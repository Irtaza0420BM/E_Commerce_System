const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employee = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    username: {type: String, required: true, unique: true},
    email: {
        type: String,
        required: [true, 'Email is required!'],
        trim: true,
        unique: true, // `unique` does not take a custom message directly
        minLength: [5, "Email must have at least 5 characters"]
    },
    phone:{ type: String , required: true, unique: true},
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    address: {type : String, required: true},
    verified: {type: Boolean, default: false},
    employeeCode: { type: String },
    adminCode: { type: String },
});

employee.index ({username : 1})
employee.index ({email: 1})

const Employee = mongoose.model('Employee', employee);

module.exports= {Employee}
