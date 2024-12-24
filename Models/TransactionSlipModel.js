const mongoose = require('mongoose');

const transactionSlipSchema = new mongoose.Schema({
    pdfName: { type: String, required: false },
    data: { type: [], required: false },
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }
}, {
    timestamps: true
});

const transactionSlipModel = mongoose.model('TransactionSlip', transactionSlipSchema);

module.exports = transactionSlipModel;
