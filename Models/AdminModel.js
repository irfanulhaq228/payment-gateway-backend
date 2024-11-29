const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    apiKey: { type: String, required: false },
    secretKey: { type: String, required: false },
}, {
    timestamps: true
});

const adminModel = mongoose.model('Admin', adminSchema);

module.exports = adminModel;
