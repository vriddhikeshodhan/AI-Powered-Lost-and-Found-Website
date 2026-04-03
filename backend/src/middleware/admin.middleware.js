const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // role_id 2 = Admin (as seeded in roles table)
    if (req.user.role_id !== 2) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

module.exports = { isAdmin };
