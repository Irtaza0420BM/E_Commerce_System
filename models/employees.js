const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
//userSchema? Question is What are the credentials for employee and admin login name, password, phone, address, cnic

mongoose.connect('mongodb://localhost:27017/items')
.then(() => {console.log('Connected to MongoDB')})
.catch(err => {console.error('Error connecting to MongoDB:', err)});


const UserSchema = new mongoose.Schema({
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
    cnic: { type: String, required: true },
    address: {type : String, required: true},
    verified: {type: Boolean, default: false},
});

// UserSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// });

UserSchema.index ({username : 1})
UserSchema.index ({email: 1})
//Why I used 1 here and note "text" is bcuz I want to do sorting, and search by exact user name not like medicine where I might forget some phrase.

module.exports = mongoose.model('Employee', UserSchema);
