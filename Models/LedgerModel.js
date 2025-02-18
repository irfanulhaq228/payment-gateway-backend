const mongoose = require('mongoose');
const { notifySubscribers } = require('../Middleware/webhookService');

// Create a separate collection to track the last used transaction number
const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000 }
});

const Counter = mongoose.model('Counter', CounterSchema);

const ledgerSchema = new mongoose.Schema({
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    image: { type: String },
    website: { type: String },
    utr: { type: String },
    type: { type: String },
    amount: { type: Number },
    tax: { type: Number },
    total: { type: Number },
    status: { type: String, default: 'Pending' },
    method: { type: String },
    username: { type: String },
    activity: { type: String },
    reason: { type: String },
    site: { type: String },
    transactionReason: { type: String },
    approval: { type: Boolean, default: false }, // New field for transaction number
    trnNo: { type: Number, unique: true }, // New field for transaction number
}, {
    timestamps: true
});

// Pre-save middleware to auto-increment trnNo
ledgerSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Find the counter document for ledgers
            const counterDoc = await Counter.findByIdAndUpdate(
                { _id: 'ledgerTrnNo' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            // Assign the incremented sequence to trnNo
            this.trnNo = counterDoc.seq;
            next();
        } catch (error) {
            return next(error);
        }
    } else {
        next();
    }
});






const ledgerModel = mongoose.model('Ledger', ledgerSchema);

module.exports = ledgerModel;