import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Auth = ({ isLogin = true }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [charityId, setCharityId] = useState('');
    const [charities, setCharities] = useState([]);
    const [error, setError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLogin) {
            fetchCharities();
        }
    }, [isLogin]);

    const fetchCharities = async () => {
        try {
            const response = await api.get('/charities');
            setCharities(response.data);
            
            // If the database is completely empty (no rows) but tables exist, it returns []
            // That's fine, but if it throws an error (tables don't exist), it hits catch
        } catch (err) {
            console.error('Failed to fetch charities', err);
            // Catch the specific 'Could not find the table' error
            const backendMsg = err.response?.data?.error || '';
            if (backendMsg.includes('Could not find the table')) {
                setError("CRITICAL ERROR: Your Database is Empty! You MUST copy the code inside database/schema.sql and run it in your Supabase SQL Editor, otherwise you cannot create an account!");
            } else {
                setError("Failed to connect to the database. Make sure your server is running!");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFormLoading(true);

        try {
            if (isLogin) {
                const res = await login({ email, password });
                if (res.success) navigate('/dashboard');
                else setError(res.message);
            } else {
                const res = await signup({ 
                    email, 
                    password, 
                    full_name: fullName, 
                    charity_id: charityId 
                });
                if (res.success) navigate('/dashboard');
                else setError(res.message);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{isLogin ? 'Welcome Back' : 'Join the Impact'}</h2>
                <p className="auth-subtitle">
                    {isLogin ? 'Enter your credentials to access your dashboard' : 'Join thousands of collectors making a difference'}
                </p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                                placeholder="John Doe"
                                required 
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="you@example.com"
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required 
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Choose Your Charity</label>
                            <select 
                                value={charityId} 
                                onChange={(e) => setCharityId(e.target.value)}
                                required
                            >
                                <option value="">Select a cause</option>
                                {charities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <small>Min. 10% of subscription goes to your selected charity.</small>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary auth-btn" disabled={formLoading}>
                        {formLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLogin ? (
                        <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                    ) : (
                        <p>Already have an account? <Link to="/login">Login</Link></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
