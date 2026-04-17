const { supabase } = require('../config/supabase');
const { generateToken } = require('../utils/jwt');

exports.signup = async (req, res) => {
    try {
        const { email, password, full_name, charity_id } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // 1. Sign up user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ message: authError.message });
        }

        const user = authData.user;

        if (!user) {
            return res.status(400).json({ message: 'User creation failed' });
        }

        // 2. Create profile in our database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: user.email,
                    full_name: full_name || '',
                    charity_id: charity_id || null,
                    charity_contribution_percentage: 10, // Minimum per PRD
                    role: 'user',
                    subscription_status: 'inactive'
                }
            ])
            .select()
            .single();

        if (profileError) {
            // Rollback auth if profile creation fails? (Supabase doesn't easily support cross-tab rollback like this automatically)
            // But for simple cases, we can try to delete the auth user if needed.
            return res.status(400).json({ message: 'Profile creation failed', error: profileError.message });
        }

        // 3. Generate our JWT
        const token = generateToken({ id: user.id, email: user.email, role: profile.role });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                subscription_status: profile.subscription_status
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // 1. Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = authData.user;

        // 2. Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // 3. Generate our JWT
        const token = generateToken({ id: user.id, email: user.email, role: profile.role });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                subscription_status: profile.subscription_status
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
