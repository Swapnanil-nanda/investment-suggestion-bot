/* ============================================================
   DASHBOARD.JS — Dashboard + Portfolio Summary + Charts
   ============================================================ */

const Dashboard = (() => {
    let currentProfile = null;
    let currentStrategy = null;

    async function init() {
        const profile = await Auth.getRiskProfile();
        if (!profile) {
            App.navigate('risk');
            return;
        }

        currentProfile = profile;
        currentStrategy = Strategies.customizeStrategy(profile);

        renderStrategyOverview();
        renderStrategyInsights('insights-benefits-list', 'insights-risks-list');
        renderAllocationChart();
        renderAllocationList();
        Market.init();
        News.init(profile.sentiment.category);
    }

    function renderStrategyOverview() {
        const strategy = currentStrategy;
        const budget = currentProfile.budget;

        // Strategy name and description
        document.getElementById('strategy-name').textContent = strategy.name;
        document.getElementById('strategy-desc').textContent = strategy.desc;
        document.getElementById('strategy-badge').textContent = strategy.riskLabel;

        // Metrics
        document.getElementById('metric-budget').textContent = formatINR(budget);
        document.getElementById('metric-return').textContent = `${strategy.returnRange[0]}% - ${strategy.returnRange[1]}%`;

        // Projected 1-year value
        const avgReturn = (strategy.returnRange[0] + strategy.returnRange[1]) / 2 / 100;
        const projected1Y = Math.round(budget * (1 + avgReturn));
        document.getElementById('metric-projected').textContent = formatINR(projected1Y);

        // Welcome message
        const session = Auth.getSession();
        const headerP = document.querySelector('.header-left p');
        if (headerP && session) {
            headerP.textContent = `Welcome back, ${session.name}! Here's your personalized investment strategy`;
        }
    }

    function renderAllocationChart() {
        const canvas = document.getElementById('allocation-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const breakdown = Strategies.getAllocationBreakdown(currentProfile.budget, currentStrategy);

        // Clear canvas
        const size = 300;
        canvas.width = size * 2; // Retina
        canvas.height = size * 2;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(2, 2);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 110;
        const innerRadius = 55;

        let startAngle = -Math.PI / 2;

        breakdown.forEach(item => {
            const sliceAngle = (item.percent / 100) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            // Draw label
            const midAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius + 25;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;

            if (item.percent >= 8) {
                ctx.fillStyle = item.color;
                ctx.font = '600 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${item.name}: ${item.percent}%`, labelX, labelY);
            }

            startAngle = endAngle;
        });

        // Center text
        ctx.fillStyle = '#0F172A';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Portfolio', centerX, centerY - 8);
        ctx.font = '400 11px Inter, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('Allocation', centerX, centerY + 10);
    }

    function renderAllocationList() {
        const container = document.getElementById('allocation-list');
        if (!container) return;

        const breakdown = Strategies.getAllocationBreakdown(currentProfile.budget, currentStrategy);

        container.innerHTML = breakdown.map(item => `
            <div class="alloc-item">
                <span class="alloc-dot" style="background: ${item.color}"></span>
                <div class="alloc-info">
                    <div class="alloc-name">${item.name}</div>
                    <div class="alloc-percent">${item.percent}% allocation</div>
                </div>
                <div class="alloc-amount">${formatINR(item.amount)}</div>
            </div>
        `).join('');
    }

    async function initPortfolio() {
        const profile = await Auth.getRiskProfile();
        if (!profile) {
            App.navigate('risk');
            return;
        }

        currentProfile = profile;
        currentStrategy = Strategies.customizeStrategy(profile);

        renderPortfolioStats();
        renderPortfolioStrategy();
        renderStrategyInsights('portfolio-benefits-list', 'portfolio-risks-list');
        renderPortfolioPieChart();
        renderBreakdownList();
        renderGrowthChart();
        renderGrowthTimeline();
    }

    function renderPortfolioStats() {
        const budget = currentProfile.budget;
        const strategy = currentStrategy;
        const horizon = currentProfile.horizon;
        const projections = Strategies.calculateProjectedReturns(budget, strategy, horizon);

        // Basic stats
        document.getElementById('stat-initial').textContent = formatINR(budget);
        document.getElementById('stat-return').textContent = `${strategy.returnRange[0]}% - ${strategy.returnRange[1]}%`;

        // Potential Gain for 1 Year (range)
        const gain1Y = projections[1];
        document.getElementById('stat-gain').textContent = `${formatINR(gain1Y.gain_worst)} – ${formatINR(gain1Y.gain_best)}`;
        document.getElementById('stat-gain-sub').textContent = `Expected: ${formatINR(gain1Y.gain_expected)}`;

        // Time horizon
        const horizonMap = { short: 'Short', medium: 'Medium', long: 'Long' };
        const horizonSubMap = { short: '1-3 years', medium: '3-7 years', long: '7+ years' };
        const horizonYearsMap = { short: 3, medium: 7, long: 10 };
        document.getElementById('stat-horizon').textContent = horizonMap[horizon] || 'Medium';
        document.getElementById('stat-horizon-sub').textContent = horizonSubMap[horizon] || '3-7 years';

        // Projected value for the investment horizon (in ranges)
        const targetYears = horizonYearsMap[horizon] || 7;
        const projForHorizon = projections[targetYears];
        if (projForHorizon) {
            const label = document.getElementById('stat-projected-label');
            const value = document.getElementById('stat-projected-value');
            const sub = document.getElementById('stat-projected-sub');

            if (label) label.textContent = `Projected Value (${targetYears} Year${targetYears > 1 ? 's' : ''})`;
            if (value) value.textContent = `${formatINR(projForHorizon.worst)} – ${formatINR(projForHorizon.best)}`;
            if (sub) sub.textContent = `Expected: ${formatINR(projForHorizon.expected)}`;
        }
    }

    function renderPortfolioStrategy() {
        document.getElementById('portfolio-strategy-name').textContent = currentStrategy.name;
        document.getElementById('portfolio-strategy-desc').textContent = currentStrategy.desc;
        document.getElementById('portfolio-risk-badge').textContent = currentStrategy.riskLabel;
    }

    function renderPortfolioPieChart() {
        const canvas = document.getElementById('portfolio-pie-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const breakdown = Strategies.getAllocationBreakdown(currentProfile.budget, currentStrategy);

        const size = 320;
        canvas.width = size * 2;
        canvas.height = size * 2;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(2, 2);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 120;

        let startAngle = -Math.PI / 2;

        breakdown.forEach(item => {
            const sliceAngle = (item.percent / 100) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            // White separator
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + 0.02);
            ctx.closePath();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Labels
            const midAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius + 28;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;

            if (item.percent >= 8) {
                ctx.fillStyle = item.color;
                ctx.font = '600 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${item.name}: ${item.percent}%`, labelX, labelY);
            }

            startAngle = endAngle;
        });
    }

    function renderBreakdownList() {
        const container = document.getElementById('breakdown-list');
        if (!container) return;

        const breakdown = Strategies.getAllocationBreakdown(currentProfile.budget, currentStrategy);

        container.innerHTML = breakdown.map(item => `
            <div class="breakdown-item">
                <span class="breakdown-dot" style="background: ${item.color}"></span>
                <div class="breakdown-info">
                    <div class="breakdown-name">${item.name}</div>
                    <div class="breakdown-percent">${item.percent}%</div>
                    <div class="breakdown-bar">
                        <div class="breakdown-bar-fill" style="width: ${item.percent}%; background: ${item.color}"></div>
                    </div>
                </div>
                <div class="breakdown-amount">${formatINR(item.amount)}</div>
            </div>
        `).join('');

        document.getElementById('total-portfolio-value').textContent = formatINR(currentProfile.budget);
    }

    function renderGrowthChart() {
        const canvas = document.getElementById('growth-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const horizon = currentProfile.horizon;
        const projections = Strategies.calculateProjectedReturns(currentProfile.budget, currentStrategy, horizon);

        const width = 800;
        const height = 300;
        canvas.width = width * 2;
        canvas.height = height * 2;
        canvas.style.width = '100%';
        canvas.style.height = height + 'px';
        ctx.scale(2, 2);

        const padding = { top: 30, right: 60, bottom: 40, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Build data points from projections
        const projYears = Object.keys(projections).map(Number).sort((a, b) => a - b);
        const years = [0, ...projYears];
        const expectedValues = [currentProfile.budget, ...projYears.map(y => projections[y].expected)];
        const bestValues = [currentProfile.budget, ...projYears.map(y => projections[y].best)];
        const worstValues = [currentProfile.budget, ...projYears.map(y => projections[y].worst)];

        const maxYear = Math.max(...years);
        const maxVal = Math.max(...bestValues) * 1.1;
        const minVal = 0;

        function xPos(year) {
            return padding.left + (year / maxYear) * chartWidth;
        }
        function yPos(val) {
            return padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
        }

        // Grid lines
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const val = maxVal - (i / 5) * (maxVal - minVal);
            ctx.fillStyle = '#94A3B8';
            ctx.font = '400 10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(formatINR(val), padding.left - 10, y + 4);
        }

        // X-axis labels
        years.forEach(year => {
            ctx.fillStyle = '#94A3B8';
            ctx.font = '500 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${year}Y`, xPos(year), height - padding.bottom + 25);
        });

        // Worst case area (light red fill)
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(worstValues[0]));
        worstValues.forEach((val, i) => ctx.lineTo(xPos(years[i]), yPos(val)));
        expectedValues.slice().reverse().forEach((val, i) => {
            ctx.lineTo(xPos(years[years.length - 1 - i]), yPos(val));
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.fill();

        // Best case area (light green fill)
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(bestValues[0]));
        bestValues.forEach((val, i) => ctx.lineTo(xPos(years[i]), yPos(val)));
        expectedValues.slice().reverse().forEach((val, i) => {
            ctx.lineTo(xPos(years[years.length - 1 - i]), yPos(val));
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.fill();

        // Worst case line (dashed red)
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(worstValues[0]));
        worstValues.forEach((val, i) => ctx.lineTo(xPos(years[i]), yPos(val)));
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Best case line
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(bestValues[0]));
        bestValues.forEach((val, i) => ctx.lineTo(xPos(years[i]), yPos(val)));
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Expected line
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(expectedValues[0]));
        expectedValues.forEach((val, i) => ctx.lineTo(xPos(years[i]), yPos(val)));
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Data points on expected line
        expectedValues.forEach((val, i) => {
            ctx.beginPath();
            ctx.arc(xPos(years[i]), yPos(val), 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#22C55E';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Value labels
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        expectedValues.forEach((val, i) => {
            if (i > 0) {
                ctx.fillText(formatINR(val), xPos(years[i]), yPos(val) - 14);
            }
        });
    }

    function renderGrowthTimeline() {
        const container = document.getElementById('growth-timeline');
        if (!container) return;

        const horizon = currentProfile.horizon;
        const projections = Strategies.calculateProjectedReturns(currentProfile.budget, currentStrategy, horizon);
        const projYears = Object.keys(projections).map(Number).sort((a, b) => a - b);

        container.innerHTML = projYears.map(year => `
            <div class="timeline-item">
                <div class="timeline-label">${year} Year${year > 1 ? 's' : ''}</div>
                <div class="timeline-value">${formatINR(projections[year].expected)}</div>
                <div class="timeline-range">${formatINR(projections[year].worst)} – ${formatINR(projections[year].best)}</div>
            </div>
        `).join('');
    }

    function initListeners() {
        // Logout
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        // Profile
        const profileBtn = document.getElementById('btn-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => App.navigate('profile'));
        }

        // Preferences (go back to risk assessment)
        const prefBtn = document.getElementById('btn-preferences');
        if (prefBtn) {
            prefBtn.addEventListener('click', () => App.navigate('risk'));
        }

        // View portfolio
        const portfolioBtn = document.getElementById('btn-view-portfolio');
        if (portfolioBtn) {
            portfolioBtn.addEventListener('click', () => App.navigate('portfolio'));
        }

        // Back to dashboard
        const backBtn = document.getElementById('btn-back-dashboard');
        if (backBtn) {
            backBtn.addEventListener('click', () => App.navigate('dashboard'));
        }

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
                const tabContent = document.getElementById(`tab-${tab}`);
                if (tabContent) tabContent.style.display = 'block';
            });
        });
    }

    function renderStrategyInsights(benefitsListId, risksListId) {
        const benefitsList = document.getElementById(benefitsListId);
        const risksList = document.getElementById(risksListId);
        if (!benefitsList || !risksList || !currentStrategy) return;

        const benefits = currentStrategy.benefits || [];
        const risks = currentStrategy.risks || [];

        benefitsList.innerHTML = benefits.map(b => `
            <li class="insight-item insight-item--benefit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${b}</span>
            </li>
        `).join('');

        risksList.innerHTML = risks.map(r => `
            <li class="insight-item insight-item--risk">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>${r}</span>
            </li>
        `).join('');
    }

    return { init, initPortfolio, initListeners };
})();
