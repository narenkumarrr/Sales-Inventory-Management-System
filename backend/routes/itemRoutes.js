const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const Item = require('../models/Item');

// All /api/items routes require authentication and admin role


// @route   GET api/items
// @desc    Get all items
// @access  Private (Employee, Admin)
router.get('/', auth, authorize(['admin', 'employee']), async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/items/:id
// @desc    Get single item by ID
// @access  Private (Employee, Admin)
router.get('/:id', auth, authorize(['admin', 'employee']), async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.json(item);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/items
// @desc    Add new item
// @access  Private (Admin)
router.post('/', auth, authorize(['admin']), async (req, res) => {
    const { name, basePrice, stock } = req.body;

    try {
        let item = await Item.findOne({ name });
        if (item) {
            return res.status(400).json({ msg: 'Item with this name already exists' });
        }

        item = new Item({
            name,
            basePrice,
            stock
        });

        await item.save();
        res.json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/items/:id
// @desc    Update an item
// @access  Private (Admin)
router.put('/:id', auth, authorize(['admin']), async (req, res) => {
    const { name, basePrice, stock } = req.body;

    // Build item object
    const itemFields = {};
    if (name) itemFields.name = name;
    if (basePrice) itemFields.basePrice = basePrice;
    if (stock) itemFields.stock = stock;

    try {
        let item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }

        // Check if new name already exists for another item
        if (name && name !== item.name) {
            const existingItem = await Item.findOne({ name });
            if (existingItem) {
                return res.status(400).json({ msg: 'Item with this name already exists' });
            }
        }

        item = await Item.findByIdAndUpdate(
            req.params.id,
            { $set: itemFields },
            { new: true }
        );

        res.json(item);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/items/:id
// @desc    Delete an item
// @access  Private (Admin)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }

        await Item.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Item removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
