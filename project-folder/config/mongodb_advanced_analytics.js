/**
 * =====================================================================
 * MongoDB – Dizajn i avancuar dhe analiza për Administrimin e Projekteve
 * =====================================================================
 *
 * Përmbajtja:
 * 1. Vendimet Reference vs. Embed (me shpjegime)
 * 2. Diagrami ER (tekstual)
 * 3. Indekse të menduara dhe analizë performance
 * 4. Validime dhe constraints (JSON Schema)
 * 5. Agregime të avancuara ($lookup, $facet, multi-stage)
 * 6. Transaksione për operacione komplekse
 */

// =====================================================================
// 1. Vendimet Reference vs. Embed
// =====================================================================
/**
 * Koleksionet dhe strategjia e lidhjeve:
 *
 * - bashkia, ministria, pozita, gjendja_civile: ruhen si koleksione më vete
 *   dhe referencohen nga punonjes (reference). Arsyeja: janë të dhëna
 *   të ndara që ndryshojnë rrallë dhe përdoren nga shumë punonjës.
 *   Embedding do të shkaktonte përsëritje të panevojshme dhe vështirësi
 *   në përditësim.
 *
 * - punonjes: përmban referenca për institucionin dhe të dhënat e tjera.
 *   Nuk embeddojmë asgjë përveç fushave bazë.
 *
 * - projekt: përmban vetëm ID të institucionit dhe tipin (Bashki/Ministeri).
 *   Embedding i punonjësve nuk bëhet sepse lidhja është many-to-many.
 *
 * - punonjes_projekt: koleksion i veçantë për many-to-many (normalizim).
 *   Embedding në projekt ose punonjes do të krijonte vargje të pakufizuara
 *   dhe probleme performance.
 *
 * - detyra: ruhet më vete, referon projekt dhe punonjes. Embedding në
 *   projekt mund të ishte alternativë, por detyrat kanë ciklin e tyre
 *   dhe shpesh kërkohen të filtrohen pavarësisht nga projekti.
 *
 * - dokumentet, raportet: ruhen veçmas, referojnë projekt dhe punonjes.
 *
 * - audit_log: koleksion i veçantë për regjistrim ndryshimesh.
 */

// =====================================================================
// 2. Diagrami ER (tekstual)
// =====================================================================
/**
 *
 * +----------------+       +-----------------+       +----------------+
 * |   bashkia      |       |   ministria     |       |   pozita       |
 * +----------------+       +-----------------+       +----------------+
 * | _id            |       | _id             |       | _id            |
 * | emri           |       | emri            |       | emri (unique)  |
 * | qyteti         |       | ministri        |       | niveli         |
 * | popullsia      |       | ...             |       | pershkrimi     |
 * | ...            |       +-----------------+       +----------------+
 * +----------------+
 *         |                       |
 *         |                       |
 *         v                       v
 * +-----------------------------------------------------+
 * |                    punonjes                         |
 * +-----------------------------------------------------+
 * | _id                                                 |
 * | emri                                                |
 * | email (unique)                                      |
 * | telefoni                                            |
 * | ditelindja                                          |
 * | gjinia                                              |
 * | gjendja_civile_id  → gjendja_civile(_id)           |
 * | pozita_id           → pozita(_id)                   |
 * | bashkia_id          → bashkia(_id) (nullable)       |
 * | ministria_id        → ministria(_id) (nullable)     |
 * | data_fillimit                                        |
 * | data_perfundimit                                     |
 * | aktiv                                               |
 * | created_at, updated_at                              |
 * +-----------------------------------------------------+
 *
 * +------------------+       +------------------+
 * | gjendja_civile   |       |   projekt        |
 * +------------------+       +------------------+
 * | _id              |       | _id              |
 * | kodi (unique)    |       | emri (unique)    |
 * | pershkrimi       |       | pershkrimi       |
 * | rendi            |       | data_fillimit    |
 * +------------------+       | data_mbarimit    |
 *                            | buxheti          |
 *                            | institucioni_id  |
 *                            | institucioni_tipi|
 *                            | created_at       |
 *                            +------------------+
 *                                   |
 *                                   | (1:N)
 *                                   v
 * +------------------+       +------------------+
 * | punonjes_projekt |       |    detyra         |
 * +------------------+       +------------------+
 * | _id              |       | _id              |
 * | punonjes_id      |       | emri             |
 * | projekt_id       |       | pershkrimi       |
 * | roli             |       | projekt_id       |
 * | data_caktimit    |       | assigned_to      |
 * | data_largimit    |       | data_fillimit    |
 * +------------------+       | data_perfundimit |
 *                            | status           |
 *                            +------------------+
 *
 * +------------------+       +------------------+
 * |   dokumentet     |       |    raportet      |
 * +------------------+       +------------------+
 * | _id              |       | _id              |
 * | titulli          |       | titulli          |
 * | pershkrimi       |       | projekt_id       |
 * | data_shtimit     |       | data_raportit    |
 * | projekt_id       |       | krijuar_nga      |
 * | krijuar_nga      |       | pershkrimi       |
 * +------------------+       +------------------+
 *
 * +------------------+
 * |    audit_log     |
 * +------------------+
 * | _id              |
 * | tabela           |
 * | veprimi          |
 * | rekord_id        |
 * | ndryshimet (JSON)|
 * | user_name        |
 * | data_krijimit    |
 * +------------------+
 */

// =====================================================================
// 3. Indekse të menduara dhe analizë performance
// =====================================================================
/**
 * Indekset krijohen për të mbështetur pyetjet më të shpeshta:
 */

// Krijimi i koleksioneve dhe indekseve
db.createCollection("punonjes");
db.punonjes.createIndex({ email: 1 }, { unique: true });
db.punonjes.createIndex({ bashkia_id: 1, aktiv: 1 });
db.punonjes.createIndex({ ministria_id: 1, aktiv: 1 });
db.punonjes.createIndex({ pozita_id: 1 });
db.punonjes.createIndex({ gjendja_civile_id: 1 });

db.createCollection("projekt");
db.projekt.createIndex({ emri: 1 }, { unique: true });
db.projekt.createIndex({ institucioni_id: 1, institucioni_tipi: 1 });
db.projekt.createIndex({ data_fillimit: 1 });

db.createCollection("punonjes_projekt");
db.punonjes_projekt.createIndex({ punonjes_id: 1, projekt_id: 1 }, { unique: true });
db.punonjes_projekt.createIndex({ projekt_id: 1 });

db.createCollection("detyra");
db.detyra.createIndex({ projekt_id: 1, status: 1 });
db.detyra.createIndex({ assigned_to: 1, status: 1 });

db.createCollection("audit_log");
db.audit_log.createIndex({ tabela: 1, rekord_id: 1 });
db.audit_log.createIndex({ data_krijimit: 1 });

// Shembull analize me explain()
// db.punonjes.find({ bashkia_id: ObjectId("..."), aktiv: true }).explain("executionStats");
// Këshillohet përdorimi i explain() për të verifikuar përdorimin e indekseve.

// =====================================================================
// 4. Validime dhe constraints (JSON Schema)
// =====================================================================
// Vendosim rregulla validation për koleksionin punonjes
db.runCommand({
  collMod: "punonjes",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["emri", "email", "telefoni", "data_fillimit", "aktiv"],
      properties: {
        emri: { bsonType: "string", description: "duhet të jetë tekst" },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "email i vlefshëm"
        },
        telefoni: { bsonType: "string", minLength: 7, maxLength: 20 },
        ditelindja: { bsonType: "date" },
        gjinia: { enum: ["Femër", "Mashkull", "Tjetër"] },
        gjendja_civile_id: { bsonType: "objectId" },
        pozita_id: { bsonType: "objectId" },
        bashkia_id: { bsonType: "objectId" },
        ministria_id: { bsonType: "objectId" },
        data_fillimit: { bsonType: "date" },
        data_perfundimit: { bsonType: "date" },
        aktiv: { bsonType: "bool" }
      },
      // Garanton që punonjësi i takon vetëm njërit institucion
      allOf: [
        {
          $or: [
            { bashkia_id: { $exists: true, $ne: null } },
            { ministria_id: { $exists: true, $ne: null } }
          ]
        }
      ]
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// =====================================================================
// 5. Agregime të avancuara
// =====================================================================

/**
 * 5.1 Analizë demografike me shumë dimensione (facet)
 */
db.punonjes.aggregate([
  { $match: { aktiv: true } },
  {
    $lookup: {
      from: "gjendja_civile",
      localField: "gjendja_civile_id",
      foreignField: "_id",
      as: "gjendja"
    }
  },
  { $unwind: { path: "$gjendja", preserveNullAndEmptyArrays: true } },
  {
    $facet: {
      byAge: [
        {
          $bucket: {
            groupBy: {
              $subtract: [
                { $year: new Date() },
                { $year: "$ditelindja" }
              ]
            },
            boundaries: [0, 25, 35, 45, 55, 65, 120],
            default: "E panjohur",
            output: { count: { $sum: 1 } }
          }
        }
      ],
      byGender: [
        { $group: { _id: "$gjinia", count: { $sum: 1 } } }
      ],
      byMaritalStatus: [
        { $group: { _id: "$gjendja.pershkrimi", count: { $sum: 1 } } }
      ],
      byPosition: [
        {
          $lookup: {
            from: "pozita",
            localField: "pozita_id",
            foreignField: "_id",
            as: "poz"
          }
        },
        { $unwind: "$poz" },
        { $group: { _id: "$poz.emri", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],
      byInstitution: [
        {
          $group: {
            _id: {
              $cond: [
                { $ne: ["$bashkia_id", null] },
                "Bashki",
                { $cond: [{ $ne: ["$ministria_id", null] }, "Ministri", "Asnjë"]
                }
              ]
            },
            count: { $sum: 1 }
          }
        }
      ]
    }
  }
]);

/**
 * 5.2 Analizë e projekteve me detyra dhe përqindje përfundimi
 */
db.projekt.aggregate([
  {
    $lookup: {
      from: "punonjes_projekt",
      localField: "_id",
      foreignField: "projekt_id",
      as: "assignments"
    }
  },
  {
    $lookup: {
      from: "detyra",
      localField: "_id",
      foreignField: "projekt_id",
      as: "tasks"
    }
  },
  {
    $addFields: {
      numri_punonjesve: { $size: "$assignments" },
      numri_detyrave: { $size: "$tasks" },
      detyra_te_perfunduara: {
        $size: {
          $filter: {
            input: "$tasks",
            as: "task",
            cond: { $eq: ["$$task.status", "Përfunduar"] }
          }
        }
      }
    }
  },
  {
    $project: {
      emri: 1,
      data_fillimit: 1,
      data_mbarimit: 1,
      buxheti: 1,
      numri_punonjesve: 1,
      numri_detyrave: 1,
      perqindja_perfundimit: {
        $cond: [
          { $eq: ["$numri_detyrave", 0] },
          0,
          { $multiply: [{ $divide: ["$detyra_te_perfunduara", "$numri_detyrave"] }, 100] }
        ]
      }
    }
  },
  { $sort: { perqindja_perfundimit: -1 } }
]);

/**
 * 5.3 Renditja e punonjësve sipas numrit të projekteve brenda institucionit (duke përdorur $setWindowFields)
 */
db.punonjes_projekt.aggregate([
  {
    $group: {
      _id: { punonjes_id: "$punonjes_id", projekt_id: "$projekt_id" },
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: "$_id.punonjes_id",
      projekte_count: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "punonjes",
      localField: "_id",
      foreignField: "_id",
      as: "punonjes"
    }
  },
  { $unwind: "$punonjes" },
  {
    $setWindowFields: {
      partitionBy: {
        $cond: [
          { $ne: ["$punonjes.bashkia_id", null] },
          "$punonjes.bashkia_id",
          "$punonjes.ministria_id"
        ]
      },
      sortBy: { projekte_count: -1 },
      output: {
        rank_in_institution: { $rank: {} }
      }
    }
  },
  { $match: { rank_in_institution: { $lte: 3 } } },
  {
    $lookup: {
      from: "bashkia",
      localField: "punonjes.bashkia_id",
      foreignField: "_id",
      as: "bashkia"
    }
  },
  {
    $lookup: {
      from: "ministria",
      localField: "punonjes.ministria_id",
      foreignField: "_id",
      as: "ministria"
    }
  },
  {
    $project: {
      emri: "$punonjes.emri",
      institucioni: {
        $cond: [
          { $ne: ["$punonjes.bashkia_id", null] },
          { $arrayElemAt: ["$bashkia.emri", 0] },
          { $arrayElemAt: ["$ministria.emri", 0] }
        ]
      },
      projekte_count: 1,
      rank_in_institution: 1
    }
  },
  { $sort: { institucioni: 1, rank_in_institution: 1 } }
]);

// =====================================================================
// 6. Transaksione për operacione komplekse
// =====================================================================
/**
 * Shembull: Krijimi i një projekti të ri dhe caktimi i punonjësve në mënyrë atomike.
 * Përdorim sesion dhe transaksion.
 */
function shtoProjektMePunonjes(projekt, punonjesIds) {
  const session = db.getMongo().startSession();
  session.startTransaction();

  try {
    const projekti_id = new ObjectId();
    // Fut projektin
    db.projekt.insertOne(
      { _id: projekti_id, ...projekt, created_at: new Date() },
      { session }
    );

    // Krijo caktimet
    const assignments = punonjesIds.map(pid => ({
      punonjes_id: pid,
      projekt_id: projekti_id,
      roli: "Anëtar",
      data_caktimit: new Date()
    }));
    if (assignments.length > 0) {
      db.punonjes_projekt.insertMany(assignments, { session });
    }

    // Përditëso timestamp-in e punonjësve (opsionale)
    db.punonjes.updateMany(
      { _id: { $in: punonjesIds } },
      { $set: { updated_at: new Date() } },
      { session }
    );

    session.commitTransaction();
    print("Transaksioni u krye me sukses. Projekt ID: " + projekti_id);
    return projekti_id;
  } catch (error) {
    session.abortTransaction();
    print("Transaksioni dështoi: " + error);
    throw error;
  } finally {
    session.endSession();
  }
}

// Shembull përdorimi:
// shtoProjektMePunonjes(
//   { emri: "Projekti i Ri", buxheti: 100000, institucioni_id: ObjectId("..."), institucioni_tipi: "Bashki" },
//   [ObjectId("id1"), ObjectId("id2")]
// );