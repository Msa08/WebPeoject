const express = require('express');
const cors = require('cors')
const router = express.Router()
const bodyParser = require('body-parser');
const Twist = require('../schemas/twist_schema.js')
const Like = require('../schemas/like_schema.js')
const Rt = require('../schemas/retweet_schema.js')
const User = require('../schemas/user_schema.js')
const Follow = require('../schemas/follow_schema.js')
const Archive = require('../schemas/archive_schema.js')
const Chat = require('../schemas/chat_schema.js')
const cookieParser = require('cookie-parser');

const allowedorigin = ['http://localhost:3000']

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(cors({credentials:true, origin : allowedorigin}))
router.use(cookieParser());

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.body.pseudo="";
    return next();
  }
  else{
    try {
      const decoded = jwt.verify(token, 'OM1993');
      req.body.pseudo = decoded.pseudo;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token non valide.' });
    }
}
};

router.get('/',verifyToken,async(req,res)=>{
  const regex = /#\w+/g;
  // Si des hashtags sont trouvés, ajoutez-les à un tableau
  let tab = {};
  let best_conv = {};
  const hashtag = await Twist.collection.find({user:req.body.pseudo}).toArray();
  for(var i = 0;i<hashtag.length;i++){
    const matchedHashtags = hashtag[i].content.match(regex);
    const list_hashtags = matchedHashtags ? matchedHashtags.map((hashtag) => hashtag.slice(1)) : [];
    for(var j = 0;j<list_hashtags.length;j++){
      if(tab[list_hashtags[j]]){
        tab[list_hashtags[j]]+=1;
      }
      else{
        tab[list_hashtags[j]]=1;
      }
    }
  }
  let maxKey = null;
  let maxValue = -Infinity;

  for (const [key, value] of Object.entries(tab)) {
    if (value > maxValue) {
      maxValue = value;
      maxKey = key;
    }
  }

  const conv = await Chat.collection.find({$or:[{sender:req.body.pseudo},{recipient:req.body.pseudo}]}).toArray();
  for(var i = 0;i<conv.length;i++){
    if(conv[i].sender!==req.body.pseudo){
      if(best_conv[conv[i].sender]){
        best_conv[conv[i].sender]+=1;
      }
      else{
        best_conv[conv[i].sender]=1;
      }
    }
    else{
      if(best_conv[conv[i].recipient]){
        best_conv[conv[i].recipient]+=1;
      }
      else{
        best_conv[conv[i].recipient]=1;
      }
    }
  }

  let maxKey2 = null;
  let maxValue2 = -Infinity;

  for (const [key, value] of Object.entries(best_conv)) {
    if (value > maxValue2) {
      maxValue2 = value;
      maxKey2 = key;
    }
  }

  res.send({
      "nb_twist":await Twist.collection.countDocuments({user:req.body.pseudo}),
      "nb_abonné":await Follow.collection.countDocuments({user_followed:req.body.pseudo}),
      "nb_like":await Like.collection.countDocuments({pseudo_user:req.body.pseudo}),
      "nb_rt":await Rt.collection.countDocuments({pseudo_user:req.body.pseudo}),
      "nb_archive":await Archive.collection.countDocuments({pseudo_user:req.body.pseudo}),
      "hashtags":maxKey,
      "best_conv":maxKey2
  })
})

module.exports = router