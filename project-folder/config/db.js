const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB u lidh me sukses');
    } catch (error) {
        console.error('❌ Lidhja me MongoDB dështoi:', error);
        process.exit(1);
    }
};

module.exports = connectDB;