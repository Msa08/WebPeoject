const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const block_schema = new Schema(
    {
        user_blocking: {
            type: String,
            required: true
        },
        user_blocked: {
            type: String,
            required: true
        }
    }
)

block_schema.index({ user_blocking: 1, user_blocked: 1 }, { unique: true });

module.exports = mongoose.model('block', block_schema)