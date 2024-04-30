const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const twist_schema = new Schema(
    {
        user: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        like: {
            type: Number,
            required: true,
        },
        retweet: {
            type: Number,
            required: true,
        },
        archive:{
            type:Number,
            required:true
        },
        time:{
            type: String,
            required:true
        }
    }
)

module.exports = mongoose.model('twist', twist_schema)