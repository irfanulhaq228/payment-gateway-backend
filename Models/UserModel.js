const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    wallet: { type: Number, default: 0 },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, {
    timestamps: true
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
