document.addEventListener('DOMContentLoaded', function() {
    const contentSections = document.querySelectorAll('.content-section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const modal = document.getElementById('addPunonjesModal');
    const importCsvModal = document.getElementById('importCsvModal');
    const importCsvForm = document.getElementById('importCsvForm');
    const importInstitutionId = document.getElementById('importInstitutionId');
    const importInstitutionType = document.getElementById('importInstitutionType');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const csvFileInput = document.getElementById('csvFile');

    let allBashkit = [];
    let allMinistrit = [];

    // NAVIGIMI
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonId = this.id;
            let sectionId;
            if (buttonId === 'btnHome') sectionId = 'homeSection';
            else if (buttonId === 'btnLocalAdmin') {
                sectionId = 'localAdminSection';
                loadBashkit();
            } else if (buttonId === 'btnCentralAdmin') {
                sectionId = 'centralAdminSection';
                loadMinistrit();
            }
            showSection(sectionId);
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    function showSection(sectionId) {
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
    }

    // BASHKITË
    async function loadBashkit() {
        try {
            const response = await fetch('/api/bashkit');
            allBashkit = await response.json();
            displayBashkit(allBashkit);
            setupSearch('searchBashkia', allBashkit, displayBashkit);
        } catch (error) { console.error('Error loading bashkit:', error); }
    }

    function displayBashkit(bashkit) {
        const container = document.getElementById('bashkitContainer');
        container.innerHTML = '';
        if (bashkit.length === 0) {
            container.innerHTML = '<p class="no-data">Nuk u gjet asnjë bashki.</p>';
            return;
        }
        bashkit.forEach(b => {
            const card = document.createElement('div');
            card.className = 'bashkia-card';
            card.innerHTML = `
                <h3>${b.emri}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${b.qyteti || 'N/A'}</p>
                <p><i class="fas fa-users"></i> ${b.numriPunonjesve || 0} punonjës</p>
                <div class="card-footer">
                    <span class="count-badge">${b.popullsia ? b.popullsia.toLocaleString() : 'N/A'}</span>
                    <span><i class="fas fa-arrow-right"></i></span>
                </div>
            `;
            card.addEventListener('click', () => showBashkiaDetails(b));
            container.appendChild(card);
        });
    }

    async function showBashkiaDetails(bashkia) {
        document.getElementById('bashkiaTitle').textContent = bashkia.emri;
        document.getElementById('bashkiaInfo').textContent = 
            `Qyteti: ${bashkia.qyteti || 'N/A'} | Popullsia: ${bashkia.popullsia ? bashkia.popullsia.toLocaleString() : 'N/A'}`;
        document.getElementById('institutionId').value = bashkia._id;
        document.getElementById('institutionType').value = 'bashkia';

        try {
            const response = await fetch(`/api/bashkia/${bashkia._id}/punonjes`);
            const punonjesit = await response.json();
            displayPunonjesit(punonjesit, 'bashkia');
            document.getElementById('punonjesCount').textContent = punonjesit.length;

            // Inicializo analizat e avancuara për këtë bashki
            currentEmployees = punonjesit;
            initAdvancedAnalytics('Bashkia');
            runAnalysis(punonjesit, 'Bashkia');
        } catch (error) {
            console.error('Error loading punonjesit:', error);
            document.getElementById('punonjesCount').textContent = '0';
        }
        showSection('bashkiaDetailsSection');
    }

    // MINISTRITË
    async function loadMinistrit() {
        try {
            const response = await fetch('/api/ministrit');
            allMinistrit = await response.json();
            displayMinistrit(allMinistrit);
            setupSearch('searchMinistria', allMinistrit, displayMinistrit);
        } catch (error) { console.error('Error loading ministrit:', error); }
    }

    function displayMinistrit(ministrit) {
        const container = document.getElementById('ministritContainer');
        container.innerHTML = '';
        if (ministrit.length === 0) {
            container.innerHTML = '<p class="no-data">Nuk u gjet asnjë ministri.</p>';
            return;
        }
        ministrit.forEach(m => {
            const card = document.createElement('div');
            card.className = 'ministria-card';
            card.innerHTML = `
                <h3>${m.emri}</h3>
                <p><i class="fas fa-user-tie"></i> ${m.ministri || 'Ministria'}</p>
                <p><i class="fas fa-users"></i> ${m.numriPunonjesve || 0} punonjës</p>
                <div class="card-footer">
                    <span class="count-badge">ID: ${m._id.slice(-4)}</span>
                    <span><i class="fas fa-arrow-right"></i></span>
                </div>
            `;
            card.addEventListener('click', () => showMinistriaDetails(m));
            container.appendChild(card);
        });
    }

    async function showMinistriaDetails(ministria) {
        document.getElementById('ministriaTitle').textContent = ministria.emri;
        document.getElementById('ministriaInfo').textContent = 
            `Ministër: ${ministria.ministri || 'N/A'} | Në punë: ${ministria.numriPunonjesve || 0} punonjës`;
        document.getElementById('institutionId').value = ministria._id;
        document.getElementById('institutionType').value = 'ministria';

        try {
            const response = await fetch(`/api/ministria/${ministria._id}/punonjes`);
            const punonjesit = await response.json();
            displayPunonjesit(punonjesit, 'ministria');
            document.getElementById('punonjesMinistriaCount').textContent = punonjesit.length;

            // Inicializo analizat e avancuara për këtë ministri
            currentEmployees = punonjesit;
            initAdvancedAnalytics('Ministria');
            runAnalysis(punonjesit, 'Ministria');
        } catch (error) {
            console.error('Error loading punonjesit:', error);
            document.getElementById('punonjesMinistriaCount').textContent = '0';
        }
        showSection('ministriaDetailsSection');
    }

    // SHPFAQ PUNONJËSIT
    window.displayPunonjesit = function(punonjesit, type) {
        const containerId = type === 'bashkia' ? 'punonjesitBashkise' : 'punonjesitMinistrise';
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (punonjesit.length === 0) {
            container.innerHTML = '<p class="no-data">Nuk ka punonjës të regjistruar.</p>';
            return;
        }

        punonjesit.forEach(p => {
            let mosha = '';
            if (p.ditelindja) {
                const today = new Date();
                const birth = new Date(p.ditelindja);
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                mosha = `${age} vjeç`;
            }

            let projektetHtml = '';
            if (p.projektet) {
                const proj = p.projektet.split(',').map(p => p.trim()).filter(p => p);
                if (proj.length > 0) {
                    projektetHtml = '<div class="projektet-tekst">' + 
                        proj.map(p => `<span class="projekt-item">${p}</span>`).join('') + '</div>';
                }
            }

            const card = document.createElement('div');
            card.className = 'punonjes-card';
            card.innerHTML = `
                <div class="punonjes-info">
                    <h4>${p.emri}</h4>
                    <p><i class="fas fa-briefcase"></i> ${p.pozita}</p>
                    <p><i class="fas fa-envelope"></i> ${p.email}</p>
                    <p><i class="fas fa-phone"></i> ${p.telefoni}</p>
                    ${p.ditelindja ? `<p><i class="fas fa-birthday-cake"></i> Datëlindja: ${new Date(p.ditelindja).toLocaleDateString('sq-AL')} (${mosha})</p>` : ''}
                    ${p.gjinia ? `<p><i class="fas fa-venus-mars"></i> Gjinia: ${p.gjinia}</p>` : ''}
                    ${p.gjendjaCivile ? `<p><i class="fas fa-ring"></i> Gjendja civile: ${p.gjendjaCivile}</p>` : ''}
                    ${projektetHtml}
                    <p><i class="fas fa-calendar-alt"></i> Filloi: ${new Date(p.dataFillimit).toLocaleDateString('sq-AL')}</p>
                </div>
                <button class="delete-btn" onclick="deletePunonjes('${p._id}', '${type}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(card);
        });
    };

    // KËRKIM
    function setupSearch(inputId, data, displayFn) {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', e => {
                const term = e.target.value.toLowerCase();
                const filtered = data.filter(item => 
                    item.emri.toLowerCase().includes(term) ||
                    (item.qyteti && item.qyteti.toLowerCase().includes(term))
                );
                displayFn(filtered);
            });
        }
    }

    // BUTONAT BACK
    document.getElementById('backToBashkit').addEventListener('click', () => showSection('localAdminSection'));
    document.getElementById('backToMinistrit').addEventListener('click', () => showSection('centralAdminSection'));

    // MODAL: SHTO PUNONJËS
    document.getElementById('addPunonjesBtn').addEventListener('click', () => {
        modal.classList.add('active');
        document.getElementById('dataFillimit').valueAsDate = new Date();
    });
    document.getElementById('addPunonjesMinistriaBtn').addEventListener('click', () => {
        modal.classList.add('active');
        document.getElementById('dataFillimit').valueAsDate = new Date();
    });
    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        modal.classList.remove('active');
        document.getElementById('punonjesForm').reset();
    });
    window.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.getElementById('punonjesForm').reset();
        }
    });

    document.getElementById('punonjesForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const institutionId = document.getElementById('institutionId').value;
        const institutionType = document.getElementById('institutionType').value;

        const punonjesiRi = {
            emri: document.getElementById('emri').value.trim(),
            pozita: document.getElementById('pozita').value,
            email: document.getElementById('email').value.trim(),
            telefoni: document.getElementById('telefoni').value.trim(),
            ditelindja: document.getElementById('ditelindja').value || null,
            gjinia: document.getElementById('gjinia').value,
            gjendjaCivile: document.getElementById('gjendjaCivile').value,
            projektet: document.getElementById('projektet').value.trim(),
            dataFillimit: document.getElementById('dataFillimit').value
        };

        if (!punonjesiRi.emri || !punonjesiRi.pozita || !punonjesiRi.email || !punonjesiRi.telefoni || !punonjesiRi.dataFillimit) {
            alert('Plotësoni të gjitha fushat e detyrueshme!');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(punonjesiRi.email)) {
            alert('Email i pavlefshëm!');
            return;
        }

        if (institutionType === 'bashkia') punonjesiRi.bashkiaId = institutionId;
        else punonjesiRi.ministriaId = institutionId;

        try {
            const response = await fetch('/api/punonjes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(punonjesiRi)
            });
            const result = await response.json();

            if (result.success) {
                if (institutionType === 'bashkia') {
                    const resp = await fetch(`/api/bashkia/${institutionId}/punonjes`);
                    const pj = await resp.json();
                    displayPunonjesit(pj, 'bashkia');
                    document.getElementById('punonjesCount').textContent = pj.length;
                    const bashkia = allBashkit.find(b => b._id === institutionId);
                    if (bashkia) bashkia.numriPunonjesve = pj.length;
                    currentEmployees = pj;
                    runAnalysis(pj, 'Bashkia');
                } else {
                    const resp = await fetch(`/api/ministria/${institutionId}/punonjes`);
                    const pj = await resp.json();
                    displayPunonjesit(pj, 'ministria');
                    document.getElementById('punonjesMinistriaCount').textContent = pj.length;
                    const ministria = allMinistrit.find(m => m._id === institutionId);
                    if (ministria) ministria.numriPunonjesve = pj.length;
                    currentEmployees = pj;
                    runAnalysis(pj, 'Ministria');
                }

                modal.classList.remove('active');
                this.reset();
                alert('Punonjësi u shtua!');
            } else {
                alert('Gabim: ' + result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Gabim në shtim.');
        }
    });

    // MODAL: IMPORT CSV
    if (document.getElementById('importCsvBtn')) {
        document.getElementById('importCsvBtn').addEventListener('click', function() {
            importInstitutionId.value = document.getElementById('institutionId').value;
            importInstitutionType.value = 'bashkia';
            importCsvModal.classList.add('active');
        });
    }
    if (document.getElementById('importCsvMinistriaBtn')) {
        document.getElementById('importCsvMinistriaBtn').addEventListener('click', function() {
            importInstitutionId.value = document.getElementById('institutionId').value;
            importInstitutionType.value = 'ministria';
            importCsvModal.classList.add('active');
        });
    }

    cancelImportBtn.addEventListener('click', () => {
        importCsvModal.classList.remove('active');
        importCsvForm.reset();
    });
    window.addEventListener('click', e => {
        if (e.target === importCsvModal) {
            importCsvModal.classList.remove('active');
            importCsvForm.reset();
        }
    });

    importCsvForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const file = csvFileInput.files[0];
        if (!file) { alert('Zgjidh një skedar CSV.'); return; }

        const formData = new FormData();
        formData.append('csvFile', file);
        formData.append('institutionId', importInstitutionId.value);
        formData.append('institutionType', importInstitutionType.value);

        try {
            const response = await fetch('/api/upload-punonjes', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                const instId = importInstitutionId.value;
                const instType = importInstitutionType.value;

                if (instType === 'bashkia') {
                    const resp = await fetch(`/api/bashkia/${instId}/punonjes`);
                    const pj = await resp.json();
                    displayPunonjesit(pj, 'bashkia');
                    document.getElementById('punonjesCount').textContent = pj.length;
                    const bashkia = allBashkit.find(b => b._id === instId);
                    if (bashkia) bashkia.numriPunonjesve = pj.length;
                    currentEmployees = pj;
                    runAnalysis(pj, 'Bashkia');
                } else {
                    const resp = await fetch(`/api/ministria/${instId}/punonjes`);
                    const pj = await resp.json();
                    displayPunonjesit(pj, 'ministria');
                    document.getElementById('punonjesMinistriaCount').textContent = pj.length;
                    const ministria = allMinistrit.find(m => m._id === instId);
                    if (ministria) ministria.numriPunonjesve = pj.length;
                    currentEmployees = pj;
                    runAnalysis(pj, 'Ministria');
                }

                importCsvModal.classList.remove('active');
                importCsvForm.reset();

                let msg = result.message;
                if (result.errors?.length) msg += '\n\nGabime:\n' + result.errors.join('\n');
                alert(msg);
            } else {
                alert('Gabim: ' + result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Gabim gjatë ngarkimit.');
        }
    });

    // ========== ANALIZAT E AVANCUARA (10 LLOJE) ==========
    window.currentEmployees = null;
    window.currentAnalysisType = 'basic';

    window.initAdvancedAnalytics = function(sectionType) {
        const analysisSelect = document.getElementById(`analysisType${sectionType}`);
        const basicFiltersDiv = document.getElementById(`basicFilters${sectionType}`);
        const extraParamsDiv = document.getElementById(`extraParams${sectionType}`);
        const exportBtn = document.getElementById(`exportData${sectionType}`);
        const filterSelect = document.getElementById(`filterSelect${sectionType}`);

        if (!analysisSelect) return;

        // Ndryshimi i llojit të analizës
        analysisSelect.addEventListener('change', function() {
            currentAnalysisType = this.value;
            
            // Shfaq/fsheh filtrat bazë vetëm për analizën "basic"
            if (this.value === 'basic') {
                basicFiltersDiv.style.display = 'block';
                extraParamsDiv.style.display = 'none';
                extraParamsDiv.innerHTML = '';
            } else {
                basicFiltersDiv.style.display = 'none';
            }

            // Parametra shtesë për disa analiza
            if (this.value === 'tenure') {
                extraParamsDiv.style.display = 'block';
                extraParamsDiv.innerHTML = `
                    <label><i class="fas fa-calendar-alt"></i> Intervali i viteve:</label>
                    <select id="tenureInterval${sectionType}">
                        <option value="1">Çdo 1 vit</option>
                        <option value="5" selected>Çdo 5 vjet</option>
                        <option value="10">Çdo 10 vjet</option>
                    </select>
                `;
            } else if (this.value === 'projects') {
                extraParamsDiv.style.display = 'block';
                extraParamsDiv.innerHTML = `
                    <label><i class="fas fa-trophy"></i> Numri i top projekteve:</label>
                    <input type="number" id="topProjectsCount${sectionType}" min="1" max="20" value="5">
                `;
            } else if (this.value === 'ageDistribution') {
                extraParamsDiv.style.display = 'block';
                extraParamsDiv.innerHTML = `
                    <label><i class="fas fa-chart-bar"></i> Gjerësia e intervalit:</label>
                    <select id="ageBinSize${sectionType}">
                        <option value="5">5 vjet</option>
                        <option value="10">10 vjet</option>
                    </select>
                `;
            } else if (this.value === 'projectCount') {
                extraParamsDiv.style.display = 'block';
                extraParamsDiv.innerHTML = `
                    <label><i class="fas fa-cubes"></i> Maksimumi i numrit:</label>
                    <input type="number" id="maxProjectCount${sectionType}" min="1" max="20" value="10">
                `;
            } else {
                extraParamsDiv.style.display = 'none';
                extraParamsDiv.innerHTML = '';
            }

            if (currentEmployees) {
                runAnalysis(currentEmployees, sectionType);
            }
        });

        // Filtrimi nga dropdown-i i filtrave bazë
        if (filterSelect) {
            filterSelect.addEventListener('change', function() {
                if (currentAnalysisType === 'basic' && currentEmployees) {
                    runAnalysis(currentEmployees, sectionType);
                }
            });
        }

        // Eksport CSV
        exportBtn.addEventListener('click', function() {
            exportToCSV(currentEmployees, sectionType);
        });

        // Inicializo me analizën bazë
        analysisSelect.dispatchEvent(new Event('change'));
    };

    window.runAnalysis = function(employees, sectionType) {
        if (!employees) return;
        currentEmployees = employees;
        const analysisType = document.getElementById(`analysisType${sectionType}`).value;
        const chartCanvas = document.getElementById(`chart${sectionType}`);
        const statsContainer = document.getElementById(`statsContainer${sectionType}`);

        const existingChart = Chart.getChart(chartCanvas);
        if (existingChart) existingChart.destroy();

        let statsHTML = '';

        switch (analysisType) {
            case 'basic':
                const filterValue = document.getElementById(`filterSelect${sectionType}`).value;
                const filtered = filterEmployees(employees, filterValue);
                displayPunonjesit(filtered, sectionType.toLowerCase());
                if (sectionType.toLowerCase() === 'bashkia') {
                    document.getElementById('punonjesCount').textContent = filtered.length;
                } else {
                    document.getElementById('punonjesMinistriaCount').textContent = filtered.length;
                }
                generateBasicChart(employees, filterValue, chartCanvas);
                statsHTML = generateBasicStats(employees, filtered);
                break;
            case 'demographic':
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateDemographicChart(employees, chartCanvas);
                statsHTML = generateDemographicStats(employees);
                break;
            case 'projects':
                const topN = parseInt(document.getElementById(`topProjectsCount${sectionType}`)?.value || 5);
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateProjectsChart(employees, topN, chartCanvas);
                statsHTML = generateProjectsStats(employees, topN);
                break;
            case 'tenure':
                const interval = parseInt(document.getElementById(`tenureInterval${sectionType}`)?.value || 5);
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateTenureChart(employees, interval, chartCanvas);
                statsHTML = generateTenureStats(employees);
                break;
            case 'combined':
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateCombinedChart(employees, chartCanvas);
                statsHTML = generateCombinedStats(employees);
                break;
            case 'positions':
                displayPunonjesit(employees, sectionType.toLowerCase());
                generatePositionChart(employees, chartCanvas);
                statsHTML = generatePositionStats(employees);
                break;
            case 'ageDistribution':
                const binSize = parseInt(document.getElementById(`ageBinSize${sectionType}`)?.value || 5);
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateAgeDistributionChart(employees, binSize, chartCanvas);
                statsHTML = generateAgeDistributionStats(employees);
                break;
            case 'projectCount':
                const maxCount = parseInt(document.getElementById(`maxProjectCount${sectionType}`)?.value || 10);
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateProjectCountChart(employees, maxCount, chartCanvas);
                statsHTML = generateProjectCountStats(employees);
                break;
            case 'positionGender':
                displayPunonjesit(employees, sectionType.toLowerCase());
                generatePositionGenderChart(employees, chartCanvas);
                statsHTML = generatePositionGenderStats(employees);
                break;
            case 'startYear':
                displayPunonjesit(employees, sectionType.toLowerCase());
                generateStartYearChart(employees, chartCanvas);
                statsHTML = generateStartYearStats(employees);
                break;
        }

        if (statsContainer) {
            statsContainer.innerHTML = statsHTML;
        }
    };

    // ========== FUNKSIONET PËR GRAFIKË DHE STATISTIKA (TË GJITHË ME ANIMACION) ==========
   function generateBasicChart(employees, filterValue, canvas) {
    const females = employees.filter(e => e.gjinia === 'Femër').length;
    const males = employees.filter(e => e.gjinia === 'Mashkull').length;
    const other = employees.filter(e => e.gjinia && !['Femër','Mashkull'].includes(e.gjinia)).length;

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Femra', 'Meshkuj', 'Tjetër'],
            datasets: [{
                label: 'Numri i punonjësve',
                data: [females, males, other],
                backgroundColor: ['#e84393', '#3498db', '#95a5a6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { title: { display: true, text: 'Shpërndarja gjinore' } },
            animation: {
                duration: 2000,               // 2 sekonda
                easing: 'easeOutBounce'        // efekt i dukshëm kërcimi
            }
        }
    });
}

    function generateDemographicChart(employees, canvas) {
        const genderCounts = {
            'Femër': employees.filter(e => e.gjinia === 'Femër').length,
            'Mashkull': employees.filter(e => e.gjinia === 'Mashkull').length,
            'Tjetër': employees.filter(e => e.gjinia && !['Femër','Mashkull'].includes(e.gjinia)).length
        };

        const maritalCounts = {
            'Beqarë': employees.filter(e => e.gjendjaCivile === 'Beqar/e').length,
            'Të martuar': employees.filter(e => e.gjendjaCivile === 'Martuar').length,
            'Të divorcuar': employees.filter(e => ['I divorcuar','E divorcuar'].includes(e.gjendjaCivile)).length,
            'Të ve': employees.filter(e => ['E ve','I ve'].includes(e.gjendjaCivile)).length
        };

        const ageGroups = { '<30': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
        employees.forEach(e => {
            if (e.ditelindja) {
                const age = calculateAge(e.ditelindja);
                if (age < 30) ageGroups['<30']++;
                else if (age < 40) ageGroups['30-39']++;
                else if (age < 50) ageGroups['40-49']++;
                else if (age < 60) ageGroups['50-59']++;
                else ageGroups['60+']++;
            }
        });

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Gjinia', 'Gjendja civile', 'Mosha'],
                datasets: [
                    { label: 'Femra', data: [genderCounts.Femër, null, null], backgroundColor: '#e84393' },
                    { label: 'Meshkuj', data: [genderCounts.Mashkull, null, null], backgroundColor: '#3498db' },
                    { label: 'Beqarë', data: [null, maritalCounts.Beqarë, null], backgroundColor: '#f39c12' },
                    { label: 'Të martuar', data: [null, maritalCounts['Të martuar'], null], backgroundColor: '#27ae60' },
                    { label: '<30', data: [null, null, ageGroups['<30']], backgroundColor: '#9b59b6' },
                    { label: '30-39', data: [null, null, ageGroups['30-39']], backgroundColor: '#e67e22' },
                    { label: '40-49', data: [null, null, ageGroups['40-49']], backgroundColor: '#1abc9c' },
                    { label: '50-59', data: [null, null, ageGroups['50-59']], backgroundColor: '#e74c3c' },
                    { label: '60+', data: [null, null, ageGroups['60+']], backgroundColor: '#34495e' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { title: { display: true, text: 'Përmbledhje demografike' } },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generateProjectsChart(employees, topN, canvas) {
        let allProjects = [];
        employees.forEach(e => {
            if (e.projektet) {
                const projArray = e.projektet.split(',').map(p => p.trim()).filter(p => p);
                allProjects.push(...projArray);
            }
        });

        const freq = {};
        allProjects.forEach(p => freq[p] = (freq[p] || 0) + 1);
        const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, topN);
        const labels = sorted.map(item => item[0].length > 20 ? item[0].substring(0,20)+'…' : item[0]);
        const values = sorted.map(item => item[1]);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numri i punonjësve',
                    data: values,
                    backgroundColor: '#f39c12',
                    borderColor: '#e67e22',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: `Top ${topN} projektet më të zakonshme` },
                    legend: { display: false }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generateTenureChart(employees, interval, canvas) {
        const today = new Date();
        const tenureGroups = {};
        employees.forEach(e => {
            const start = new Date(e.dataFillimit);
            const years = (today - start) / (1000 * 60 * 60 * 24 * 365.25);
            const group = Math.floor(years / interval) * interval;
            const label = `${group}-${group+interval}`;
            tenureGroups[label] = (tenureGroups[label] || 0) + 1;
        });

        const labels = Object.keys(tenureGroups).sort((a,b) => {
            const aVal = parseInt(a.split('-')[0]);
            const bVal = parseInt(b.split('-')[0]);
            return aVal - bVal;
        });
        const values = labels.map(l => tenureGroups[l]);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numri i punonjësve',
                    data: values,
                    backgroundColor: '#1abc9c',
                    borderColor: '#16a085',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: `Shpërndarja sipas vjetërsisë (çdo ${interval} vjet)` },
                    legend: { display: false }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generateCombinedChart(employees, canvas) {
        const data = {
            'Femër': { 'Beqar/e': 0, 'Martuar': 0, 'I divorcuar': 0, 'E divorcuar': 0, 'E ve': 0, 'I ve': 0 },
            'Mashkull': { 'Beqar/e': 0, 'Martuar': 0, 'I divorcuar': 0, 'E divorcuar': 0, 'E ve': 0, 'I ve': 0 }
        };

        employees.forEach(e => {
            if (e.gjinia && e.gjendjaCivile) {
                const g = e.gjinia;
                const gc = e.gjendjaCivile;
                if (data[g] && data[g][gc] !== undefined) data[g][gc]++;
                else {
                    if (!data[g]['Tjetër']) data[g]['Tjetër'] = 0;
                    data[g]['Tjetër']++;
                }
            }
        });

        const labels = ['Beqarë', 'Të martuar', 'Të divorcuar', 'Të ve', 'Tjetër'];
        const femaleData = labels.map(l => {
            if (l === 'Beqarë') return data['Femër']['Beqar/e'] || 0;
            if (l === 'Të martuar') return data['Femër']['Martuar'] || 0;
            if (l === 'Të divorcuar') return (data['Femër']['I divorcuar'] || 0) + (data['Femër']['E divorcuar'] || 0);
            if (l === 'Të ve') return (data['Femër']['E ve'] || 0) + (data['Femër']['I ve'] || 0);
            return data['Femër']['Tjetër'] || 0;
        });
        const maleData = labels.map(l => {
            if (l === 'Beqarë') return data['Mashkull']['Beqar/e'] || 0;
            if (l === 'Të martuar') return data['Mashkull']['Martuar'] || 0;
            if (l === 'Të divorcuar') return (data['Mashkull']['I divorcuar'] || 0) + (data['Mashkull']['E divorcuar'] || 0);
            if (l === 'Të ve') return (data['Mashkull']['E ve'] || 0) + (data['Mashkull']['I ve'] || 0);
            return data['Mashkull']['Tjetër'] || 0;
        });

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Femra', data: femaleData, backgroundColor: '#e84393' },
                    { label: 'Meshkuj', data: maleData, backgroundColor: '#3498db' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { title: { display: true, text: 'Kryqëzimi: Gjinia vs Gjendja civile' } },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generatePositionChart(employees, canvas) {
        const positions = {};
        employees.forEach(e => {
            positions[e.pozita] = (positions[e.pozita] || 0) + 1;
        });
        const sorted = Object.entries(positions).sort((a,b) => b[1] - a[1]);
        const labels = sorted.map(p => p[0]);
        const values = sorted.map(p => p[1]);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numri i punonjësve',
                    data: values,
                    backgroundColor: '#9b59b6',
                    borderColor: '#8e44ad',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: 'Shpërndarja sipas pozicioneve' },
                    legend: { display: false }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generateAgeDistributionChart(employees, binSize, canvas) {
        const ageGroups = {};
        employees.forEach(e => {
            if (e.ditelindja) {
                const age = calculateAge(e.ditelindja);
                const binStart = Math.floor(age / binSize) * binSize;
                const label = `${binStart}-${binStart+binSize}`;
                ageGroups[label] = (ageGroups[label] || 0) + 1;
            }
        });

        const labels = Object.keys(ageGroups).sort((a,b) => {
            const aVal = parseInt(a.split('-')[0]);
            const bVal = parseInt(b.split('-')[0]);
            return aVal - bVal;
        });
        const values = labels.map(l => ageGroups[l]);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numri i punonjësve',
                    data: values,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: `Shpërndarja e moshës (çdo ${binSize} vjet)` },
                    legend: { display: false }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generateProjectCountChart(employees, maxCount, canvas) {
        const counts = Array(maxCount + 1).fill(0);
        employees.forEach(e => {
            if (e.projektet && e.projektet.trim() !== '') {
                const num = e.projektet.split(',').filter(p => p.trim()).length;
                if (num <= maxCount) counts[num]++;
                else counts[maxCount]++; // group at max
            } else {
                counts[0]++;
            }
        });

        const labels = Array.from({length: maxCount + 1}, (_, i) => i === maxCount ? `${maxCount}+` : `${i}`);
        const values = counts;

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numri i punonjësve',
                    data: values,
                    backgroundColor: '#e67e22',
                    borderColor: '#d35400',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: 'Shpërndarja e numrit të projekteve' },
                    legend: { display: false }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generatePositionGenderChart(employees, canvas) {
        const positions = {};
        employees.forEach(e => {
            if (!positions[e.pozita]) {
                positions[e.pozita] = { female: 0, male: 0, other: 0 };
            }
            if (e.gjinia === 'Femër') positions[e.pozita].female++;
            else if (e.gjinia === 'Mashkull') positions[e.pozita].male++;
            else positions[e.pozita].other++;
        });

        const labels = Object.keys(positions).slice(0, 8); // max 8 për lexueshmëri
        const femaleData = labels.map(p => positions[p].female);
        const maleData = labels.map(p => positions[p].male);
        const otherData = labels.map(p => positions[p].other);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Femra', data: femaleData, backgroundColor: '#e84393' },
                    { label: 'Meshkuj', data: maleData, backgroundColor: '#3498db' },
                    { label: 'Tjetër', data: otherData, backgroundColor: '#95a5a6' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: 'Pozita vs Gjinia' }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    function generateStartYearChart(employees, canvas) {
        const years = {};
        employees.forEach(e => {
            const year = new Date(e.dataFillimit).getFullYear();
            years[year] = (years[year] || 0) + 1;
        });
        const sorted = Object.keys(years).sort((a,b) => a - b);
        const labels = sorted;
        const values = sorted.map(y => years[y]);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numri i punonjësve',
                    data: values,
                    backgroundColor: '#16a085',
                    borderColor: '#1abc9c',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { 
                    title: { display: true, text: 'Shpërndarja sipas vitit të fillimit' },
                    legend: { display: false }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
    }

    // ========== FUNKSIONE STATISTIKORE (të pandryshuara) ==========
    function generateBasicStats(employees, filtered) {
        const total = employees.length;
        const filteredCount = filtered.length;
        return `
            <h5><i class="fas fa-filter"></i> Statistika të filtrit</h5>
            <table class="stats-table">
                <tr><td>Gjithsej punonjës:</td><td>${total}</td></tr>
                <tr><td>Pas filtrit:</td><td>${filteredCount} (${((filteredCount/total)*100 || 0).toFixed(1)}%)</td></tr>
            </table>
        `;
    }

    function generateDemographicStats(employees) {
        const total = employees.length;
        const females = employees.filter(e => e.gjinia === 'Femër').length;
        const males = employees.filter(e => e.gjinia === 'Mashkull').length;
        const avgAge = employees.filter(e => e.ditelindja).reduce((acc, e) => acc + calculateAge(e.ditelindja), 0) / employees.filter(e => e.ditelindja).length || 0;
        return `
            <h5><i class="fas fa-venus-mars"></i> Statistika demografike</h5>
            <table class="stats-table">
                <tr><td>Gjithsej punonjës:</td><td>${total}</td></tr>
                <tr><td>Femra:</td><td>${females} (${((females/total)*100 || 0).toFixed(1)}%)</td></tr>
                <tr><td>Meshkuj:</td><td>${males} (${((males/total)*100 || 0).toFixed(1)}%)</td></tr>
                <tr><td>Mosha mesatare:</td><td>${avgAge.toFixed(1)} vjeç</td></tr>
            </table>
        `;
    }

    function generateProjectsStats(employees, topN) {
        const withProjects = employees.filter(e => e.projektet && e.projektet.trim() !== '').length;
        const withoutProjects = employees.length - withProjects;
        let totalProjects = 0;
        employees.forEach(e => {
            if (e.projektet) totalProjects += e.projektet.split(',').filter(p => p.trim()).length;
        });
        return `
            <h5><i class="fas fa-tasks"></i> Statistika e projekteve</h5>
            <table class="stats-table">
                <tr><td>Punonjës me projekte:</td><td>${withProjects} (${((withProjects/employees.length)*100).toFixed(1)}%)</td></tr>
                <tr><td>Punonjës pa projekte:</td><td>${withoutProjects} (${((withoutProjects/employees.length)*100).toFixed(1)}%)</td></tr>
                <tr><td>Gjithsej projekte:</td><td>${totalProjects}</td></tr>
                <tr><td>Projekte për punonjës:</td><td>${(totalProjects/employees.length).toFixed(2)}</td></tr>
            </table>
        `;
    }

    function generateTenureStats(employees) {
        const today = new Date();
        let totalYears = 0;
        let minYears = Infinity, maxYears = 0;
        employees.forEach(e => {
            const start = new Date(e.dataFillimit);
            const years = (today - start) / (1000 * 60 * 60 * 24 * 365.25);
            totalYears += years;
            if (years < minYears) minYears = years;
            if (years > maxYears) maxYears = years;
        });
        const avgYears = totalYears / employees.length;
        return `
            <h5><i class="fas fa-hourglass-half"></i> Statistika e vjetërsisë</h5>
            <table class="stats-table">
                <tr><td>Vjetërsi mesatare:</td><td>${avgYears.toFixed(1)} vjet</td></tr>
                <tr><td>Vjetërsi minimale:</td><td>${minYears.toFixed(1)} vjet</td></tr>
                <tr><td>Vjetërsi maksimale:</td><td>${maxYears.toFixed(1)} vjet</td></tr>
            </table>
        `;
    }

    function generateCombinedStats(employees) {
        const total = employees.length;
        const married = employees.filter(e => e.gjendjaCivile === 'Martuar').length;
        const single = employees.filter(e => e.gjendjaCivile === 'Beqar/e').length;
        return `
            <h5><i class="fas fa-merge"></i> Statistika të kombinuara</h5>
            <table class="stats-table">
                <tr><td>Gjithsej punonjës:</td><td>${total}</td></tr>
                <tr><td>Të martuar:</td><td>${married} (${((married/total)*100).toFixed(1)}%)</td></tr>
                <tr><td>Beqarë:</td><td>${single} (${((single/total)*100).toFixed(1)}%)</td></tr>
                <tr><td>Femra të martuara:</td><td>${employees.filter(e => e.gjinia === 'Femër' && e.gjendjaCivile === 'Martuar').length}</td></tr>
                <tr><td>Meshkuj të martuar:</td><td>${employees.filter(e => e.gjinia === 'Mashkull' && e.gjendjaCivile === 'Martuar').length}</td></tr>
            </table>
        `;
    }

    function generatePositionStats(employees) {
        const total = employees.length;
        const positions = employees.map(e => e.pozita).filter((v,i,a) => a.indexOf(v) === i).length;
        const topPosition = Object.entries(employees.reduce((acc, e) => {
            acc[e.pozita] = (acc[e.pozita] || 0) + 1;
            return acc;
        }, {})).sort((a,b) => b[1] - a[1])[0];
        return `
            <h5><i class="fas fa-briefcase"></i> Statistika e pozicioneve</h5>
            <table class="stats-table">
                <tr><td>Gjithsej pozicione:</td><td>${positions}</td></tr>
                <tr><td>Pozita më e zakonshme:</td><td>${topPosition ? topPosition[0] : 'N/A'} (${topPosition ? topPosition[1] : 0})</td></tr>
                <tr><td>Mesatarisht për pozitë:</td><td>${(total / positions).toFixed(1)} punonjës</td></tr>
            </table>
        `;
    }

    function generateAgeDistributionStats(employees) {
        const withAge = employees.filter(e => e.ditelindja).length;
        const avgAge = employees.filter(e => e.ditelindja).reduce((acc, e) => acc + calculateAge(e.ditelindja), 0) / withAge || 0;
        const minAge = Math.min(...employees.filter(e => e.ditelindja).map(e => calculateAge(e.ditelindja))) || 0;
        const maxAge = Math.max(...employees.filter(e => e.ditelindja).map(e => calculateAge(e.ditelindja))) || 0;
        return `
            <h5><i class="fas fa-birthday-cake"></i> Statistika e moshës</h5>
            <table class="stats-table">
                <tr><td>Me datëlindje:</td><td>${withAge} (${((withAge/employees.length)*100).toFixed(1)}%)</td></tr>
                <tr><td>Mosha mesatare:</td><td>${avgAge.toFixed(1)} vjeç</td></tr>
                <tr><td>Mosha minimale:</td><td>${minAge.toFixed(1)} vjeç</td></tr>
                <tr><td>Mosha maksimale:</td><td>${maxAge.toFixed(1)} vjeç</td></tr>
            </table>
        `;
    }

    function generateProjectCountStats(employees) {
        const withProjects = employees.filter(e => e.projektet && e.projektet.trim() !== '').length;
        const withoutProjects = employees.length - withProjects;
        let totalProjects = 0, totalEmployeesWithProjects = 0;
        employees.forEach(e => {
            if (e.projektet && e.projektet.trim() !== '') {
                const count = e.projektet.split(',').filter(p => p.trim()).length;
                totalProjects += count;
                totalEmployeesWithProjects++;
            }
        });
        const avgProjectsPerEmployeeWithProjects = totalEmployeesWithProjects ? totalProjects / totalEmployeesWithProjects : 0;
        return `
            <h5><i class="fas fa-cubes"></i> Statistika e numrit të projekteve</h5>
            <table class="stats-table">
                <tr><td>Pa asnjë projekt:</td><td>${withoutProjects} (${((withoutProjects/employees.length)*100).toFixed(1)}%)</td></tr>
                <tr><td>Me të paktën 1 projekt:</td><td>${withProjects} (${((withProjects/employees.length)*100).toFixed(1)}%)</td></tr>
                <tr><td>Projekte gjithsej:</td><td>${totalProjects}</td></tr>
                <tr><td>Mesatarisht (ata me projekte):</td><td>${avgProjectsPerEmployeeWithProjects.toFixed(2)} projekte</td></tr>
            </table>
        `;
    }

    function generatePositionGenderStats(employees) {
        const topMalePos = Object.entries(employees.reduce((acc, e) => {
            if (e.gjinia === 'Mashkull') acc[e.pozita] = (acc[e.pozita] || 0) + 1;
            return acc;
        }, {})).sort((a,b) => b[1] - a[1])[0];
        const topFemalePos = Object.entries(employees.reduce((acc, e) => {
            if (e.gjinia === 'Femër') acc[e.pozita] = (acc[e.pozita] || 0) + 1;
            return acc;
        }, {})).sort((a,b) => b[1] - a[1])[0];
        return `
            <h5><i class="fas fa-venus-mars"></i> Pozitat kryesore sipas gjinisë</h5>
            <table class="stats-table">
                <tr><td>Pozita më e zakonshme për meshkuj:</td><td>${topMalePos ? topMalePos[0] : 'N/A'} (${topMalePos ? topMalePos[1] : 0})</td></tr>
                <tr><td>Pozita më e zakonshme për femra:</td><td>${topFemalePos ? topFemalePos[0] : 'N/A'} (${topFemalePos ? topFemalePos[1] : 0})</td></tr>
            </table>
        `;
    }

    function generateStartYearStats(employees) {
        const years = employees.map(e => new Date(e.dataFillimit).getFullYear());
        const earliest = Math.min(...years);
        const latest = Math.max(...years);
        const avgYear = years.reduce((a,b) => a + b, 0) / years.length;
        return `
            <h5><i class="fas fa-calendar"></i> Statistika e viteve të fillimit</h5>
            <table class="stats-table">
                <tr><td>Viti më i hershëm:</td><td>${earliest}</td></tr>
                <tr><td>Viti më i vonë:</td><td>${latest}</td></tr>
                <tr><td>Viti mesatar:</td><td>${avgYear.toFixed(0)}</td></tr>
            </table>
        `;
    }

    // ========== FUNKSIONE NDIHMËSE ==========
    function calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }

    function filterEmployees(employees, filterValue) {
        if (filterValue === 'all') return employees;
        return employees.filter(p => {
            switch (filterValue) {
                case 'female': return p.gjinia === 'Femër';
                case 'male': return p.gjinia === 'Mashkull';
                case 'single': return p.gjendjaCivile === 'Beqar/e';
                case 'married': return p.gjendjaCivile === 'Martuar';
                case 'divorced': return ['I divorcuar','E divorcuar'].includes(p.gjendjaCivile);
                case 'widow': return ['E ve','I ve'].includes(p.gjendjaCivile);
                case 'hasProjects': return p.projektet && p.projektet.trim() !== '';
                case 'noProjects': return !p.projektet || p.projektet.trim() === '';
                default: return true;
            }
        });
    }

    window.exportToCSV = function(employees, sectionType) {
        if (!employees || employees.length === 0) {
            alert('Nuk ka të dhëna për të eksportuar.');
            return;
        }

        const headers = ['Emri', 'Pozita', 'Email', 'Telefoni', 'Datëlindja', 'Gjinia', 'Gjendja Civile', 'Projektet', 'Data e fillimit'];
        const rows = employees.map(e => [
            e.emri,
            e.pozita,
            e.email,
            e.telefoni,
            e.ditelindja ? new Date(e.ditelindja).toLocaleDateString('sq-AL') : '',
            e.gjinia || '',
            e.gjendjaCivile || '',
            e.projektet || '',
            new Date(e.dataFillimit).toLocaleDateString('sq-AL')
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `punonjesit_${sectionType}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // NISJA FILLESTARE
    showSection('homeSection');
    loadBashkit();
    loadMinistrit();
});

// FSHRIRJE PUNONJËSI
async function deletePunonjes(id, type) {
    if (!confirm('Jeni i sigurt që dëshironi të fshini këtë punonjës?')) return;
    try {
        const response = await fetch(`/api/punonjes/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            const currentSection = document.querySelector('.content-section.active').id;
            if (currentSection === 'bashkiaDetailsSection') {
                const bashkiaId = document.getElementById('institutionId').value;
                const resp = await fetch(`/api/bashkia/${bashkiaId}/punonjes`);
                const pj = await resp.json();
                displayPunonjesit(pj, 'bashkia');
                document.getElementById('punonjesCount').textContent = pj.length;
                window.currentEmployees = pj;
                runAnalysis(pj, 'Bashkia');
            } else if (currentSection === 'ministriaDetailsSection') {
                const ministriaId = document.getElementById('institutionId').value;
                const resp = await fetch(`/api/ministria/${ministriaId}/punonjes`);
                const pj = await resp.json();
                displayPunonjesit(pj, 'ministria');
                document.getElementById('punonjesMinistriaCount').textContent = pj.length;
                window.currentEmployees = pj;
                runAnalysis(pj, 'Ministria');
            }
            alert('Punonjësi u fshi!');
        } else {
            alert('Gabim: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Gabim në fshirje.');
    }
}