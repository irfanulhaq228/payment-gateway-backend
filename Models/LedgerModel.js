const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    image: { type: String },
    website: { type: String },
    utr: { type: String },
    amount: { type: Number },
    tax: { type: Number },
    total: { type: Number },
    status: { type: String, default:'Unverified' },
    method: { type: String },
}, {
    timestamps: true
});

const userModel = mongoose.model('Ledger', ledgerSchema);

module.exports = userModel;
