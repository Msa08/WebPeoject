const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const like_schema = new Schema(
    {
        id_tweet: {
            type: String,
            required: true
        },
        pseudo_user : {
            type: String,
            required: true
        }
    }
)

like_schema.index({ id_tweet: 1, pseudo_user: 1 }, { unique: true });

module.exports = mongoose.model('like', like_schema)