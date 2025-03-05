const mongoose = require('mongoose');

const adminStaffSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    userName: { type: String, required: false},
    email: { type: String, required: false },
    password: { type: String, required: false },
    ledgerType: { type: Array, required: false },
    ledgerBank: { type: Array, required: false },
    ledgerMerchant: { type: Array, required: false },
    block: { type: Boolean, required: false, default: false },
}, {
    timestamps: true
});

const adminStaffModel = mongoose.model('AdminStaff', adminStaffSchema);

module.exports = adminStaffModel;
