//I made connection to localhost Mongodb, then I made a Schema for name, quantity and required_quantity. DB name is items, collection name is Item
//Then I exported data.


const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/items')
.then(() => {console.log('Connected to MongoDB')})
.catch(err => {console.error('Error connecting to MongoDB:', err)});

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
  required_quantity:{
    type: Number,
    required: true,
  },
  stock: {
    type: String,
    default: 'Available'
  },
  price_per_unit: { 
    type: Number,
    required: true 
  }
});

const soldItemSchema = new mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Number, required: true },
    price_per_unit: { type: Number, required: true },
    total_cost: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  });
  

const soldItem = mongoose.model('purchaseItem', soldItemSchema)
const Item = mongoose.model('Item', itemSchema);

module.exports = {Item, soldItem}