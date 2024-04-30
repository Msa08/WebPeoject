const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const user_schema = new Schema(
    {
        nom: {
            type: String,
            required: true
        },
        prenom: {
            type: String,
            required: true
        },
        pseudo: {
            type: String,
            required: true,
            unique: true,
        },
        date_n: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        nb_follow : {
            type: Number,
            required:true
        },
        nb_followers: {
            type : Number,
            required : true
        },
        private:{
            type:Boolean,
            required : true,
            default:false
        },
        bio:{
            type:String,
        }
    }
)

module.exports = mongoose.model('user', user_schema)