const mongoose = require('mongoose');

// Define the schema
const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  sequence_value: {
    type: Number,
    default: 0,
  },
});

// Create and export the model
const Counter = mongoose.model('Counter', counterSchema);

module.exports = {Counter};
