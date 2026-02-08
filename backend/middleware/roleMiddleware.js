module.exports = function (roles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ msg: 'Not authorized, no role found' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied, insufficient role' });
        }
        next();
    };
};
