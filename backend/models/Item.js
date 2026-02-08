const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Item', ItemSchema);
