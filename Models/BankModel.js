const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
    accountNo: { type: String, default: "" },
    accountType: { type: String, default: "" },
    bankName: { type: String, default: "" },
    image: { type: String, required: false},
    iban: { type: String, default: "" },
    accountLimit: { type: Number, required: false, default:0 },
    accountHolderName: { type: String, required: false },
    block: { type: Boolean, default: true },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
    timestamps: true
});

const bankModel = mongoose.model('Bank', bankSchema);

module.exports = bankModel;
