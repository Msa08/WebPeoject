const express = require('express');
const app = express();
const cors = require('cors')
const router = express.Router()
const bodyParser = require('body-parser');
const Twist = require('../schemas/twist_schema.js')
const Like = require('../schemas/like_schema.js')
const Rt = require('../schemas/retweet_schema.js')
const User = require('../schemas/user_schema.js')
const Follow = require('../schemas/follow_schema.js')
const Archive = require('../schemas/archive_schema.js')
const Block = require('../schemas/block_schema.js')
const Theme = require('../schemas/theme_schema.js')
const ObjectId = require('mongodb').ObjectId;
const cookieParser = require('cookie-parser');
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: "app/data_bases/picture/",
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + Date.now() + ext);
    }
});
const upload = multer({
    limits: {
        fieldSize: 5 * 1024 * 1024
    }, storage: storage
});

const allowedorigin = ['http://localhost:3000']

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(cors({credentials:true, origin : allowedorigin}))
router.use(cookieParser());
router.use(express.static(path.join(__dirname, 'picture')))

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

router.post('/post_twist',verifyToken, async (req, res) => {
    const twist = new Twist({
        user: req.body.user,
        content: req.body.content,
        like: req.body.like,
        retweet: req.body.retweet,
        time:req.body.time,
        archive:req.body.archive

    });
    try {
        const regex = /#\w+/g;
        const matchedHashtags = req.body.content.match(regex);

        // Si des hashtags sont trouvés, ajoutez-les à un tableau
        const hashtags = matchedHashtags ? matchedHashtags.map((hashtag) => hashtag.slice(1)) : [];
        for(var i = 0;i<hashtags.length;i++){
            Theme.collection.updateOne({ nom: hashtags[i] },
                { $inc: { nombre: 1 } },
                { upsert: true })
        }
        console.log(hashtags)
        const a = await twist.save();
        console.log(a._id.valueOf())
        console.log('twist posté');
        res.status(200).send({id:a._id.valueOf()});
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du post");
    }
});

router.get('/liste_twist', verifyToken, async (req, res) => {
    try {
      const twistCollection = Twist.collection
      const twists = await twistCollection.find().toArray();
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
            const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:user.pseudo},{user_blocked:user.pseudo,user_blocking:req.body.pseudo}]})
            if(block){
                continue
            }
            else{
                tab.push(twists[i]);
            }
        }
      }
      res.json(tab);
    } catch (err) {
      console.error(err);
      res.status(500).send('Une erreur s\'est produite lors de la récupération des utilisateurs.');
    }
});

router.post('/like_twist',verifyToken,async (req,res)=>{
    const like = new Like({
        id_tweet: req.body._id,
        pseudo_user : req.body.pseudo,
    });
    try{
        console.log(req.body._id)
        await like.save();
        const twistCollection = Twist.collection
        twistCollection.updateOne(
            {_id:new ObjectId(req.body._id)},
            {$inc :{like:1}}
        )
        console.log('twist liké');
        res.status(200).send("twist liké avec succès");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du post");
    }
});

router.post('/rt_twist',verifyToken,async (req,res)=>{
    const rt = new Rt({
        id_tweet: req.body._id,
        pseudo_user : req.body.pseudo,
    });
    try{
        await rt.save()
        const twistCollection = Twist.collection
        twistCollection.updateOne(
            {_id:new ObjectId(req.body._id)},
            {$inc :{retweet:1}}
        )
        console.log('twist rt');
        res.status(200).send("twist rt avec succès");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du post");
    }
});

router.post('/get_rt_count',async (req,res)=>{
    const nb_like = await Twist.findOne({_id:req.body.id})
    res.send({"rt":nb_like.retweet})
})

router.post('/get_like_count',async (req,res)=>{
    const nb_like = await Twist.findOne({_id:new ObjectId(req.body.id)})
    res.send({"like":nb_like.like})
})

router.post('/get_archive_count',async (req,res)=>{
    const nb_archive = await Twist.findOne({_id:new ObjectId(req.body.id)})
    res.send({"archive":nb_archive.archive})
})

router.post('/unrt_twist',verifyToken,async (req,res)=>{
    try{
        const twistCollection = Twist.collection
        twistCollection.updateOne(
            {_id:new ObjectId(req.body._id)},
            {$inc :{retweet:-1}}
        )
        const rtCollection = Rt.collection
        rtCollection.deleteOne({id_tweet:req.body._id,pseudo_user:req.body.pseudo})
        console.log('twist unrt');
        res.status(200).send("twist unrt avec succès");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du unrt");
    }
})

router.post('/unlike_twist',verifyToken,async (req,res)=>{
    try{
        const twistCollection = Twist.collection
        await twistCollection.updateOne(
            {_id:new ObjectId(req.body._id)},
            {$inc :{like:-1}}
        )
        const likeCollection = Like.collection
        likeCollection.deleteOne({id_tweet:req.body._id,pseudo_user:req.body.pseudo})
        console.log('twist unlike');
        res.status(200).send("twist unlike avec succès");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du unlike");
    }
})

router.post('/archive_twist',verifyToken,async (req,res)=>{
    const archive = new Archive({
        id_tweet: req.body._id,
        pseudo_user : req.body.pseudo,
    });
    try{
        await archive.save();
        const twistCollection = Twist.collection
        twistCollection.updateOne(
            {_id:new ObjectId(req.body._id)},
            {$inc :{archive:1}}
        )
        res.status(200).send("twist archivé avec succès");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du post");
    }
})

router.post('/unarchive_twist',verifyToken,async (req,res)=>{
    try{
        const twistCollection = Twist.collection
        await twistCollection.updateOne(
            {_id:new ObjectId(req.body._id)},
            {$inc :{archive:-1}}
        )
        const archiveCollection = Archive.collection
        archiveCollection.deleteOne({id_tweet:req.body._id,pseudo_user:req.body.pseudo})
        res.status(200).send("twist unlike avec succès");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du unlike");
    }
})
router.post('/islike',verifyToken,async (req,res)=>{
    if(req.body.pseudo==""){
        res.send({"like":false})
    }
    else{
        try{
            const likeCollection = Like.collection
            await likeCollection.findOne({id_tweet:req.body._id,pseudo_user:req.body.pseudo})
            .then(result =>{
                if(result){
                    res.send({"like":true})
                }
                else{
                    res.send({"like":false})
                }
            })
        }
        catch (error) {
            console.error(error.message);
            res.status(500).send("Une erreur s'est produite lors du test like");
        }
    }
})

router.post('/isrt',verifyToken,async (req,res)=>{
    if(req.body.pseudo==""){
        res.send({"rt":false})
    }
    else{
        try{
            const rtCollection = Rt.collection
            await rtCollection.findOne({id_tweet:req.body._id,pseudo_user:req.body.pseudo})
            .then(result =>{
                if(result){
                    res.send({"rt":true})
                }
                else{
                    res.send({"rt":false})
                }
            })
        }
        catch (error) {
            console.error(error.message);
            res.status(500).send("Une erreur s'est produite lors du test like");
        }
    }
})

router.post('/isarchive',verifyToken,async (req,res)=>{
    if(req.body.pseudo==""){
        res.send({"archive":false})
    }
    else{
        try{
            const archiveCollection = Archive.collection
            await archiveCollection.findOne({id_tweet:req.body._id,pseudo_user:req.body.pseudo})
            .then(result =>{
                if(result){
                    res.send({"archive":true})
                }
                else{
                    res.send({"archive":false})
                }
            })
        }
        catch (error) {
            console.error(error.message);
            res.status(500).send("Une erreur s'est produite lors du test like");
        }
    }
})

router.get('/liste_tweet/:username', async (req, res) => {
    try {
      const twistCollection = Twist.collection
      const twists = await twistCollection.find({user:req.params.username}).toArray();
      res.json(twists);
    } catch (err) {
      console.error(err);
      res.status(500).send('Une erreur s\'est produite lors de la récupération des utilisateurs.');
    }
});

router.get('/liste_rt/:username', verifyToken,async (req, res) => {
    try {
      const rtCollection = Rt.collection
      const id = await rtCollection.find({pseudo_user:req.params.username}).toArray();
      let tableau = [];
      for (var i = 0; i < id.length; i++) {
        const rt2 = await Twist.collection.findOne({_id:new ObjectId(id[i].id_tweet)})
        if(rt2){
            const user=await User.collection.findOne({pseudo:rt2.user})
            if(user.pseudo!=req.body.pseudo && user.private){
                const follow = await Follow.collection.findOne({user_follow:req.body.pseudo,user_followed:rt2.user})
                if(follow){
                    tableau.push(rt2);
                }
            }
            else{
                const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:user.pseudo},{user_blocked:user.pseudo,user_blocking:req.body.pseudo}]})
                if(block){
                    continue
                }
                else{
                    tableau.push(rt2);
                }
            }
        }
      }
        res.json(tableau);
    }
    catch (err) {
      console.error(err);
      res.status(500).send('Une erreur s\'est produite lors de la récupération des utilisateurs.');
    }
});

router.get('/liste_like/:username', verifyToken, async (req, res) => {
    try {
      const likeCollection = Like.collection
      const id = await likeCollection.find({pseudo_user:req.params.username}).toArray();
      let tableau = [];
      for (var i = 0; i < id.length; i++) {
        const like = await Twist.collection.findOne({_id:new ObjectId(id[i].id_tweet)})
        if(like){
            const user=await User.collection.findOne({pseudo:like.user})
            if(user.pseudo!=req.body.pseudo && user.private){
                const follow = await Follow.collection.findOne({user_follow:req.body.pseudo,user_followed:like.user})
                if(follow){
                    tableau.push(like);
                }
            }
            else{
                const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:user.pseudo},{user_blocked:user.pseudo,user_blocking:req.body.pseudo}]})
                if(block){
                    continue
                }
                else{
                    tableau.push(like);
                }
            }
        }
    }
      res.json(tableau);
    } catch (err) {
      console.error(err);
      res.status(500).send('Une erreur s\'est produite lors de la récupération des utilisateurs.');
    }
});

router.get("/liste_archive",verifyToken, async(req,res)=>{
    try {
        const archiveCollection = Archive.collection
        const id = await archiveCollection.find({pseudo_user:req.body.pseudo}).toArray();
        console.log(id)
        let tableau = [];
        for (var i = 0; i < id.length; i++) {
          const archive = await Twist.collection.findOne({_id:new ObjectId(id[i].id_tweet)})
          if(archive){
              const user=await User.collection.findOne({pseudo:archive.user})
              if(user.pseudo!=req.body.pseudo && user.private){
                  const follow = await Follow.collection.findOne({user_follow:req.body.pseudo,user_followed:archive.user})
                  if(follow){
                      tableau.push(archive);
                  }
              }
              else{
                const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:user.pseudo},{user_blocked:user.pseudo,user_blocking:req.body.pseudo}]})
                if(block){
                    continue
                }
                else{
                    tableau.push(archive);
                }
              }
          }
        }
        res.json(tableau);
      } catch (err) {
        console.error(err);
        res.status(500).send('Une erreur s\'est produite lors de la récupération des utilisateurs.');
      }
})

router.delete("/delete_twist:id_twist",verifyToken, async(req,res)=>{
    try{
        const twist = await Twist.collection.findOne({_id:new ObjectId(req.params.id_twist),user:req.body.pseudo});
        const regex = /#\w+/g;
        const matchedHashtags = twist.content.match(regex);

        // Si des hashtags sont trouvés, ajoutez-les à un tableau
        const hashtags = matchedHashtags ? matchedHashtags.map((twist) => twist.slice(1)) : [];
        for(var i = 0;i<hashtags.length;i++){
            await Theme.collection.updateOne({ nom: hashtags[i] },
                { $inc: { nombre: -1 } })
            const theme = await Theme.collection.findOne({ nom: hashtags[i] });
            console.log(theme)
            if(theme.nombre===0){
                await Theme.collection.deleteOne({ nom: hashtags[i] })
            }
        }
        await Twist.collection.deleteOne({_id:new ObjectId(req.params.id_twist),user:req.body.pseudo});
        res.status(200).send("twist deleted");
    }
    catch(error){
        console.log(error)
        res.status(500).send('Une erreur s\'est produite lors de la suppression du twist.');
    }
})

router.get("/gettopHashtags",async(req,res)=>{
    try{
        const hashtags = await Theme.collection.find().toArray();
        hashtags.sort((a, b) => b.nombre- a.nombre);

        // Obtenir les 5 premiers éléments du tableau trié
        const topFive = hashtags.slice(0, 5);
        res.status(200).json(hashtags)
    }
    catch(error){
        console.log(error)
        res.status(500).send('Une erreur s\'est produite lors de l obtention des hashtags.');
    }
})

router.post("/sendpicture",upload.single('picture'),verifyToken,async(req,res)=>{
    const oldPath = req.file.path;
    // Construire le nouveau nom de fichier
    const newName = `${req.body.id}`;
    // Construire le nouveau chemin complet du fichier
    const newPath = path.join(path.dirname(oldPath), newName);
    // Renommer le fichier avec le nouveau nom de fichier
    fs.renameSync(oldPath, newPath);
    console.log(req.file);
    res.status(200).send('Image Uploaded!');
})

router.get("/picture/:filename", (req, res) => {
    const filename = req.params.filename;
    fs.access(path.join(__dirname, 'picture/', filename), (err) => {
        if (err) {
          res.status(201).send("rien")
          return;
        }
        res.sendFile(path.join(__dirname, 'picture/', filename));
    })
})
module.exports = router;
