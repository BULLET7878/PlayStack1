const { supabase } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = {
    monthly: {
        name: 'Monthly',
        amount: 999, // $9.99 in cents
        interval: 'month'
    },
    yearly: {
        name: 'Yearly',
        amount: 9999, // $99.99 in cents
        interval: 'year'
    }
};

// Create checkout session
exports.createCheckout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { plan_type } = req.body;

        if (!PLANS[plan_type]) {
            return res.status(400).json({ message: 'Invalid plan type. Choose "monthly" or "yearly".' });
        }

        const plan = PLANS[plan_type];

        // Check if user already has a Stripe customer ID
        let stripeCustomerId = req.user.stripe_customer_id;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                metadata: { userId }
            });
            stripeCustomerId = customer.id;

            // Save Stripe customer ID
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', userId);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Fairway Rewards ${plan.name} Plan`,
                        description: `${plan.name} subscription to Fairway Rewards`
                    },
                    unit_amount: plan.amount,
                    recurring: { interval: plan.interval }
                },
                quantity: 1
            }],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
            cancel_url: `${process.env.CLIENT_URL}/subscribe?cancelled=true`,
            metadata: { userId, plan_type }
        });

        res.status(200).json({ url: session.url, sessionId: session.id });
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

// Stripe webhook handler
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const planType = session.metadata.plan_type;

            // Update profile subscription status
            await supabase
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    stripe_subscription_id: session.subscription
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
                    amount: PLANS[planType].amount / 100,
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    stripe_subscription_id: session.subscription
                }]);

            // Record transaction
            await supabase
                .from('transactions')
                .insert([{
                    user_id: userId,
                    amount: PLANS[planType].amount / 100,
                    type: 'subscription_payment',
                    stripe_payment_id: session.payment_intent,
                    metadata: { plan_type: planType }
                }]);

            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;

            await supabase
                .from('profiles')
                .update({ subscription_status: 'cancelled' })
                .eq('stripe_subscription_id', subscription.id);

            await supabase
                .from('subscriptions')
                .update({ status: 'cancelled' })
                .eq('stripe_subscription_id', subscription.id);

            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;

            await supabase
                .from('profiles')
                .update({ subscription_status: 'expired' })
                .eq('stripe_customer_id', invoice.customer);

            break;
        }
    }

    res.status(200).json({ received: true });
};

// Get available plans
exports.getPlans = async (req, res) => {
    res.status(200).json({
        plans: Object.entries(PLANS).map(([key, plan]) => ({
            id: key,
            name: plan.name,
            amount: plan.amount / 100,
            interval: plan.interval
        }))
    });
};
