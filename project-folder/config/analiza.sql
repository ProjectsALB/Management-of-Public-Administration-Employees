-- ==================================================================
-- analiza.sql
-- Analiza e avancuar e të dhënave për bazën "Administrim_Projektesh"
-- ==================================================================
USE Administrim_Projektesh;
GO

/* ==================================================================
   Pjesa 1: Analiza demografike e punonjësve
   ================================================================== */

-- 1.1 Shpërndarja e punonjësve sipas moshës (grupmoshat)
SELECT 
    CASE 
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) < 25 THEN 'Nën 25 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 25 AND 34 THEN '25-34 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 35 AND 44 THEN '35-44 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 45 AND 54 THEN '45-54 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 55 AND 64 THEN '55-64 vjeç'
        ELSE '65+ vjeç'
    END AS grupmosha,
    COUNT(*) AS numri_punonjesve,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) AS perqindja
FROM punonjes
WHERE ditelindja IS NOT NULL AND aktiv = 1
GROUP BY 
    CASE 
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) < 25 THEN 'Nën 25 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 25 AND 34 THEN '25-34 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 35 AND 44 THEN '35-44 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 45 AND 54 THEN '45-54 vjeç'
        WHEN DATEDIFF(YEAR, ditelindja, GETDATE()) BETWEEN 55 AND 64 THEN '55-64 vjeç'
        ELSE '65+ vjeç'
    END
ORDER BY grupmosha;
GO

-- 1.2 Shpërndarja sipas gjinisë dhe gjendjes civile
SELECT 
    p.gjinia,
    gc.pershkrimi AS gjendja_civile,
    COUNT(*) AS numri,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(PARTITION BY p.gjinia) AS DECIMAL(5,2)) AS perqindja_brenda_gjinise,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) AS perqindja_total
FROM punonjes p
LEFT JOIN gjendja_civile gc ON p.gjendja_civile_id = gc.id
WHERE p.aktiv = 1
GROUP BY p.gjinia, gc.pershkrimi
ORDER BY p.gjinia, numri DESC;
GO

-- 1.3 Shpërndarja sipas pozitave dhe nivelit hierarkik
SELECT 
    po.emri AS pozita,
    po.niveli,
    COUNT(*) AS numri_punonjesve,
    AVG(DATEDIFF(YEAR, p.data_fillimit, GETDATE())) AS vjetersia_mesatare_vite
FROM punonjes p
INNER JOIN pozita po ON p.pozita_id = po.id
WHERE p.aktiv = 1
GROUP BY po.emri, po.niveli
ORDER BY po.niveli, numri_punonjesve DESC;
GO

-- 1.4 Vjetërsia e punonjësve (distribution)
SELECT 
    CASE 
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) < 1 THEN '< 1 vit'
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) BETWEEN 1 AND 2 THEN '1-2 vjet'
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) BETWEEN 3 AND 5 THEN '3-5 vjet'
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) BETWEEN 6 AND 10 THEN '6-10 vjet'
        ELSE '10+ vjet'
    END AS vjetersia,
    COUNT(*) AS numri_punonjesve
FROM punonjes
WHERE aktiv = 1
GROUP BY 
    CASE 
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) < 1 THEN '< 1 vit'
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) BETWEEN 1 AND 2 THEN '1-2 vjet'
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) BETWEEN 3 AND 5 THEN '3-5 vjet'
        WHEN DATEDIFF(YEAR, data_fillimit, GETDATE()) BETWEEN 6 AND 10 THEN '6-10 vjet'
        ELSE '10+ vjet'
    END
ORDER BY vjetersia;
GO

-- 1.5 Punonjësit më të rinj dhe më të vjetër (top 5)
SELECT TOP 5
    emri,
    ditelindja,
    DATEDIFF(YEAR, ditelindja, GETDATE()) AS mosha,
    COALESCE(b.emri, m.emri) AS institucioni
FROM punonjes p
LEFT JOIN bashkia b ON p.bashkia_id = b.id
LEFT JOIN ministria m ON p.ministria_id = m.id
WHERE ditelindja IS NOT NULL AND aktiv = 1
ORDER BY ditelindja DESC;  -- më të rinj

SELECT TOP 5
    emri,
    ditelindja,
    DATEDIFF(YEAR, ditelindja, GETDATE()) AS mosha,
    COALESCE(b.emri, m.emri) AS institucioni
FROM punonjes p
LEFT JOIN bashkia b ON p.bashkia_id = b.id
LEFT JOIN ministria m ON p.ministria_id = m.id
WHERE ditelindja IS NOT NULL AND aktiv = 1
ORDER BY ditelindja;  -- më të vjetër
GO

/* ==================================================================
   Pjesa 2: Analiza e projekteve
   ================================================================== */

-- 2.1 Statistikat e përgjithshme të projekteve
SELECT 
    COUNT(*) AS total_projekte,
    SUM(CASE WHEN data_mbarimit < GETDATE() THEN 1 ELSE 0 END) AS projekte_te_perfunduara,
    SUM(CASE WHEN data_mbarimit >= GETDATE() OR data_mbarimit IS NULL THEN 1 ELSE 0 END) AS projekte_ne_progres,
    AVG(buxheti) AS buxheti_mesatar,
    SUM(buxheti) AS buxheti_total,
    AVG(DATEDIFF(DAY, data_fillimit, ISNULL(data_mbarimit, GETDATE()))) AS kohēzgjatja_mesatare_dite
FROM projekt;
GO

-- 2.2 Shpërndarja e projekteve sipas institucionit
SELECT 
    institucioni_tipi,
    CASE WHEN institucioni_tipi = 'Bashki' THEN (SELECT emri FROM bashkia WHERE id = institucioni_id)
         ELSE (SELECT emri FROM ministria WHERE id = institucioni_id) END AS emri_institucionit,
    COUNT(*) AS numri_projekteve,
    SUM(buxheti) AS buxheti_total,
    AVG(buxheti) AS buxheti_mesatar,
    SUM( (SELECT COUNT(*) FROM punonjes_projekt WHERE projekt_id = projekt.id) ) AS total_punonjes_te_perfshire
FROM projekt
GROUP BY institucioni_tipi, institucioni_id
ORDER BY numri_projekteve DESC;
GO

-- 2.3 Projekte me buxhetin më të lartë (top 10)
SELECT TOP 10
    emri,
    buxheti,
    data_fillimit,
    data_mbarimit,
    institucioni_tipi,
    CASE WHEN institucioni_tipi = 'Bashki' THEN (SELECT emri FROM bashkia WHERE id = institucioni_id)
         ELSE (SELECT emri FROM ministria WHERE id = institucioni_id) END AS institucioni
FROM projekt
ORDER BY buxheti DESC;
GO

-- 2.4 Projekte me më shumë punonjës të përfshirë
SELECT TOP 10
    pr.id,
    pr.emri,
    COUNT(pp.punonjes_id) AS numri_punonjesve,
    pr.buxheti,
    pr.buxheti / NULLIF(COUNT(pp.punonjes_id), 0) AS buxheti_per_punonjes
FROM projekt pr
LEFT JOIN punonjes_projekt pp ON pr.id = pp.projekt_id
GROUP BY pr.id, pr.emri, pr.buxheti
ORDER BY numri_punonjesve DESC;
GO

-- 2.5 Trendi i projekteve të reja sipas viteve
SELECT 
    YEAR(data_fillimit) AS viti,
    COUNT(*) AS numri_projekteve_te_reja,
    SUM(buxheti) AS buxheti_total_vjetor
FROM projekt
GROUP BY YEAR(data_fillimit)
ORDER BY viti;
GO

-- 2.6 Analiza e performancës së projekteve (krahasimi i planifikuar vs aktual)
SELECT 
    pr.emri,
    pr.data_fillimit,
    pr.data_mbarimit_planifikuar,
    pr.data_mbarimit_aktuale,
    DATEDIFF(DAY, pr.data_mbarimit_planifikuar, pr.data_mbarimit_aktuale) AS vonesa_dite,
    pr.buxheti,
    pr.shpenzimet_aktuale,
    (pr.shpenzimet_aktuale - pr.buxheti) AS diferenca_buxhetore,
    CASE 
        WHEN pr.data_mbarimit_aktuale <= pr.data_mbarimit_planifikuar THEN 'Në afat'
        WHEN pr.data_mbarimit_aktuale > pr.data_mbarimit_planifikuar THEN 'Me vonesë'
        ELSE 'Në progres'
    END AS statusi_kohor
FROM projekt pr
WHERE pr.data_mbarimit_planifikuar IS NOT NULL
ORDER BY vonesa_dite DESC;
GO

/* ==================================================================
   Pjesa 3: Analiza e detyrave dhe produktivitetit
   ================================================================== */

-- 3.1 Statistikat e detyrave sipas statusit
SELECT 
    status,
    COUNT(*) AS numri_detyrave,
    AVG(DATEDIFF(DAY, data_fillimit, ISNULL(data_perfundimit, GETDATE()))) AS kohēzgjatja_mesatare_dite
FROM detyra
GROUP BY status
ORDER BY numri_detyrave DESC;
GO

-- 3.2 Punonjësit me më shumë detyra të kryera
SELECT TOP 10
    p.emri,
    COUNT(d.id) AS total_detyra,
    SUM(CASE WHEN d.status = 'Përfunduar' THEN 1 ELSE 0 END) AS detyra_te_perfunduara,
    CAST(SUM(CASE WHEN d.status = 'Përfunduar' THEN 1 ELSE 0 END) * 100.0 / COUNT(d.id) AS DECIMAL(5,2)) AS perqindja_suksesit
FROM punonjes p
INNER JOIN detyra d ON p.id = d.assigned_to
WHERE p.aktiv = 1
GROUP BY p.emri, p.id
HAVING COUNT(d.id) > 0
ORDER BY detyra_te_perfunduara DESC;
GO

-- 3.3 Detyrat e vonuara për çdo projekt
SELECT 
    pr.emri AS projekt,
    COUNT(d.id) AS numri_detyrave_te_vonuara
FROM detyra d
INNER JOIN projekt pr ON d.projekt_id = pr.id
WHERE d.data_perfundimit < GETDATE() AND d.status != 'Përfunduar'
GROUP BY pr.emri
ORDER BY numri_detyrave_te_vonuara DESC;
GO

-- 3.4 Shpërndarja e detyrave sipas projekteve (top 10 projektet me më shumë detyra)
SELECT TOP 10
    pr.emri,
    COUNT(d.id) AS numri_detyrave,
    COUNT(DISTINCT d.assigned_to) AS numri_punonjesve_te_perfshire
FROM detyra d
INNER JOIN projekt pr ON d.projekt_id = pr.id
GROUP BY pr.emri
ORDER BY numri_detyrave DESC;
GO

/* ==================================================================
   Pjesa 4: Analiza krahasuese Bashki vs Ministri
   ================================================================== */

-- 4.1 Përmbledhje e punonjësve sipas llojit të institucionit
SELECT 
    'Bashki' AS lloji,
    COUNT(*) AS numri_punonjesve,
    AVG(DATEDIFF(YEAR, ditelindja, GETDATE())) AS mosha_mesatare,
    AVG(DATEDIFF(YEAR, data_fillimit, GETDATE())) AS vjetersia_mesatare
FROM punonjes
WHERE bashkia_id IS NOT NULL AND aktiv = 1
UNION ALL
SELECT 
    'Ministri' AS lloji,
    COUNT(*),
    AVG(DATEDIFF(YEAR, ditelindja, GETDATE())),
    AVG(DATEDIFF(YEAR, data_fillimit, GETDATE()))
FROM punonjes
WHERE ministria_id IS NOT NULL AND aktiv = 1;
GO

-- 4.2 Krahasimi i numrit të projekteve dhe buxhetit mesatar
SELECT 
    institucioni_tipi,
    COUNT(*) AS numri_projekteve,
    AVG(buxheti) AS buxheti_mesatar,
    SUM(buxheti) AS buxheti_total
FROM projekt
GROUP BY institucioni_tipi;
GO

-- 4.3 5 bashkitë dhe 5 ministritë me më shumë punonjës
SELECT TOP 5
    'Bashki' AS tipi,
    b.emri,
    b.numri_punonjesve
FROM bashkia b
ORDER BY b.numri_punonjesve DESC;

SELECT TOP 5
    'Ministri' AS tipi,
    m.emri,
    m.numri_punonjesve
FROM ministria m
ORDER BY m.numri_punonjesve DESC;
GO

/* ==================================================================
   Pjesa 5: Analiza e audit log-ut dhe aktivitetit
   ================================================================== */

-- 5.1 Aktiviteti ditor në bazë (INSERT, UPDATE, DELETE)
SELECT 
    CAST(data_krijimit AS DATE) AS data,
    veprimi,
    COUNT(*) AS numri_veprimeve
FROM audit_log
GROUP BY CAST(data_krijimit AS DATE), veprimi
ORDER BY data DESC, veprimi;
GO

-- 5.2 Tabelat më të ndryshuara
SELECT 
    tabela,
    COUNT(*) AS numri_ndryshimeve,
    COUNT(CASE WHEN veprimi = 'I' THEN 1 END) AS inserts,
    COUNT(CASE WHEN veprimi = 'U' THEN 1 END) AS updates,
    COUNT(CASE WHEN veprimi = 'D' THEN 1 END) AS deletes
FROM audit_log
GROUP BY tabela
ORDER BY numri_ndryshimeve DESC;
GO

-- 5.3 Përdoruesit më aktivë
SELECT 
    user_name,
    COUNT(*) AS numri_veprimeve
FROM audit_log
GROUP BY user_name
ORDER BY numri_veprimeve DESC;
GO

/* ==================================================================
   Pjesa 6: Analiza të avancuara me Window Functions
   ================================================================== */

-- 6.1 Renditja e punonjësve sipas numrit të projekteve (brenda institucionit)
WITH punonjes_projekte AS (
    SELECT 
        p.id,
        p.emri,
        COALESCE(b.emri, m.emri) AS institucioni,
        COUNT(pp.projekt_id) AS numri_projekteve,
        ROW_NUMBER() OVER (PARTITION BY COALESCE(b.id, m.id) ORDER BY COUNT(pp.projekt_id) DESC) AS rn
    FROM punonjes p
    LEFT JOIN bashkia b ON p.bashkia_id = b.id
    LEFT JOIN ministria m ON p.ministria_id = m.id
    LEFT JOIN punonjes_projekt pp ON p.id = pp.punonjes_id
    WHERE p.aktiv = 1
    GROUP BY p.id, p.emri, b.emri, m.emri, b.id, m.id
)
SELECT 
    institucioni,
    emri,
    numri_projekteve,
    rn
FROM punonjes_projekte
WHERE rn <= 3  -- Top 3 punonjësit për institucion
ORDER BY institucioni, rn;
GO

-- 6.2 Lëvizja e numrit të punonjësve gjatë viteve (hiring trend)
SELECT 
    YEAR(data_fillimit) AS viti,
    COUNT(*) AS punonjes_te_rinj,
    SUM(COUNT(*)) OVER (ORDER BY YEAR(data_fillimit) ROWS UNBOUNDED PRECEDING) AS gjithsej_kumulative
FROM punonjes
WHERE aktiv = 1
GROUP BY YEAR(data_fillimit)
ORDER BY viti;
GO

-- 6.3 Krahasimi i buxhetit të projektit me mesataren e institucionit
SELECT 
    pr.emri,
    pr.buxheti,
    AVG(pr.buxheti) OVER (PARTITION BY pr.institucioni_tipi, pr.institucioni_id) AS buxheti_mesatar_institucionit,
    pr.buxheti - AVG(pr.buxheti) OVER (PARTITION BY pr.institucioni_tipi, pr.institucioni_id) AS diferenca_nga_mesatarja
FROM projekt pr
ORDER BY diferenca_nga_mesatarja DESC;
GO

/* ==================================================================
   Pjesa 7: Raporte të shpejta (për dashboard)
   ================================================================== */

-- 7.1 KPI kryesore
SELECT 
    (SELECT COUNT(*) FROM punonjes WHERE aktiv = 1) AS total_punonjes_aktiv,
    (SELECT COUNT(*) FROM projekt) AS total_projekte,
    (SELECT COUNT(*) FROM detyra WHERE status != 'Përfunduar') AS detyra_aktive,
    (SELECT SUM(buxheti) FROM projekt) AS buxheti_total_projekteve,
    (SELECT AVG(DATEDIFF(YEAR, ditelindja, GETDATE())) FROM punonjes WHERE ditelindja IS NOT NULL AND aktiv = 1) AS mosha_mesatare;
GO

-- 7.2 Shpërndarja gjeografike (për bashki)
SELECT 
    b.qyteti,
    COUNT(p.id) AS numri_punonjesve,
    COUNT(DISTINCT pr.id) AS numri_projekteve
FROM bashkia b
LEFT JOIN punonjes p ON b.id = p.bashkia_id AND p.aktiv = 1
LEFT JOIN projekt pr ON b.id = pr.institucioni_id AND pr.institucioni_tipi = 'Bashki'
GROUP BY b.qyteti
ORDER BY numri_punonjesve DESC;
GO

-- 7.3 Raporti i përfundimit të detyrave për çdo projekt
SELECT 
    pr.emri,
    COUNT(d.id) AS total_detyra,
    SUM(CASE WHEN d.status = 'Përfunduar' THEN 1 ELSE 0 END) AS detyra_te_perfunduara,
    CAST(SUM(CASE WHEN d.status = 'Përfunduar' THEN 1 ELSE 0 END) * 100.0 / COUNT(d.id) AS DECIMAL(5,2)) AS perqindja_perfundimit
FROM projekt pr
LEFT JOIN detyra d ON pr.id = d.projekt_id
GROUP BY pr.emri
ORDER BY perqindja_perfundimit DESC;
GO

/* ==================================================================
   Pjesa 8: Pastrimi dhe mirëmbajtja (opsionale)
   ================================================================== */

-- 8.1 Kontrollo integritetin referencial (punonjës pa institucion)
SELECT *
FROM punonjes
WHERE bashkia_id IS NULL AND ministria_id IS NULL AND aktiv = 1;
GO

-- 8.2 Kontrollo punonjësit e dyfishuar (email)
SELECT email, COUNT(*)
FROM punonjes
GROUP BY email
HAVING COUNT(*) > 1;
GO

-- 8.3 Rekomandime për indekse që mungojnë (nëse lejohet)
-- Kjo kërkon sys.dm_db_missing_index_details, por mund të heqim koment nëse duam
-- SELECT * FROM sys.dm_db_missing_index_details;
GO

PRINT 'Analiza e avancuar u ekzekutua me sukses!';
GO