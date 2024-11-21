const joi = require('joi');

exports.createSchema = joi.object({
    name: joi.string().required().min(3).max(50),
    quantity: joi.number().integer().required(),
    required_quantity: joi.number().greater(0).integer().required(),
})
