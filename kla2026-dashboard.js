document.addEventListener('DOMContentLoaded', () => {
    // klaData is globally available from kla2026-data.js

    const districtSelect = document.getElementById('districtSelect');
    const constSelect = document.getElementById('constSelect');

    const constInfo = document.getElementById('constInfo');
    const mlaInfo = document.getElementById('mlaInfo');
    const candidatesList = document.getElementById('candidatesList');
    const chartsContainer = document.getElementById('chartsContainer');

    let assemblyChartInstance = null;
    let generalChartInstance = null;
    let trendChartInstance = null;

    // Helper formatting functions
    const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num);
    const formatPercent = (dec) => (dec * 100).toFixed(2) + '%';

    // Set Chart.js defaults for dark theme
    Chart.defaults.color = '#94a3b8'; // text-muted
    Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

    // Populate Districts
    if (klaData && klaData.districts) {
        klaData.districts.sort().forEach(dist => {
            const option = document.createElement('option');
            option.value = dist;
            option.textContent = dist;
            districtSelect.appendChild(option);
        });
    }

    // Handle District Change
    districtSelect.addEventListener('change', (e) => {
        const dist = e.target.value;
        constSelect.innerHTML = '<option value="">-- Select Constituency --</option>';
        
        if (dist) {
            constSelect.disabled = false;
            // Get constituencies for this district
            const distConsts = Object.values(klaData.constituencies)
                .filter(c => c.district === dist)
                .sort((a, b) => parseInt(a.id) - parseInt(b.id));

            distConsts.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = `${c.id} - ${c.name}`;
                constSelect.appendChild(option);
            });
        } else {
            constSelect.disabled = true;
        }

        // Hide panels
        constInfo.style.display = 'none';
        mlaInfo.style.display = 'none';
        candidatesList.style.display = 'none';
        chartsContainer.style.display = 'none';
    });

    // Handle Constituency Change
    constSelect.addEventListener('change', (e) => {
        const constId = e.target.value;
        if (constId) {
            updateDashboard(constId);
        } else {
            constInfo.style.display = 'none';
            mlaInfo.style.display = 'none';
            candidatesList.style.display = 'none';
            chartsContainer.style.display = 'none';
        }
    });

    function updateDashboard(constId) {
        // Show panels
        constInfo.style.display = 'block';
        mlaInfo.style.display = 'block';
        candidatesList.style.display = 'block';
        chartsContainer.style.display = 'block';

        const cData = klaData.constituencies[constId];
        const mData = klaData.current_mla[constId];
        const cands = klaData.candidates[constId] || [];
        const history = klaData.vote_history[constId] || [];

        // PANEL 1
        document.getElementById('constNameMl').textContent = cData.name_ml;
        document.getElementById('constNameEn').textContent = cData.name;
        document.getElementById('valParliament').textContent = cData.parliament;
        document.getElementById('valReservation').textContent = cData.reservation;
        document.getElementById('valMaleVoters').textContent = formatNumber(cData.male_voters);
        document.getElementById('valFemaleVoters').textContent = formatNumber(cData.female_voters);
        document.getElementById('valTotalVoters').textContent = formatNumber(cData.total_voters);

        const lastMlasBody = document.getElementById('lastMlasBody');
        lastMlasBody.innerHTML = '';
        const niyamaHistory = history.filter(h => h.election === 'niyamasabha').sort((a, b) => b.year - a.year);
        
        niyamaHistory.slice(0, 3).forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${h.year}</td>
                <td>${h.winner_name}</td>
                <td><span class="badge ${h.winner_alliance.toLowerCase() || 'others'}">${h.winner_alliance}</span></td>
            `;
            lastMlasBody.appendChild(tr);
        });

        // PANEL 2
        if (mData) {
            document.getElementById('mlaName').textContent = mData.member;
            document.getElementById('mlaAge').textContent = mData.age;
            document.getElementById('mlaParty').textContent = mData.party;
            
            const badge = document.getElementById('mlaAlliance');
            badge.textContent = mData.alliance;
            badge.className = `badge ${mData.alliance.toLowerCase() || 'others'}`;

            document.getElementById('statTotalVotes').textContent = formatNumber(mData.total_votes);
            document.getElementById('statPolled').textContent = `${formatNumber(mData.valid_votes)} (${formatPercent(mData.valid_vote_percentage)})`;
            document.getElementById('statReceived').textContent = `${formatNumber(mData.member_votes)} (${formatPercent(mData.member_perc)})`;
            document.getElementById('statMargin').textContent = formatNumber(mData.margin);

            // Try to find photo from 2026 candidate list for the sitting MLA if they are contesting again
            // Often their name matches or they have same party
            const photoEl = document.getElementById('mlaPhoto');
            let mlaPhoto = '';
            
            // Wait, we can get runner up from 2021
            const h2021 = niyamaHistory.find(h => h.year === 2021);
            if (h2021) {
                document.getElementById('statRunnerUpName').textContent = h2021.runnerup_name;
                document.getElementById('statRunnerUpParty').textContent = h2021.runnerup_party;
                document.getElementById('statRunnerUpVotes').textContent = formatNumber(h2021.runnerup_votes);
            } else {
                document.getElementById('statRunnerUpName').textContent = 'N/A';
                document.getElementById('statRunnerUpParty').textContent = 'N/A';
                document.getElementById('statRunnerUpVotes').textContent = 'N/A';
            }

            // Robust logic to find MLA photo from 2026 Candidates
            function normalizeName(name) {
                return name.toLowerCase().replace(/adv\.|dr\.|prof\.|sri\.|smt\./g, '').replace(/[\.\s]/g, '');
            }

            const mlaNorm = normalizeName(mData.member);
            let candMatch = cands.find(c => {
                const candNorm = normalizeName(c.name);
                return (candNorm.includes(mlaNorm) || mlaNorm.includes(candNorm)) && c.party === mData.party;
            });
            
            // Fallback: match by last name & party
            if (!candMatch) {
                const mlaParts = mData.member.split(' ');
                const mlaLastName = mlaParts[mlaParts.length - 1].toLowerCase();
                candMatch = cands.find(c => c.name.toLowerCase().includes(mlaLastName) && c.party === mData.party);
            }

            if (candMatch && candMatch.photo) {
                mlaPhoto = candMatch.photo;
            }

            if (mlaPhoto) {
                photoEl.src = `assets/images/candidates/${mlaPhoto}`;
            } else {
                photoEl.src = ''; // will fallback to onerror
            }
        }

        // PANEL 3
        candidatesList.innerHTML = '';
        
        // Custom sort to put major alliances first
        const allCands = [...cands].sort((a, b) => {
            const order = { 'LDF': 1, 'UDF': 2, 'NDA': 3, 'Others': 4 };
            const ao = order[a.alliance] || 4;
            const bo = order[b.alliance] || 4;
            return ao - bo;
        });

        allCands.forEach(cand => {
            const card = document.createElement('div');
            const allianceClass = cand.alliance.toLowerCase() || 'others';
            card.className = `candidate-card ${allianceClass}`;
            
            const imgSrc = cand.photo ? `assets/images/candidates/${cand.photo}` : '';
            
            card.innerHTML = `
                <img src="${imgSrc}" class="cand-photo" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Crect%20fill%3D%22%23dddddd%22%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2222%22%20r%3D%2210%22%20fill%3D%22%23aaaaaa%22%2F%3E%3Cpath%20d%3D%22M15%2050%20c0%20-15%2030%20-15%2030%200%22%20fill%3D%22%23aaaaaa%22%2F%3E%3C%2Fsvg%3E'">
                <div class="cand-info">
                    <p class="cand-name-en">${cand.name}</p>
                    <p class="cand-name-ml malayalam-font">${cand.name_ml}</p>
                    <div class="cand-meta">
                        Age: ${cand.age || 'N/A'} | Party: <strong>${cand.party}</strong>
                    </div>
                </div>
            `;
            candidatesList.appendChild(card);
        });

        // PANEL 4: CHARTS
        if (assemblyChartInstance) assemblyChartInstance.destroy();
        if (generalChartInstance) generalChartInstance.destroy();
        if (trendChartInstance) trendChartInstance.destroy();

        const ldfColor = '#ef4444';
        const udfColor = '#3b82f6';
        const ndaColor = '#f59e0b';

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4
                },
                legend: {
                    labels: { color: '#94a3b8', font: { family: "'Outfit', sans-serif", size: 13 } }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } }
                }
            }
        };

        // Assembly Chart
        const asyData = history.filter(h => h.election === 'niyamasabha').sort((a, b) => a.year - b.year);
        assemblyChartInstance = new Chart(document.getElementById('assemblyChart'), {
            type: 'bar',
            data: {
                labels: asyData.map(h => h.year.toString()),
                datasets: [
                    { label: 'LDF', data: asyData.map(h => h.ldf_votes), backgroundColor: ldfColor, borderRadius: 4, borderSkipped: false },
                    { label: 'UDF', data: asyData.map(h => h.udf_votes), backgroundColor: udfColor, borderRadius: 4, borderSkipped: false },
                    { label: 'NDA', data: asyData.map(h => h.nda_votes), backgroundColor: ndaColor, borderRadius: 4, borderSkipped: false }
                ]
            },
            options: commonOptions
        });

        // General Chart
        const genData = history.filter(h => h.election === 'loksabha').sort((a, b) => a.year - b.year);
        generalChartInstance = new Chart(document.getElementById('generalChart'), {
            type: 'bar',
            data: {
                labels: genData.map(h => h.year.toString()),
                datasets: [
                    { label: 'LDF', data: genData.map(h => h.ldf_votes), backgroundColor: ldfColor, borderRadius: 4, borderSkipped: false },
                    { label: 'UDF', data: genData.map(h => h.udf_votes), backgroundColor: udfColor, borderRadius: 4, borderSkipped: false },
                    { label: 'NDA', data: genData.map(h => h.nda_votes), backgroundColor: ndaColor, borderRadius: 4, borderSkipped: false }
                ]
            },
            options: commonOptions
        });

        // Combined Trend Chart
        const allData = [...history].sort((a, b) => a.year - b.year);
        trendChartInstance = new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
                labels: allData.map(h => h.year.toString() + (h.election === 'loksabha' ? ' (LS)' : '')),
                datasets: [
                    { label: 'LDF', data: allData.map(h => h.ldf_votes), borderColor: ldfColor, backgroundColor: ldfColor, tension: 0.4, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#1e293b' },
                    { label: 'UDF', data: allData.map(h => h.udf_votes), borderColor: udfColor, backgroundColor: udfColor, tension: 0.4, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#1e293b' },
                    { label: 'NDA', data: allData.map(h => h.nda_votes), borderColor: ndaColor, backgroundColor: ndaColor, tension: 0.4, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#1e293b' }
                ]
            },
            options: commonOptions
        });

    }
});
