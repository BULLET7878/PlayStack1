const { supabase } = require('../config/supabase');

exports.getCharities = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('charities')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching charities', error: error.message });
    }
};

exports.getFeaturedCharities = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('charities')
            .select('*')
            .eq('is_featured', true)
            .limit(3);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching featured charities', error: error.message });
    }
};
