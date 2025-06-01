const { Schema, model } = require('mongoose');

const bankAccountSchema = new Schema({
    sellerId: {
        type: Schema.ObjectId,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    IBAN: {
        type: String,
        required: true
    },
    note: {
        type: String
    }
}, { timestamps: true });

module.exports = model('bankAccount', bankAccountSchema);
