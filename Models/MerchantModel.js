const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
    image: { type: String, required: false},
    merchantName: { type: String, required: false},
    apiKey: { type: String, required: false},
    secretKey: { type: String, required: false},
    fullName: { type: String, required: false},
    userName: { type: String, required: false},
    phone: { type: String, required: false },
    email: { type: String, required: false },
    password: { type: String, required: false },
    website: { type: String, required: false },
    bio: { type: String, required: false },
    accounts: { type: Number, required: false, default:0 },
    accountLimit: { type: Number, required: false, default:0 },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    block: { type: Boolean, required: false, default: false },
    verify: { type: Boolean, required: false, default: false },
}, {
    timestamps: true
});

const merchantModel = mongoose.model('Merchant', merchantSchema);

module.exports = merchantModel;
