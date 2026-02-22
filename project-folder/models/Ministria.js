const mongoose = require('mongoose');

const MinistriaSchema = new mongoose.Schema({
    emri: { type: String, required: true },
    ministri: { type: String, default: 'Ministri' },
    numriPunonjesve: { type: Number, default: 0 }
});

module.exports = mongoose.model('Ministria', MinistriaSchema);