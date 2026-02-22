const mongoose = require('mongoose');

const BashkiaSchema = new mongoose.Schema({
    emri: { type: String, required: true },
    qyteti: String,
    numriPunonjesve: { type: Number, default: 0 },
    popullsia: Number
});

module.exports = mongoose.model('Bashkia', BashkiaSchema);