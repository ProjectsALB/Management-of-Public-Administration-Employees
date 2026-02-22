// ============================================
// seed.js – Ngarkon të dhënat fillestare në MongoDB
// Ekzekuto: node seed.js
// ============================================

require('dotenv').config();
const connectDB = require('./config/db');
const Bashkia = require('./models/Bashkia');
const Ministria = require('./models/Ministria');
const Punonjes = require('./models/Punonjes');

// ================ TË DHËNAT FILLESTARE ================

const bashkitEDhena = [
  { emri: "Bashkia Tiranë", qyteti: "Tiranë", numriPunonjesve: 2500, popullsia: 912000 },
  { emri: "Bashkia Durrës", qyteti: "Durrës", numriPunonjesve: 1200, popullsia: 205000 },
  { emri: "Bashkia Vlorë", qyteti: "Vlorë", numriPunonjesve: 900, popullsia: 130000 },
  { emri: "Bashkia Shkodër", qyteti: "Shkodër", numriPunonjesve: 800, popullsia: 110000 },
  { emri: "Bashkia Fier", qyteti: "Fier", numriPunonjesve: 850, popullsia: 120000 },
  { emri: "Bashkia Korçë", qyteti: "Korçë", numriPunonjesve: 750, popullsia: 75000 },
  { emri: "Bashkia Elbasan", qyteti: "Elbasan", numriPunonjesve: 700, popullsia: 80000 },
  { emri: "Bashkia Berat", qyteti: "Berat", numriPunonjesve: 600, popullsia: 60000 },
  { emri: "Bashkia Lushnjë", qyteti: "Lushnjë", numriPunonjesve: 450, popullsia: 55000 },
  { emri: "Bashkia Kavajë", qyteti: "Kavajë", numriPunonjesve: 400, popullsia: 40000 },
  { emri: "Bashkia Gjirokastër", qyteti: "Gjirokastër", numriPunonjesve: 350, popullsia: 30000 },
  { emri: "Bashkia Pogradec", qyteti: "Pogradec", numriPunonjesve: 300, popullsia: 25000 },
  { emri: "Bashkia Lezhë", qyteti: "Lezhë", numriPunonjesve: 320, popullsia: 35000 },
  { emri: "Bashkia Kuçovë", qyteti: "Kuçovë", numriPunonjesve: 280, popullsia: 20000 },
  { emri: "Bashkia Krujë", qyteti: "Krujë", numriPunonjesve: 260, popullsia: 22000 },
  { emri: "Bashkia Kukës", qyteti: "Kukës", numriPunonjesve: 240, popullsia: 18000 },
  { emri: "Bashkia Patos", qyteti: "Patos", numriPunonjesve: 220, popullsia: 22000 },
  { emri: "Bashkia Sarandë", qyteti: "Sarandë", numriPunonjesve: 200, popullsia: 20000 },
  { emri: "Bashkia Laç", qyteti: "Laç", numriPunonjesve: 180, popullsia: 25000 },
  { emri: "Bashkia Burrel", qyteti: "Burrel", numriPunonjesve: 160, popullsia: 15000 }
];

const ministritEDhena = [
  { emri: "Kryeministria", ministri: "Kryeministri", numriPunonjesve: 500 },
  { emri: "Ministria e Financave dhe Ekonomisë", ministri: "Ministri", numriPunonjesve: 800 },
  { emri: "Ministria e Jashtme", ministri: "Ministri", numriPunonjesve: 600 },
  { emri: "Ministria e Brendshme", ministri: "Ministri", numriPunonjesve: 1200 },
  { emri: "Ministria e Mbrojtjes", ministri: "Ministri", numriPunonjesve: 1000 },
  { emri: "Ministria e Drejtësisë", ministri: "Ministri", numriPunonjesve: 900 },
  { emri: "Ministria e Arsimit dhe Sportit", ministri: "Ministri", numriPunonjesve: 1100 },
  { emri: "Ministria e Shëndetësisë dhe Mbrojtjes Sociale", ministri: "Ministri", numriPunonjesve: 1300 },
  { emri: "Ministria e Infrastrukturës dhe Energjisë", ministri: "Ministri", numriPunonjesve: 850 },
  { emri: "Ministria e Kulturës", ministri: "Ministri", numriPunonjesve: 400 },
  { emri: "Ministria e Bujqësisë dhe Zhvillimit Rural", ministri: "Ministri", numriPunonjesve: 700 },
  { emri: "Ministria e Turizmit dhe Mjedisit", ministri: "Ministri", numriPunonjesve: 450 },
  { emri: "Ministria e Puneve të Brendshme", ministri: "Ministri", numriPunonjesve: 550 },
  { emri: "Ministria e Rinisë dhe Fëmijëve", ministri: "Ministri", numriPunonjesve: 350 }
];

const punonjesitEDhena = [
  {
    bashkiaId: 1, // ID numerike, do të konvertohet më poshtë
    emri: "Arben Dervishi",
    pozita: "Drejtor i Administratës",
    email: "arben.dervishi@tirana.gov.al",
    telefoni: "+355 4 222 3344",
    ditelindja: "1978-03-15",
    gjinia: "Mashkull",
    gjendjaCivile: "Martuar",
    projektet: "Digitalizimi i arkivës, Sistemi i lejeve të ndërtimit, Platforma e shërbimeve online",
    dataFillimit: "2020-01-15"
  },
  {
    bashkiaId: 1,
    emri: "Elena Marku",
    pozita: "Kryepunonjëse",
    email: "elena.marku@tirana.gov.al",
    telefoni: "+355 4 222 3345",
    ditelindja: "1985-07-22",
    gjinia: "Femër",
    gjendjaCivile: "Beqare",
    projektet: "Riorganizimi i administratës, Trajnime për punonjësit",
    dataFillimit: "2021-03-20"
  },
  {
    ministriaId: 1,
    emri: "Agim Hoxha",
    pozita: "Këshilltar i Kryeministrit",
    email: "agim.hoxha@kryeministria.gov.al",
    telefoni: "+355 4 227 1111",
    ditelindja: "1972-11-05",
    gjinia: "Mashkull",
    gjendjaCivile: "Martuar",
    projektet: "Reforma në administratë, Strategjia e qeverisjes elektronike",
    dataFillimit: "2019-11-10"
  },
  {
    ministriaId: 2,
    emri: "Anisa Leka",
    pozita: "Drejtore e Departamentit të Buxhetit",
    email: "anisa.leka@financa.gov.al",
    telefoni: "+355 4 222 8888",
    ditelindja: "1980-09-18",
    gjinia: "Femër",
    gjendjaCivile: "E divorcuar",
    projektet: "Sistemi i ri i buxhetimit, Monitorimi i shpenzimeve, Aplikacioni i deklarimit të pasurisë",
    dataFillimit: "2022-02-15"
  }
];

// ================ FUNKSIONI KRYESOR ================
const seedDatabase = async () => {
  try {
    await connectDB();

    // Pastro koleksionet
    await Bashkia.deleteMany({});
    await Ministria.deleteMany({});
    await Punonjes.deleteMany({});
    console.log('🗑️  Koleksionet u pastruan.');

    // Fut bashkitë
    const bashkit = await Bashkia.insertMany(bashkitEDhena);
    console.log(`✅ U futën ${bashkit.length} bashki.`);

    // Fut ministritë
    const ministrit = await Ministria.insertMany(ministritEDhena);
    console.log(`✅ U futën ${ministrit.length} ministri.`);

    // Krijo hartën ID numerike -> ObjectId
    const bashkiaMap = {};
    bashkit.forEach((b, index) => {
      bashkiaMap[index + 1] = b._id; // indeksi 0 -> id 1
    });

    const ministriaMap = {};
    ministrit.forEach((m, index) => {
      ministriaMap[index + 1] = m._id;
    });

    // Përgatit punonjësit me referencat e sakta
    const punonjesitPerMongo = punonjesitEDhena.map(p => {
      const { bashkiaId, ministriaId, ...rest } = p;
      const newPunonjes = { ...rest };
      if (bashkiaId) newPunonjes.bashkiaId = bashkiaMap[bashkiaId];
      if (ministriaId) newPunonjes.ministriaId = ministriaMap[ministriaId];
      return newPunonjes;
    });

    // Fut punonjësit
    const punonjesit = await Punonjes.insertMany(punonjesitPerMongo);
    console.log(`✅ U futën ${punonjesit.length} punonjës.`);

    console.log('\n🎉 Të dhënat u ngarkuan me sukses në MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gabim gjatë mbushjes së bazës:', error);
    process.exit(1);
  }
};

seedDatabase();