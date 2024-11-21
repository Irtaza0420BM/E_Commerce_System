const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for Employee Information related to updates
const EmployeeUpdateSchema = new Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',  // Assuming you have an Employee model
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',  // Assuming you have an Item model to track the items
    required: true
  },
  action: {
    type: String,
    enum: ['update', 'delete'],  // You can add more actions as needed
    required: true
  },
  updateDetails: {
    type: String,
    required: false  // Optional: to store any comments/details about the update
  },
  timestamp: {
    type: Date,
    default: Date.now  // Automatically records the time of the update
  }
});

// Create a model for the EmployeeUpdateSchema
const EmployeeUpdate = mongoose.model('EmployeeUpdate', EmployeeUpdateSchema);

module.exports = EmployeeUpdate;
