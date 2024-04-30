const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const image_schema = new Schema(
    {
        pseudo : {
            type : String,
            required : true
        },
        path_banner: { 
            type: String, 
            required: true,
            default : 'https://i.pinimg.com/originals/63/01/b3/6301b3599dda27bd54d08e7691754ef1.jpg'
        },
        // path_pp : {
        //     type:String,
        //     required:true,
        //     default : ''
        // }
    }
)

// image_schema.index({ id_tweet: 1, pseudo_user: 1 }, { unique: true });

module.exports = mongoose.model('image', image_schema)