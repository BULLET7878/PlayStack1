import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const signup = async (userData) => {
        try {
            const response = await authService.signup(userData);
            const { token, user: profile } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(profile));
            setUser(profile);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Signup failed' 
            };
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            const { token, user: profile } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(profile));
            setUser(profile);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        signup,
        login,
        logout,
        isAuthenticated: !!user && !!localStorage.getItem('token')
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
