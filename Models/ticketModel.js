const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    title: { type: String },
    message: { type: String },
    type: { type: String },
    ticketClose: { type: Boolean, default: false },
    status: { type: String, },
}, {
    timestamps: true
});

const ticketModel = mongoose.model('Ticket', ticketSchema);

module.exports = ticketModel;
