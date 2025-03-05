const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
    charges: { type: Number,  },
    currency: { type: String, },
    currencyRate: { type: String, required: false },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, {
    timestamps: true
});

const exchangeModel = mongoose.model('Exchange', exchangeSchema);

module.exports = exchangeModel;
