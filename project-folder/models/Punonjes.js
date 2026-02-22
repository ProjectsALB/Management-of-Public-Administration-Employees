const mongoose = require('mongoose');

const PunonjesSchema = new mongoose.Schema({
    emri: { type: String, required: true },
    pozita: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefoni: { type: String, required: true },
    ditelindja: Date,
    gjinia: String,
    gjendjaCivile: String,
    projektet: String,
    dataFillimit: { type: Date, default: Date.now },
    bashkiaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bashkia' },
    ministriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ministria' }
});

module.exports = mongoose.model('Punonjes', PunonjesSchema);