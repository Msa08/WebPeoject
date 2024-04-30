const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const router = express.Router();
const User = require('../schemas/user_schema.js');
const Follow = require('../schemas/follow_schema.js');
const Twist = require('../schemas/twist_schema.js');
const Block = require('../schemas/block_schema.js')
const cookieParser = require('cookie-parser');
const allowedorigin = ['http://localhost:3000']
router.use(bodyParser.json({ limit: '10mb' }));
router.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
router.use(cors({credentials:true, origin : allowedorigin}))
router.use(cookieParser());
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({"logged":false})
    }
  
    try {
      const decoded = jwt.verify(token, 'OM1993');
      req.body.pseudo = decoded.pseudo;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token non valide.' });
    }
  };

router.post("/top_twist",verifyToken,async(req,res)=>{
    try{
        const twists = await Twist.collection.find({content:{$regex:req.body.research}}).toArray();
        console.log(req.body.research)
        let tab=[]
          for (var i = 0; i < twists.length; i++) {
            const user=await User.collection.findOne({pseudo:twists[i].user})
            if(user.pseudo!=req.body.pseudo && user.private){
                const follow = await Follow.collection.findOne({user_follow:req.body.pseudo,user_followed:user.pseudo})
                if(follow){
                    tab.push(twists[i]);
                }
            }
            else{
                tab.push(twists[i]);
            }
          }
          tab.sort(function(a,b){
            return b.like-a.like;
          })
          console.log(tab)
          res.json(tab);
    }
    catch(error){
        console.error(err);
      res.status(500).send('Une erreur s\'est produite lors de la recherche de twist.');
    }
})

router.post("/user",verifyToken,async(req,res)=>{
    try{
        const users = await User.collection.find({pseudo:{$regex:req.body.research}}).toArray();
        users.sort(function(a,b){
          return a.pseudo-b.pseudo;
        })
        let tab = []
        for(var i = 0; i<users.length;i++){
          if(users[i].pseudo!==req.body.pseudo){
              const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:users[i].pseudo},{user_blocked:users[i].pseudo,user_blocking:req.body.pseudo}]})
              if(block){
                  continue
              }
              else{
                tab.push({
                  "pseudo":users[i].pseudo
                })
              }
          }
        }
        res.json(tab);
    }
    catch(error){
        console.error(error);
      res.status(500).send('Une erreur s\'est produite lors de la recherche de twist.');
    }
})

router.post("/recent",verifyToken,async(req,res)=>{
    try{
        const twists = await Twist.collection.find({content:{$regex:req.body.research}}).toArray();
        let tab=[]
          for (var i = 0; i < twists.length; i++) {
            const user=await User.collection.findOne({pseudo:twists[i].user})
            if(user.pseudo!=req.body.pseudo && user.private){
                const follow = await Follow.collection.findOne({user_follow:req.body.pseudo,user_followed:user.pseudo})
                if(follow){
                    tab.push(twists[i]);
                }
            }
            else{
                tab.push(twists[i]);
            }
          }
          tab.sort(function(a,b){
            let dateA = new Date(a.time);
            let dateB = new Date(b.time);
            return dateB - dateA;
          })
          res.json(tab);
    }
    catch(error){
        console.error(err);
      res.status(500).send('Une erreur s\'est produite lors de la recherche de twist.');
    }
})

router.post("/twistHashtagged",verifyToken,async(req,res)=>{
  const regex = new RegExp(`#${req.body.search}\\b`, 'gi');
  const liste = await Twist.collection.find({content:{ $regex: `#${req.body.research}\\b`}}).toArray();
  console.log(liste)
  let tableau = [];
  for (var i = 0; i < liste.length; i++) {
    const user=await User.collection.findOne({pseudo:liste[i].user})
    if(user.pseudo!=req.body.pseudo && user.private){
        const follow = await Follow.collection.findOne({user_follow:req.body.pseudo,user_followed:liste[i].user})
        if(follow){
            tableau.push(liste[i]);
        }
    }
    else{
        const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:user.pseudo},{user_blocked:user.pseudo,user_blocking:req.body.pseudo}]})
        if(block){
            continue
        }
        else{
            tableau.push(liste[i]);
        }
    }
    }
  res.json(tableau);
});

module.exports = router