const { verifyToken } = require('../utils/jwt');
const { supabase } = require('../config/supabase');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }

        // Fetch latest profile info to check role and subscription
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', decoded.id)
            .single();

        if (error || !profile) {
            return res.status(404).json({ message: 'User profile match not found' });
        }

        req.user = profile;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Not authorized' });
    }
};

exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

exports.activeSubscriptionOnly = (req, res, next) => {
    if (req.user && req.user.subscription_status === 'active') {
        next();
    } else {
        res.status(403).json({ message: 'Active subscription required' });
    }
};
