const mongoose = require('mongoose');

const WebsiteSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    url: { type: String },
}, {
    timestamps: true
});

const websiteModel = mongoose.model('Website', WebsiteSchema);

module.exports = websiteModel;
