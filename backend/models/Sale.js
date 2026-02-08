const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
    id: { // This 'id' refers to the Item's _id
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    sellPrice: {
        type: Number,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    profit: {
        type: Number,
        required: true
    }
});

const SaleSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    items: [SaleItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    totalProfit: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Sale', SaleSchema);
