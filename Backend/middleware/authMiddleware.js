const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Keep `_id` for compatibility with the rest of the codebase,
            // which was written against Mongoose's `_id` convention.
            req.user = { ...user, _id: user.id };
            delete req.user.password;

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
