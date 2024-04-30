const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://Matthias:Said2001@twister.txuqneo.mongodb.net/", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        mongoose.connection;
        console.log('MongoDB connected!');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB
