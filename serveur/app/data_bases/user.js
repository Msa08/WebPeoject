const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../schemas/user_schema.js');
const Follow = require('../schemas/follow_schema.js');
const Twist = require('../schemas/twist_schema.js');
const Rt = require('../schemas/retweet_schema.js');
const Like = require('../schemas/like_schema.js');
const Chat = require('../schemas/chat_schema.js');
const Block = require('../schemas/block_schema.js')
const AskFollow = require('../schemas/askfollow_schema.js')
const Archive = require('../schemas/archive_schema.js')
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: "app/data_bases/banner/",
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
const storage2 = multer.diskStorage({
    destination: "app/data_bases/pp/",
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + Date.now() + ext);
    }
});
const upload2 = multer({
    limits: {
        fieldSize: 5 * 1024 * 1024
    }, storage: storage2
});


const allowedorigin = ['http://localhost:3000', 'http://localhost:3000/']
router.use(bodyParser.json({ limit: '10mb' }));
router.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
router.use(cors({ credentials: true, origin: allowedorigin }))
router.use(cookieParser());
// router.use('/twist',require('./twist.js'));

router.use(express.static(path.join(__dirname, 'banner')))
router.use(express.static(path.join(__dirname, 'pp')))
const defaultppPath = path.join(__dirname, 'pp', 'default');
const defaultbannerPath = path.join(__dirname, 'banner', 'default');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.send({ "logged": false })
    }

    try {
        const decoded = jwt.verify(token, 'OM1993');
        req.body.pseudo = decoded.pseudo;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token non valide.' });
    }
};

// Middleware de cryptage du mot de passe
const hashPassword = async (req, res, next) => {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    next();
};

// Route pour créer un utilisateur
router.post('/create_user', hashPassword, async (req, res) => {
    const usr = new User({
        nom: req.body.nom,
        prenom: req.body.prenom,
        pseudo: req.body.pseudo,
        date_n: req.body.date_n,
        email: req.body.email,
        password: req.body.password,
        nb_follow: req.body.nb_follow,
        nb_followers: req.body.nb_followers
    });
    try {
        const user = await User.collection.findOne({pseudo:req.body.pseudo})
        if(user){
            res.status(401).send()
        }
        else{
            await usr.save();
            fs.readFile(defaultppPath, (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }
                const newPath = path.join(__dirname,'pp',req.body.pseudo)
            fs.writeFile(newPath, data, (err) => {
                  if (err) {
                    console.log("writefile")
                    console.error(err);
                    return;
                  }
                });
            });
            fs.readFile(defaultbannerPath, (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }
                const newPath = path.join(__dirname,'banner',req.body.pseudo)
            fs.writeFile(newPath, data, (err) => {
                  if (err) {
                    console.log("writefile")
                    console.error(err);
                    return;
                  }
                });
            });
            const secret = "OM1993"
            const token = jwt.sign({ pseudo: usr.pseudo }, secret);
            res.cookie("token", token, { httpOnly: false })
            console.log('Usr ajouté dans la base de donnée');
            res.status(200).send("L'utilisateur a été ajouté avec succès!");
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors de l'ajout de l'utilisateur");
    }
});

// Route pour s'authentifier
router.post('/login', async (req, res) => {
    const { pseudo, password } = req.body;
    const user = await User.findOne({ pseudo });
    console.log(pseudo);
    if (user && (await bcrypt.compare(password, user.password))) {
        // user_log = user
        const secret = "OM1993"
        const token = jwt.sign({ pseudo: user.pseudo }, secret);
        res.cookie("token", token, { httpOnly: false })
        res.status(200).send("Authentification réussie! ");
    } else {
        console.log("echec")
        res.status(401).send("L'authentification a échoué.");
    }
});

// Route pour récupérer tous les utilisateurs (accessible uniquement si authentifié)
router.get('/get_all', verifyToken, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors de la récupération des utilisateurs.");
    }
});

// Route pour se déconnecter
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    console.log("logout")
    res.status(200).send("all is good")
});

router.get('/logged', verifyToken, async (req, res) => {
    // const token = req.cookies.token;
    // const decoded = jwt.verify(token, 'OM1993');
    const user = await User.findOne({ pseudo: req.body.pseudo });
    console.log(req.body.pseudo)
    res.send({
        "logged": true,
        "nom": user.nom,
        "prenom": user.prenom,
        "pseudo": user.pseudo,
        "nb_follow": user.nb_follow,
        "nb_followers": user.nb_followers,
        "mail":user.email,
        "date_n":user.date_n
    })
})

router.get('/get_user/:username', verifyToken, async (req, res) => {
    try {
        const pseudo = req.params.username;
        const user = await User.findOne({ pseudo });
        const follow = await Follow.findOne({ user_follow: req.body.pseudo, user_followed: user.pseudo })
        if (user.private && (!follow && user.pseudo != req.body.pseudo)) {
            res.status(200).send({
                "private": true,
                "pseudo": user.pseudo
            })
        }
        else {
            res.send({
                "nom": user.nom,
                "prenom": user.prenom,
                "pseudo": user.pseudo,
                "nb_follow": user.nb_follow,
                "nb_followers": user.nb_followers,
                "bio":user.bio
            })
        }
    }
    catch (error) {
        console.error(error.message)
        res.send({ "pseudo": "user not found" })
    }
})

router.post('/follow/:username', verifyToken, async (req, res) => {
    try {
        if (req.body.pseudo !== req.params.username) {
            const userCollection = User.collection
            const user = await userCollection.findOne({ pseudo: req.params.username });
            const block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:req.params.username},{user_blocked:req.params.username,user_blocking:req.body.pseudo}]})
            console.log(block)
            if(block){
                return res.status(500).send("user introuvable");
            }
            if (user.private) {
                const askfollow = new AskFollow({
                    user_asking: req.body.pseudo,
                    user_asked: req.params.username
                });
                await askfollow.save();
                res.status(205).send("follow request sent")
            }
            else {
                const follow = new Follow({
                    user_follow: req.body.pseudo,
                    user_followed: req.params.username
                });
                await follow.save();
                await userCollection.updateOne(
                    { pseudo: req.body.pseudo },
                    { $inc: { nb_follow: 1 } }
                )
                await userCollection.updateOne(
                    { pseudo: req.params.username },
                    { $inc: { nb_followers: 1 } }
                )
                res.status(200).send("follow réussi")
            }
        }
        else {
            res.status(500).send("impossible de se follow sois-même")
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du follow");
    }
})

router.delete('/unfollow/:username', verifyToken, async (req, res) => {
    try {
        const followCollection = Follow.collection
        const follow = await followCollection.findOne({
            user_follow: req.body.pseudo,
            user_followed: req.params.username
        })
        if (follow) {
            await followCollection.deleteOne({
                user_follow: req.body.pseudo,
                user_followed: req.params.username
            })
            const userCollection = User.collection
            await userCollection.updateOne(
                { pseudo: req.body.pseudo },
                { $inc: { nb_follow: -1 } }
            )
            await userCollection.updateOne(
                { pseudo: req.params.username },
                { $inc: { nb_followers: -1 } }
            )
            res.status(200).send("unfollow réussi")
        }
        else {
            res.status(300).send("follow non trouvé")
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du follow");
    }
})

router.get("/isfollow/:username", verifyToken, async (req, res) => {
    try {
        const followCollection = Follow.collection;
        await followCollection.findOne({
            user_follow: req.body.pseudo,
            user_followed: req.params.username
        })
            .then(response => {
                if (response) {
                    res.status(200).send({
                        "follow": true
                    })
                }
                else {
                    res.status(200).send({
                        "follow": false
                    })
                }
            });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du checkfollow");
    }

})

router.get("/personnalsettings", verifyToken, async (req, res) => {
    try {
        const userCollection = User.collection;
        const user = await userCollection.findOne(
            { pseudo: req.body.pseudo });
        let json = {
            "private": user.private,
            "ads": user.ads
        }
        res.status(200).send(json);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors de la recupération des preferences de confidentialité");
    }
})

router.put("/settings", verifyToken, async (req, res) => {
    try {
        const userCollection = User.collection;
        const user = await userCollection.findOne(
            { pseudo: req.body.pseudo });
        for (let key in req.body) {
            if (key === "pseudo") {
                continue;
            }
            if (key === "private" && user.private != req.body.private) {
                const upd = {};
                upd[key] = req.body[key];
                await Twist.collection.updateMany({
                    user: req.body.pseudo
                }, { $set: upd })
            }
            const update = {};
            update[key] = req.body[key];
            await userCollection.updateOne(
                { pseudo: req.body.pseudo },
                { $set: update });
        }
        res.status(200).send("changement de confidentialité réalisé avec succès");
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du changement de confidentialité du profil");
    }
})

router.post("/upload_banner", upload.single('banner'), verifyToken, async (req, res) => {
    const oldPath = req.file.path;

    // Construire le nouveau nom de fichier
    const newName = `${req.body.pseudo}`;

    // Construire le nouveau chemin complet du fichier
    const newPath = path.join(path.dirname(oldPath), newName);

    // Renommer le fichier avec le nouveau nom de fichier
    fs.renameSync(oldPath, newPath);

    console.log(req.file);
    res.send('Image Uploaded!');
})

router.post("/upload_pp", upload2.single('pp'), verifyToken, async (req, res) => {
    const oldPath = req.file.path;

    const ext = path.extname(req.file.originalname);

    // Construire le nouveau nom de fichier
    const newName = `${req.body.pseudo}`;

    // Construire le nouveau chemin complet du fichier
    const newPath = path.join(path.dirname(oldPath), newName);

    // Renommer le fichier avec le nouveau nom de fichier
    fs.renameSync(oldPath, newPath);
    res.send('Image Uploaded!');
})

router.get("/liste_followers/:username", verifyToken, async (req, res) => {
    try {
        const followers = await Follow.collection.find({ user_followed: req.params.username }).toArray();
        let tab = []
        for(var i = 0;i<followers.length;i++){
            let block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:followers[i].user_follow},{user_blocked:followers[i].user_follow,user_blocking:req.body.pseudo}]})
            if(block){
                continue;
            }
            else{
                tab.push(followers[i])
            }
        }
        res.json(tab);

    }
    catch (error) {
        console.error(error.message)
        res.status(500).send("Une erreur s'est produite lors du chargement des followers");
    }

})

router.get("/liste_follows/:username", verifyToken, async (req, res) => {
    try {
        const follows = await Follow.collection.find({ user_follow: req.params.username }).toArray();
        let tab = []
        for(var i = 0;i<follows.length;i++){
            let block = await Block.collection.findOne({$or:[{user_blocked:req.body.pseudo,user_blocking:follows[i].user_followed},{user_blocked:follows[i].user_followed,user_blocking:req.body.pseudo}]})
            if(block){
                continue;
            }
            else{
                tab.push(follows[i])
            }
        }
        res.json(tab);
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send("Une erreur s'est produite lors du chargement des followers");
    }

})

router.get("/liste_request/", verifyToken, async (req, res) => {
    try {
        const request = await AskFollow.collection.find({ user_asked: req.body.pseudo }).toArray();
        res.status(200).json(request)
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send("Une erreur s'est produite lors du chargement des requêtes");
    }

})

router.post("/accept_request/:username", verifyToken, async (req, res) => {
    try {
        const request = await AskFollow.collection.findOne({ user_asking: req.params.username, user_asked: req.body.pseudo })
        const userCollection = User.collection

        if (request) {
            const follow = new Follow({
                user_follow: req.params.username,
                user_followed: req.body.pseudo
            });
            await follow.save();
            await userCollection.updateOne(
                { pseudo: req.params.username },
                { $inc: { nb_follow: 1 } }
            )
            await userCollection.updateOne(
                { pseudo: req.body.pseudo },
                { $inc: { nb_followers: 1 } }
            )
            await AskFollow.collection.deleteOne({ user_asking: req.params.username, user_asked: req.body.pseudo });
            res.status(200).send("follow réussi")
        }
        else {
            res.status(500).send("requete inexistante")
        }
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send("Une erreur s'est produite lors de la validation de la requete");
    }
})

router.post("/refuse_request/:username", verifyToken, async (req, res) => {
    try {
        const request = await AskFollow.collection.findOne({ user_asking: req.params.username, user_asked: req.body.pseudo })

        if (request) {
            await AskFollow.collection.deleteOne({ user_asking: req.params.username, user_asked: req.body.pseudo });
            res.status(200).send("rejet accepté")
        }
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send("Une erreur s'est produite lors de la validation de la requete");
    }
})

router.delete('/unasked/:username', verifyToken, async (req, res) => {
    try {
        const askedCollection = AskFollow.collection
        await askedCollection.deleteOne({
            user_asking: req.body.pseudo,
            user_asked: req.params.username
        })
        res.status(200).send("unasked done")
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Une erreur s'est produite lors du follow");
    }
})


router.get("/isAsked/:username", verifyToken, async (req, res) => {
    const askedCollection = AskFollow.collection;
    await askedCollection.findOne({
        user_asking: req.body.pseudo,
        user_asked: req.params.username
    })
        .then(response => {
            if (response) {
                res.status(200).send({
                    "asked": true
                })
            }
            else {
                res.status(200).send({
                    "asked": false
                })
            }
        });
})

router.post("/search_follows/:username", verifyToken, async (req, res) => {
    const follow = await Follow.collection.find({ user_follow: req.params.username, user_followed: { $regex: `^${req.body.search}`, $options: "i" } }).toArray();
    res.status(200).json(follow);
})

router.post("/search_followers/:username", verifyToken, async (req, res) => {
    console.log(req.body)
    const follow = await Follow.collection.find({ user_follow: { $regex: `^${req.body.search}`, $options: "i" }, user_followed: req.params.username }).toArray();
    res.status(200).json(follow);
})

router.post("/block/:username", verifyToken, async (req, res) => {
    const block = new Block({
        user_blocking: req.body.pseudo,
        user_blocked: req.params.username
    })
    await block.save();
    const follow1 = await Follow.collection.findOne({ user_follow: req.body.pseudo, user_followed: req.params.username })
    if (follow1) {
        await Follow.collection.deleteOne({ user_follow: req.body.pseudo, user_followed: req.params.username })
        const userCollection = User.collection
        await userCollection.updateOne(
            { pseudo: req.body.pseudo },
            { $inc: { nb_follow: -1 } }
        )
        await userCollection.updateOne(
            { pseudo: req.params.username },
            { $inc: { nb_followers: -1 } }
        )
    }
    const follow2 = await Follow.collection.findOne({ user_followed: req.body.pseudo, user_follow: req.params.username })
    if (follow2) {
        await Follow.collection.deleteOne({ user_followed: req.body.pseudo, user_follow: req.params.username })
        const userCollection = User.collection
        await userCollection.updateOne(
            { pseudo: req.params.username },
            { $inc: { nb_follow: -1 } }
        )
        await userCollection.updateOne(
            { pseudo: req.body.pseudo },
            { $inc: { nb_followers: -1 } }
        )
    }
    res.send("utilisateur bloqué")
})

router.get("/isblock/:username", verifyToken, async (req, res) => {
    console.log(req.body.pseudo)
    console.log(req.params.username)
    const block = await Block.collection.findOne({ user_blocking: req.body.pseudo, user_blocked: req.params.username });
    console.log(block)
    if (block) {
        res.status(200).send({ block: true })
    }
    else {
        const block2 = await Block.collection.findOne({ user_blocking: req.params.username, user_blocked: req.body.pseudo });
        if(block2){
            res.status(200).send({ block: true})
        }
        else{
            res.status(200).send({ block: false})
        }
    }
})


router.get("/liste_block/", verifyToken, async (req, res) => {
    try {
        const request = await Block.collection.find({ user_blocking: req.body.pseudo }).toArray();
        res.status(200).json(request)
    }
    catch (error) {
        console.error(error.message)
        res.status(500).send("Une erreur s'est produite lors du chargement des users bloqués");
    }

})

router.post("/unblock/:username", verifyToken, async (req, res) => {
    await Block.collection.deleteOne({ user_blocking: req.body.pseudo, user_blocked: req.params.username })
    res.status(200).send("utilisateur débloqué")
})

router.post("/setinformation", verifyToken, async (req, res) => {
    try{
        if(req.body.pseudo!==req.body.new_pseudo && !await User.collection.findOne({ "pseudo": req.body.new_pseudo })){
            await User.collection.updateOne({ "pseudo": req.body.pseudo },
        {   $set:{nom:req.body.nom,
            prenom:req.body.prenom,
            pseudo:req.body.new_pseudo,
            date_n:req.body.date,
            email:req.body.email}})
            res.clearCookie('token');
            const secret = "OM1993"
            const token = jwt.sign({ pseudo: req.body.new_pseudo }, secret);
            res.cookie("token", token, { httpOnly: false })
            await Twist.collection.updateMany({user:req.body.pseudo},{$set:{user:req.body.new_pseudo}})
            await Rt.collection.updateMany({pseudo_user:req.body.pseudo},{$set:{pseudo_user:req.body.new_pseudo}})
            await Chat.collection.updateMany({recipient:req.body.pseudo},{$set:{recipient:req.body.new_pseudo}})
            await Chat.collection.updateMany({sender:req.body.pseudo},{$set:{sender:req.body.new_pseudo}})
            await Like.collection.updateMany({pseudo_user:req.body.pseudo},{$set:{pseudo_user:req.body.new_pseudo}})
            await Follow.collection.updateMany({user_follow:req.body.pseudo},{$set:{user_follow:req.body.new_pseudo}})
            await Follow.collection.updateMany({user_followed:req.body.pseudo},{$set:{user_followed:req.body.new_pseudo}})
            await Block.collection.updateMany({user_blocking:req.body.pseudo},{$set:{user_blocking:req.body.new_pseudo}})
            await Block.collection.updateMany({user_blocked:req.body.pseudo},{$set:{user_blocked:req.body.new_pseudo}})
            await AskFollow.collection.updateMany({user_asking:req.body.pseudo},{$set:{user_asking:req.body.new_pseudo}})
            await AskFollow.collection.updateMany({user_asked:req.body.pseudo},{$set:{user_asked:req.body.new_pseudo}})
            await Archive.collection.updateMany({pseudo_user:req.body.pseudo},{$set:{pseudo_user:req.body.new_pseudo}})
            const oldPathbanner = path.join(__dirname,'banner',req.body.pseudo);
            const oldPathpp = path.join(__dirname,'pp',req.body.pseudo);

            // Construire le nouveau nom de fichier
            const newName = `${req.body.new_pseudo}`;
        
            // Construire le nouveau chemin complet du fichier
            const newPathbanner = path.join(path.dirname(oldPathbanner), newName);
            const newPathpp = path.join(path.dirname(oldPathpp), newName);
        
            // Renommer le fichier avec le nouveau nom de fichier
            fs.renameSync(oldPathbanner, newPathbanner);
            fs.renameSync(oldPathpp, newPathpp);
            res.status(200).send()
        }
        else{
            res.status(401).send()
        }
    }
    catch(error){
        console.error(error.message)
        res.status(500).send("error lors de la modification")
    }
    
})

router.get("/banner/:filename", (req, res) => {
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'banner/', filename));
})

router.get("/pp/:filename", (req, res) => {
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'pp/', filename));
})

router.post("/changebio/",verifyToken,(req,res)=>{
    const bio = User.collection.updateOne({pseudo:req.body.pseudo},{ $set: { bio: req.body.bio } })
    res.status(200).send(bio.bio)
})

router.post("/checkpassword",verifyToken,async(req,res)=>{
    const user = await User.collection.findOne({pseudo:req.body.pseudo})
    if(await bcrypt.compare(req.body.password, user.password)){
        res.status(200).send()
    }
    else{
        res.status(401).send()
    }
})

router.post("/setpassword",verifyToken,hashPassword,async(req,res)=>{
    await User.collection.updateOne({pseudo:req.body.pseudo},{$set:{password:req.body.password}})
    res.status(200).send("mdp bien modifié")
})

router.post("/deleteaccount",verifyToken,async(req,res)=>{
            res.clearCookie('token')
            await User.collection.deleteOne({pseudo:req.body.pseudo})
            await Twist.collection.deleteMany({user:req.body.pseudo})
            await Rt.collection.deleteMany({pseudo_user:req.body.pseudo})
            await Chat.collection.deleteMany({recipient:req.body.pseudo})
            await Chat.collection.deleteMany({sender:req.body.pseudo})
            await Like.collection.deleteMany({pseudo_user:req.body.pseudo})
            const liste_follow = await Follow.collection.find({user_follow:req.body.pseudo}).toArray();
            const liste_followers = await Follow.collection.find({user_followed:req.body.pseudo}).toArray();

            for(var i = 0;i<liste_follow.length;i++){
                await User.collection.updateOne({pseudo:liste_follow[i].user_followed},{$inc:{nb_followers:-1}})
            }
            for(var i = 0;i<liste_followers.length;i++){
                await User.collection.updateOne({pseudo:liste_follow[i].user_follows},{$inc:{nb_follows:-1}})
            }

            await Follow.collection.deleteMany({user_follow:req.body.pseudo})
            await Follow.collection.deleteMany({user_followed:req.body.pseudo})
            await Block.collection.deleteMany({user_blocking:req.body.pseudo})
            await Block.collection.deleteMany({user_blocked:req.body.pseudo})
            await AskFollow.collection.deleteMany({user_asking:req.body.pseudo})
            await AskFollow.collection.deleteMany({user_asked:req.body.pseudo})
            await Archive.collection.deleteMany({pseudo_user:req.body.pseudo})
            const Pathbanner = path.join(__dirname,'banner',req.body.pseudo);
            const Pathpp = path.join(__dirname,'pp',req.body.pseudo);
            // Renommer le fichier avec le nouveau nom de fichier
            fs.unlinkSync(Pathbanner);
            fs.unlinkSync(Pathpp);
            res.status(200).send()
})
module.exports = router;
