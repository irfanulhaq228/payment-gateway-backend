const mongoose = require('mongoose');

const WebsiteNameSchema = new mongoose.Schema({
    name: { type: String, required: true },
}, {
    timestamps: true
});

const WebsiteNameModel = mongoose.model('WebsiteName', WebsiteNameSchema);

module.exports = WebsiteNameModel;
