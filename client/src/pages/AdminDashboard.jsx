import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [stats, setStats] = useState({ activeUsers: 0, totalWinnings: 0, totalCharity: 0, revenue: 0 });
    const [drawType, setDrawType] = useState('algorithm');
    const [drawLoading, setDrawLoading] = useState(false);
    const [simulationData, setSimulationData] = useState(null);
    const [winnersToVerify, setWinnersToVerify] = useState([]);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [statsRes, winnersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/winners/pending')
            ]);
            setStats(statsRes.data);
            setWinnersToVerify(winnersRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data');
        }
    };

    const handleRunDraw = async (isSimulation = true) => {
        setDrawLoading(true);
        try {
            const res = await api.post('/draws/execute', { 
                type: drawType, 
                isSimulation 
            });
            if (isSimulation) {
                setSimulationData(res.data);
            } else {
                alert('Live draw successfully executed!');
                setSimulationData(null);
                fetchAdminData(); // refresh stats right after live draw
            }
        } catch (err) {
            alert('Error running draw');
        } finally {
            setDrawLoading(false);
        }
    };

    const handleVerifyMatch = async (id, action) => {
        try {
            await api.post(`/admin/winners/${id}/verify`, { action });
            fetchAdminData();
        } catch (error) {
            alert('Error verifying winner');
        }
    };

    return (
        <div className="page admin-dashboard">
            <header className="dashboard-header admin-header">
                <h2>Admin Control Center</h2>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </header>

            <div className="admin-stats-row">
                <div className="stat-card">
                    <h4>Active Subscribers</h4>
                    <div className="stat-value">{stats.activeUsers}</div>
                </div>
                <div className="stat-card">
                    <h4>Monthly Rev (Est)</h4>
                    <div className="stat-value">${stats.revenue}</div>
                </div>
                <div className="stat-card">
                    <h4>Winnings Paid</h4>
                    <div className="stat-value">${stats.totalWinnings}</div>
                </div>
                <div className="stat-card">
                    <h4>Charity Impact</h4>
                    <div className="stat-value charity">${stats.totalCharity}</div>
                </div>
            </div>

            <div className="dashboard-grid admin-grid">
                {/* Draw Control Engine */}
                <motion.div className="dashboard-card draw-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3>Draw Control Engine</h3>
                    <div className="draw-controls">
                        <select value={drawType} onChange={(e) => setDrawType(e.target.value)}>
                            <option value="algorithm">Smart Algorithmic Draw (Score Frequency)</option>
                            <option value="random">True Random Draw</option>
                        </select>
                        <div className="draw-buttons">
                            <button onClick={() => handleRunDraw(true)} disabled={drawLoading} className="btn btn-secondary">
                                {drawLoading ? 'Processing...' : 'Run Simulation'}
                            </button>
                            <button onClick={() => {
                                if (window.confirm("Are you sure you want to execute a LIVE draw? This is irreversible.")) {
                                    handleRunDraw(false);
                                }
                            }} disabled={drawLoading} className="btn btn-primary alert-btn">
                                Execute LIVE Draw
                            </button>
                        </div>
                    </div>

                    {simulationData && (
                        <div className="simulation-results">
                            <h4>Simulation Results</h4>
                            <p><strong>Numbers:</strong> {simulationData.winning_numbers.join(', ')}</p>
                            <p><strong>Pool:</strong> ${simulationData.stats.total_pool}</p>
                            <ul>
                                <li>Tier 1 (M5): {simulationData.stats.tier_1.winners} winners (${simulationData.stats.tier_1.split}/ea)</li>
                                <li>Tier 2 (M4): {simulationData.stats.tier_2.winners} winners (${simulationData.stats.tier_2.split}/ea)</li>
                                <li>Tier 3 (M3): {simulationData.stats.tier_3.winners} winners (${simulationData.stats.tier_3.split}/ea)</li>
                            </ul>
                        </div>
                    )}
                </motion.div>

                {/* Winner Verification Portal */}
                <motion.div className="dashboard-card verification-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3>Winner Verification Portal</h3>
                    {winnersToVerify.length === 0 ? (
                        <p className="empty-state">No pending verifications.</p>
                    ) : (
                        <ul className="verify-list">
                            {winnersToVerify.map(w => (
                                <li key={w.id}>
                                    <div className="verify-info">
                                        <strong>{w.profiles?.full_name} ({w.profiles?.email})</strong>
                                        <div className="verify-details">
                                            Match {w.match_type} | ${w.prize_amount} | {new Date(w.draws?.draw_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="verify-actions">
                                        <button onClick={() => handleVerifyMatch(w.id, 'approve')} className="btn btn-primary small-btn">Approve</button>
                                        <button onClick={() => handleVerifyMatch(w.id, 'reject')} className="btn btn-secondary small-btn reject">Reject</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
