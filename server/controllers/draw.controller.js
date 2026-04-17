const { supabase } = require('../config/supabase');

// --- Helper Functions ---

// 1. Random Draw Logic
const runRandomDraw = () => {
    const numbers = new Set();
    while (numbers.size < 5) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
};

// 2. Algorithm Draw Logic
const runAlgorithmDraw = async (scores) => {
    if (!scores || scores.length === 0) return runRandomDraw();

    // Calculate frequencies of all submitted scores in the current period
    const frequencyMap = {};
    scores.forEach(s => {
        frequencyMap[s.value] = (frequencyMap[s.value] || 0) + 1;
    });

    const entries = Object.entries(frequencyMap).map(([val, freq]) => ({
        val: parseInt(val),
        freq
    }));

    // Sort by frequency (most frequent first)
    entries.sort((a, b) => b.freq - a.freq);

    const winningNumbers = new Set();

    // Let's add top 3 most frequent to give them a higher chance directly
    for (let i = 0; i < Math.min(3, entries.length); i++) {
        winningNumbers.add(entries[i].val);
    }

    // Fill the rest randomly if needed, avoiding duplicates
    while (winningNumbers.size < 5) {
        const randomNum = Math.floor(Math.random() * 45) + 1;
        winningNumbers.add(randomNum);
    }

    return Array.from(winningNumbers).sort((a, b) => a - b);
};

// Calculate match count
const getMatchCount = (userScores, winningNumbers) => {
    let matchCount = 0;
    const winningSet = new Set(winningNumbers);
    userScores.forEach(val => {
        if (winningSet.has(val)) matchCount++;
    });
    return matchCount;
};

// Controller methods
exports.executeDraw = async (req, res) => {
    try {
        const { type = 'random', isSimulation = false } = req.body; // 'random' or 'algorithm'

        // 1. Get total prize pool (derived from total active sub revenue * portion)
        // For simplicity, we'll assume a calculated jackpot amount or passed in by admin
        // Let's calculate dynamically based on active subscribers
        const { count: activeUserCount, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'active');
            
        if (countError) throw countError;

        // E.g., $9.99/mo, 50% goes to pool = ~$5 per user
        let totalPool = (activeUserCount || 0) * 5; 
        
        // Add previous rollover if any (mock logic for demo: fetch last draw rollover)
        const { data: lastDraw } = await supabase
            .from('draws')
            .select('jackpot_amount')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
        // Assuming rollover logic
        // totalPool += lastDrawRollover...

        const tier1Amount = totalPool * 0.40; // Match 5
        const tier2Amount = totalPool * 0.35; // Match 4
        const tier3Amount = totalPool * 0.25; // Match 3

        let winningNumbers = [];

        if (type === 'algorithm') {
            // Fetch all scores added since last draw
            // For demo, we just fetch all scores
            const { data: allScores, error: scoreError } = await supabase
                .from('scores')
                .select('value');
            if (scoreError) throw scoreError;
            
            winningNumbers = await runAlgorithmDraw(allScores);
        } else {
            winningNumbers = runRandomDraw();
        }

        // --- Find Winners ---
        
        // Get all active users and their scores
        // Note: In reality, we'd only look at scores for the current valid period
        const { data: userScoresData, error: userScoresError } = await supabase
            .from('scores')
            .select('user_id, value');
            
        if (userScoresError) throw userScoresError;
        
        // Group by user
        const userScoresMap = {};
        userScoresData.forEach(row => {
            if (!userScoresMap[row.user_id]) userScoresMap[row.user_id] = [];
            userScoresMap[row.user_id].push(row.value);
        });
        
        const winners = [];
        let t1Winners = 0, t2Winners = 0, t3Winners = 0;

        for (const [userId, scoresList] of Object.entries(userScoresMap)) {
            const matches = getMatchCount(scoresList, winningNumbers);
            if (matches === 5) {
                t1Winners++;
                winners.push({ user_id: userId, match_type: 5 });
            } else if (matches === 4) {
                t2Winners++;
                winners.push({ user_id: userId, match_type: 4 });
            } else if (matches === 3) {
                t3Winners++;
                winners.push({ user_id: userId, match_type: 3 });
            }
        }

        // Calculate actual payouts split amongst winners
        const calculatePayout = (tierPool, numWinners) => numWinners > 0 ? (tierPool / numWinners).toFixed(2) : 0;
        
        winners.forEach(w => {
            if (w.match_type === 5) w.prize_amount = calculatePayout(tier1Amount, t1Winners);
            if (w.match_type === 4) w.prize_amount = calculatePayout(tier2Amount, t2Winners);
            if (w.match_type === 3) w.prize_amount = calculatePayout(tier3Amount, t3Winners);
            
            // For Simulation vs Actual
            w.status = 'pending';
        });

        const simulationResult = {
            draw_date: new Date().toISOString(),
            draw_type: type,
            winning_numbers: winningNumbers,
            jackpot_amount: totalPool,
            is_simulation: isSimulation,
            stats: {
                total_pool: totalPool,
                tier_1: { split: calculatePayout(tier1Amount, t1Winners), winners: t1Winners },
                tier_2: { split: calculatePayout(tier2Amount, t2Winners), winners: t2Winners },
                tier_3: { split: calculatePayout(tier3Amount, t3Winners), winners: t3Winners }
            },
            winners_preview: winners
        };

        if (isSimulation) {
            return res.status(200).json(simulationResult);
        }

        // If not a simulation, actually insert into Database!
        const { data: savedDraw, error: dbErr } = await supabase
            .from('draws')
            .insert([{
                draw_type: type,
                winning_numbers: winningNumbers,
                jackpot_amount: totalPool,
                is_simulation: false,
                is_published: true
            }])
            .select()
            .single();

        if (dbErr) throw dbErr;

        // Insert winners
        if (winners.length > 0) {
            const winnersToInsert = winners.map(w => ({
                ...w,
                draw_id: savedDraw.id
            }));
            
            const { error: winErr } = await supabase
                .from('winners')
                .insert(winnersToInsert);
                
            if (winErr) throw winErr;
        }

        res.status(201).json({ message: 'Draw executed successfully', draw: savedDraw, details: simulationResult.stats });

    } catch (error) {
        console.error('Execute draw error:', error);
        res.status(500).json({ message: 'Error executing draw', error: error.message });
    }
};

exports.getDrawHistory = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('draws')
            .select('*')
            .eq('is_simulation', false)
            .order('draw_date', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching draw history' });
    }
};

exports.getWinnings = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch winners table joined with draw info
        const { data, error } = await supabase
            .from('winners')
            .select(`
                *,
                draws ( winning_numbers, draw_date )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching winnings' });
    }
};
