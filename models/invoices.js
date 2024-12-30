const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    _id: { type: String, required: true },  // store invoice IDs as string
    createdBy: {type: mongoose.Schema.Types.ObjectId, 
        ref: 'Employee', 
        required: true   
    },
    customername: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }, // Selling price per unit
        },
    ],
    percentdiscount: {type: Number, default :0},
    total: { type: Number, required: true },
    versions: [
        {
            __v: Number,
            createdBy: { type: String, required: true },
            createdAt:  { type: Date, default: Date.now },
            items: [
                {
                    name: { type: String },
                    quantity: { type: Number },
                    price: { type: Number },
                },
            ],
            total: { type: Number },
        },
    ],
}, { versionKey: '__v' });

// Add indexes for better query performance
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ customername: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = {Invoice};


