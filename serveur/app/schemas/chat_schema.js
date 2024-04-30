const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const message_schema = new Schema(
    {
        sender: {
            type: String,
            required: true
        },
        date: {
            type: String,
            required: true
        },
        recipient:{
            type:String,
            required:true
        },
        content:{
            type:String,
            required:true
        }
    }
)

module.exports = mongoose.model('message', message_schema)