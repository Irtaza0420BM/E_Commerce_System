const joi = require('joi');

exports.createSchema = joi.object({
    name: joi.string().required().min(3).max(50),
    quantity: joi.number().integer().required(),
    required_quantity: joi.number().greater(0).integer().required(),
})

exports.readSchema = joi.object({
    name: joi.string().min(3).max(50),
})




exports.updateSchema = joi.object({
    name: joi.string().min(3).max(50),
    quantity: joi.number().integer().greater(0).required(),
    price_per_unit: joi.number().required().greater(0)
})


exports.removeSchema