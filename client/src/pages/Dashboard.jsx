import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [scores, setScores] = useState([]);
    const [scoreValue, setScoreValue] = useState('');
    const [scoreDate, setScoreDate] = useState('');
    const [winnings, setWinnings] = useState([]);
    const [statusData, setStatusData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [scoresRes, subRes, winningsRes] = await Promise.all([
                api.get('/scores'),
                api.get('/subscriptions/status'),
                api.get('/draws/winnings')
            ]);
            setScores(scoresRes.data);
            setStatusData(subRes.data);
            setWinnings(winningsRes.data);
        } catch (err) {
            console.error('Failed to load dashboard data');
        }
    };

    const handleAddScore = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/scores', { 
                value: parseInt(scoreValue), 
                score_date: scoreDate 
            });
            setScoreValue('');
            setScoreDate('');
            fetchDashboardData(); // Refresh to get the latest 5
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding score');
        }
    };

    const handleDeleteScore = async (id) => {
        try {
            await api.delete(`/scores/${id}`);
            fetchDashboardData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubscribe = async () => {
        try {
            const res = await api.post('/subscriptions/checkout', { plan_type: 'monthly' });
            
            const options = {
                key: res.data.key, // Your Razorpay test key from the backend
                subscription_id: res.data.subscription_id,
                name: "Playstake",
                description: "Monthly Premium Membership",
                handler: function (response) {
                    // Payment successful! Let's refresh data to show 'ACTIVE'
                    fetchDashboardData();
                    alert("Payment Successful! Welcome to Playstake.");
                },
                prefill: {
                    name: user?.full_name || "",
                    email: user?.email || "",
                    contact: "9999999999" // Dummy checkout number
                },
                theme: {
                    color: "#18181b" // Matches project dark theme
                }
            };

            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                setError(`Payment Failed: ${response.error.description}`);
            });

            rzp.open();
        } catch (err) {
            setError('Failed to initiate checkout. Is your backend running?');
            console.error(err);
        }
    };

    const isActive = user?.subscription_status === 'active';

    return (
        <div className="page dashboard">
            <header className="dashboard-header">
                <h2>Welcome, {user?.full_name || 'Impact Maker'}</h2>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </header>

            <div className="dashboard-grid">
                {/* Subscription Status Card */}
                <motion.div className="dashboard-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3>Subscription Status</h3>
                    <div className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                        {user?.subscription_status?.toUpperCase() || 'INACTIVE'}
                    </div>
                    {!isActive && (
                        <div className="subscribe-cta">
                            <p>Unlock the ability to log scores, participate in draws, and contribute to charities.</p>
                            <button onClick={handleSubscribe} className="btn btn-primary mt-2">Subscribe Now</button>
                        </div>
                    )}
                </motion.div>

                {/* Score Management Card */}
                <motion.div className="dashboard-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h3>Your Scores (Stableford)</h3>
                    <p className="subtitle">Only your latest 5 scores are kept.</p>
                    
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleAddScore} className="score-form">
                        <input 
                            type="number" 
                            min="1" max="45" 
                            value={scoreValue}
                            onChange={(e) => setScoreValue(e.target.value)}
                            placeholder="Score (1-45)" 
                            required 
                            disabled={!isActive}
                        />
                        <input 
                            type="date" 
                            value={scoreDate}
                            onChange={(e) => setScoreDate(e.target.value)}
                            required 
                            disabled={!isActive}
                        />
                        <button type="submit" className="btn btn-primary" disabled={!isActive}>Add</button>
                    </form>

                    <ul className="score-list">
                        {scores.map(s => (
                            <li key={s.id}>
                                <span>{s.value} pts</span>
                                <span>{new Date(s.score_date).toLocaleDateString()}</span>
                                <button onClick={() => handleDeleteScore(s.id)} className="delete-btn">X</button>
                            </li>
                        ))}
                        {scores.length === 0 && <p className="empty-state">No scores logged yet.</p>}
                    </ul>
                </motion.div>

                {/* Winnings & Draws Card */}
                <motion.div className="dashboard-card summary-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3>Your Winnings</h3>
                    {winnings.length === 0 ? (
                        <p className="empty-state">Participate in draws to win!</p>
                    ) : (
                        <ul className="winnings-list">
                            {winnings.map(w => (
                                <li key={w.id}>
                                    <div>
                                        <strong>Match {w.match_type}</strong>
                                        <span> ({new Date(w.draws?.draw_date).toLocaleDateString()})</span>
                                    </div>
                                    <div className="prize-amount">${w.prize_amount}</div>
                                    <div className={`win-status ${w.status}`}>{w.status}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
