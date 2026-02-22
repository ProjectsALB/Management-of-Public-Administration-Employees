const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const connectDB = require('./config/db');
const Bashkia = require('./models/Bashkia');
const Ministria = require('./models/Ministria');
const Punonjes = require('./models/Punonjes');

const app = express();
const PORT = process.env.PORT || 3000;

// Lidhu me MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(fileUpload({ 
    limits: { fileSize: 2 * 1024 * 1024 },
    abortOnLimit: true,
    createParentPath: true
}));

// ------------------------------------------------------------
// BASHKITË
// ------------------------------------------------------------
app.get('/api/bashkit', async (req, res) => {
    try {
        const bashkit = await Bashkia.find();
        res.json(bashkit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/bashkia/:id/punonjes', async (req, res) => {
    try {
        const punonjesit = await Punonjes.find({ bashkiaId: req.params.id });
        res.json(punonjesit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ------------------------------------------------------------
// MINISTRITË
// ------------------------------------------------------------
app.get('/api/ministrit', async (req, res) => {
    try {
        const ministrit = await Ministria.find();
        res.json(ministrit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/ministria/:id/punonjes', async (req, res) => {
    try {
        const punonjesit = await Punonjes.find({ ministriaId: req.params.id });
        res.json(punonjesit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ------------------------------------------------------------
// SHTO PUNONJËS INDIVIDUAL
// ------------------------------------------------------------
app.post('/api/punonjes', async (req, res) => {
    try {
        const punonjesiRi = new Punonjes(req.body);
        await punonjesiRi.save();

        // Përditëso numrin e punonjësve në bashki/ministri
        if (req.body.bashkiaId) {
            await Bashkia.findByIdAndUpdate(req.body.bashkiaId, {
                $inc: { numriPunonjesve: 1 }
            });
        }
        if (req.body.ministriaId) {
            await Ministria.findByIdAndUpdate(req.body.ministriaId, {
                $inc: { numriPunonjesve: 1 }
            });
        }

        res.json({ success: true, data: punonjesiRi });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------------------------------------
// FSHI PUNONJËS
// ------------------------------------------------------------
app.delete('/api/punonjes/:id', async (req, res) => {
    try {
        const punonjesi = await Punonjes.findByIdAndDelete(req.params.id);
        if (!punonjesi) {
            return res.status(404).json({ success: false, message: 'Punonjësi nuk u gjet' });
        }

        if (punonjesi.bashkiaId) {
            await Bashkia.findByIdAndUpdate(punonjesi.bashkiaId, {
                $inc: { numriPunonjesve: -1 }
            });
        }
        if (punonjesi.ministriaId) {
            await Ministria.findByIdAndUpdate(punonjesi.ministriaId, {
                $inc: { numriPunonjesve: -1 }
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------------------------------------
// IMPORT CSV
// ------------------------------------------------------------
app.post('/api/upload-punonjes', async (req, res) => {
    try {
        if (!req.files || !req.files.csvFile) {
            return res.status(400).json({ success: false, message: 'Asnjë skedar nuk u ngarkua.' });
        }

        const csvFile = req.files.csvFile;
        const { institutionId, institutionType } = req.body;

        if (!institutionId || !institutionType) {
            return res.status(400).json({ success: false, message: 'Mungon ID e institucionit ose tipi.' });
        }

        const csvData = csvFile.data.toString('utf8');
        const lines = csvData.split('\n').filter(line => line.trim() !== '');

        if (lines.length < 2) {
            return res.status(400).json({ success: false, message: 'Skedari CSV është bosh ose i pavlefshëm.' });
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const requiredFields = ['emri', 'pozita', 'email', 'telefoni'];
        const missingFields = requiredFields.filter(f => !headers.includes(f));
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Kolonat e detyrueshme mungojnë: ${missingFields.join(', ')}.`
            });
        }

        const emriIdx = headers.indexOf('emri');
        const pozitaIdx = headers.indexOf('pozita');
        const emailIdx = headers.indexOf('email');
        const telefoniIdx = headers.indexOf('telefoni');
        const ditelindjaIdx = headers.indexOf('ditelindja');
        const gjiniaIdx = headers.indexOf('gjinia');
        const gjendjaCivileIdx = headers.indexOf('gjendja_civile');
        const projektetIdx = headers.indexOf('projektet');
        const dataFillimitIdx = headers.indexOf('datafillimit');

        const added = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const line = lines[i].trim();
                if (!line) continue;
                const values = line.split(',').map(v => v.trim());

                const punonjesiRi = {
                    emri: values[emriIdx],
                    pozita: values[pozitaIdx],
                    email: values[emailIdx],
                    telefoni: values[telefoniIdx],
                    ditelindja: ditelindjaIdx !== -1 ? values[ditelindjaIdx] : null,
                    gjinia: gjiniaIdx !== -1 ? values[gjiniaIdx] : '',
                    gjendjaCivile: gjendjaCivileIdx !== -1 ? values[gjendjaCivileIdx] : '',
                    projektet: projektetIdx !== -1 ? values[projektetIdx] : '',
                    dataFillimit: dataFillimitIdx !== -1 ? values[dataFillimitIdx] : new Date().toISOString().split('T')[0]
                };

                if (institutionType === 'bashkia') {
                    punonjesiRi.bashkiaId = institutionId;
                } else {
                    punonjesiRi.ministriaId = institutionId;
                }

                const punonjes = new Punonjes(punonjesiRi);
                await punonjes.save();
                added.push(punonjes);
            } catch (e) {
                errors.push(`Rreshti ${i + 1}: ${e.message}`);
            }
        }

        if (added.length > 0) {
            if (institutionType === 'bashkia') {
                await Bashkia.findByIdAndUpdate(institutionId, {
                    $inc: { numriPunonjesve: added.length }
                });
            } else {
                await Ministria.findByIdAndUpdate(institutionId, {
                    $inc: { numriPunonjesve: added.length }
                });
            }
        }

        res.json({
            success: true,
            addedCount: added.length,
            errors,
            message: `${added.length} punonjës u shtuan me sukses. ${errors.length} gabime.`
        });

    } catch (error) {
        console.error('CSV Upload error:', error);
        res.status(500).json({ success: false, message: 'Gabim i brendshëm i serverit.' });
    }
});

// ------------------------------------------------------------
// NIS SERVERIN
// ------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🚀 Serveri po funksionon në http://localhost:${PORT}`);
});