const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Chat = require('../schemas/chat_schema.js')
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

router.post("/send_chat/:username",verifyToken,async(req,res)=>{
  const message = new Chat({
    sender:req.body.pseudo,
    date:req.body.date,
    recipient:req.params.username,
    content:req.body.content
  })
  try{
    await message.save()
    res.status(200).send("Message bien envoyé");

  }
  catch(error){
    console.error(error.message);
    res.status(500).send("Une erreur s'est produite lors de l'envoi du message");
  }
})

router.get("/list_conversation/",verifyToken,async (req,res)=>{
  try{
    const liste_chat = await Chat.collection.find({$or:[{sender:req.body.pseudo},{recipient:req.body.pseudo}]}).toArray();
    liste_chat.sort(function(a,b){
        let dateA = new Date(a.date);
        let dateB = new Date(b.date);
      return dateB - dateA;
    });
    let tab=[];
    for(var i =0;i<liste_chat.length;i++){
      if((tab.findIndex(objet=> objet.user === liste_chat[i].sender) === -1) && (tab.findIndex(objet=> objet.user===liste_chat[i].recipient)===-1)){
        if(liste_chat[i].sender!=req.body.pseudo){
          tab.push({
            user:liste_chat[i].sender,
            message:liste_chat[i].content
          })
        }
        else{
          tab.push({
            user:liste_chat[i].recipient,
            message:liste_chat[i].content
          })
        }
      }
    }

    res.status(200).json(tab);
  }
  catch(error){
    console.error(error.message);
    res.status(500).send("Une erreur s'est produite lors de la recupérations des conversations");
  }
})

router.get("/list_message/:username",verifyToken,async (req,res)=>{
  try{
    const liste_message = await Chat.collection.find({$or:[{
      sender:req.body.pseudo,
      recipient:req.params.username
    },
    {
      sender:req.params.username,
      recipient:req.body.pseudo
    }]
  }).toArray();

  liste_message.sort(function(a,b){
    return a.date - b.date;
  });

  res.json(liste_message);
  }
  catch(error){

  }
})

router.post("/search_conv",verifyToken,async(req,res)=>{
  
  try{
    const liste_chat = await Chat.collection.find({$or:[{sender:req.body.pseudo,recipient:{$regex: `^${req.body.search}`, $options: "i"}},{sender:{$regex: `^${req.body.search}`, $options: "i"},recipient:req.body.pseudo}]}).toArray();
    liste_chat.sort(function(a,b){
        let dateA = new Date(a.date);
        let dateB = new Date(b.date);
      return dateB - dateA;
    });
    let tab=[];
    for(var i =0;i<liste_chat.length;i++){
      if((tab.findIndex(objet=> objet.user === liste_chat[i].sender) === -1) && (tab.findIndex(objet=> objet.user===liste_chat[i].recipient)===-1)){
        if(liste_chat[i].sender!=req.body.pseudo){
          tab.push({
            user:liste_chat[i].sender,
            message:liste_chat[i].content
          })
        }
        else{
          tab.push({
            user:liste_chat[i].recipient,
            message:liste_chat[i].content
          })
        }
      }
    }

    res.status(200).json(tab);
  }
  catch(error){
    console.error(error.message);
    res.status(500).send("Une erreur s'est produite lors de la recupérations des conversations");
  }
})


module.exports = router