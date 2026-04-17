const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };
