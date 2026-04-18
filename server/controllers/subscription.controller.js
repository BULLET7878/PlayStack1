const { supabase } = require('../config/supabase');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PLANS = {
    monthly: {
        name: 'Monthly',
        amount: 99900, // 999 INR in paise
        interval: 'monthly'
    },
    yearly: {
        name: 'Yearly',
        amount: 999900, // 9999 INR in paise
        interval: 'yearly'
    }
};

// Simple in-memory cache for plan IDs to avoid creating them repeatedly
let razorpayPlanIds = {
    monthly: null,
    yearly: null
};

// Create checkout session (Razorpay Subscription)
exports.createCheckout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { plan_type } = req.body;

        if (!PLANS[plan_type]) {
            return res.status(400).json({ message: 'Invalid plan type. Choose "monthly" or "yearly".' });
        }

        // 1. Ensure a Razorpay Plan exists for this logic
        if (!razorpayPlanIds[plan_type]) {
            try {
                const plan = await razorpay.plans.create({
                    period: PLANS[plan_type].interval,
                    interval: 1,
                    item: {
                        name: `Playstake ${PLANS[plan_type].name} Plan`,
                        amount: PLANS[plan_type].amount,
                        currency: "INR",
                        description: "Premium access to Playstake"
                    }
                });
                razorpayPlanIds[plan_type] = plan.id;
            } catch (planErr) {
                console.error("Error creating plan dynamically:", planErr);
                return res.status(500).json({ message: 'Failed to configure payment plan' });
            }
        }

        // 2. Create the Subscription in Razorpay
        const subscription = await razorpay.subscriptions.create({
            plan_id: razorpayPlanIds[plan_type],
            total_count: 12, // Arbitrary count for recurring
            customer_notify: 1,
            notes: {
                userId,
                plan_type
            }
        });

        // 3. Temporarily update the user's profile with the pending subscription ID
        await supabase
            .from('profiles')
            .update({ stripe_subscription_id: subscription.id }) // repurposing the field from Stripe
            .eq('id', userId);

        res.status(200).json({ 
            subscription_id: subscription.id,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ message: 'Error creating checkout session', error: error.message });
    }
};

// Get subscription status
exports.getSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        res.status(200).json({
            subscription: data,
            status: req.user.subscription_status
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subscription', error: error.message });
    }
};

// Razorpay webhook handler
exports.handleWebhook = async (req, res) => {
    // Note: To use verifying, you need process.env.RAZORPAY_WEBHOOK_SECRET
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback_secret_if_not_set';
    
    // Validate signature
    const signature = req.headers['x-razorpay-signature'];
    const bodyString = JSON.stringify(req.body);
    
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(bodyString)
                                    .digest('hex');
                                    
    // If webhook secret isn't provided/valid, we'll bypass validation for development ease
    if (signature && signature !== expectedSignature && process.env.RAZORPAY_WEBHOOK_SECRET) {
        return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    try {
        switch (event.event) {
            case 'subscription.charged': {
                const sub = event.payload.subscription.entity;
                const payment = event.payload.payment.entity;
                
                const userId = sub.notes.userId;
                const planType = sub.notes.plan_type || 'monthly';

                if (!userId) break;

                // Update profile subscription status
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'active',
                        stripe_subscription_id: sub.id // reused column
                    })
                    .eq('id', userId);

                // Create subscription record
                const now = new Date();
                const periodEnd = new Date(now);
                if (planType === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
                else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

                await supabase
                    .from('subscriptions')
                    .insert([{
                        user_id: userId,
                        plan_type: planType,
                        status: 'active',
                        amount: payment.amount / 100, // back to base unit
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd.toISOString(),
                        stripe_subscription_id: sub.id // reused column
                    }]);

                // Record transaction
                await supabase
                    .from('transactions')
                    .insert([{
                        user_id: userId,
                        amount: payment.amount / 100,
                        type: 'subscription_payment',
                        stripe_payment_id: payment.id, // reused column
                        metadata: { plan_type: planType }
                    }]);

                break;
            }

            case 'subscription.cancelled': {
                const sub = event.payload.subscription.entity;

                await supabase
                    .from('profiles')
                    .update({ subscription_status: 'cancelled' })
                    .eq('stripe_subscription_id', sub.id);

                await supabase
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('stripe_subscription_id', sub.id);

                break;
            }
        }
    } catch (err) {
        console.error("Webhook processing error: ", err);
    }

    res.status(200).json({ received: true });
};

// Get available plans
exports.getPlans = async (req, res) => {
    res.status(200).json({
        plans: Object.entries(PLANS).map(([key, plan]) => ({
            id: key,
            name: plan.name,
            amount: plan.amount / 100, // send standard INR to frontend, not paise
            interval: plan.interval
        }))
    });
};
