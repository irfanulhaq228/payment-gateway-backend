const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' }
}, {
    timestamps: true
});

const approvalModel = mongoose.model('Approval', approvalSchema);

module.exports = approvalModel;
