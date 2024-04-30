const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const archive_schema = new Schema(
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

archive_schema.index({ id_tweet: 1, pseudo_user: 1 }, { unique: true });

module.exports = mongoose.model('archive', archive_schema)