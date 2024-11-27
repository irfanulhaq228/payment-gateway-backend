const mongoose = require('mongoose');

const WebsiteLogoSchema = new mongoose.Schema({
    image: { type: String, required: true },
}, {
    timestamps: true
});

const WebsiteLogoModel = mongoose.model('WebsiteLogo', WebsiteLogoSchema);

module.exports = WebsiteLogoModel;
