const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
    ip: { type: String, required: false},
    isp: { type: String, required: false, default: 'unknown' },
    city: { type: String, required: false },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    loginDate: { type: String, required: false},
    logoutDate: { type: String, required: false, default:'-'},
}, {
    timestamps: true
});

const loginHistoryModel = mongoose.model('LoginHistory', loginHistorySchema);

module.exports = loginHistoryModel;
