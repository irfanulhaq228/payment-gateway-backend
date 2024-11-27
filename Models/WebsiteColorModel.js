// =============== >main website single color

const mongoose = require('mongoose');

const websiteColorSchema = new mongoose.Schema({
    color: { type: String, required: true, unique: true },
    status: { type: Boolean, default: false }
}, {
    timestamps: true
});

const websiteColorModel = mongoose.model('WebsiteColor', websiteColorSchema);

module.exports = websiteColorModel;
