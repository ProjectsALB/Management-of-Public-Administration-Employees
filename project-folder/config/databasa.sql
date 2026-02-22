-- ========================================================
-- Skript i plotë për Bazën e të Dhënave "Administrim_Projektesh"
-- Versioni: Advanced me indekse, trigera, procedura dhe pamje
-- ========================================================

-- Nëse databaza ekziston, e fshijmë (për testim)
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'Administrim_Projektesh')
    DROP DATABASE Administrim_Projektesh;
GO

CREATE DATABASE Administrim_Projektesh;
GO

USE Administrim_Projektesh;
GO

-- ========================================================
-- Tabelat e dhëna (me përmirësime)
-- ========================================================

CREATE TABLE bashkia (
    id INT PRIMARY KEY IDENTITY(1,1),   -- shtuar IDENTITY për auto-increment
    emri NVARCHAR(100) NOT NULL,
    qyteti NVARCHAR(100),
    numri_punonjesve INT DEFAULT 0,
    popullsia INT,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE ministria (
    id INT PRIMARY KEY IDENTITY(1,1),
    emri NVARCHAR(100) NOT NULL,
    ministri NVARCHAR(100) DEFAULT 'Ministri',
    numri_punonjesve INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE gjendja_civile (
    id INT PRIMARY KEY IDENTITY(1,1),
    kodi NVARCHAR(10) UNIQUE NOT NULL,
    pershkrimi NVARCHAR(50) NOT NULL,
    rendi INT DEFAULT 0
);

CREATE TABLE pozita (
    id INT PRIMARY KEY IDENTITY(1,1),
    emri NVARCHAR(100) UNIQUE NOT NULL,
    niveli INT,
    pershkrimi NVARCHAR(255)
);

CREATE TABLE punonjes (
    id INT PRIMARY KEY IDENTITY(1,1),
    emri NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    telefoni NVARCHAR(50) NOT NULL,
    ditelindja DATE,
    gjinia NVARCHAR(20),
    gjendja_civile_id INT FOREIGN KEY REFERENCES gjendja_civile(id),
    pozita_id INT FOREIGN KEY REFERENCES pozita(id),
    bashkia_id INT FOREIGN KEY REFERENCES bashkia(id),
    ministria_id INT FOREIGN KEY REFERENCES ministria(id),
    data_fillimit DATE NOT NULL,
    data_perfundimit DATE,
    aktiv BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE projekt (
    id INT PRIMARY KEY IDENTITY(1,1),
    emri NVARCHAR(255) UNIQUE NOT NULL,
    pershkrimi NVARCHAR(MAX),
    data_fillimit DATE,
    data_mbarimit DATE,
    buxheti DECIMAL(18,2),
    institucioni_id INT NOT NULL, -- bashkia ose ministria
    institucioni_tipi NVARCHAR(20) NOT NULL
);

CREATE TABLE punonjes_projekt (
    id INT PRIMARY KEY IDENTITY(1,1),
    punonjes_id INT NOT NULL FOREIGN KEY REFERENCES punonjes(id),
    projekt_id INT NOT NULL FOREIGN KEY REFERENCES projekt(id),
    roli NVARCHAR(100),
    data_caktimit DATETIME2 DEFAULT GETUTCDATE(),
    data_largimit DATETIME2,
    CONSTRAINT UQ_punonjes_projekt UNIQUE (punonjes_id, projekt_id)
);

CREATE TABLE departamenti (
    id INT PRIMARY KEY IDENTITY(1,1),
    emri NVARCHAR(100) NOT NULL,
    bashkia_id INT FOREIGN KEY REFERENCES bashkia(id),
    ministria_id INT FOREIGN KEY REFERENCES ministria(id),
    pershkrimi NVARCHAR(MAX)
);

CREATE TABLE dokumentet (
    id INT PRIMARY KEY IDENTITY(1,1),
    titulli NVARCHAR(255) NOT NULL,
    pershkrimi NVARCHAR(MAX),
    data_shtimit DATE,
    projekti_id INT FOREIGN KEY REFERENCES projekt(id),
    krijuar_nga INT FOREIGN KEY REFERENCES punonjes(id)
);

CREATE TABLE detyra (
    id INT PRIMARY KEY IDENTITY(1,1),
    emri NVARCHAR(255) NOT NULL,
    pershkrimi NVARCHAR(MAX),
    projekt_id INT FOREIGN KEY REFERENCES projekt(id),
    assigned_to INT FOREIGN KEY REFERENCES punonjes(id),
    data_fillimit DATE,
    data_perfundimit DATE,
    status NVARCHAR(50)
);

CREATE TABLE raportet (
    id INT PRIMARY KEY IDENTITY(1,1),
    titulli NVARCHAR(255) NOT NULL,
    projekti_id INT FOREIGN KEY REFERENCES projekt(id),
    data_raportit DATE,
    krijuar_nga INT FOREIGN KEY REFERENCES punonjes(id),
    pershkrimi NVARCHAR(MAX)
);

-- ========================================================
-- Tabela për audit log (logu i ndryshimeve)
-- ========================================================
CREATE TABLE audit_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tabela NVARCHAR(100) NOT NULL,
    veprimi CHAR(1) NOT NULL, -- 'I' INSERT, 'U' UPDATE, 'D' DELETE
    rekord_id INT NOT NULL,
    ndryshimet NVARCHAR(MAX), -- JSON i të dhënave të vjetra/të reja
    user_name NVARCHAR(128) DEFAULT SUSER_SNAME(),
    data_krijimit DATETIME2 DEFAULT GETUTCDATE()
);

-- ========================================================
-- Indekse të optimizuara për performancë
-- ========================================================

CREATE INDEX IX_punonjes_bashkia_id ON punonjes(bashkia_id) WHERE bashkia_id IS NOT NULL;
CREATE INDEX IX_punonjes_ministria_id ON punonjes(ministria_id) WHERE ministria_id IS NOT NULL;
CREATE INDEX IX_punonjes_pozita_id ON punonjes(pozita_id);
CREATE INDEX IX_punonjes_gjendja_civile_id ON punonjes(gjendja_civile_id);
CREATE INDEX IX_punonjes_aktiv ON punonjes(aktiv);
CREATE INDEX IX_punonjes_data_fillimit ON punonjes(data_fillimit);

CREATE INDEX IX_projekt_institucioni ON projekt(institucioni_id, institucioni_tipi);
CREATE INDEX IX_projekt_data_fillimit ON projekt(data_fillimit);
CREATE INDEX IX_projekt_data_mbarimit ON projekt(data_mbarimit);

CREATE INDEX IX_punonjes_projekt_punonjes_id ON punonjes_projekt(punonjes_id);
CREATE INDEX IX_punonjes_projekt_projekt_id ON punonjes_projekt(projekt_id);

CREATE INDEX IX_detyra_projekt_id ON detyra(projekt_id);
CREATE INDEX IX_detyra_assigned_to ON detyra(assigned_to);
CREATE INDEX IX_detyra_status ON detyra(status);

CREATE INDEX IX_dokumentet_projekti_id ON dokumentet(projekti_id);
CREATE INDEX IX_raportet_projekti_id ON raportet(projekti_id);

-- ========================================================
-- Trigger për logim (audit)
-- ========================================================
GO

CREATE OR ALTER TRIGGER trg_punonjes_audit
ON punonjes
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @veprimi CHAR(1);
    DECLARE @rekord_id INT;
    DECLARE @ndryshimet NVARCHAR(MAX);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @veprimi = 'U'; -- UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @veprimi = 'I'; -- INSERT
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @veprimi = 'D'; -- DELETE

    -- Për INSERT dhe UPDATE, logojmë të dhënat e reja
    IF @veprimi IN ('I', 'U')
    BEGIN
        INSERT INTO audit_log (tabela, veprimi, rekord_id, ndryshimet)
        SELECT 'punonjes', @veprimi, i.id,
            (SELECT * FROM inserted i WHERE i.id = i.id FOR JSON AUTO)
        FROM inserted i;
    END

    -- Për DELETE, logojmë të dhënat e vjetra
    IF @veprimi = 'D'
    BEGIN
        INSERT INTO audit_log (tabela, veprimi, rekord_id, ndryshimet)
        SELECT 'punonjes', @veprimi, d.id,
            (SELECT * FROM deleted d WHERE d.id = d.id FOR JSON AUTO)
        FROM deleted d;
    END
END;
GO

-- Trigger të ngjashëm për tabelat e tjera (bashkia, ministria, projekt, etj.)
CREATE OR ALTER TRIGGER trg_bashkia_audit
ON bashkia
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @veprimi CHAR(1);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @veprimi = 'U';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @veprimi = 'I';
    ELSE IF EXISTS (SELECT * FROM deleted) SET @veprimi = 'D';

    INSERT INTO audit_log (tabela, veprimi, rekord_id, ndryshimet)
    SELECT 'bashkia', @veprimi, COALESCE(i.id, d.id),
        COALESCE(
            (SELECT * FROM inserted i WHERE i.id = COALESCE(i.id, d.id) FOR JSON AUTO),
            (SELECT * FROM deleted d WHERE d.id = COALESCE(i.id, d.id) FOR JSON AUTO)
        )
    FROM (SELECT * FROM inserted) i
    FULL OUTER JOIN (SELECT * FROM deleted) d ON i.id = d.id;
END;
GO

CREATE OR ALTER TRIGGER trg_ministria_audit
ON ministria
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @veprimi CHAR(1);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @veprimi = 'U';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @veprimi = 'I';
    ELSE IF EXISTS (SELECT * FROM deleted) SET @veprimi = 'D';

    INSERT INTO audit_log (tabela, veprimi, rekord_id, ndryshimet)
    SELECT 'ministria', @veprimi, COALESCE(i.id, d.id),
        COALESCE(
            (SELECT * FROM inserted i WHERE i.id = COALESCE(i.id, d.id) FOR JSON AUTO),
            (SELECT * FROM deleted d WHERE d.id = COALESCE(i.id, d.id) FOR JSON AUTO)
        )
    FROM (SELECT * FROM inserted) i
    FULL OUTER JOIN (SELECT * FROM deleted) d ON i.id = d.id;
END;
GO

CREATE OR ALTER TRIGGER trg_projekt_audit
ON projekt
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @veprimi CHAR(1);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @veprimi = 'U';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @veprimi = 'I';
    ELSE IF EXISTS (SELECT * FROM deleted) SET @veprimi = 'D';

    INSERT INTO audit_log (tabela, veprimi, rekord_id, ndryshimet)
    SELECT 'projekt', @veprimi, COALESCE(i.id, d.id),
        COALESCE(
            (SELECT * FROM inserted i WHERE i.id = COALESCE(i.id, d.id) FOR JSON AUTO),
            (SELECT * FROM deleted d WHERE d.id = COALESCE(i.id, d.id) FOR JSON AUTO)
        )
    FROM (SELECT * FROM inserted) i
    FULL OUTER JOIN (SELECT * FROM deleted) d ON i.id = d.id;
END;
GO

-- Trigger për të mbajtur numri_punonjesve të përditësuar në bashkia dhe ministria
CREATE OR ALTER TRIGGER trg_punonjes_update_count
ON punonjes
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Për bashkitë
    UPDATE b
    SET numri_punonjesve = (SELECT COUNT(*) FROM punonjes WHERE bashkia_id = b.id AND aktiv = 1)
    FROM bashkia b
    WHERE b.id IN (SELECT bashkia_id FROM inserted WHERE bashkia_id IS NOT NULL)
       OR b.id IN (SELECT bashkia_id FROM deleted WHERE bashkia_id IS NOT NULL);

    -- Për ministritë
    UPDATE m
    SET numri_punonjesve = (SELECT COUNT(*) FROM punonjes WHERE ministria_id = m.id AND aktiv = 1)
    FROM ministria m
    WHERE m.id IN (SELECT ministria_id FROM inserted WHERE ministria_id IS NOT NULL)
       OR m.id IN (SELECT ministria_id FROM deleted WHERE ministria_id IS NOT NULL);
END;
GO

-- ========================================================
-- Procedura të depozituara (Stored Procedures)
-- ========================================================

-- 1. Shto punonjës të ri
CREATE OR ALTER PROCEDURE usp_ShtoPunonjes
    @emri NVARCHAR(255),
    @email NVARCHAR(255),
    @telefoni NVARCHAR(50),
    @ditelindja DATE = NULL,
    @gjinia NVARCHAR(20) = NULL,
    @gjendja_civile_id INT = NULL,
    @pozita_id INT,
    @bashkia_id INT = NULL,
    @ministria_id INT = NULL,
    @data_fillimit DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO punonjes (emri, email, telefoni, ditelindja, gjinia, gjendja_civile_id, pozita_id, bashkia_id, ministria_id, data_fillimit, aktiv)
        VALUES (@emri, @email, @telefoni, @ditelindja, @gjinia, @gjendja_civile_id, @pozita_id, @bashkia_id, @ministria_id, @data_fillimit, 1);

        COMMIT TRANSACTION;

        SELECT SCOPE_IDENTITY() AS id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 2. Përditëso punonjës
CREATE OR ALTER PROCEDURE usp_PerditesoPunonjes
    @id INT,
    @emri NVARCHAR(255) = NULL,
    @email NVARCHAR(255) = NULL,
    @telefoni NVARCHAR(50) = NULL,
    @ditelindja DATE = NULL,
    @gjinia NVARCHAR(20) = NULL,
    @gjendja_civile_id INT = NULL,
    @pozita_id INT = NULL,
    @bashkia_id INT = NULL,
    @ministria_id INT = NULL,
    @data_fillimit DATE = NULL,
    @data_perfundimit DATE = NULL,
    @aktiv BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE punonjes
        SET
            emri = COALESCE(@emri, emri),
            email = COALESCE(@email, email),
            telefoni = COALESCE(@telefoni, telefoni),
            ditelindja = COALESCE(@ditelindja, ditelindja),
            gjinia = COALESCE(@gjinia, gjinia),
            gjendja_civile_id = COALESCE(@gjendja_civile_id, gjendja_civile_id),
            pozita_id = COALESCE(@pozita_id, pozita_id),
            bashkia_id = COALESCE(@bashkia_id, bashkia_id),
            ministria_id = COALESCE(@ministria_id, ministria_id),
            data_fillimit = COALESCE(@data_fillimit, data_fillimit),
            data_perfundimit = COALESCE(@data_perfundimit, data_perfundimit),
            aktiv = COALESCE(@aktiv, aktiv),
            updated_at = GETUTCDATE()
        WHERE id = @id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 3. Fshi punonjës (logjikisht, duke e bërë inaktiv)
CREATE OR ALTER PROCEDURE usp_FshiPunonjes
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE punonjes SET aktiv = 0, data_perfundimit = GETUTCDATE() WHERE id = @id;
END;
GO

-- 4. Procedura për statistika: numri i punonjësve sipas bashkive
CREATE OR ALTER PROCEDURE usp_StatistikaSipasBashkive
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        b.id,
        b.emri AS bashkia,
        COUNT(p.id) AS numri_punonjesve
    FROM bashkia b
    LEFT JOIN punonjes p ON p.bashkia_id = b.id AND p.aktiv = 1
    GROUP BY b.id, b.emri
    ORDER BY numri_punonjesve DESC;
END;
GO

-- 5. Procedura për raportin e projekteve me numrin e punonjësve të përfshirë
CREATE OR ALTER PROCEDURE usp_RaportProjekteve
    @data_fillimit DATE = NULL,
    @data_mbarimit DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        pr.id,
        pr.emri,
        pr.data_fillimit,
        pr.data_mbarimit,
        pr.buxheti,
        COUNT(pp.punonjes_id) AS numri_punonjesve,
        COUNT(DISTINCT d.id) AS numri_detyrave
    FROM projekt pr
    LEFT JOIN punonjes_projekt pp ON pr.id = pp.projekt_id
    LEFT JOIN detyra d ON pr.id = d.projekt_id
    WHERE (@data_fillimit IS NULL OR pr.data_fillimit >= @data_fillimit)
      AND (@data_mbarimit IS NULL OR pr.data_mbarimit <= @data_mbarimit)
    GROUP BY pr.id, pr.emri, pr.data_fillimit, pr.data_mbarimit, pr.buxheti;
END;
GO

-- 6. Procedura për të marrë historikun e ndryshimeve të një punonjësi
CREATE OR ALTER PROCEDURE usp_HistorikuPunonjesit
    @punonjes_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        data_krijimit,
        veprimi,
        ndryshimet
    FROM audit_log
    WHERE tabela = 'punonjes' AND rekord_id = @punonjes_id
    ORDER BY data_krijimit DESC;
END;
GO

-- 7. Procedura për të shtuar një projekt dhe caktuar punonjës (transaksion)
CREATE OR ALTER PROCEDURE usp_ShtoProjektMePunonjes
    @emri NVARCHAR(255),
    @pershkrimi NVARCHAR(MAX),
    @data_fillimit DATE,
    @data_mbarimit DATE,
    @buxheti DECIMAL(18,2),
    @institucioni_id INT,
    @institucioni_tipi NVARCHAR(20),
    @punonjes_ids NVARCHAR(MAX) -- listë ID-ve të ndara me presje
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Krijo projektin
        INSERT INTO projekt (emri, pershkrimi, data_fillimit, data_mbarimit, buxheti, institucioni_id, institucioni_tipi)
        VALUES (@emri, @pershkrimi, @data_fillimit, @data_mbarimit, @buxheti, @institucioni_id, @institucioni_tipi);

        DECLARE @projekt_id INT = SCOPE_IDENTITY();

        -- Cakto punonjësit
        INSERT INTO punonjes_projekt (punonjes_id, projekt_id, roli, data_caktimit)
        SELECT value, @projekt_id, 'Anëtar', GETUTCDATE()
        FROM STRING_SPLIT(@punonjes_ids, ',');

        COMMIT TRANSACTION;
        SELECT @projekt_id AS projekt_id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ========================================================
-- Pamje (Views) për raportim
-- ========================================================

-- 1. Pamje: Punonjësit aktivë me detajet e institucionit dhe pozitës
CREATE OR ALTER VIEW vw_PunonjesitAktiv
AS
SELECT
    p.id,
    p.emri,
    p.email,
    p.telefoni,
    p.ditelindja,
    p.gjinia,
    gc.pershkrimi AS gjendja_civile,
    po.emri AS pozita,
    COALESCE(b.emri, m.emri) AS institucioni,
    CASE WHEN p.bashkia_id IS NOT NULL THEN 'Bashki' ELSE 'Ministri' END AS tipi_institucionit,
    p.data_fillimit,
    DATEDIFF(YEAR, p.data_fillimit, GETDATE()) AS vjetersia_vite
FROM punonjes p
LEFT JOIN gjendja_civile gc ON p.gjendja_civile_id = gc.id
LEFT JOIN pozita po ON p.pozita_id = po.id
LEFT JOIN bashkia b ON p.bashkia_id = b.id
LEFT JOIN ministria m ON p.ministria_id = m.id
WHERE p.aktiv = 1;
GO

-- 2. Pamje: Përmbledhje e punonjësve sipas moshës dhe gjinisë
CREATE OR ALTER VIEW vw_StatistikaDemografike
AS
SELECT
    YEAR(GETDATE()) - YEAR(p.ditelindja) AS mosha,
    p.gjinia,
    COUNT(*) AS numri
FROM punonjes p
WHERE p.ditelindja IS NOT NULL AND p.aktiv = 1
GROUP BY YEAR(GETDATE()) - YEAR(p.ditelindja), p.gjinia;
GO

-- 3. Pamje: Projektet me numrin e punonjësve dhe detyrave
CREATE OR ALTER VIEW vw_ProjektetDetajet
AS
SELECT
    pr.id,
    pr.emri AS projekt,
    pr.data_fillimit,
    pr.data_mbarimit,
    pr.buxheti,
    COUNT(DISTINCT pp.punonjes_id) AS numri_punonjesve,
    COUNT(DISTINCT d.id) AS numri_detyrave,
    COUNT(DISTINCT r.id) AS numri_raporteve
FROM projekt pr
LEFT JOIN punonjes_projekt pp ON pr.id = pp.projekt_id
LEFT JOIN detyra d ON pr.id = d.projekt_id
LEFT JOIN raportet r ON pr.id = r.projekti_id
GROUP BY pr.id, pr.emri, pr.data_fillimit, pr.data_mbarimit, pr.buxheti;
GO

-- 4. Pamje: Punonjësit që nuk janë caktuar në asnjë projekt
CREATE OR ALTER VIEW vw_PunonjesitPaProjekt
AS
SELECT
    p.id,
    p.emri,
    p.email,
    p.pozita_id,
    po.emri AS pozita,
    COALESCE(b.emri, m.emri) AS institucioni
FROM punonjes p
LEFT JOIN punonjes_projekt pp ON p.id = pp.punonjes_id
LEFT JOIN bashkia b ON p.bashkia_id = b.id
LEFT JOIN ministria m ON p.ministria_id = m.id
LEFT JOIN pozita po ON p.pozita_id = po.id
WHERE p.aktiv = 1 AND pp.id IS NULL;
GO

-- 5. Pamje: Statistikat e përdorimit të sistemeve (log)
CREATE OR ALTER VIEW vw_LogStatistika
AS
SELECT
    CAST(data_krijimit AS DATE) AS data,
    tabela,
    veprimi,
    COUNT(*) AS numri
FROM audit_log
GROUP BY CAST(data_krijimit AS DATE), tabela, veprimi;
GO

-- 6. Pamje: Shpenzimet totale për projekte për çdo institucion
CREATE OR ALTER VIEW vw_ShpenzimetSipasInstitucionit
AS
SELECT
    institucioni_tipi,
    institucioni_id,
    CASE WHEN institucioni_tipi = 'Bashki' THEN (SELECT emri FROM bashkia WHERE id = institucioni_id)
         ELSE (SELECT emri FROM ministria WHERE id = institucioni_id) END AS emri_institucionit,
    COUNT(*) AS numri_projekteve,
    SUM(buxheti) AS total_buxheti,
    AVG(buxheti) AS mesatarja_buxhetit
FROM projekt
GROUP BY institucioni_tipi, institucioni_id;
GO

-- 7. Pamje: Detyrat e vonuara
CREATE OR ALTER VIEW vw_DetyratEVonuara
AS
SELECT
    d.id,
    d.emri AS detyra,
    pr.emri AS projekt,
    d.data_perfundimit,
    p.emri AS punonjes_pergjegjes,
    DATEDIFF(DAY, d.data_perfundimit, GETDATE()) AS dite_vonese
FROM detyra d
INNER JOIN projekt pr ON d.projekt_id = pr.id
LEFT JOIN punonjes p ON d.assigned_to = p.id
WHERE d.data_perfundimit < GETDATE() AND d.status != 'Përfunduar';
GO

-- ========================================================
-- Query të optimizuara (shembuj)
-- ========================================================

-- 1. Gjej punonjësit me projektet e tyre (përdor indekset)
SELECT
    p.emri AS punonjes,
    pr.emri AS projekt
FROM punonjes p
INNER JOIN punonjes_projekt pp ON p.id = pp.punonjes_id
INNER JOIN projekt pr ON pp.projekt_id = pr.id
WHERE p.aktiv = 1
ORDER BY p.emri;

-- 2. Numëro punonjësit për çdo pozitë në një bashki të caktuar (p.sh. bashkia me id=1)
SELECT
    po.emri AS pozita,
    COUNT(*) AS numri
FROM punonjes p
INNER JOIN pozita po ON p.pozita_id = po.id
WHERE p.bashkia_id = 1 AND p.aktiv = 1
GROUP BY po.emri
ORDER BY numri DESC;

-- 3. Shuma e buxhetit të projekteve për çdo institucion (bashki/ministri)
SELECT
    institucioni_tipi,
    institucioni_id,
    SUM(buxheti) AS total_buxheti
FROM projekt
GROUP BY institucioni_tipi, institucioni_id;

-- 4. Gjej detyrat e vonuara (data e fundit e kryerjes ka kaluar)
SELECT
    d.emri AS detyra,
    pr.emri AS projekt,
    d.data_perfundimit,
    p.emri AS punonjes_pergjegjes
FROM detyra d
INNER JOIN projekt pr ON d.projekt_id = pr.id
LEFT JOIN punonjes p ON d.assigned_to = p.id
WHERE d.data_perfundimit < GETDATE() AND d.status != 'Përfunduar';

-- 5. Statistikat e punonjësve sipas gjinisë dhe gjendjes civile
SELECT
    p.gjinia,
    gc.pershkrimi AS gjendja_civile,
    COUNT(*) AS numri
FROM punonjes p
LEFT JOIN gjendja_civile gc ON p.gjendja_civile_id = gc.id
WHERE p.aktiv = 1
GROUP BY p.gjinia, gc.pershkrimi
ORDER BY p.gjinia, gc.pershkrimi;

-- ========================================================
-- Fundi i skriptit
-- ========================================================
PRINT 'Baza e të dhënave u krijua me sukses!';
GO