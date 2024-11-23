
const mongoose = require('mongoose');


//I need items name, Items Quatity inserted by Admin, and required quantity for each item, How much we bought it for How much we selling it for

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required!'],
    trim: true,
    unique: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required.'],
  },
  required_quantity: {
    type: Number,
    required: true,
  },
  stock: {
    type: String,
    default: 'Available',
  },
  buying_price_per_unit: { 
    type: Number,
    required: true,
  },
  selling_price_per_unit: {
    type: Number,
    required: true,
  },
});

itemSchema.index({ name: "text" });

const Item = mongoose.model('Item', itemSchema);

module.exports = {Item}
