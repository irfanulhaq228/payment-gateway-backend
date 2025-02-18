const mongoose = require('mongoose');

const webhookSubscriberSchema = new mongoose.Schema({
    url: { type: String, required: true },
}, {
    timestamps: true
});

const webhookSubscriberModel = mongoose.model('WebhookSubscriber', webhookSubscriberSchema);

module.exports = webhookSubscriberModel;
