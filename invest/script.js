// Money Moves — Game Script
// Pure vanilla JS, no modules, global scope

// =========================================================================
// STATE
// =========================================================================
var playerName = 'You';
var playerAge  = 18;
var currentScenario = null;
var exploredScenarios = {};  // { invest: {...results}, car: {...}, credit: {...}, home: {...} }

// =========================================================================
// DOM REFERENCES
// =========================================================================
var hubScreen      = document.getElementById('hub-screen');
var scenarioScreen = document.getElementById('scenario-screen');
var summaryScreen  = document.getElementById('summary-screen');

var playerNameInput = document.getElementById('player-name');
var playerAgeInput  = document.getElementById('player-age');

var scenarioTitleEl    = document.getElementById('scenario-title');
var scenarioSubtitleEl = document.getElementById('scenario-subtitle');
var scenarioControls   = document.getElementById('scenario-controls');
var chartWrapper       = document.getElementById('chart-wrapper');
var mainChart          = document.getElementById('main-chart');
var chartTooltipEl     = document.getElementById('chart-tooltip');
var scenarioStats      = document.getElementById('scenario-stats');
var comparisonCards    = document.getElementById('comparison-cards');
var scenarioInsight    = document.getElementById('scenario-insight');
var insightText        = document.getElementById('insight-text');
var buffettBlock       = document.getElementById('buffett-block');
var buffettQuoteText   = document.getElementById('buffett-quote-text');
var buffettQuoteCtx    = document.getElementById('buffett-quote-ctx');

var markCompleteBtn  = document.getElementById('mark-complete-btn');
var viewSummaryBtn   = document.getElementById('view-summary-btn');
var backToHubBtn     = document.getElementById('back-to-hub');
var backFromSummary  = document.getElementById('back-from-summary');
var summaryContent   = document.getElementById('summary-content');

// =========================================================================
// NAVIGATION
// =========================================================================
function showScreen(name) {
    hubScreen.classList.add('hidden');
    scenarioScreen.classList.add('hidden');
    summaryScreen.classList.add('hidden');
    if (name === 'hub')      hubScreen.classList.remove('hidden');
    if (name === 'scenario') scenarioScreen.classList.remove('hidden');
    if (name === 'summary')  summaryScreen.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function getPlayerName() {
    var n = playerNameInput.value.trim();
    return n.length > 0 ? n : 'You';
}

function getPlayerAge() {
    var a = parseInt(playerAgeInput.value, 10);
    if (isNaN(a) || a < 15) return 15;
    if (a > 50) return 50;
    return a;
}

// =========================================================================
// FORMATTERS
// =========================================================================
function fmtDollar(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
    return '$' + Math.round(n);
}

function fmtDollarFull(n) {
    return '$' + Math.round(n).toLocaleString();
}

function fmtMonths(m) {
    if (m >= 12) {
        var yr = Math.floor(m / 12);
        var mo = m % 12;
        return mo > 0 ? yr + 'y ' + mo + 'm' : yr + (yr === 1 ? ' year' : ' years');
    }
    return m + (m === 1 ? ' month' : ' months');
}

// =========================================================================
// FINANCIAL CALCULATORS
// =========================================================================

// Monthly compounding DCA from startAge to endAge at fixed annual return
function calcDCA(monthlyContrib, startAge, endAge, annualReturn) {
    var months = Math.max(0, (endAge - startAge) * 12);
    var monthlyRate = annualReturn / 12;
    var portfolio = 0;
    var series = [{ age: startAge, value: 0 }];
    for (var m = 1; m <= months; m++) {
        portfolio = (portfolio + monthlyContrib) * (1 + monthlyRate);
        if (m % 12 === 0) {
            series.push({ age: startAge + m / 12, value: portfolio });
        }
    }
    return { final: portfolio, series: series };
}

// Historical DCA: uses SP500_RETURNS starting from a given calendar year
// Loops the historical data if needed to cover the full period
function calcDCAHistorical(monthlyContrib, startAge, startYear, endAge) {
    var years = Math.max(0, endAge - startAge);
    var portfolio = 0;
    var series = [{ age: startAge, value: 0 }];
    for (var i = 0; i < years; i++) {
        var yearIdx = (startYear + i - SP500_RETURNS[0].year) % SP500_RETURNS.length;
        if (yearIdx < 0) yearIdx += SP500_RETURNS.length;
        var annualReturn = SP500_RETURNS[yearIdx].return;
        var monthlyRate = annualReturn / 12;
        for (var m = 0; m < 12; m++) {
            portfolio = (portfolio + monthlyContrib) * (1 + monthlyRate);
        }
        series.push({ age: startAge + i + 1, value: portfolio });
    }
    return { final: portfolio, series: series };
}

// Loan amortization: returns monthly payment, total paid, total interest, amortization schedule
function calcLoan(principal, annualRate, years) {
    var n = years * 12;
    var r = annualRate / 12;
    var monthlyPayment;
    if (r === 0) {
        monthlyPayment = principal / n;
    } else {
        monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    var totalPaid = monthlyPayment * n;
    var totalInterest = totalPaid - principal;
    return {
        monthlyPayment: monthlyPayment,
        totalPaid:      totalPaid,
        totalInterest:  totalInterest,
    };
}

// Credit card payoff: returns series [{month, balance, interestPaid}] and totals
function calcCreditCardPayoff(balance, annualAPR, monthlyPayment) {
    var monthlyRate = annualAPR / 12;
    var month = 0;
    var totalInterest = 0;
    var series = [{ month: 0, balance: balance }];
    var maxMonths = 600; // cap at 50 years
    var b = balance;
    while (b > 0 && month < maxMonths) {
        var interest = b * monthlyRate;
        totalInterest += interest;
        b = b + interest - monthlyPayment;
        if (b < 0) b = 0;
        month++;
        series.push({ month: month, balance: b });
    }
    return {
        months:        month,
        totalInterest: totalInterest,
        totalPaid:     balance + totalInterest,
        series:        series,
        neverPaidOff:  (month >= maxMonths && b > 0),
    };
}

// Minimum credit card payment (2% of balance or $25, whichever is more)
function calcMinPayment(balance) {
    return Math.max(balance * 0.02, 25);
}

// What monthly savings invested at SP500 avg become over N years
function calcOpportunityCost(monthly, years) {
    return calcDCA(monthly, 0, years, RATES.sp500Avg).final;
}

// =========================================================================
// SVG LINE CHART
// =========================================================================

var CHART_PAD = { top: 20, right: 24, bottom: 36, left: 60 };
var CHART_W = 720;
var CHART_H = 280;
var CHART_INNER_W = CHART_W - CHART_PAD.left - CHART_PAD.right;
var CHART_INNER_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

// datasets: [{label, color, data: [{x, y}]}]
// options: { xLabel, yLabel, xFmt, yFmt }
function buildLineChart(svgEl, datasets, options) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    var allX = [], allY = [];
    datasets.forEach(function(ds) {
        ds.data.forEach(function(p) { allX.push(p.x); allY.push(p.y); });
    });

    var xMin = Math.min.apply(null, allX);
    var xMax = Math.max.apply(null, allX);
    var yMin = 0;
    var yMax = Math.max.apply(null, allY) * 1.08;

    var xFmt = options.xFmt || function(v) { return v; };
    var yFmt = options.yFmt || function(v) { return fmtDollar(v); };

    function scaleX(x) { return CHART_PAD.left + ((x - xMin) / (xMax - xMin || 1)) * CHART_INNER_W; }
    function scaleY(y) { return CHART_PAD.top + CHART_INNER_H - ((y - yMin) / (yMax - yMin || 1)) * CHART_INNER_H; }

    var ns = 'http://www.w3.org/2000/svg';
    function el(tag, attrs) {
        var e = document.createElementNS(ns, tag);
        Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
        return e;
    }
    function text(str, attrs) {
        var t = document.createElementNS(ns, 'text');
        Object.keys(attrs).forEach(function(k) { t.setAttribute(k, attrs[k]); });
        t.textContent = str;
        return t;
    }

    // Background
    svgEl.appendChild(el('rect', { x: 0, y: 0, width: CHART_W, height: CHART_H, fill: '#ffffff' }));

    // Y grid lines + labels
    var yTicks = 5;
    for (var i = 0; i <= yTicks; i++) {
        var yVal = yMin + (yMax - yMin) * (i / yTicks);
        var yPx  = scaleY(yVal);
        svgEl.appendChild(el('line', { x1: CHART_PAD.left, y1: yPx, x2: CHART_PAD.left + CHART_INNER_W, y2: yPx, class: 'chart-grid' }));
        svgEl.appendChild(text(yFmt(yVal), { x: CHART_PAD.left - 6, y: yPx + 3, 'text-anchor': 'end', class: 'chart-axis-label' }));
    }

    // X grid lines + labels
    var xRange = xMax - xMin;
    var xStep = xRange <= 20 ? 5 : xRange <= 50 ? 10 : 10;
    for (var xv = Math.ceil(xMin / xStep) * xStep; xv <= xMax; xv += xStep) {
        var xPx = scaleX(xv);
        svgEl.appendChild(el('line', { x1: xPx, y1: CHART_PAD.top, x2: xPx, y2: CHART_PAD.top + CHART_INNER_H, class: 'chart-grid' }));
        svgEl.appendChild(text(xFmt(xv), { x: xPx, y: CHART_PAD.top + CHART_INNER_H + 14, 'text-anchor': 'middle', class: 'chart-axis-label' }));
    }

    // Axis lines
    svgEl.appendChild(el('line', { x1: CHART_PAD.left, y1: CHART_PAD.top, x2: CHART_PAD.left, y2: CHART_PAD.top + CHART_INNER_H, class: 'chart-axis' }));
    svgEl.appendChild(el('line', { x1: CHART_PAD.left, y1: CHART_PAD.top + CHART_INNER_H, x2: CHART_PAD.left + CHART_INNER_W, y2: CHART_PAD.top + CHART_INNER_H, class: 'chart-axis' }));

    // Axis titles
    if (options.yLabel) {
        var yLbl = text(options.yLabel, { x: 12, y: CHART_PAD.top + CHART_INNER_H / 2, 'text-anchor': 'middle', transform: 'rotate(-90, 12, ' + (CHART_PAD.top + CHART_INNER_H / 2) + ')', class: 'chart-axis-title' });
        svgEl.appendChild(yLbl);
    }
    if (options.xLabel) {
        svgEl.appendChild(text(options.xLabel, { x: CHART_PAD.left + CHART_INNER_W / 2, y: CHART_H - 4, 'text-anchor': 'middle', class: 'chart-axis-title' }));
    }

    // Dataset lines + areas
    datasets.forEach(function(ds) {
        var pts = ds.data;
        if (pts.length < 2) return;

        // Area fill
        var areaPath = 'M ' + scaleX(pts[0].x) + ' ' + scaleY(0);
        pts.forEach(function(p) { areaPath += ' L ' + scaleX(p.x) + ' ' + scaleY(p.y); });
        areaPath += ' L ' + scaleX(pts[pts.length - 1].x) + ' ' + scaleY(0) + ' Z';
        svgEl.appendChild(el('path', { d: areaPath, fill: ds.color, opacity: '0.08', 'stroke-width': '0' }));

        // Line
        var linePath = pts.map(function(p, idx) {
            return (idx === 0 ? 'M' : 'L') + ' ' + scaleX(p.x) + ' ' + scaleY(p.y);
        }).join(' ');
        svgEl.appendChild(el('path', { d: linePath, stroke: ds.color, 'stroke-width': '2.5', fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    });

    // Legend
    var legendX = CHART_PAD.left + 8;
    datasets.forEach(function(ds, i) {
        var lx = legendX + i * 140;
        svgEl.appendChild(el('rect', { x: lx, y: CHART_PAD.top + 6, width: 16, height: 3, fill: ds.color, rx: 1 }));
        svgEl.appendChild(text(ds.label, { x: lx + 22, y: CHART_PAD.top + 11, class: 'chart-legend-label', fill: '#475569' }));
    });

    // Scrubber overlay
    var scrubLine = el('line', { x1: 0, y1: CHART_PAD.top, x2: 0, y2: CHART_PAD.top + CHART_INNER_H, class: 'chart-scrubber', visibility: 'hidden' });
    svgEl.appendChild(scrubLine);

    var dots = datasets.map(function(ds) {
        var d = el('circle', { r: '4', fill: ds.color, stroke: '#fff', 'stroke-width': '1.5', visibility: 'hidden' });
        svgEl.appendChild(d);
        return d;
    });

    var overlay = el('rect', {
        x: CHART_PAD.left, y: CHART_PAD.top,
        width: CHART_INNER_W, height: CHART_INNER_H,
        fill: 'transparent', class: 'chart-overlay',
    });

    overlay.addEventListener('mousemove', function(e) {
        var rect = svgEl.getBoundingClientRect();
        var svgX = (e.clientX - rect.left) / rect.width * CHART_W;
        var svgY = (e.clientY - rect.top)  / rect.height * CHART_H;
        var xRatio = (svgX - CHART_PAD.left) / CHART_INNER_W;
        var xVal = xMin + xRatio * (xMax - xMin);
        xVal = Math.max(xMin, Math.min(xMax, xVal));

        scrubLine.setAttribute('x1', scaleX(xVal));
        scrubLine.setAttribute('x2', scaleX(xVal));
        scrubLine.setAttribute('visibility', 'visible');

        var tipLines = [xFmt(Math.round(xVal))];
        datasets.forEach(function(ds, i) {
            // Find closest point
            var closest = ds.data.reduce(function(a, b) {
                return Math.abs(b.x - xVal) < Math.abs(a.x - xVal) ? b : a;
            });
            dots[i].setAttribute('cx', scaleX(closest.x));
            dots[i].setAttribute('cy', scaleY(closest.y));
            dots[i].setAttribute('visibility', 'visible');
            tipLines.push(ds.label + ': ' + yFmt(closest.y));
        });

        chartTooltipEl.innerHTML = tipLines.join('<br>');
        chartTooltipEl.classList.remove('hidden');

        // Position tooltip
        var tipW = 160;
        var tipLeft = e.clientX - rect.left + 12;
        if (tipLeft + tipW > rect.width) tipLeft = e.clientX - rect.left - tipW - 12;
        chartTooltipEl.style.left = tipLeft + 'px';
        chartTooltipEl.style.top  = (e.clientY - rect.top - 20) + 'px';
    });

    overlay.addEventListener('mouseleave', function() {
        scrubLine.setAttribute('visibility', 'hidden');
        dots.forEach(function(d) { d.setAttribute('visibility', 'hidden'); });
        chartTooltipEl.classList.add('hidden');
    });

    svgEl.appendChild(overlay);
}

// =========================================================================
// SCENARIO RENDERERS
// =========================================================================

// ----- INVEST -----
var investState = {
    monthly:    DEFAULTS.monthlyContrib,
    mode:       'avg',      // 'avg' | 'historical'
    startYear:  1990,
};

function loadScenarioInvest() {
    playerName = getPlayerName();
    playerAge  = getPlayerAge();

    scenarioTitleEl.textContent    = '📈 Investing & Compound Interest';
    scenarioSubtitleEl.textContent = 'How a small, consistent investment compounds into real wealth';

    // Controls
    scenarioControls.innerHTML = [
        '<div class="control-group">',
        '  <div class="control-label">Monthly Contribution</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="inv-contrib-display">$100</span>',
        '    <span class="slider-unit">per month</span>',
        '  </div>',
        '  <input type="range" id="inv-contrib" min="25" max="1000" step="25" value="' + investState.monthly + '">',
        '</div>',
        '<div class="control-group">',
        '  <div class="control-label">Simulation Mode</div>',
        '  <div class="mode-toggle">',
        '    <button class="mode-btn' + (investState.mode === 'avg' ? ' active' : '') + '" id="inv-mode-avg">Average (10.5%)</button>',
        '    <button class="mode-btn' + (investState.mode === 'historical' ? ' active' : '') + '" id="inv-mode-hist">Historical S&P</button>',
        '  </div>',
        '  <p class="control-note">Historical mode uses real S&P 500 annual returns from 1990–2024.</p>',
        '</div>',
        '<div class="control-group" id="inv-year-group"' + (investState.mode !== 'historical' ? ' style="display:none"' : '') + '>',
        '  <div class="control-label">Start Year</div>',
        '  <select id="inv-start-year">',
        SP500_RETURNS.map(function(r) {
            return '<option value="' + r.year + '"' + (r.year === investState.startYear ? ' selected' : '') + '>' + r.year + '</option>';
        }).join(''),
        '  </select>',
        '</div>',
        '<div class="compare-info">',
        '  <strong>' + playerName + '</strong> starts at age ' + playerAge + '<br>',
        '  <strong>Jordan</strong> starts at age ' + DEFAULTS.jordanInvestAge,
        '</div>',
    ].join('\n');

    document.getElementById('inv-contrib').addEventListener('input', function() {
        investState.monthly = parseInt(this.value, 10);
        document.getElementById('inv-contrib-display').textContent = '$' + investState.monthly;
        renderInvest();
    });
    document.getElementById('inv-mode-avg').addEventListener('click', function() {
        investState.mode = 'avg';
        document.getElementById('inv-mode-avg').classList.add('active');
        document.getElementById('inv-mode-hist').classList.remove('active');
        document.getElementById('inv-year-group').style.display = 'none';
        renderInvest();
    });
    document.getElementById('inv-mode-hist').addEventListener('click', function() {
        investState.mode = 'historical';
        document.getElementById('inv-mode-avg').classList.remove('active');
        document.getElementById('inv-mode-hist').classList.add('active');
        document.getElementById('inv-year-group').style.display = '';
        renderInvest();
    });
    document.getElementById('inv-start-year').addEventListener('change', function() {
        investState.startYear = parseInt(this.value, 10);
        renderInvest();
    });

    chartWrapper.classList.remove('hidden');
    renderInvest();
}

function renderInvest() {
    var monthly   = investState.monthly;
    var retireAge = DEFAULTS.retireAge;
    var jordan    = DEFAULTS.jordanInvestAge;

    var playerResult, jordanResult;
    if (investState.mode === 'avg') {
        playerResult = calcDCA(monthly, playerAge, retireAge, RATES.sp500Avg);
        jordanResult = calcDCA(monthly, jordan,    retireAge, RATES.sp500Avg);
    } else {
        playerResult = calcDCAHistorical(monthly, playerAge, investState.startYear, retireAge);
        jordanResult = calcDCAHistorical(monthly, jordan,    investState.startYear, retireAge);
    }

    var greenColor = '#16a34a';
    var grayColor  = '#94a3b8';

    buildLineChart(mainChart, [
        { label: playerName + ' (age ' + playerAge + ')', color: greenColor, data: playerResult.series.map(function(p) { return { x: p.age, y: p.value }; }) },
        { label: 'Jordan (age ' + jordan + ')',           color: grayColor,  data: jordanResult.series.map(function(p) { return { x: p.age, y: p.value }; }) },
    ], {
        xLabel: 'Age',
        yLabel: 'Portfolio Value',
        xFmt: function(v) { return 'Age ' + v; },
        yFmt: fmtDollar,
    });

    // Comparison cards at milestones
    var milestones = [30, 40, 50, retireAge];
    var cardsHtml = '<div class="comparison-cards">';

    milestones.forEach(function(age) {
        if (age <= playerAge && age < retireAge) return;
        var pVal = interpolateSeries(playerResult.series, age, 'age', 'value');
        var jVal = interpolateSeries(jordanResult.series, age, 'age', 'value');
        if (pVal === null && jVal === null) return;
        pVal = pVal || 0;
        jVal = jVal || 0;
        var diff = pVal - jVal;
        cardsHtml += '<div class="comparison-grid">';
        cardsHtml += '<div class="cmp-card cmp-player' + (pVal >= jVal ? ' cmp-winner' : ' cmp-loser') + '">';
        cardsHtml += '<div class="cmp-label">' + playerName + '</div>';
        cardsHtml += '<div class="cmp-value ' + (pVal >= jVal ? 'green' : 'red') + '">' + fmtDollar(pVal) + '</div>';
        cardsHtml += '</div>';
        cardsHtml += '<div style="text-align:center">';
        cardsHtml += '<div class="vs-badge">vs</div>';
        cardsHtml += '<div style="font-size:0.8rem;font-weight:700;margin-top:4px">Age ' + age + '</div>';
        cardsHtml += '</div>';
        cardsHtml += '<div class="cmp-card cmp-jordan' + (jVal > pVal ? ' cmp-winner' : ' cmp-loser') + '">';
        cardsHtml += '<div class="cmp-label">Jordan</div>';
        cardsHtml += '<div class="cmp-value ' + (jVal > pVal ? 'green' : 'gray') + '">' + fmtDollar(jVal) + '</div>';
        cardsHtml += '</div>';
        cardsHtml += '</div>';
        if (diff > 0) {
            cardsHtml += '<div class="advantage-banner">' + playerName + ' has <strong>' + fmtDollar(diff) + ' more</strong> by age ' + age + '</div>';
        }
    });
    cardsHtml += '</div>';
    comparisonCards.innerHTML = cardsHtml;

    // Insight
    var finalDiff = playerResult.final - jordanResult.final;
    var years = retireAge - playerAge;
    var totalContrib = monthly * 12 * years;
    insightText.innerHTML = [
        'By investing <strong>' + fmtDollarFull(monthly) + '/month</strong> from age ' + playerAge + ',',
        playerName + ' accumulates <strong>' + fmtDollarFull(playerResult.final) + '</strong> by age ' + retireAge + '.',
        'Jordan, starting at 40, ends up with <strong>' + fmtDollarFull(jordanResult.final) + '</strong> — a difference of <strong class="text-green">' + fmtDollarFull(Math.abs(finalDiff)) + '</strong>.',
        'Your total contributions: <strong>' + fmtDollarFull(totalContrib) + '</strong>. The rest is compound growth.',
    ].join(' ');

    var quote = BUFFETT_QUOTES[0];
    buffettQuoteText.textContent = quote.text;
    buffettQuoteCtx.textContent  = quote.context;
    buffettBlock.classList.remove('hidden');
    scenarioInsight.classList.remove('hidden');
    scenarioStats.innerHTML = '';

    exploredScenarios['invest'] = {
        playerFinal: playerResult.final,
        jordanFinal: jordanResult.final,
        monthly: monthly,
        playerAge: playerAge,
    };
    updateCardStatuses();
}

// ----- CAR -----
var carState = {
    price:     DEFAULTS.carPrice,
    down:      DEFAULTS.carDown,
    years:     DEFAULTS.carLoanYears,
};

function loadScenarioCar() {
    playerName = getPlayerName();
    playerAge  = getPlayerAge();

    scenarioTitleEl.textContent    = '🚗 Buying a Car';
    scenarioSubtitleEl.textContent = 'The true cost of financing a new car — and what you're giving up';

    scenarioControls.innerHTML = [
        '<div class="control-group">',
        '  <div class="control-label">Car Price</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="car-price-display">$30,000</span>',
        '  </div>',
        '  <input type="range" id="car-price" min="10000" max="60000" step="1000" value="' + carState.price + '">',
        '</div>',
        '<div class="control-group">',
        '  <div class="control-label">Down Payment</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="car-down-display">$5,000</span>',
        '  </div>',
        '  <input type="range" id="car-down" min="0" max="20000" step="500" value="' + carState.down + '">',
        '</div>',
        '<div class="control-group">',
        '  <div class="control-label">Loan Term</div>',
        '  <select id="car-years">',
        [3,4,5,6,7].map(function(y) {
            return '<option value="' + y + '"' + (y === carState.years ? ' selected' : '') + '>' + y + ' years</option>';
        }).join(''),
        '  </select>',
        '</div>',
        '<div class="compare-info">',
        '  Rate: <strong>7.0% APR</strong> (avg. 2024 new car loan)<br>',
        '  Opportunity cost calculated at <strong>10.5% avg. S&P 500</strong>',
        '</div>',
    ].join('\n');

    document.getElementById('car-price').addEventListener('input', function() {
        carState.price = parseInt(this.value, 10);
        document.getElementById('car-price-display').textContent = fmtDollarFull(carState.price);
        renderCar();
    });
    document.getElementById('car-down').addEventListener('input', function() {
        carState.down = parseInt(this.value, 10);
        document.getElementById('car-down-display').textContent = fmtDollarFull(carState.down);
        renderCar();
    });
    document.getElementById('car-years').addEventListener('change', function() {
        carState.years = parseInt(this.value, 10);
        renderCar();
    });

    chartWrapper.classList.add('hidden');
    renderCar();
}

function renderCar() {
    var principal = Math.max(100, carState.price - carState.down);
    var loan = calcLoan(principal, RATES.carLoan, carState.years);
    var oppCost = calcOpportunityCost(loan.monthlyPayment, carState.years);
    var oppCostTo65 = calcDCA(loan.monthlyPayment, playerAge + carState.years, DEFAULTS.retireAge, RATES.sp500Avg).final;

    var pctInterest = (loan.totalInterest / loan.totalPaid) * 100;

    scenarioStats.innerHTML = [
        '<div class="stats-dual">',
        '<div class="stats-block">',
        '  <h3>Loan Details</h3>',
        '  <div class="stat-row"><span class="stat-label">Loan Amount</span><span class="stat-value">' + fmtDollarFull(principal) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Monthly Payment</span><span class="stat-value red">' + fmtDollarFull(loan.monthlyPayment) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Interest</span><span class="stat-value red">' + fmtDollarFull(loan.totalInterest) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Cost of Car</span><span class="stat-value">' + fmtDollarFull(carState.down + loan.totalPaid) + '</span></div>',
        '  <div class="interest-bar-wrap">',
        '    <div class="interest-bar-label"><span>How your payments break down</span></div>',
        '    <div class="interest-bar">',
        '      <div class="bar-principal" style="width:' + (100 - pctInterest).toFixed(1) + '%"></div>',
        '      <div class="bar-interest"  style="width:' + pctInterest.toFixed(1) + '%"></div>',
        '    </div>',
        '    <div class="bar-legend">',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#16a34a"></div> Principal</div>',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#dc2626"></div> Interest (' + pctInterest.toFixed(0) + '%)</div>',
        '    </div>',
        '  </div>',
        '</div>',
        '<div class="stats-block">',
        '  <h3>Opportunity Cost</h3>',
        '  <div class="stat-row"><span class="stat-label">If invested over loan term</span><span class="stat-value green">' + fmtDollarFull(oppCost) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">If invested until age ' + DEFAULTS.retireAge + '</span><span class="stat-value green">' + fmtDollarFull(oppCost + oppCostTo65) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total "real" cost of car</span><span class="stat-value red">' + fmtDollarFull(carState.down + loan.totalPaid + oppCost) + '</span></div>',
        '  <p class="control-note" style="margin-top:12px">The opportunity cost is what your monthly car payment <em>could have grown to</em> if invested in an S&P 500 index fund instead.</p>',
        '</div>',
        '</div>',
    ].join('\n');

    comparisonCards.innerHTML = '';
    insightText.innerHTML = [
        'You borrow <strong>' + fmtDollarFull(principal) + '</strong> at 7% APR for ' + carState.years + ' years.',
        'Your monthly payment is <strong class="text-red">' + fmtDollarFull(loan.monthlyPayment) + '</strong>,',
        'and you pay <strong class="text-red">' + fmtDollarFull(loan.totalInterest) + '</strong> in interest.',
        'But the real cost is the <strong class="text-green">' + fmtDollarFull(oppCost) + '</strong> that money <em>could have become</em>',
        'if invested at average S&P 500 returns over the same ' + carState.years + ' years.',
    ].join(' ');
    buffettBlock.classList.add('hidden');
    scenarioInsight.classList.remove('hidden');

    exploredScenarios['car'] = {
        price:          carState.price,
        monthlyPayment: loan.monthlyPayment,
        totalInterest:  loan.totalInterest,
        oppCost:        oppCost,
    };
    updateCardStatuses();
}

// ----- CREDIT -----
var creditState = {
    balance:  DEFAULTS.creditBalance,
    payment:  150,
};

function loadScenarioCredit() {
    playerName = getPlayerName();
    playerAge  = getPlayerAge();

    scenarioTitleEl.textContent    = '💳 Credit Card Debt';
    scenarioSubtitleEl.textContent = 'How 24% APR turns small balances into years of payments';

    var minPay = Math.round(calcMinPayment(DEFAULTS.creditBalance));

    scenarioControls.innerHTML = [
        '<div class="control-group">',
        '  <div class="control-label">Current Balance</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="cc-balance-display">$5,000</span>',
        '  </div>',
        '  <input type="range" id="cc-balance" min="500" max="10000" step="100" value="' + creditState.balance + '">',
        '</div>',
        '<div class="control-group">',
        '  <div class="control-label">Your Monthly Payment</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="cc-payment-display">$150</span>',
        '  </div>',
        '  <input type="range" id="cc-payment" min="25" max="500" step="25" value="' + creditState.payment + '">',
        '</div>',
        '<div class="compare-info">',
        '  Rate: <strong>24% APR</strong> (avg. 2024 credit card rate)<br>',
        '  <strong>Jordan</strong> makes minimum payments only (2% of balance or $25)',
        '</div>',
    ].join('\n');

    document.getElementById('cc-balance').addEventListener('input', function() {
        creditState.balance = parseInt(this.value, 10);
        document.getElementById('cc-balance-display').textContent = fmtDollarFull(creditState.balance);
        renderCredit();
    });
    document.getElementById('cc-payment').addEventListener('input', function() {
        creditState.payment = parseInt(this.value, 10);
        document.getElementById('cc-payment-display').textContent = fmtDollarFull(creditState.payment);
        renderCredit();
    });

    chartWrapper.classList.remove('hidden');
    renderCredit();
}

function renderCredit() {
    var balance = creditState.balance;
    var payment = creditState.payment;
    var minPay  = calcMinPayment(balance);

    // Ensure player payment > minimum interest to avoid infinite loop
    var monthlyInterestOnBalance = balance * (RATES.creditCard / 12);
    if (payment <= monthlyInterestOnBalance) {
        payment = Math.ceil(monthlyInterestOnBalance) + 1;
    }

    var playerResult = calcCreditCardPayoff(balance, RATES.creditCard, payment);
    var jordanResult = calcCreditCardPayoff(balance, RATES.creditCard, minPay);

    // Chart — remaining balance over months
    var maxMonths = Math.max(playerResult.months, Math.min(jordanResult.months, 360));
    var pSeries = playerResult.series.filter(function(p) { return p.month <= maxMonths; });
    var jSeries = jordanResult.series.filter(function(p) { return p.month <= maxMonths; });

    buildLineChart(mainChart, [
        { label: playerName + ' ($' + payment + '/mo)',  color: '#16a34a', data: pSeries.map(function(p) { return { x: p.month, y: p.balance }; }) },
        { label: 'Jordan (min payment)', color: '#94a3b8', data: jSeries.map(function(p) { return { x: p.month, y: p.balance }; }) },
    ], {
        xLabel: 'Months',
        yLabel: 'Remaining Balance',
        xFmt: function(v) { return fmtMonths(v); },
        yFmt: fmtDollarFull,
    });

    var jordanMsg = jordanResult.neverPaidOff
        ? 'Jordan <strong>never pays it off</strong> making minimum payments — the interest exceeds the payment!'
        : 'Jordan takes <strong>' + fmtMonths(jordanResult.months) + '</strong> to pay off, paying <strong class="text-red">' + fmtDollarFull(jordanResult.totalInterest) + '</strong> in interest.';

    scenarioStats.innerHTML = [
        '<div class="stats-dual">',
        '<div class="stats-block">',
        '  <h3>' + playerName + ' (' + fmtDollarFull(payment) + '/mo)</h3>',
        '  <div class="stat-row"><span class="stat-label">Payoff Time</span><span class="stat-value">' + fmtMonths(playerResult.months) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Interest Paid</span><span class="stat-value red">' + fmtDollarFull(playerResult.totalInterest) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Paid</span><span class="stat-value">' + fmtDollarFull(playerResult.totalPaid) + '</span></div>',
        '</div>',
        '<div class="stats-block">',
        '  <h3>Jordan (minimum payments)</h3>',
        '  <div class="stat-row"><span class="stat-label">Payoff Time</span><span class="stat-value red">' + (jordanResult.neverPaidOff ? '∞' : fmtMonths(jordanResult.months)) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Interest Paid</span><span class="stat-value red">' + fmtDollarFull(jordanResult.totalInterest) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Paid</span><span class="stat-value red">' + fmtDollarFull(jordanResult.totalPaid) + '</span></div>',
        '</div>',
        '</div>',
    ].join('\n');

    comparisonCards.innerHTML = '';
    insightText.innerHTML = [
        'With a <strong>' + fmtDollarFull(balance) + '</strong> balance at 24% APR,',
        'paying <strong>' + fmtDollarFull(payment) + '/month</strong> pays it off in',
        '<strong>' + fmtMonths(playerResult.months) + '</strong> with <strong class="text-red">' + fmtDollarFull(playerResult.totalInterest) + '</strong> in interest.',
        jordanMsg,
    ].join(' ');

    var quote = BUFFETT_QUOTES[1];
    buffettQuoteText.textContent = quote.text;
    buffettQuoteCtx.textContent  = quote.context;
    buffettBlock.classList.remove('hidden');
    scenarioInsight.classList.remove('hidden');

    exploredScenarios['credit'] = {
        balance:       balance,
        payment:       payment,
        months:        playerResult.months,
        totalInterest: playerResult.totalInterest,
    };
    updateCardStatuses();
}

// ----- HOME -----
var homeState = {
    price:    DEFAULTS.homePrice,
    downPct:  DEFAULTS.homeDownPct,
};

function loadScenarioHome() {
    playerName = getPlayerName();
    playerAge  = getPlayerAge();

    scenarioTitleEl.textContent    = '🏠 Home Loan Comparison';
    scenarioSubtitleEl.textContent = '15-year vs 30-year mortgage — see the real long-term cost';

    scenarioControls.innerHTML = [
        '<div class="control-group">',
        '  <div class="control-label">Home Price</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="home-price-display">$350,000</span>',
        '  </div>',
        '  <input type="range" id="home-price" min="150000" max="800000" step="10000" value="' + homeState.price + '">',
        '</div>',
        '<div class="control-group">',
        '  <div class="control-label">Down Payment</div>',
        '  <div class="slider-display">',
        '    <span class="slider-value" id="home-down-display">20%</span>',
        '  </div>',
        '  <input type="range" id="home-down" min="5" max="40" step="5" value="' + Math.round(homeState.downPct * 100) + '">',
        '</div>',
        '<div class="compare-info">',
        '  <strong>15-year</strong> at 6.5% APR<br>',
        '  <strong>30-year</strong> at 7.0% APR<br>',
        '  Payment difference invested at 10.5% avg.',
        '</div>',
    ].join('\n');

    document.getElementById('home-price').addEventListener('input', function() {
        homeState.price = parseInt(this.value, 10);
        document.getElementById('home-price-display').textContent = fmtDollarFull(homeState.price);
        renderHome();
    });
    document.getElementById('home-down').addEventListener('input', function() {
        homeState.downPct = parseInt(this.value, 10) / 100;
        document.getElementById('home-down-display').textContent = Math.round(homeState.downPct * 100) + '%';
        renderHome();
    });

    chartWrapper.classList.add('hidden');
    renderHome();
}

function renderHome() {
    var downAmt   = homeState.price * homeState.downPct;
    var principal = homeState.price - downAmt;
    var loan15 = calcLoan(principal, RATES.mortgage15yr, 15);
    var loan30 = calcLoan(principal, RATES.mortgage30yr, 30);

    var monthlyDiff = loan30.monthlyPayment - loan15.monthlyPayment;
    // For 30yr, the lower monthly payment frees up cash vs 15yr — but 30yr COSTS more
    // The 15yr payer saves the payment difference after year 15 (loan paid off) for 15 more years
    var diffInvested15 = calcDCA(Math.abs(monthlyDiff), 0, 15, RATES.sp500Avg).final;

    var pct15 = (loan15.totalInterest / (loan15.totalPaid)) * 100;
    var pct30 = (loan30.totalInterest / (loan30.totalPaid)) * 100;

    scenarioStats.innerHTML = [
        '<div class="stats-dual">',
        '<div class="stats-block">',
        '  <h3>15-Year at 6.5%</h3>',
        '  <div class="stat-row"><span class="stat-label">Monthly Payment</span><span class="stat-value red">' + fmtDollarFull(loan15.monthlyPayment) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Interest</span><span class="stat-value red">' + fmtDollarFull(loan15.totalInterest) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Cost</span><span class="stat-value">' + fmtDollarFull(downAmt + loan15.totalPaid) + '</span></div>',
        '  <div class="interest-bar-wrap">',
        '    <div class="interest-bar">',
        '      <div class="bar-principal" style="width:' + (100 - pct15).toFixed(1) + '%"></div>',
        '      <div class="bar-interest" style="width:' + pct15.toFixed(1) + '%"></div>',
        '    </div>',
        '    <div class="bar-legend">',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#16a34a"></div> Principal</div>',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#dc2626"></div> Interest (' + pct15.toFixed(0) + '%)</div>',
        '    </div>',
        '  </div>',
        '</div>',
        '<div class="stats-block">',
        '  <h3>30-Year at 7.0%</h3>',
        '  <div class="stat-row"><span class="stat-label">Monthly Payment</span><span class="stat-value green">' + fmtDollarFull(loan30.monthlyPayment) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Interest</span><span class="stat-value red">' + fmtDollarFull(loan30.totalInterest) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">Total Cost</span><span class="stat-value">' + fmtDollarFull(downAmt + loan30.totalPaid) + '</span></div>',
        '  <div class="interest-bar-wrap">',
        '    <div class="interest-bar">',
        '      <div class="bar-principal" style="width:' + (100 - pct30).toFixed(1) + '%"></div>',
        '      <div class="bar-interest" style="width:' + pct30.toFixed(1) + '%"></div>',
        '    </div>',
        '    <div class="bar-legend">',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#16a34a"></div> Principal</div>',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#dc2626"></div> Interest (' + pct30.toFixed(0) + '%)</div>',
        '    </div>',
        '  </div>',
        '</div>',
        '</div>',
        '<div class="stats-block" style="margin-top:16px">',
        '  <h3>The Monthly Difference: ' + fmtDollarFull(Math.abs(monthlyDiff)) + '/mo</h3>',
        '  <div class="stat-row"><span class="stat-label">30-yr saves per month vs 15-yr</span><span class="stat-value green">' + (monthlyDiff > 0 ? '+' : '') + fmtDollarFull(Math.abs(monthlyDiff)) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">30-yr costs more in total interest</span><span class="stat-value red">+' + fmtDollarFull(loan30.totalInterest - loan15.totalInterest) + '</span></div>',
        '  <div class="stat-row"><span class="stat-label">If monthly savings invested 15 yrs</span><span class="stat-value gold">' + fmtDollarFull(diffInvested15) + '</span></div>',
        '  <p class="control-note" style="margin-top:8px">The 15-year mortgage costs more each month but pays off in half the time — and the savings after payoff can be invested, often closing the gap.</p>',
        '</div>',
    ].join('\n');

    comparisonCards.innerHTML = '';
    insightText.innerHTML = [
        'A <strong>' + fmtDollarFull(homeState.price) + '</strong> home with <strong>' + Math.round(homeState.downPct * 100) + '% down</strong>:',
        'the 30-year mortgage is <strong class="text-green">' + fmtDollarFull(Math.abs(monthlyDiff)) + '/mo cheaper</strong>,',
        'but costs <strong class="text-red">' + fmtDollarFull(loan30.totalInterest - loan15.totalInterest) + ' more in interest</strong>.',
        'The 15-year homeowner is mortgage-free in half the time — and those freed-up payments can then be invested.',
    ].join(' ');
    buffettBlock.classList.add('hidden');
    scenarioInsight.classList.remove('hidden');

    exploredScenarios['home'] = {
        price:         homeState.price,
        loan15Monthly: loan15.monthlyPayment,
        loan30Monthly: loan30.monthlyPayment,
        interestDiff:  loan30.totalInterest - loan15.totalInterest,
    };
    updateCardStatuses();
}

// =========================================================================
// SUMMARY SCREEN
// =========================================================================
function renderSummary() {
    var scenarios = [
        { id: 'invest', icon: '📈', title: 'Investing & Compound Interest' },
        { id: 'car',    icon: '🚗', title: 'Buying a Car' },
        { id: 'credit', icon: '💳', title: 'Credit Card Debt' },
        { id: 'home',   icon: '🏠', title: 'Home Loan Comparison' },
    ];

    var html = '';
    scenarios.forEach(function(sc) {
        var res = exploredScenarios[sc.id];
        html += '<div class="summary-scenario-block' + (res ? '' : ' not-explored') + '">';
        html += '<h3>' + sc.icon + ' ' + sc.title + '</h3>';
        if (!res) {
            html += '<p class="summary-not-explored">Not yet explored</p>';
        } else if (sc.id === 'invest') {
            html += '<div class="stat-row"><span class="stat-label">' + playerName + ' at retirement (age 65)</span><span class="stat-value green">' + fmtDollarFull(res.playerFinal) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Jordan at retirement (age 65)</span><span class="stat-value gray">' + fmtDollarFull(res.jordanFinal) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Your advantage</span><span class="stat-value green">' + fmtDollarFull(res.playerFinal - res.jordanFinal) + '</span></div>';
        } else if (sc.id === 'car') {
            html += '<div class="stat-row"><span class="stat-label">Car price</span><span class="stat-value">' + fmtDollarFull(res.price) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Total interest paid</span><span class="stat-value red">' + fmtDollarFull(res.totalInterest) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Opportunity cost (if invested)</span><span class="stat-value gold">' + fmtDollarFull(res.oppCost) + '</span></div>';
        } else if (sc.id === 'credit') {
            html += '<div class="stat-row"><span class="stat-label">Balance cleared</span><span class="stat-value green">' + fmtDollarFull(res.balance) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Payoff time</span><span class="stat-value">' + fmtMonths(res.months) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Total interest paid</span><span class="stat-value red">' + fmtDollarFull(res.totalInterest) + '</span></div>';
        } else if (sc.id === 'home') {
            html += '<div class="stat-row"><span class="stat-label">Home price</span><span class="stat-value">' + fmtDollarFull(res.price) + '</span></div>';
            html += '<div class="stat-row"><span class="stat-label">Extra interest (30yr vs 15yr)</span><span class="stat-value red">' + fmtDollarFull(res.interestDiff) + '</span></div>';
        }
        html += '</div>';
    });

    summaryContent.innerHTML = html;
}

// =========================================================================
// HELPERS
// =========================================================================
function interpolateSeries(series, targetX, xKey, yKey) {
    for (var i = 0; i < series.length; i++) {
        if (series[i][xKey] === targetX) return series[i][yKey];
        if (series[i][xKey] > targetX && i > 0) {
            // Linear interpolation between i-1 and i
            var x0 = series[i-1][xKey], x1 = series[i][xKey];
            var y0 = series[i-1][yKey], y1 = series[i][yKey];
            var t = (targetX - x0) / (x1 - x0);
            return y0 + t * (y1 - y0);
        }
    }
    // Return last value if targetX is beyond series
    if (series.length > 0 && targetX >= series[series.length-1][xKey]) {
        return series[series.length-1][yKey];
    }
    return null;
}

function updateCardStatuses() {
    ['invest', 'car', 'credit', 'home'].forEach(function(id) {
        var statusEl = document.getElementById('status-' + id);
        var card = document.querySelector('[data-scenario="' + id + '"]');
        if (!statusEl || !card) return;
        if (exploredScenarios[id]) {
            statusEl.textContent = '✓';
            statusEl.classList.add('done');
            card.classList.add('completed');
        } else {
            statusEl.textContent = '▶';
            statusEl.classList.remove('done');
            card.classList.remove('completed');
        }
    });
}

// =========================================================================
// EVENT WIRING
// =========================================================================
document.querySelectorAll('.scenario-card').forEach(function(card) {
    card.addEventListener('click', function() {
        var sc = this.getAttribute('data-scenario');
        currentScenario = sc;
        scenarioStats.innerHTML     = '';
        comparisonCards.innerHTML   = '';
        scenarioInsight.classList.add('hidden');
        chartWrapper.classList.add('hidden');

        if (sc === 'invest') loadScenarioInvest();
        if (sc === 'car')    loadScenarioCar();
        if (sc === 'credit') loadScenarioCredit();
        if (sc === 'home')   loadScenarioHome();

        showScreen('scenario');
    });
});

backToHubBtn.addEventListener('click', function() {
    showScreen('hub');
});

backFromSummary.addEventListener('click', function() {
    showScreen('hub');
});

markCompleteBtn.addEventListener('click', function() {
    showScreen('hub');
});

viewSummaryBtn.addEventListener('click', function() {
    renderSummary();
    showScreen('summary');
});

// Sync player name/age on input so Compare info in controls stays fresh
playerNameInput.addEventListener('change', function() { playerName = getPlayerName(); });
playerAgeInput.addEventListener('change',  function() { playerAge  = getPlayerAge(); });
