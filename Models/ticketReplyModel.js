const mongoose = require('mongoose');

const ticketReplySchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    message: { type: String },
    type: { type: String },
}, {
    timestamps: true
});

const ticketReplyModel = mongoose.model('TicketReply', ticketReplySchema);

module.exports = ticketReplyModel;
