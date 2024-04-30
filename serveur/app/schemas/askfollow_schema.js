const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const askfollow_schema = new Schema(
    {
        user_asking: {
            type: String,
            required: true
        },
        user_asked: {
            type: String,
            required: true
        }
    }
)

askfollow_schema.index({ user_asking: 1, user_asked: 1 }, { unique: true });

module.exports = mongoose.model('askfollow', askfollow_schema)