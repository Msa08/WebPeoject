const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const follow_schema = new Schema(
    {
        user_follow: {
            type: String,
            required: true
        },
        user_followed: {
            type: String,
            required: true
        }
    }
)

follow_schema.index({ user_follow: 1, user_followed: 1 }, { unique: true });

module.exports = mongoose.model('follow', follow_schema)