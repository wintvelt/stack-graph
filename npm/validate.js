// try validator of stackdefs
const { Validator } = require('jsonschema')
const schema = require('./stack-schema.js')
let v = new Validator()

module.exports = function (stack) {
    const res = v.validate(stack, schema)
    return res
}