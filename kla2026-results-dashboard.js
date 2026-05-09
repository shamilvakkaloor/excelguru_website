document.addEventListener('DOMContentLoaded', () => {
    // Data globally available from kla2026-results-data.js as `klaResultsData`
    if (!klaResultsData) return;

    const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num);

    // Color definitions
    const colors = {
        'LDF': '#ef4444',
        'UDF': '#3b82f6',
        'NDA': '#f59e0b',
        'Others': '#94a3b8'
    };
    const getCls = (alliance) => alliance.toLowerCase() || 'others';
    const getColor = (alliance) => colors[alliance] || colors['Others'];

    // Global Data Structures calculated once on load
    const stateSummary = {
        totalVotes: 0,
        seats: { 'LDF': 0, 'UDF': 0, 'NDA': 0, 'Others': 0 },
        votes: { 'LDF': 0, 'UDF': 0, 'NDA': 0, 'Others': 0 },
        districts: {},
        allConstituencies: [] // for top margins
    };

    // Initialize State Summary Data
    Object.keys(klaResultsData.results).forEach(constId => {
        const cData = klaResultsData.constituencies[constId];
        const res = klaResultsData.results[constId];
        if (!res || res.length === 0) return;

        const winner = res[0]; // array is sorted by votes
        const dist = cData.district;

        if (!stateSummary.districts[dist]) {
            stateSummary.districts[dist] = {
                name: dist,
                totalSeats: 0,
                seats: { 'LDF': 0, 'UDF': 0, 'NDA': 0, 'Others': 0 },
                constituencies: []
            };
        }

        let allianceKey = winner.alliance;
        if (!['LDF', 'UDF', 'NDA'].includes(allianceKey)) allianceKey = 'Others';

        stateSummary.seats[allianceKey]++;
        stateSummary.districts[dist].seats[allianceKey]++;
        stateSummary.districts[dist].totalSeats++;

        let constTotalVotes = 0;
        res.forEach(c => {
            let aKey = c.alliance;
            if (!['LDF', 'UDF', 'NDA'].includes(aKey)) aKey = 'Others';
            stateSummary.votes[aKey] += c.votes;
            stateSummary.totalVotes += c.votes;
            constTotalVotes += c.votes;
        });

        const constRecord = {
            id: constId,
            name: cData.name,
            district: dist,
            winnerName: winner.candidate_name,
            party: winner.party,
            alliance: winner.alliance,
            margin: winner.margin,
            totalVotes: constTotalVotes
        };
        stateSummary.districts[dist].constituencies.push(constRecord);
        stateSummary.allConstituencies.push(constRecord);
    });

    // --- TAB SWITCHING LOGIC ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // --- TAB 1: CONSTITUENCY RESULTS ---
    const districtSelect = document.getElementById('districtSelect');
    const constSelect = document.getElementById('constSelect');
    let assemblyTrendChartInst, trendChartInst, asyChartInst, genChartInst;

    klaResultsData.districts.sort().forEach(dist => {
        const opt = document.createElement('option');
        opt.value = dist; opt.textContent = dist;
        districtSelect.appendChild(opt);
    });

    districtSelect.addEventListener('change', (e) => {
        const dist = e.target.value;
        constSelect.innerHTML = '<option value="">-- Select Constituency --</option>';
        if (dist) {
            constSelect.disabled = false;
            const distConsts = Object.values(klaResultsData.constituencies)
                .filter(c => c.district === dist)
                .sort((a, b) => parseInt(a.id) - parseInt(b.id));

            distConsts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; opt.textContent = `${c.id} - ${c.name}`;
                constSelect.appendChild(opt);
            });
        } else {
            constSelect.disabled = true;
        }
        document.getElementById('constContent').style.display = 'none';
        document.getElementById('constEmptyState').style.display = 'block';
    });

    constSelect.addEventListener('change', (e) => {
        const constId = e.target.value;
        if (constId) {
            document.getElementById('constContent').style.display = 'block';
            document.getElementById('constEmptyState').style.display = 'none';
            renderConstituency(constId);
        } else {
            document.getElementById('constContent').style.display = 'none';
            document.getElementById('constEmptyState').style.display = 'block';
        }
    });

    function getFallbackImg() {
        return "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%3E%3Crect%20fill%3D%22%23dddddd%22%20width%3D%2260%22%20height%3D%2260%22%2F%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2222%22%20r%3D%2210%22%20fill%3D%22%23aaaaaa%22%2F%3E%3Cpath%20d%3D%22M15%2050%20c0%20-15%2030%20-15%2030%200%22%20fill%3D%22%23aaaaaa%22%2F%3E%3C%2Fsvg%3E";
    }

    function renderConstituency(constId) {
        const cData = klaResultsData.constituencies[constId];
        const res = klaResultsData.results[constId] || [];
        const hist = klaResultsData.vote_history[constId] || [];

        document.getElementById('constNameEn').textContent = cData.name;
        document.getElementById('constNameMl').textContent = cData.name_ml;

        // Podium (Top 3)
        const podiumContainer = document.getElementById('podiumContainer');
        podiumContainer.innerHTML = '';
        const order = [1, 0, 2]; // 2nd, 1st, 3rd for UI display
        order.forEach(idx => {
            if (res.length > idx) {
                const c = res[idx];
                const isWinner = idx === 0;
                const imgSrc = c.photo ? `assets/images/results/${c.photo}` : '';
                const fallback = getFallbackImg();
                const cls = getCls(c.alliance);
                
                let cardHtml = `<div class="podium-card ${isWinner ? 'podium-1' : ''}">`;
                if (isWinner) cardHtml += `<div class="winner-badge">Winner</div>`;
                if (!isWinner) cardHtml += `<div class="podium-rank">#${idx+1}</div>`;
                
                cardHtml += `
                    <img src="${imgSrc}" onerror="this.src='${fallback}'" class="podium-photo">
                    <div class="podium-name">${c.candidate_name}</div>
                    <span class="badge ${cls}" style="margin-bottom:0.5rem">${c.alliance}</span>
                    <div style="font-size:0.85rem; color:var(--text-muted);">${c.party}</div>
                    <div class="podium-stat">${formatNumber(c.votes)}</div>
                    <div class="podium-margin">${c.vote_share}% Share</div>
                `;
                if (isWinner && res.length > 1) {
                    cardHtml += `<div class="podium-margin" style="margin-top:0.5rem; color:#27ae60; font-weight:600;">Margin: ${formatNumber(c.margin)}</div>`;
                }
                cardHtml += `</div>`;
                podiumContainer.innerHTML += cardHtml;
            }
        });

        // Summary Cards
        let allianceVotes = { 'LDF': 0, 'UDF': 0, 'NDA': 0, 'Others': 0 };
        let totalVotes = 0;
        res.forEach(c => {
            let key = c.alliance;
            if (!['LDF', 'UDF', 'NDA'].includes(key)) key = 'Others';
            allianceVotes[key] += c.votes;
            totalVotes += c.votes;
        });

        const cardsContainer = document.getElementById('allianceSummaryCards');
        cardsContainer.innerHTML = '';
        ['LDF', 'UDF', 'NDA'].forEach(a => {
            const v = allianceVotes[a];
            const p = totalVotes > 0 ? ((v/totalVotes)*100).toFixed(1) : 0;
            const cls = getCls(a);
            cardsContainer.innerHTML += `
                <div class="summary-card ${cls}-card">
                    <div class="summary-title">${a} Total Votes</div>
                    <div class="summary-value">${formatNumber(v)}</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem;">
                        <span>Vote Share</span><span>${p}%</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill progress-fill-${cls}" style="width: ${p}%"></div></div>
                </div>
            `;
        });

        // Candidates Table
        const tbody = document.getElementById('candidatesTableBody');
        tbody.innerHTML = '';
        res.forEach((c, idx) => {
            const tr = document.createElement('tr');
            if (idx === 0) tr.className = 'winner-row';
            const cls = getCls(c.alliance);
            tr.innerHTML = `
                <td><strong>${idx+1}</strong></td>
                <td>
                    <div style="font-weight:600">${c.candidate_name}</div>
                    ${c.candidate_name_ml ? `<div class="malayalam-font" style="font-size:0.85rem; color:var(--text-muted)">${c.candidate_name_ml}</div>` : ''}
                </td>
                <td>${c.party}</td>
                <td><span class="badge ${cls}">${c.alliance}</span></td>
                <td style="text-align: right; font-weight:600;">${formatNumber(c.votes)}</td>
                <td style="text-align: right;">${c.vote_share}%</td>
            `;
            tbody.appendChild(tr);
        });

        // Charts
        renderCharts(res, hist);
    }

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#f8fafc', bodyColor: '#cbd5e1', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10 },
            legend: { labels: { color: '#94a3b8', font: { family: "'Outfit', sans-serif", size: 13 } } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } } }
        }
    };

    function renderCharts(res2026, hist) {
        if (assemblyTrendChartInst) assemblyTrendChartInst.destroy();
        if (trendChartInst) trendChartInst.destroy();
        if (asyChartInst) asyChartInst.destroy();
        if (genChartInst) genChartInst.destroy();

        let aV = { LDF:0, UDF:0, NDA:0 };
        res2026.forEach(c => {
            if(aV[c.alliance] !== undefined) aV[c.alliance] += c.votes;
        });

        const asyData = hist.filter(h => h.election === 'niyamasabha').sort((a, b) => a.year - b.year);
        // Add 2026 to Assembly Data
        if (res2026.length > 0) {
            asyData.push({ year: 2026, election: 'niyamasabha', ldf_votes: aV.LDF, udf_votes: aV.UDF, nda_votes: aV.NDA });
        }

        // 1. Assembly Trend Chart (Line)
        assemblyTrendChartInst = new Chart(document.getElementById('assemblyTrendChart'), {
            type: 'line',
            data: {
                labels: asyData.map(h => h.year.toString()),
                datasets: [
                    { label: 'LDF', data: asyData.map(h => h.ldf_votes), borderColor: colors.LDF, tension: 0.4, borderWidth: 3, pointRadius: 4 },
                    { label: 'UDF', data: asyData.map(h => h.udf_votes), borderColor: colors.UDF, tension: 0.4, borderWidth: 3, pointRadius: 4 },
                    { label: 'NDA', data: asyData.map(h => h.nda_votes), borderColor: colors.NDA, tension: 0.4, borderWidth: 3, pointRadius: 4 }
                ]
            },
            options: commonChartOptions
        });

        // 2. Assembly Elections History Chart (Bar, includes 2026)
        asyChartInst = new Chart(document.getElementById('assemblyChart'), {
            type: 'bar',
            data: {
                labels: asyData.map(h => h.year.toString()),
                datasets: [
                    { label: 'LDF', data: asyData.map(h => h.ldf_votes), backgroundColor: colors.LDF, borderRadius: 4 },
                    { label: 'UDF', data: asyData.map(h => h.udf_votes), backgroundColor: colors.UDF, borderRadius: 4 },
                    { label: 'NDA', data: asyData.map(h => h.nda_votes), backgroundColor: colors.NDA, borderRadius: 4 }
                ]
            },
            options: commonChartOptions
        });

        const genData = hist.filter(h => h.election === 'loksabha').sort((a, b) => a.year - b.year);
        genChartInst = new Chart(document.getElementById('generalChart'), {
            type: 'bar',
            data: {
                labels: genData.map(h => h.year.toString()),
                datasets: [
                    { label: 'LDF', data: genData.map(h => h.ldf_votes), backgroundColor: colors.LDF, borderRadius: 4 },
                    { label: 'UDF', data: genData.map(h => h.udf_votes), backgroundColor: colors.UDF, borderRadius: 4 },
                    { label: 'NDA', data: genData.map(h => h.nda_votes), backgroundColor: colors.NDA, borderRadius: 4 }
                ]
            },
            options: commonChartOptions
        });

        const allData = [...hist].sort((a, b) => a.year - b.year);
        // Add 2026 to Combined Trend
        if (res2026.length > 0) {
            allData.push({ year: 2026, election: 'niyamasabha', ldf_votes: aV.LDF, udf_votes: aV.UDF, nda_votes: aV.NDA });
        }
        
        trendChartInst = new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
                labels: allData.map(h => h.year.toString() + (h.election === 'loksabha' ? ' (LS)' : '')),
                datasets: [
                    { label: 'LDF', data: allData.map(h => h.ldf_votes), borderColor: colors.LDF, tension: 0.4, borderWidth: 3, pointRadius: 4 },
                    { label: 'UDF', data: allData.map(h => h.udf_votes), borderColor: colors.UDF, tension: 0.4, borderWidth: 3, pointRadius: 4 },
                    { label: 'NDA', data: allData.map(h => h.nda_votes), borderColor: colors.NDA, tension: 0.4, borderWidth: 3, pointRadius: 4 }
                ]
            },
            options: commonChartOptions
        });
    }

    // --- TAB 2: DISTRICT OVERVIEW ---
    const distOverviewSelect = document.getElementById('distOverviewSelect');
    klaResultsData.districts.sort().forEach(dist => {
        const opt = document.createElement('option');
        opt.value = dist; opt.textContent = dist;
        distOverviewSelect.appendChild(opt);
    });

    distOverviewSelect.addEventListener('change', (e) => {
        const dist = e.target.value;
        if (dist) {
            document.getElementById('distContent').style.display = 'block';
            document.getElementById('distEmptyState').style.display = 'none';
            renderDistrictOverview(dist);
        } else {
            document.getElementById('distContent').style.display = 'none';
            document.getElementById('distEmptyState').style.display = 'block';
        }
    });

    function renderTallyBar(elId, seats, total) {
        const el = document.getElementById(elId);
        el.innerHTML = '';
        ['LDF', 'UDF', 'NDA', 'Others'].forEach(a => {
            const count = seats[a];
            if (count > 0) {
                const w = (count / total) * 100;
                el.innerHTML += `<div class="tally-segment progress-fill-${getCls(a)}" style="width:${w}%" title="${a}: ${count} Seats">${count}</div>`;
            }
        });
    }

    function renderDistrictOverview(dist) {
        document.getElementById('distOverviewTitle').textContent = dist + ' District';
        const dData = stateSummary.districts[dist];
        
        renderTallyBar('distTallyBar', dData.seats, dData.totalSeats);
        
        const legend = document.getElementById('distTallyLegend');
        legend.innerHTML = '';
        ['LDF', 'UDF', 'NDA', 'Others'].forEach(a => {
            if(dData.seats[a] > 0) {
                legend.innerHTML += `<div style="display:flex; align-items:center; gap:0.5rem;"><span style="width:12px;height:12px;border-radius:50%;background:${colors[a]}"></span>${a}: <strong>${dData.seats[a]}</strong></div>`;
            }
        });

        const tbody = document.getElementById('distTableBody');
        tbody.innerHTML = '';
        dData.constituencies.sort((a,b)=>parseInt(a.id)-parseInt(b.id)).forEach(c => {
            const cls = getCls(c.alliance);
            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td style="font-weight:600;">${c.name}</td>
                    <td>${c.winnerName}</td>
                    <td>${c.party}</td>
                    <td><span class="badge ${cls}">${c.alliance}</span></td>
                    <td style="text-align: right; font-weight:600; color:#27ae60">${formatNumber(c.margin)}</td>
                </tr>
            `;
        });
    }

    // --- TAB 3: STATE SUMMARY ---
    function renderStateSummary() {
        renderTallyBar('stateTallyBar', stateSummary.seats, 140);

        const cardsContainer = document.getElementById('stateSummaryCards');
        cardsContainer.innerHTML = '';
        ['LDF', 'UDF', 'NDA'].forEach(a => {
            const seats = stateSummary.seats[a];
            const v = stateSummary.votes[a];
            const p = ((v / stateSummary.totalVotes) * 100).toFixed(1);
            const cls = getCls(a);
            cardsContainer.innerHTML += `
                <div class="summary-card ${cls}-card">
                    <div class="summary-title">${a} Performance</div>
                    <div class="summary-value" style="color:${colors[a]}">${seats} Seats</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem;">
                        <span style="color:var(--text-muted)">Total Votes: ${formatNumber(v)}</span>
                        <span style="font-weight:600;">${p}%</span>
                    </div>
                </div>
            `;
        });

        const sortedByMargin = [...stateSummary.allConstituencies].sort((a,b)=>b.margin - a.margin);
        const highMargin = sortedByMargin.slice(0, 5);
        const lowMargin = [...stateSummary.allConstituencies].sort((a,b)=>a.margin - b.margin).slice(0, 5);

        const fillTable = (bodyId, data) => {
            const tbody = document.getElementById(bodyId);
            tbody.innerHTML = '';
            data.forEach(c => {
                const cls = getCls(c.alliance);
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${c.name}</strong> <span style="font-size:0.8rem; color:var(--text-muted)">(${c.district})</span></td>
                        <td>${c.winnerName} <span class="badge ${cls}" style="font-size:0.65rem; padding:0.1rem 0.4rem; margin-left:0.5rem;">${c.alliance}</span></td>
                        <td style="text-align:right; font-weight:600; color:#27ae60">${formatNumber(c.margin)}</td>
                    </tr>
                `;
            });
        };
        fillTable('highMarginBody', highMargin);
        fillTable('lowMarginBody', lowMargin);

        const heatmap = document.getElementById('stateDistrictHeatmap');
        heatmap.innerHTML = '';
        Object.values(stateSummary.districts).sort((a,b)=>b.totalSeats - a.totalSeats).forEach(d => {
            heatmap.innerHTML += `
                <tr>
                    <td style="font-weight:600">${d.name}</td>
                    <td style="text-align:center;">${d.totalSeats}</td>
                    <td style="text-align:center; ${d.seats.LDF > d.seats.UDF && d.seats.LDF > d.seats.NDA ? 'background:rgba(239,68,68,0.1); color:#ef4444; font-weight:700;' : ''}">${d.seats.LDF}</td>
                    <td style="text-align:center; ${d.seats.UDF > d.seats.LDF && d.seats.UDF > d.seats.NDA ? 'background:rgba(59,130,246,0.1); color:#3b82f6; font-weight:700;' : ''}">${d.seats.UDF}</td>
                    <td style="text-align:center; ${d.seats.NDA > d.seats.LDF && d.seats.NDA > d.seats.UDF ? 'background:rgba(245,158,11,0.1); color:#f59e0b; font-weight:700;' : ''}">${d.seats.NDA}</td>
                    <td style="text-align:center;">${d.seats.Others}</td>
                </tr>
            `;
        });
    }

    // Render state summary on load
    renderStateSummary();
});
