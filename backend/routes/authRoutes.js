const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user (public for employees, admin-protected for admins)
// @access  Public (for 'employee' role), Private (for 'admin' role)
router.post(
    '/register',
    // Apply validation checks regardless of role
    [
        check('username', 'Username is required').not().isEmpty(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('role', 'Role must be "admin" or "employee"').isIn(['admin', 'employee']).optional()
    ],
    async (req, res, next) => { // Added next to chain middleware
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, role } = req.body;

        // If 'admin' role is requested, apply auth and authorization middleware
        if (role === 'admin') {
            return auth(req, res, () => {
                authorize(['admin'])(req, res, async () => {
                    // If authorized as admin, proceed with admin registration
                    try {
                        let user = await User.findOne({ username });

                        if (user) {
                            return res.status(400).json({ msg: 'User already exists' });
                        }

                        user = new User({
                            username,
                            password,
                            role: 'admin' // Ensure role is explicitly 'admin'
                        });

                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(password, salt);

                        await user.save();

                        const payload = {
                            user: {
                                id: user.id,
                                role: user.role
                            }
                        };

                        jwt.sign(
                            payload,
                            process.env.JWT_SECRET,
                            { expiresIn: '1h' },
                            (err, token) => {
                                if (err) throw err;
                                res.json({ token });
                            }
                        );

                    } catch (err) {
                        console.error(err.message);
                        res.status(500).send('Server Error');
                    }
                });
            });
        } else {
            // Default to 'employee' role if not specified or not 'admin'
            // and proceed with public registration
            try {
                let user = await User.findOne({ username });

                if (user) {
                    return res.status(400).json({ msg: 'User already exists' });
                }

                user = new User({
                    username,
                    password,
                    role: 'employee' // Default role
                });

                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);

                await user.save();

                const payload = {
                    user: {
                        id: user.id,
                        role: user.role
                    }
                };

                jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' },
                    (err, token) => {
                        if (err) throw err;
                        res.json({ token });
                    }
                );

            } catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('username', 'Username is required').not().isEmpty(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            let user = await User.findOne({ username });

            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
