const { supabase } = require('../config/supabase');

exports.getStats = async (req, res) => {
    try {
        // Active Subscriptions
        const { count: activeUsers, error: err1 } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'active');

        // Total Winnings Paid Out
        const { data: winnings, error: err2 } = await supabase
            .from('winners')
            .select('prize_amount')
            .eq('status', 'paid');
            
        const totalWinnings = winnings ? winnings.reduce((acc, curr) => acc + parseFloat(curr.prize_amount), 0) : 0;

        // Total Charity Contribution Estimate (mock logic for demo: 10% of revenue)
        const totalCharity = activeUsers * 9.99 * 0.10;

        res.status(200).json({
            activeUsers: activeUsers || 0,
            totalWinnings,
            totalCharity: totalCharity.toFixed(2),
            revenue: (activeUsers * 9.99).toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

exports.getPendingWinners = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('winners')
            .select(`
                *,
                profiles(email, full_name),
                draws(draw_date)
            `)
            .eq('status', 'pending');
            
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending winners' });
    }
};

exports.verifyWinner = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const status = action === 'approve' ? 'verified' : 'rejected';

        const { error } = await supabase
            .from('winners')
            .update({ 
                status, 
                verified_at: new Date().toISOString() 
            })
            .eq('id', id);

        if (error) throw error;
        
        // In real app, trigger payout via Stripe Connect or similar if 'approve'
        
        res.status(200).json({ message: `Winner ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying winner' });
    }
};
