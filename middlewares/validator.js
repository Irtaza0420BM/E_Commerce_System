const joi = require('joi');

exports.createSchema = joi.object({
    name: joi.string().required().min(3).max(50),
    quantity: joi.number().integer().required(),
    required_quantity: joi.number().greater(0).integer().required(),
    buying_price_per_unit: joi.number().greater(0).required(),
    selling_price_per_unit: joi.number().greater(0).required()
})

exports.readSchema = joi.object({
    name: joi.string().min(3).max(50),
})

exports.updateSchema = joi.object({
    name: joi.string().min(3).max(50),
    quantity: joi.number().integer().greater(0).required(),
    price_per_unit: joi.number().required().greater(0)
})

exports.employeeSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().min(6).max(60).required().email({tlds:{ allow:['com', 'net']}}).messages({
        'string.email': 'Only email addresses of the form of abc@abc.com or abc@abc.net are allowed',
        'string.empty': 'Email is required.',
        'string.min': 'Email must be at least 6 characters long.',        
    }),
    username: joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]+$')).min(3).max(30).messages({
      'string.pattern.base': 'Username can only contain letters and numbers, no spaces or special characters.',
      'string.empty': 'Username is required.',
      'string.min': 'Username must be at least 3 characters long.',
      'string.max': 'Username must not exceed 30 characters.',
    }),
    password: joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_=+-]).{8,}$')).messages({
        'string.empty' : 'Password is required.',
        'string.pattern.base': 'Password must be at least 8 characters long and contain at least, one uppercase letter, one lowercase letter, one number and one special character.',
        
    }),
    phone: joi.string().required().pattern(new RegExp('^[0-9]{11}$')),
    address: joi.string().required(),
})
//Will validate Email and password (no need to open it.)
exports.signinSchema = joi.object({
    username: joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]+$')).min(3).max(30).required().messages({
        'string.pattern.base': 'Username can only contain letters and numbers, no spaces or special characters.',
        'string.empty': 'Username is required.',
        'string.min': 'Username must be at least 3 characters long.',
        'string.max': 'Username must not exceed 30 characters.',
      }),
    password: joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_=+-]).{8,}$')).messages({
        'string.pattern.base': 'Atleast 8 Alphanumeric, and One Capital letter, one small letter, one number and one special character is required.',})
})


exports.removeSchema = joi.object({

})