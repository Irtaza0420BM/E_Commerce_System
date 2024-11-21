const { hash, compare } = require("bcrypt")
const crypto = require("crypto")

exports.doHash = (value, saltValue) =>
{
    const result = hash(value, saltValue)
    return result;
}


exports.doHashValidation = (value, hashedValue) =>
{
    const result = compare(value,hashedValue);
    return result;
}

exports.hmacProcess=(value, hashedValue) =>
{
    const result = crypto.createHmac('sha256', hashedValue).update(value).digest('hex')
    return result
}