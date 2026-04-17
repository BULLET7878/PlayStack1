const { supabase } = require('../config/supabase');

// Add a score (enforces 1-45 range, no duplicate dates, max 5 scores)
exports.addScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { value, score_date } = req.body;

        // Validate range
        if (!value || value < 1 || value > 45) {
            return res.status(400).json({ message: 'Score must be between 1 and 45 (Stableford format)' });
        }

        if (!score_date) {
            return res.status(400).json({ message: 'Score date is required' });
        }

        // Check for duplicate date
        const { data: existing, error: dupError } = await supabase
            .from('scores')
            .select('id')
            .eq('user_id', userId)
            .eq('score_date', score_date)
            .maybeSingle();

        if (dupError) throw dupError;

        if (existing) {
            return res.status(400).json({ message: 'You already have a score for this date. Only one score per day is allowed.' });
        }

        // Get current score count
        const { data: currentScores, error: countError } = await supabase
            .from('scores')
            .select('id, score_date')
            .eq('user_id', userId)
            .order('score_date', { ascending: true });

        if (countError) throw countError;

        // If 5 or more scores, remove the oldest
        if (currentScores && currentScores.length >= 5) {
            const oldestId = currentScores[0].id;
            const { error: deleteError } = await supabase
                .from('scores')
                .delete()
                .eq('id', oldestId);

            if (deleteError) throw deleteError;
        }

        // Insert new score
        const { data: newScore, error: insertError } = await supabase
            .from('scores')
            .insert([{ user_id: userId, value, score_date }])
            .select()
            .single();

        if (insertError) throw insertError;

        res.status(201).json({ message: 'Score added successfully', score: newScore });
    } catch (error) {
        console.error('Add score error:', error);
        res.status(500).json({ message: 'Error adding score', error: error.message });
    }
};

// Get user's scores (reverse chronological)
exports.getScores = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('user_id', userId)
            .order('score_date', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching scores', error: error.message });
    }
};

// Delete a score
exports.deleteScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('scores')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.status(200).json({ message: 'Score deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting score', error: error.message });
    }
};
