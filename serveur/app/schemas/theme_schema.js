const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const theme_schema = new Schema(
    {
        nom: {
            type: String,
            required: true,
            unique:true
        },
        nombre : {
            type: Number,
            default:0
        }
    }
)

module.exports = mongoose.model('#', theme_schema)