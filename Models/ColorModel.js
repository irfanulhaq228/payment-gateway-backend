const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    mainColor: { type: String, required: true, unique: true },
    secColor: { type: String, required: true },
    status: { type: Boolean, default: false }
}, {
    timestamps: true
});

const colorModel = mongoose.model('Color', colorSchema);

module.exports = colorModel;
