const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    image: { type: String },
    title: { type: String },
    reason: { type: String },
    user: { type: String },
    ticketClose: { type: String },
    status: { type: String, default:'New Ticket' },
}, {
    timestamps: true
});

const ticketModel = mongoose.model('Ticket', ticketSchema);

module.exports = ticketModel;
