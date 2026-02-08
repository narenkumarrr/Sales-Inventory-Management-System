const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// @route   GET api/sales
// @desc    Get all sales history
// @access  Private (Admin)
router.get('/', auth, authorize(['admin']), async (req, res) => {
    try {
        const sales = await Sale.find().sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/sales
// @desc    Record a new sale
// @access  Private (Employee, Admin)
router.post('/', auth, authorize(['admin', 'employee']), async (req, res) => {
    const { items } = req.body; // items array from the frontend

    if (!items || items.length === 0) {
        return res.status(400).json({ msg: 'No items in sale' });
    }

    let totalAmount = 0;
    let totalProfit = 0;
    const saleItems = [];

    try {
        for (let i = 0; i < items.length; i++) {
            const saleItem = items[i];
            const dbItem = await Item.findById(saleItem.id);

            // Validate item existence
            if (!dbItem) {
                return res.status(404).json({ msg: `Item not found: ${saleItem.name}` });
            }

            // Validate selling price >= basePrice
            if (saleItem.sellPrice < dbItem.basePrice) {
                return res.status(400).json({ msg: `Selling price for ${dbItem.name} cannot be less than base price.` });
            }

            // Validate stock
            if (saleItem.qty > dbItem.stock) {
                return res.status(400).json({ msg: `Not enough stock for ${dbItem.name}. Available: ${dbItem.stock}, Requested: ${saleItem.qty}` });
            }

            // Calculate profit for the item
            const itemProfit = (saleItem.sellPrice - dbItem.basePrice) * saleItem.qty;
            const itemTotal = saleItem.sellPrice * saleItem.qty;

            saleItems.push({
                id: dbItem._id,
                name: dbItem.name,
                basePrice: dbItem.basePrice,
                sellPrice: saleItem.sellPrice,
                qty: saleItem.qty,
                total: itemTotal,
                profit: itemProfit
            });

            totalAmount += itemTotal;
            totalProfit += itemProfit;

            // Reduce stock
            dbItem.stock -= saleItem.qty;
            await dbItem.save();
        }

        const newSale = new Sale({
            items: saleItems,
            totalAmount,
            totalProfit
        });

        await newSale.save();
        res.json(newSale);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
