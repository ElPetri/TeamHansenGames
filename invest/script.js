// Money Moves — Game Script
// Pure vanilla JS, no modules, global scope

// =========================================================================
// STATE
// =========================================================================
var playerName = 'You';
var playerAge  = 18;
var currentScenario = null;
var currentTab = 'basic';
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
// ADVANCED CALCULATORS
// =========================================================================

// Tax-advantaged account comparison: Traditional 401k vs Roth IRA vs Taxable
// Returns { traditional, roth, taxable } final values at retirement
function calcTaxAdvantaged(monthlyContrib, grossIncome, bracket, accountType, years) {
    var annualReturn = RATES.sp500Avg;
    // Traditional 401k: contribute pre-tax, pay tax on withdrawal
    var tradFinal = calcDCA(monthlyContrib, 0, years, annualReturn).final * (1 - bracket);
    // Roth IRA: contribute after-tax, withdrawals tax-free
    var afterTaxMonthly = monthlyContrib * (1 - bracket);
    var rothFinal = calcDCA(afterTaxMonthly, 0, years, annualReturn).final;
    // Taxable brokerage: contribute after-tax, pay 15% long-term capital gains on gains
    var taxableRaw = calcDCA(afterTaxMonthly, 0, years, annualReturn).final;
    var taxableContribTotal = afterTaxMonthly * 12 * years;
    var taxableGains = Math.max(0, taxableRaw - taxableContribTotal);
    var taxableFinal = taxableContribTotal + taxableGains * (1 - 0.15);
    return { traditional: tradFinal, roth: rothFinal, taxable: taxableFinal };
}

// Expense ratio drag: compare multiple annual expense ratios on same DCA
// ratios: [{label, rate}]  Returns array of {label, final, series}
function calcExpenseRatioDrag(monthly, years, ratios) {
    return ratios.map(function(r) {
        var effectiveReturn = RATES.sp500Avg - r.rate;
        var result = calcDCA(monthly, 0, years, effectiveReturn);
        return { label: r.label, rate: r.rate, final: result.final, series: result.series };
    });
}

// Lump sum vs DCA: invest total all-at-once vs spread over N months using historical data
function calcLumpSumVsDCA(total, deployMonths, startYear) {
    // Lump sum: invest all on day 1, hold for same total period
    var totalYears = 20; // fixed horizon for comparison
    var lumpResult = calcDCAHistorical(0, 0, startYear, totalYears);
    // Add lump sum as initial value
    var rate0 = SP500_RETURNS.find(function(r) { return r.year === startYear; });
    var annReturn0 = rate0 ? rate0.return : RATES.sp500Avg;
    var lumpFinal = total;
    for (var i = 0; i < totalYears; i++) {
        var idx = (startYear + i - SP500_RETURNS[0].year) % SP500_RETURNS.length;
        if (idx < 0) idx += SP500_RETURNS.length;
        lumpFinal *= (1 + SP500_RETURNS[idx].return);
    }

    // DCA: spread total over deployMonths, then hold remainder invested
    var monthly = total / deployMonths;
    var dcaFinal = calcDCAHistorical(monthly, 0, startYear, totalYears).final;

    return {
        lumpFinal: lumpFinal,
        dcaFinal:  dcaFinal,
        lumpWins:  lumpFinal >= dcaFinal,
        diff:      Math.abs(lumpFinal - dcaFinal),
    };
}

// Car depreciation schedule
function calcDepreciation(price, maxYears) {
    maxYears = Math.min(maxYears || 10, DEPRECIATION_CURVE.length - 1);
    var schedule = [];
    for (var y = 0; y <= maxYears; y++) {
        schedule.push({ year: y, value: price * DEPRECIATION_CURVE[y] });
    }
    return schedule;
}

// Lease vs Buy: total cost of ownership over N years
function calcLeaseVsBuy(price, leaseTerm, moneyFactor, residualPct, ownYears) {
    // Lease: pay monthly lease payments, repeat until ownYears
    var residual = price * residualPct;
    var leaseMonthly = (price - residual) / leaseTerm + (price + residual) * moneyFactor;
    var numLeases = Math.ceil(ownYears / (leaseTerm / 12));
    var leaseTotalCost = leaseMonthly * leaseTerm * numLeases;

    // Buy: take loan, drive until ownYears
    var loan = calcLoan(price * 0.9, RATES.carLoan, ownYears); // 10% down
    var buyTotalCost = price * 0.1 + loan.totalPaid; // down + loan payments
    // Equity at end: car still has depreciated value
    var yearsOld = ownYears;
    var idx = Math.min(yearsOld, DEPRECIATION_CURVE.length - 1);
    var residualValue = price * DEPRECIATION_CURVE[idx];
    var netBuyCost = buyTotalCost - residualValue;

    return {
        leaseMonthly:  leaseMonthly,
        leaseTotalCost: leaseTotalCost,
        buyMonthly:    loan.monthlyPayment,
        buyTotalCost:  buyTotalCost,
        netBuyCost:    netBuyCost,
        residualValue: residualValue,
    };
}

// Total Cost of Ownership for a car over N years
function calcCarTCO(price, loanDetails, annualInsurance, annualMaintenance, annualFuel, years) {
    var loanCost    = loanDetails.totalPaid;
    var insuranceCost   = annualInsurance * years;
    var maintenanceCost = annualMaintenance * years;
    var fuelCost    = annualFuel * years;
    var depreciation = price - price * (DEPRECIATION_CURVE[Math.min(years, DEPRECIATION_CURVE.length-1)]);
    var total = loanCost + insuranceCost + maintenanceCost + fuelCost + depreciation;
    return {
        loanCost: loanCost, insuranceCost: insuranceCost,
        maintenanceCost: maintenanceCost, fuelCost: fuelCost,
        depreciation: depreciation, total: total,
        perMonth: total / (years * 12),
    };
}

// Avalanche vs Snowball debt payoff
// debts: [{name, balance, apr, minPayment}]
// extraMonthly: additional payment above minimums
function calcAvalancheVsSnowball(debts, extraMonthly) {
    function simulate(sortedDebts) {
        var balances = sortedDebts.map(function(d) { return d.balance; });
        var month = 0;
        var totalInterest = 0;
        var maxMonths = 600;
        while (month < maxMonths) {
            var allPaid = balances.every(function(b) { return b <= 0; });
            if (allPaid) break;
            month++;
            var extra = extraMonthly;
            for (var i = 0; i < sortedDebts.length; i++) {
                if (balances[i] <= 0) continue;
                var interest = balances[i] * (sortedDebts[i].apr / 12);
                totalInterest += interest;
                balances[i] += interest;
                var pay = sortedDebts[i].minPayment;
                // Add freed-up minimums from paid debts
                for (var j = 0; j < i; j++) {
                    if (balances[j] <= 0) pay += sortedDebts[j].minPayment;
                }
                // Add extra to first non-zero
                if (i === sortedDebts.findIndex(function(d, k) { return balances[k] > 0; })) {
                    pay += extra;
                    extra = 0;
                }
                balances[i] = Math.max(0, balances[i] - pay);
            }
        }
        return { months: month, totalInterest: totalInterest };
    }

    var byAPR     = debts.slice().sort(function(a, b) { return b.apr - a.apr; });       // avalanche
    var byBalance = debts.slice().sort(function(a, b) { return a.balance - b.balance; }); // snowball

    return {
        avalanche: simulate(byAPR),
        snowball:  simulate(byBalance),
    };
}

// Balance transfer analysis
function calcBalanceTransfer(balance, transferFeePct, promoMonths, monthlyPayment, fallbackAPR) {
    var fee = balance * transferFeePct;
    var totalWithFee = balance + fee;
    var month = 0;
    var totalInterest = 0;
    var b = totalWithFee;
    // Pay 0% during promo period
    while (month < promoMonths && b > 0) {
        b = Math.max(0, b - monthlyPayment);
        month++;
    }
    var balanceAtEnd = b;
    // After promo, pay fallback APR on remaining
    var fallbackInterest = 0;
    var fallbackMonths = 0;
    if (b > 0) {
        var payoffResult = calcCreditCardPayoff(b, fallbackAPR, monthlyPayment);
        fallbackInterest = payoffResult.totalInterest;
        fallbackMonths   = payoffResult.months;
    }
    var totalCost = fee + fallbackInterest;
    var totalMonths = month + fallbackMonths;
    // Compare vs staying on original card
    var stayResult = calcCreditCardPayoff(balance, RATES.creditCard, monthlyPayment);
    var savings = stayResult.totalInterest - totalCost;
    return {
        transferFee: fee, balanceAtPromoEnd: balanceAtEnd,
        fallbackInterest: fallbackInterest, totalCost: totalCost,
        totalMonths: totalMonths, savings: savings,
        stayTotalInterest: stayResult.totalInterest,
        paidOffInPromo: balanceAtEnd <= 0,
    };
}

// Rent vs Buy break-even
function calcRentVsBuy(homePrice, downPct, mortgageRate, monthlyRent, annualAppreciation, years) {
    var down         = homePrice * downPct;
    var principal    = homePrice - down;
    var loan         = calcLoan(principal, mortgageRate, 30);
    var closingCosts = homePrice * 0.03; // ~3% closing costs to buy
    var sellCosts    = homePrice * 0.06; // ~6% agent fees to sell

    var ownerCumulativeCost = [0];
    var renterCumulativeCost = [0];
    var homeValue = homePrice;
    var loanBalance = principal;
    var monthlyRate = mortgageRate / 12;

    // Accumulate rent (invested down payment)
    var investedDown = calcDCA(0, 0, years, RATES.sp500Avg).final; // placeholder; lump sum handled below
    var rentInvested = down; // renter invests the down payment
    for (var y = 1; y <= years; y++) {
        // Owner costs: mortgage + property tax (1.2%) + insurance (0.5%) + maintenance (1%) - appreciation
        homeValue *= (1 + annualAppreciation);
        var ownerAnnual = loan.monthlyPayment * 12 + homePrice * 0.017;
        ownerCumulativeCost.push(ownerCumulativeCost[y-1] + ownerAnnual);

        // Renter costs: rent (increases 3%/yr) + opportunity: down payment invested grows
        monthlyRent *= 1.03;
        rentInvested *= (1 + RATES.sp500Avg);
        renterCumulativeCost.push(renterCumulativeCost[y-1] + monthlyRent * 12);
    }

    // Owner net at sale: equity - sell costs
    var ownerEquity = homeValue - (homePrice * Math.pow(1 - 0.06, years) * 0); // simplified
    homeValue = homePrice * Math.pow(1 + annualAppreciation, years);
    var remainingBalance = principal;
    for (var m = 0; m < years * 12; m++) {
        var interest = remainingBalance * monthlyRate;
        var princPayment = loan.monthlyPayment - interest;
        remainingBalance = Math.max(0, remainingBalance - princPayment);
    }
    var ownerNetProceeds = homeValue - remainingBalance - homePrice * 0.06;
    var ownerNetCost = ownerCumulativeCost[years] + closingCosts - ownerNetProceeds;
    var renterNetCost = renterCumulativeCost[years] - (rentInvested - down); // subtract investment gains

    // Find break-even year
    var breakEvenYear = null;
    for (var y2 = 1; y2 <= years; y2++) {
        if (ownerCumulativeCost[y2] <= renterCumulativeCost[y2]) {
            breakEvenYear = y2;
            break;
        }
    }

    return {
        ownerSeries:      ownerCumulativeCost.map(function(v, i) { return { x: i, y: v }; }),
        renterSeries:     renterCumulativeCost.map(function(v, i) { return { x: i, y: v }; }),
        breakEvenYear:    breakEvenYear,
        homeValueAtEnd:   homeValue,
        remainingBalance: remainingBalance,
        ownerNetCost:     ownerNetCost,
        renterNetCost:    renterNetCost,
    };
}

// PMI cost calculator
function calcPMI(homePrice, downPct, pmiRateAnnual, mortgageRate, loanYears) {
    var down = homePrice * downPct;
    var principal = homePrice - down;
    var loan = calcLoan(principal, mortgageRate, loanYears);
    var monthlyRate = mortgageRate / 12;
    var balance = principal;
    var pmiMonthly = homePrice * (pmiRateAnnual / 12);
    var pmiMonthsTotal = 0;
    var totalPMI = 0;
    for (var m = 0; m < loanYears * 12; m++) {
        var interest = balance * monthlyRate;
        balance = Math.max(0, balance - (loan.monthlyPayment - interest));
        var equity = (homePrice - balance) / homePrice;
        if (equity < 0.20) {
            totalPMI += pmiMonthly;
            pmiMonthsTotal++;
        }
    }
    return {
        monthlyPaymentWithPMI: loan.monthlyPayment + pmiMonthly,
        monthlyPMI:   pmiMonthly,
        totalPMI:     totalPMI,
        pmiMonths:    pmiMonthsTotal,
        basePayment:  loan.monthlyPayment,
    };
}

// True monthly cost of homeownership
function calcTrueMonthlyCost(homePrice, mortgageRate, loanYears, propertyTaxRate, annualInsurance, monthlyHOA, maintenancePct) {
    var loan = calcLoan(homePrice * 0.80, mortgageRate, loanYears); // assume 20% down
    var monthlyTax         = (homePrice * propertyTaxRate) / 12;
    var monthlyInsurance   = annualInsurance / 12;
    var monthlyMaintenance = (homePrice * maintenancePct) / 12;
    var total = loan.monthlyPayment + monthlyTax + monthlyInsurance + monthlyHOA + monthlyMaintenance;
    return {
        mortgage:    loan.monthlyPayment,
        tax:         monthlyTax,
        insurance:   monthlyInsurance,
        hoa:         monthlyHOA,
        maintenance: monthlyMaintenance,
        total:       total,
        sticker:     loan.monthlyPayment,
        difference:  total - loan.monthlyPayment,
    };
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
    svgEl.appendChild(el('rect', { x: 0, y: 0, width: CHART_W, height: CHART_H, fill: '#12121a' }));

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
        svgEl.appendChild(text(ds.label, { x: lx + 22, y: CHART_PAD.top + 11, class: 'chart-legend-label', fill: '#aaa' }));
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

    var greenColor = '#00ff88';
    var grayColor  = '#888';

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
    scenarioSubtitleEl.textContent = "The true cost of financing a new car \u2014 and what you're giving up";

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
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#00ff88"></div> Principal</div>',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#ff4466"></div> Interest (' + pctInterest.toFixed(0) + '%)</div>',
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
        { label: playerName + ' ($' + payment + '/mo)',  color: '#00ff88', data: pSeries.map(function(p) { return { x: p.month, y: p.balance }; }) },
        { label: 'Jordan (min payment)', color: '#888', data: jSeries.map(function(p) { return { x: p.month, y: p.balance }; }) },
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
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#00ff88"></div> Principal</div>',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#ff4466"></div> Interest (' + pct15.toFixed(0) + '%)</div>',
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
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#00ff88"></div> Principal</div>',
        '      <div class="bar-legend-item"><div class="bar-swatch" style="background:#ff4466"></div> Interest (' + pct30.toFixed(0) + '%)</div>',
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
// ADVANCED HELPERS
// =========================================================================

function quizHtml(questions) {
    var html = '<div class="quiz-section">';
    html += '<button class="quiz-toggle-btn" onclick="toggleQuiz(this)">🧠 Test yourself</button>';
    html += '<div class="quiz-questions" style="display:none">';
    questions.forEach(function(q, qi) {
        html += '<div class="quiz-question" id="qq-' + qi + '">';
        html += '<p>' + q.q + '</p>';
        html += '<div class="quiz-options">';
        q.opts.forEach(function(opt, oi) {
            html += '<button class="quiz-option" onclick="answerQuiz(this,' + qi + ',' + oi + ',' + q.correct + ')">' + opt + '</button>';
        });
        html += '</div>';
        html += '<div class="quiz-explanation" id="qe-' + qi + '">' + q.explanation + '</div>';
        html += '</div>';
    });
    html += '</div></div>';
    return html;
}

function toggleQuiz(btn) {
    var container = btn.nextElementSibling;
    var open = container.style.display !== 'none';
    container.style.display = open ? 'none' : 'flex';
    btn.textContent = open ? '🧠 Test yourself' : '🧠 Hide quiz';
}

function answerQuiz(btn, qi, oi, correct) {
    var container = btn.closest('.quiz-options');
    var buttons = container.querySelectorAll('.quiz-option');
    buttons.forEach(function(b) { b.disabled = true; });
    btn.classList.add(oi === correct ? 'correct' : 'wrong');
    buttons[correct].classList.add('correct');
    var explanation = document.getElementById('qe-' + qi);
    if (explanation) explanation.style.display = 'block';
}

function conceptCard(term, explanation) {
    return '<div class="concept-card"><strong>' + term + '</strong><p>' + explanation + '</p></div>';
}

function learnMoreLinks(links) {
    return '<div class="learn-more-links">' +
        links.map(function(l) {
            return '<a class="learn-more-link" href="' + l.url + '" target="_blank" rel="noopener noreferrer">' + l.label + '</a>';
        }).join('') +
        '</div>';
}

function caseStudy(text) {
    return '<div class="case-study"><div class="case-study-label">📊 Case Study</div><p>' + text + '</p></div>';
}

function advBlock(icon, title, bodyHtml) {
    return '<div class="adv-block">' +
        '<div class="adv-block-header"><h3>' + icon + ' ' + title + '</h3></div>' +
        '<div class="adv-block-body">' + bodyHtml + '</div>' +
        '</div>';
}

// =========================================================================
// ADVANCED LOADERS
// =========================================================================

function loadAdvancedInvest() {
    chartWrapper.classList.add('hidden');
    scenarioInsight.classList.add('hidden');
    scenarioControls.innerHTML = '';

    var html = '<div class="adv-section">';

    // --- Sub-topic 1: Tax-Advantaged Accounts ---
    var taxBrackets = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
    var selBracket = 0.22;
    var selContrib = 300;
    var taxYears = DEFAULTS.retireAge - playerAge;

    function taxRowHtml(contrib, bracket, years) {
        var r = calcTaxAdvantaged(contrib, 0, bracket, 'all', years);
        return [
            '<div class="stat-row"><span class="stat-label">Traditional 401(k) (pre-tax now, taxed on withdrawal)</span><span class="stat-value green">' + fmtDollarFull(r.traditional) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Roth IRA (after-tax now, tax-free withdrawal)</span><span class="stat-value green">' + fmtDollarFull(r.roth) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Taxable Brokerage (after-tax, 15% cap gains on withdrawal)</span><span class="stat-value">' + fmtDollarFull(r.taxable) + '</span></div>',
        ].join('');
    }

    html += advBlock('🏛️', 'Tax-Advantaged Accounts: 401(k) & Roth IRA',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group">' +
        '<div class="control-label">Monthly Contribution</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tax-contrib-display">$300</span><span class="slider-unit">/ mo</span></div>' +
        '<input type="range" id="adv-tax-contrib" min="50" max="1917" step="25" value="300">' +
        '<p class="control-note">2024 401(k) limit: $23,000/yr ($1,917/mo). IRA limit: $7,000/yr ($583/mo).</p>' +
        '</div>' +
        '<div class="control-group">' +
        '<div class="control-label">Your Tax Bracket</div>' +
        '<select id="adv-tax-bracket">' +
        taxBrackets.map(function(b) { return '<option value="' + b + '"' + (b === 0.22 ? ' selected' : '') + '>' + (b*100).toFixed(0) + '%</option>'; }).join('') +
        '</select>' +
        '</div>' +
        '<div class="compare-info">Comparison assumes S&P 500 avg (10.5%) over <strong>' + taxYears + ' years</strong> to retirement.</div>' +
        '</div>' +
        '<div class="adv-results">' +
        '<div class="stats-block" id="adv-tax-results">' + taxRowHtml(selContrib, selBracket, taxYears) + '</div>' +
        '<div class="concept-cards">' +
        conceptCard('401(k) Employer Match', 'Many employers match 50–100% of your contributions up to a certain %. This is free money — always contribute at least enough to get the full match.') +
        conceptCard('Traditional vs Roth', 'Traditional: lower taxes NOW (good if you\'re in a high bracket today). Roth: tax-free growth and withdrawal (great for young, low-income earners who expect higher taxes later).') +
        conceptCard('Tax-Deferred Compounding', 'In tax-advantaged accounts, gains aren\'t taxed yearly — so more money stays invested and compounds. Over 40 years, this is worth hundreds of thousands of dollars.') +
        '</div>' +
        caseStudy('Alex earns $45k/yr (22% bracket), invests $300/mo for 40 years. Traditional 401(k) vs taxable brokerage — the tax advantage alone adds over $100,000 at retirement.') +
        learnMoreLinks([
            { label: 'IRS 401(k) Limits', url: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits' },
            { label: 'Roth IRA (Investopedia)', url: 'https://www.investopedia.com/terms/r/rothira.asp' },
            { label: '401(k) Match Calculator (NerdWallet)', url: 'https://www.nerdwallet.com/article/investing/what-is-401k-employer-match' },
        ]) +
        quizHtml([
            { q: 'Which account lets your money grow AND be withdrawn completely tax-free?', opts: ['Traditional 401(k)', 'Roth IRA', 'Taxable Brokerage', 'Savings Account'], correct: 1, explanation: 'Roth IRA contributions are made with after-tax dollars, but all growth and qualified withdrawals are 100% tax-free.' },
            { q: 'What is the #1 rule about employer 401(k) matching?', opts: ['Avoid it — it locks up your money', 'Always contribute enough to get the full match', 'Only use it if you\'re over 30', 'Match only matters for high earners'], correct: 1, explanation: 'Employer match is literally free money added to your retirement account. Not taking the full match is leaving part of your compensation on the table.' },
            { q: 'Why do young earners especially benefit from a Roth IRA?', opts: ['They earn more interest', 'They are likely in a lower tax bracket now than they will be later', 'Roth has higher contribution limits', 'Roth has no income limits'], correct: 1, explanation: 'If you\'re 22 and in the 12% bracket, you pay 12% tax now and nothing on withdrawal. If you\'re 55 in the 32% bracket, you\'d have paid much more. Lock in the low tax rate while you can.' },
        ]) +
        '</div></div>'
    );

    // --- Sub-topic 2: Expense Ratios ---
    var expMonthly = 200;
    var expYears = 40;
    var expRatios = [
        { label: 'VOO / Index Fund (0.03%)',     rate: 0.0003 },
        { label: 'Typical Active Fund (1.0%)',   rate: 0.0100 },
        { label: 'High-Fee Fund (2.0%)',         rate: 0.0200 },
    ];
    var expResults = calcExpenseRatioDrag(expMonthly, expYears, expRatios);

    html += advBlock('💸', 'Expense Ratios — The Silent Fee',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group">' +
        '<div class="control-label">Monthly Investment</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-exp-contrib-display">$200</span></div>' +
        '<input type="range" id="adv-exp-contrib" min="50" max="1000" step="25" value="200">' +
        '</div>' +
        '<div class="control-group">' +
        '<div class="control-label">Investment Horizon</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-exp-years-display">40</span><span class="slider-unit"> years</span></div>' +
        '<input type="range" id="adv-exp-years" min="10" max="50" step="1" value="40">' +
        '</div>' +
        '<div class="compare-info">All three funds assumed to track the S&P 500 at 10.5% gross. The only difference is the annual fee.</div>' +
        '</div>' +
        '<div class="adv-results">' +
        '<div class="stats-block" id="adv-exp-results">' +
        expResults.map(function(r) {
            return '<div class="stat-row"><span class="stat-label">' + r.label + '</span><span class="stat-value green">' + fmtDollarFull(r.final) + '</span></div>';
        }).join('') +
        '<div class="stat-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px">' +
        '<span class="stat-label">Fee drag: Index vs Active (1%)</span>' +
        '<span class="stat-value red">-' + fmtDollarFull(expResults[0].final - expResults[1].final) + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="concept-cards">' +
        conceptCard('Expense Ratio', 'An annual fee charged by a fund, expressed as a % of your balance. A 1% fee on a $100,000 portfolio costs $1,000/year — and that $1,000 can\'t compound.') +
        conceptCard('Index Fund', 'A fund that passively tracks a market index (like the S&P 500). No active stock-picking means much lower fees and, historically, better long-term returns than most active funds.') +
        conceptCard('Active vs Passive Management', 'Actively managed funds hire analysts to pick stocks. Studies show 80–90% of active funds underperform the index over 15+ years — and charge 10–100x more for the privilege.') +
        '</div>' +
        caseStudy('$200/mo invested for 40 years: VOO at 0.03% grows to ~$1.35M. An active fund at 1.0% grows to ~$1.07M. The 0.97% fee difference silently costs you over $280,000.') +
        learnMoreLinks([
            { label: 'Vanguard VOO', url: 'https://investor.vanguard.com/investment-products/etfs/profile/voo' },
            { label: 'SPIVA Report (Active vs Passive)', url: 'https://www.spglobal.com/spdji/en/research-insights/spiva/' },
            { label: 'Expense Ratios Explained (Investopedia)', url: 'https://www.investopedia.com/terms/e/expenseratio.asp' },
        ]) +
        quizHtml([
            { q: 'A fund charges a 1% annual expense ratio. On a $200,000 balance, how much do you pay per year?', opts: ['$20', '$200', '$2,000', '$20,000'], correct: 2, explanation: '1% of $200,000 = $2,000/year. That $2,000 is taken from your balance and can\'t compound — making fees compoundingly expensive over time.' },
            { q: 'What percentage of actively managed funds beat the S&P 500 index over 15+ years?', opts: ['~80%', '~50%', '~30%', '~10–20%'], correct: 3, explanation: 'According to the SPIVA report, roughly 80–90% of active funds underperform their benchmark index over 15 years. Lower fees + broad diversification = a hard combo to beat.' },
        ]) +
        '</div></div>'
    );

    // --- Sub-topic 3: Lump Sum vs DCA ---
    html += advBlock('💰', 'Lump Sum vs Dollar-Cost Averaging',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group">' +
        '<div class="control-label">Total Amount to Invest</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-ls-amount-display">$10,000</span></div>' +
        '<input type="range" id="adv-ls-amount" min="1000" max="50000" step="1000" value="10000">' +
        '</div>' +
        '<div class="control-group">' +
        '<div class="control-label">DCA Deployment Period</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-ls-months-display">12</span><span class="slider-unit"> months</span></div>' +
        '<input type="range" id="adv-ls-months" min="3" max="24" step="3" value="12">' +
        '</div>' +
        '<div class="control-group">' +
        '<div class="control-label">Start Year (Historical)</div>' +
        '<select id="adv-ls-year">' +
        SP500_RETURNS.slice(0, -20).map(function(r) {
            return '<option value="' + r.year + '"' + (r.year === 1990 ? ' selected' : '') + '>' + r.year + '</option>';
        }).join('') +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="adv-results">' +
        '<div class="stats-block" id="adv-ls-results">' +
        '<div class="stat-row"><span class="stat-label">Lump Sum (invest all now)</span><span class="stat-value green" id="adv-ls-lump">—</span></div>' +
        '<div class="stat-row"><span class="stat-label">DCA (spread over period)</span><span class="stat-value" id="adv-ls-dca">—</span></div>' +
        '<div class="stat-row"><span class="stat-label">Winner</span><span class="stat-value" id="adv-ls-winner">—</span></div>' +
        '</div>' +
        '<div class="concept-cards">' +
        conceptCard('Lump Sum Investing', 'Investing all available money immediately. Historically wins ~68% of the time because more time in the market = more compounding.') +
        conceptCard('Dollar-Cost Averaging (DCA)', 'Spreading purchases over time to reduce the risk of investing at a market peak. Psychologically easier — but usually earns slightly less than lump sum.') +
        conceptCard('Time in the Market', 'The longer your money is invested, the more it compounds. Missing even a few of the market\'s best days dramatically reduces long-term returns — which is why staying invested beats timing the market.') +
        '</div>' +
        caseStudy('You receive a $10,000 bonus. Invest it all now vs $833/mo for 12 months. Using historical S&P 500 data, lump sum wins about 68% of the time — and when it wins, it wins by more than when DCA wins.') +
        learnMoreLinks([
            { label: 'Vanguard: Lump Sum vs DCA Research', url: 'https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/invest-now-or-temporarily-hold-your-cash.html' },
            { label: 'DCA Explained (Investopedia)', url: 'https://www.investopedia.com/terms/d/dollarcostaveraging.asp' },
        ]) +
        quizHtml([
            { q: 'Historically, does lump sum or DCA produce better returns?', opts: ['DCA always wins', 'Lump sum wins about 68% of the time', 'They are exactly equal', 'It depends entirely on your age'], correct: 1, explanation: 'Vanguard research shows lump sum investing outperforms DCA ~68% of the time across global markets, because getting money invested sooner means more time for it to compound.' },
            { q: 'When does DCA make the most sense over lump sum?', opts: ['When you have a large windfall and are near retirement or extremely risk-averse', 'When you\'re young and have time to recover', 'When markets are at all-time highs', 'DCA never makes sense'], correct: 0, explanation: 'DCA is most defensible for someone near retirement who can\'t afford to invest everything right before a crash. For long time horizons, lump sum is almost always better mathematically.' },
        ]) +
        '</div></div>'
    );

    // --- Sub-topic 4: Bear Markets ---
    var bearTableHtml = '<table class="bear-table"><thead><tr><th>Crash</th><th>Peak Drop</th><th>Recovery</th><th>Key Lesson</th></tr></thead><tbody>';
    BEAR_MARKETS.forEach(function(b) {
        bearTableHtml += '<tr>' +
            '<td><strong>' + b.name + '</strong><br><span style="font-size:0.75rem;color:var(--text-dim)">' + b.start + ' – ' + b.trough + '</span></td>' +
            '<td class="peak-drop">' + (b.peakDrop * 100).toFixed(1) + '%</td>' +
            '<td class="recovery">' + fmtMonths(b.recoveryMonths) + '</td>' +
            '<td style="font-size:0.8rem;color:var(--text-mid)">' + b.note + '</td>' +
            '</tr>';
    });
    bearTableHtml += '</tbody></table>';

    html += advBlock('🐻', 'Historical Bear Markets & Recovery',
        bearTableHtml +
        '<div class="concept-cards">' +
        conceptCard('Bear Market', 'A decline of 20% or more from recent highs. They are a normal part of the market cycle — there have been 26 bear markets in the S&P 500 since 1928.') +
        conceptCard('Staying Invested Through Crashes', 'Missing just the 10 best trading days per decade cuts your returns roughly in half. Most of those best days happen during bear markets — so staying invested (and ideally buying more) is the historically superior strategy.') +
        conceptCard('Sequence of Returns Risk', 'The order in which you experience gains/losses matters most near retirement. A crash early in your career is actually an opportunity (buy cheap). A crash in year 1 of retirement is genuinely dangerous.') +
        '</div>' +
        caseStudy('An investor who held through the 2008–2009 GFC (worst modern crash) fully recovered in ~4 years and went on to quadruple their money by 2024. An investor who sold at the bottom in March 2009 locked in a 57% loss and missed the entire decade-long bull market.') +
        learnMoreLinks([
            { label: 'DALBAR Investor Behavior Study', url: 'https://www.dalbar.com/QAIB/Index' },
            { label: 'S&P 500 Bear Markets History (Investopedia)', url: 'https://www.investopedia.com/bear-market-definition-and-examples-5202524' },
        ]) +
        quizHtml([
            { q: 'What is the definition of a bear market?', opts: ['Any single day the market drops', 'A drop of 10% or more', 'A drop of 20% or more from recent highs', 'A recession lasting 2+ quarters'], correct: 2, explanation: 'A bear market is officially defined as a drop of 20%+ from a recent peak. A 10% drop is called a "correction."' },
            { q: 'What did research find about investors who sold during bear markets?', opts: ['They protected their wealth and recovered faster', 'They missed the recovery and permanently reduced their long-term returns', 'They were right 50% of the time', 'Selling during a crash is always the smart move'], correct: 1, explanation: 'The DALBAR study consistently shows that average investors underperform the market significantly because they sell in fear and miss the rebounds. Emotional decisions are the #1 enemy of long-term returns.' },
        ])
    );

    html += '</div>'; // adv-section
    scenarioStats.innerHTML = html;
    comparisonCards.innerHTML = '';
    attachAdvInvestEvents();
}

function attachAdvInvestEvents() {
    var taxContribEl = document.getElementById('adv-tax-contrib');
    var taxBracketEl = document.getElementById('adv-tax-bracket');
    function updateTax() {
        var contrib = parseInt(taxContribEl.value, 10);
        var bracket = parseFloat(taxBracketEl.value);
        document.getElementById('adv-tax-contrib-display').textContent = '$' + contrib;
        var years = DEFAULTS.retireAge - playerAge;
        var r = calcTaxAdvantaged(contrib, 0, bracket, 'all', years);
        document.getElementById('adv-tax-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Traditional 401(k)</span><span class="stat-value green">' + fmtDollarFull(r.traditional) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Roth IRA</span><span class="stat-value green">' + fmtDollarFull(r.roth) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Taxable Brokerage</span><span class="stat-value">' + fmtDollarFull(r.taxable) + '</span></div>',
        ].join('');
    }
    if (taxContribEl) { taxContribEl.addEventListener('input', updateTax); taxBracketEl.addEventListener('change', updateTax); }

    var expContribEl = document.getElementById('adv-exp-contrib');
    var expYearsEl   = document.getElementById('adv-exp-years');
    function updateExp() {
        var contrib = parseInt(expContribEl.value, 10);
        var years   = parseInt(expYearsEl.value, 10);
        document.getElementById('adv-exp-contrib-display').textContent = '$' + contrib;
        document.getElementById('adv-exp-years-display').textContent   = years;
        var expRatios = [
            { label: 'VOO / Index Fund (0.03%)',    rate: 0.0003 },
            { label: 'Typical Active Fund (1.0%)',  rate: 0.0100 },
            { label: 'High-Fee Fund (2.0%)',        rate: 0.0200 },
        ];
        var results = calcExpenseRatioDrag(contrib, years, expRatios);
        document.getElementById('adv-exp-results').innerHTML = results.map(function(r) {
            return '<div class="stat-row"><span class="stat-label">' + r.label + '</span><span class="stat-value green">' + fmtDollarFull(r.final) + '</span></div>';
        }).join('') +
        '<div class="stat-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px">' +
        '<span class="stat-label">Fee drag: Index vs Active (1%)</span>' +
        '<span class="stat-value red">-' + fmtDollarFull(results[0].final - results[1].final) + '</span>' +
        '</div>';
    }
    if (expContribEl) { expContribEl.addEventListener('input', updateExp); expYearsEl.addEventListener('input', updateExp); }

    var lsAmountEl = document.getElementById('adv-ls-amount');
    var lsMonthsEl = document.getElementById('adv-ls-months');
    var lsYearEl   = document.getElementById('adv-ls-year');
    function updateLS() {
        var amount = parseInt(lsAmountEl.value, 10);
        var months = parseInt(lsMonthsEl.value, 10);
        var yr     = parseInt(lsYearEl.value, 10);
        document.getElementById('adv-ls-amount-display').textContent = fmtDollarFull(amount);
        document.getElementById('adv-ls-months-display').textContent = months;
        var r = calcLumpSumVsDCA(amount, months, yr);
        document.getElementById('adv-ls-lump').textContent    = fmtDollarFull(r.lumpFinal);
        document.getElementById('adv-ls-dca').textContent     = fmtDollarFull(r.dcaFinal);
        document.getElementById('adv-ls-winner').textContent  = r.lumpWins ? 'Lump Sum (+' + fmtDollarFull(r.diff) + ')' : 'DCA (+' + fmtDollarFull(r.diff) + ')';
        document.getElementById('adv-ls-winner').className    = 'stat-value ' + (r.lumpWins ? 'green' : 'gold');
    }
    if (lsAmountEl) { lsAmountEl.addEventListener('input', updateLS); lsMonthsEl.addEventListener('input', updateLS); lsYearEl.addEventListener('change', updateLS); updateLS(); }
}

// ----- ADVANCED CAR -----
function loadAdvancedCar() {
    chartWrapper.classList.add('hidden');
    scenarioInsight.classList.add('hidden');
    scenarioControls.innerHTML = '';

    var html = '<div class="adv-section">';

    // --- Sub-topic 1: New vs Used Depreciation ---
    var deprPrice = 35000;
    function deprBarsHtml(price) {
        var schedule = calcDepreciation(price, 10);
        var html2 = '<div class="depr-bar-wrap">';
        schedule.forEach(function(pt) {
            html2 += '<div class="depr-year-row">' +
                '<div class="depr-year-label">Year ' + pt.year + '</div>' +
                '<div class="depr-bar-track"><div class="depr-bar-fill" style="width:' + (DEPRECIATION_CURVE[pt.year] * 100).toFixed(0) + '%"></div></div>' +
                '<div class="depr-value">' + fmtDollarFull(pt.value) + '</div>' +
                '</div>';
        });
        html2 += '</div>';
        return html2;
    }

    html += advBlock('📉', 'New vs Used — The Depreciation Curve',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group">' +
        '<div class="control-label">New Car Price</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-depr-price-display">$35,000</span></div>' +
        '<input type="range" id="adv-depr-price" min="10000" max="60000" step="1000" value="35000">' +
        '</div>' +
        '<div class="compare-info" style="margin-top:8px">New car loses ~20% in year 1 and ~50% in 5 years.<br>Buying a 2–3 year old car lets you skip the steepest depreciation.</div>' +
        '</div>' +
        '<div class="adv-results">' +
        '<div id="adv-depr-bars">' + deprBarsHtml(deprPrice) + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('Depreciation', 'The loss in value of an asset over time. Cars depreciate faster than almost any other major purchase. Unlike a home, a car never appreciates.') +
        conceptCard('Certified Pre-Owned (CPO)', 'A used car that has been inspected and reconditioned by the manufacturer. Usually comes with an extended warranty. Often the best value — you skip year-1 depreciation while getting manufacturer backing.') +
        '</div>' +
        caseStudy('A $35,000 new car is worth ~$23,800 after 2 years. Buying the same model 2 years used for ~$24,000 vs new for $35,000 saves $11,000 upfront. Invested at 10.5% for 30 years, that $11,000 becomes $' + Math.round(calcDCA(0, 0, 30, RATES.sp500Avg).final + 11000 * Math.pow(1 + RATES.sp500Avg, 30)).toLocaleString() + '.') +
        learnMoreLinks([
            { label: 'Edmunds Depreciation Data', url: 'https://www.edmunds.com/car-buying/understanding-car-depreciation.html' },
            { label: 'CarGurus New vs Used', url: 'https://www.cargurus.com/Cars/articles/new_vs_used_car' },
        ]) +
        quizHtml([
            { q: 'Roughly how much does a new car lose in value in its first year?', opts: ['About 5%', 'About 10%', 'About 20%', 'About 50%'], correct: 2, explanation: 'The average new car loses 15–25% of its value in the first year due to the "new car premium" disappearing the moment you drive off the lot.' },
            { q: 'What is the main financial advantage of buying a 2–3 year old used car?', opts: ['Lower insurance costs', 'You skip the steepest part of the depreciation curve', 'Better fuel economy', 'Easier financing'], correct: 1, explanation: 'Years 1–3 are when cars lose value fastest. By buying used, someone else absorbs that loss. You get most of the car\'s remaining life for significantly less money.' },
        ])
    );

    // --- Sub-topic 2: Lease vs Buy ---
    html += advBlock('📋', 'Lease vs Buy Analysis',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group">' +
        '<div class="control-label">Car Price</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-lease-price-display">$35,000</span></div>' +
        '<input type="range" id="adv-lease-price" min="15000" max="60000" step="1000" value="35000">' +
        '</div>' +
        '<div class="control-group">' +
        '<div class="control-label">Lease Term</div>' +
        '<select id="adv-lease-term">' +
        ['24','36','48'].map(function(t) { return '<option value="' + t + '"' + (t === '36' ? ' selected' : '') + '>' + t + ' months</option>'; }).join('') +
        '</select>' +
        '</div>' +
        '<div class="compare-info">Assumes residual = 55% of MSRP, money factor = 0.0015 (~3.6% APR), 5-year ownership comparison.</div>' +
        '</div>' +
        '<div class="adv-results">' +
        '<div class="stats-block" id="adv-lease-results">—</div>' +
        '</div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('Money Factor', 'The lease equivalent of an interest rate. Multiply by 2,400 to convert to APR. A money factor of 0.0015 = 3.6% APR.') +
        conceptCard('Residual Value', 'What the car is projected to be worth at the end of the lease. Higher residual = lower monthly payment. The leasing company bears depreciation risk above or below this number.') +
        conceptCard('When Leasing Makes Sense', 'Leasing makes sense if: (1) you always want a new car every 3 years, (2) the car is for business (lease payments can be deductible), or (3) you drive fewer than 12,000 miles/year.') +
        '</div>' +
        caseStudy('Leasing a $35k car every 3 years for 9 years costs more in total than buying once and keeping it. But driving 3 different new cars vs one aging car is a lifestyle choice — the math just makes clear what that choice costs.') +
        learnMoreLinks([
            { label: 'Consumer Reports: Lease vs Buy', url: 'https://www.consumerreports.org/cars/car-financing/should-you-lease-or-buy-your-next-car-a5852180986/' },
            { label: 'Lease vs Buy Calculator (Bankrate)', url: 'https://www.bankrate.com/loans/auto-loans/lease-vs-buy-calculator/' },
        ]) +
        quizHtml([
            { q: 'At the end of a lease, what happens to the equity you built?', opts: ['You keep it as a credit toward the next lease', 'There is no equity — you own nothing', 'You can withdraw it like a savings account', 'It converts to a down payment automatically'], correct: 1, explanation: 'Leasing is essentially renting a car. You make payments for the depreciation, but own nothing at the end. Buying builds equity (the car has resale value).' },
        ])
    );

    // --- Sub-topic 3: Total Cost of Ownership ---
    html += advBlock('🧾', 'Total Cost of Ownership',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group"><div class="control-label">Car Price</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tco-price-display">$30,000</span></div>' +
        '<input type="range" id="adv-tco-price" min="10000" max="60000" step="1000" value="30000"></div>' +
        '<div class="control-group"><div class="control-label">Annual Insurance</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tco-ins-display">$1,800</span></div>' +
        '<input type="range" id="adv-tco-ins" min="600" max="4000" step="100" value="1800"></div>' +
        '<div class="control-group"><div class="control-label">Annual Maintenance</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tco-maint-display">$800</span></div>' +
        '<input type="range" id="adv-tco-maint" min="200" max="3000" step="100" value="800"></div>' +
        '<div class="control-group"><div class="control-label">Annual Fuel</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tco-fuel-display">$2,000</span></div>' +
        '<input type="range" id="adv-tco-fuel" min="500" max="5000" step="100" value="2000"></div>' +
        '</div>' +
        '<div class="adv-results"><div class="stats-block" id="adv-tco-results">—</div></div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('Total Cost of Ownership (TCO)', 'The sticker price is the least important number. TCO includes loan interest, insurance, maintenance, fuel, registration, and depreciation — often 2–3x the purchase price over 5 years.') +
        '</div>' +
        learnMoreLinks([
            { label: 'AAA Annual Driving Cost Report', url: 'https://newsroom.aaa.com/auto/your-driving-costs/' },
            { label: 'True Cost to Own (Edmunds)', url: 'https://www.edmunds.com/tco.html' },
        ]) +
        quizHtml([
            { q: 'The average American spends how much per year to own and operate a car (AAA 2024)?', opts: ['About $3,000', 'About $6,000', 'About $10,000–$12,000', 'About $20,000'], correct: 2, explanation: 'According to AAA\'s 2024 report, the average annual cost to own and operate a new car is approximately $10,000–$12,000 when you include loan payments, insurance, fuel, maintenance, and depreciation.' },
        ])
    );

    html += '</div>';
    scenarioStats.innerHTML = html;
    comparisonCards.innerHTML = '';
    attachAdvCarEvents();
}

function attachAdvCarEvents() {
    var deprEl = document.getElementById('adv-depr-price');
    if (deprEl) {
        deprEl.addEventListener('input', function() {
            var p = parseInt(this.value, 10);
            document.getElementById('adv-depr-price-display').textContent = fmtDollarFull(p);
            var schedule = calcDepreciation(p, 10);
            var html2 = '<div class="depr-bar-wrap">';
            schedule.forEach(function(pt) {
                html2 += '<div class="depr-year-row">' +
                    '<div class="depr-year-label">Year ' + pt.year + '</div>' +
                    '<div class="depr-bar-track"><div class="depr-bar-fill" style="width:' + (DEPRECIATION_CURVE[pt.year] * 100).toFixed(0) + '%"></div></div>' +
                    '<div class="depr-value">' + fmtDollarFull(pt.value) + '</div>' +
                    '</div>';
            });
            html2 += '</div>';
            document.getElementById('adv-depr-bars').innerHTML = html2;
        });
    }

    function updateLease() {
        var price = parseInt(document.getElementById('adv-lease-price').value, 10);
        var term  = parseInt(document.getElementById('adv-lease-term').value, 10);
        document.getElementById('adv-lease-price-display').textContent = fmtDollarFull(price);
        var r = calcLeaseVsBuy(price, term, 0.0015, 0.55, 5);
        document.getElementById('adv-lease-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Lease monthly payment (est.)</span><span class="stat-value">' + fmtDollarFull(r.leaseMonthly) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Buy monthly payment (7% APR, 5yr)</span><span class="stat-value">' + fmtDollarFull(r.buyMonthly) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Total lease cost over 5 years</span><span class="stat-value red">' + fmtDollarFull(r.leaseTotalCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Net buy cost over 5 years (after resale)</span><span class="stat-value green">' + fmtDollarFull(r.netBuyCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Residual value of car at 5 years</span><span class="stat-value gold">' + fmtDollarFull(r.residualValue) + '</span></div>',
        ].join('');
    }
    var leasePrice = document.getElementById('adv-lease-price');
    var leaseTerm  = document.getElementById('adv-lease-term');
    if (leasePrice) { leasePrice.addEventListener('input', updateLease); leaseTerm.addEventListener('change', updateLease); updateLease(); }

    function updateTCO() {
        var price = parseInt(document.getElementById('adv-tco-price').value, 10);
        var ins   = parseInt(document.getElementById('adv-tco-ins').value, 10);
        var maint = parseInt(document.getElementById('adv-tco-maint').value, 10);
        var fuel  = parseInt(document.getElementById('adv-tco-fuel').value, 10);
        document.getElementById('adv-tco-price-display').textContent = fmtDollarFull(price);
        document.getElementById('adv-tco-ins-display').textContent   = fmtDollarFull(ins);
        document.getElementById('adv-tco-maint-display').textContent = fmtDollarFull(maint);
        document.getElementById('adv-tco-fuel-display').textContent  = fmtDollarFull(fuel);
        var loan = calcLoan(price * 0.9, RATES.carLoan, 5);
        var r = calcCarTCO(price, loan, ins, maint, fuel, 5);
        document.getElementById('adv-tco-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Loan payments + interest (5yr)</span><span class="stat-value red">' + fmtDollarFull(r.loanCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Insurance (5yr)</span><span class="stat-value red">' + fmtDollarFull(r.insuranceCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Maintenance (5yr)</span><span class="stat-value red">' + fmtDollarFull(r.maintenanceCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Fuel (5yr)</span><span class="stat-value red">' + fmtDollarFull(r.fuelCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Depreciation (5yr)</span><span class="stat-value red">' + fmtDollarFull(r.depreciation) + '</span></div>',
            '<div class="stat-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px"><span class="stat-label"><strong>Total 5-Year Cost</strong></span><span class="stat-value red"><strong>' + fmtDollarFull(r.total) + '</strong></span></div>',
            '<div class="stat-row"><span class="stat-label">True monthly cost</span><span class="stat-value">' + fmtDollarFull(r.perMonth) + '/mo</span></div>',
        ].join('');
    }
    var tcoPrice = document.getElementById('adv-tco-price');
    if (tcoPrice) {
        ['adv-tco-price','adv-tco-ins','adv-tco-maint','adv-tco-fuel'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateTCO);
        });
        updateTCO();
    }
}

// ----- ADVANCED CREDIT -----
function loadAdvancedCredit() {
    chartWrapper.classList.add('hidden');
    scenarioInsight.classList.add('hidden');
    scenarioControls.innerHTML = '';

    var html = '<div class="adv-section">';

    // --- Sub-topic 1: Avalanche vs Snowball ---
    html += advBlock('⛰️', 'Avalanche vs Snowball Payoff Methods',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group"><div class="control-label">Credit Card Balance</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-av-cc-display">$3,000</span></div>' +
        '<input type="range" id="adv-av-cc" min="500" max="10000" step="250" value="3000"></div>' +
        '<div class="control-group"><div class="control-label">Auto Loan Balance</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-av-car-display">$8,000</span></div>' +
        '<input type="range" id="adv-av-car" min="1000" max="20000" step="500" value="8000"></div>' +
        '<div class="control-group"><div class="control-label">Student Loan Balance</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-av-student-display">$15,000</span></div>' +
        '<input type="range" id="adv-av-student" min="1000" max="50000" step="1000" value="15000"></div>' +
        '<div class="control-group"><div class="control-label">Extra Monthly Payment</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-av-extra-display">$200</span></div>' +
        '<input type="range" id="adv-av-extra" min="0" max="500" step="25" value="200"></div>' +
        '</div>' +
        '<div class="adv-results"><div class="stats-block" id="adv-av-results">—</div></div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('Avalanche Method', 'Pay minimums on all debts, then throw every extra dollar at the highest-APR debt first. Mathematically optimal — saves the most interest.') +
        conceptCard('Snowball Method', 'Pay minimums on all debts, then throw every extra dollar at the smallest balance first. Creates early "wins" that build motivation. May cost slightly more in interest.') +
        conceptCard('Which Should You Choose?', 'If you\'re disciplined: Avalanche. If you\'ve tried to pay off debt before and quit: Snowball. The best method is the one you\'ll actually stick to.') +
        '</div>' +
        caseStudy('$3k CC at 24%, $8k auto at 7%, $15k student loan at 5%. With $200 extra/month: Avalanche pays off in less time and saves hundreds in interest vs Snowball.') +
        learnMoreLinks([
            { label: 'Debt Avalanche (NerdWallet)', url: 'https://www.nerdwallet.com/article/finance/what-is-a-debt-avalanche' },
            { label: 'Debt Snowball (Ramsey Solutions)', url: 'https://www.ramseysolutions.com/debt/how-the-debt-snowball-method-works' },
        ]) +
        quizHtml([
            { q: 'The Avalanche method targets debts in what order?', opts: ['Smallest balance first', 'Largest balance first', 'Highest interest rate first', 'Oldest debt first'], correct: 2, explanation: 'Avalanche targets the highest APR first, minimizing the total interest you pay. This is mathematically the cheapest way to pay off multiple debts.' },
            { q: 'Why might someone choose the Snowball method despite paying more interest?', opts: ['It\'s faster', 'Early wins from eliminating small debts build motivation and momentum', 'It improves your credit score faster', 'It reduces your monthly minimums sooner'], correct: 1, explanation: 'Behavioral economics shows that small wins keep people motivated. Dave Ramsey popularized Snowball for this reason — a method you\'ll stick to beats an optimal one you\'ll abandon.' },
        ])
    );

    // --- Sub-topic 2: Credit Scores ---
    var ficoDonuts = '<div class="fico-chart-wrap">';
    // Simple SVG pie
    var cx = 60, cy = 60, r = 50;
    ficoDonuts += '<svg viewBox="0 0 120 120" width="120" height="120" style="flex-shrink:0">';
    var startAngle = -Math.PI / 2;
    FICO_FACTORS.forEach(function(f) {
        var angle = (f.pct / 100) * 2 * Math.PI;
        var x1 = cx + r * Math.cos(startAngle);
        var y1 = cy + r * Math.sin(startAngle);
        var x2 = cx + r * Math.cos(startAngle + angle);
        var y2 = cy + r * Math.sin(startAngle + angle);
        var large = angle > Math.PI ? 1 : 0;
        ficoDonuts += '<path d="M ' + cx + ' ' + cy + ' L ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
            ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' Z"' +
            ' fill="' + f.color + '" opacity="0.85"/>';
        startAngle += angle;
    });
    ficoDonuts += '</svg>';
    ficoDonuts += '<div class="fico-legend">';
    FICO_FACTORS.forEach(function(f) {
        ficoDonuts += '<div class="fico-legend-item"><div class="fico-swatch" style="background:' + f.color + '"></div>' +
            '<span class="fico-pct">' + f.pct + '%</span><span>' + f.label + '</span></div>';
    });
    ficoDonuts += '</div></div>';

    html += advBlock('📊', 'How Credit Scores Are Calculated',
        ficoDonuts +
        '<div class="concept-cards" style="margin-top:16px">' +
        FICO_FACTORS.map(function(f) {
            return conceptCard(f.label + ' (' + f.pct + '%)', f.description);
        }).join('') +
        '</div>' +
        caseStudy('Missing a single payment on a $30 bill can drop your credit score 60–110 points. A score drop from 760 to 650 on a $300,000 mortgage can cost you 1–2% more in interest — roughly $60,000–$120,000 over 30 years.') +
        learnMoreLinks([
            { label: 'myFICO Score Simulator', url: 'https://www.myfico.com/credit-education/credit-score-range' },
            { label: 'Experian Credit Score Guide', url: 'https://www.experian.com/blogs/ask-experian/credit-education/score-basics/what-is-a-good-credit-score/' },
            { label: 'How to Improve Your Score (CFPB)', url: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-improve-my-credit-score-en-315/' },
        ]) +
        quizHtml([
            { q: 'What is the single most important factor in your FICO score?', opts: ['Credit utilization (30%)', 'Payment history (35%)', 'Credit mix (10%)', 'Length of history (15%)'], correct: 1, explanation: 'Payment history is 35% of your FICO score — the single largest factor. Paying every bill on time, every time, is the most impactful thing you can do for your credit.' },
            { q: 'If you want to improve your credit score quickly, what is the most effective action?', opts: ['Open several new credit cards', 'Close old unused accounts', 'Pay down balances to reduce utilization below 30%', 'Apply for a personal loan'], correct: 2, explanation: 'Credit utilization (amounts owed) is 30% of your score and can change month-to-month. Paying down balances to below 30% of your credit limit — ideally below 10% — is the fastest legal way to boost your score.' },
            { q: 'Should you close old credit cards you don\'t use?', opts: ['Yes — fewer cards means less risk', 'No — closing them reduces your average account age and available credit, lowering your score', 'It doesn\'t matter either way', 'Yes, but only if they have an annual fee'], correct: 1, explanation: 'Closing old cards hurts two factors: (1) it reduces your total available credit (raising utilization %) and (2) it can lower your average account age. Keep old cards open and use them occasionally.' },
        ])
    );

    // --- Sub-topic 3: Balance Transfer ---
    html += advBlock('🔄', 'Balance Transfer / 0% APR Promotions',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group"><div class="control-label">Balance to Transfer</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-bt-bal-display">$5,000</span></div>' +
        '<input type="range" id="adv-bt-bal" min="500" max="15000" step="250" value="5000"></div>' +
        '<div class="control-group"><div class="control-label">Transfer Fee</div>' +
        '<select id="adv-bt-fee"><option value="0.03">3%</option><option value="0.05" selected>5%</option></select>' +
        '</div>' +
        '<div class="control-group"><div class="control-label">0% Promo Period</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-bt-promo-display">15</span><span class="slider-unit"> months</span></div>' +
        '<input type="range" id="adv-bt-promo" min="6" max="21" step="3" value="15"></div>' +
        '<div class="control-group"><div class="control-label">Monthly Payment</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-bt-pay-display">$200</span></div>' +
        '<input type="range" id="adv-bt-pay" min="50" max="600" step="25" value="200"></div>' +
        '</div>' +
        '<div class="adv-results"><div class="stats-block" id="adv-bt-results">—</div></div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('Balance Transfer', 'Moving debt from a high-APR card to a new card offering 0% for a promotional period (usually 12–21 months). You pay a transfer fee (3–5%), but pay no interest during the promo period.') +
        conceptCard('The Trap: Deferred Interest', 'Some cards (especially store cards) use deferred interest — if you don\'t pay off the full balance before the promo ends, you owe ALL the interest that accrued retroactively. Read the fine print carefully.') +
        conceptCard('When Balance Transfers Work', 'Balance transfers work best when: (1) you have a concrete plan to pay it off during the 0% period, (2) the transfer fee is less than the interest you\'d otherwise pay, and (3) you don\'t add new charges to either card.') +
        '</div>' +
        learnMoreLinks([
            { label: 'CFPB Balance Transfer Guide', url: 'https://www.consumerfinance.gov/ask-cfpb/what-should-i-know-about-balance-transfer-credit-cards-en-1445/' },
            { label: 'Best Balance Transfer Cards (NerdWallet)', url: 'https://www.nerdwallet.com/best/credit-cards/balance-transfer' },
        ]) +
        quizHtml([
            { q: 'You transfer $5,000 with a 5% fee and a 15-month 0% promo. What is your total balance after the transfer fee?', opts: ['$5,000', '$5,150', '$5,250', '$5,500'], correct: 2, explanation: '5% of $5,000 = $250 fee. Your new balance is $5,250. You need to pay this off within 15 months to avoid the fallback interest rate.' },
            { q: 'What is "deferred interest" and why is it dangerous?', opts: ['Interest that is forgiven after the promo period', 'Interest that accumulates but is charged retroactively if not paid off in time', 'A lower APR offered to loyal customers', 'Interest on purchases made after the transfer'], correct: 1, explanation: 'Deferred interest means the interest was silently accruing during the promo period. If you don\'t pay the full balance before the promo ends, you owe all of it at once. This is different from a true 0% APR offer.' },
        ])
    );

    html += '</div>';
    scenarioStats.innerHTML = html;
    comparisonCards.innerHTML = '';
    attachAdvCreditEvents();
}

function attachAdvCreditEvents() {
    function updateAvalanche() {
        var cc       = parseInt(document.getElementById('adv-av-cc').value, 10);
        var car      = parseInt(document.getElementById('adv-av-car').value, 10);
        var student  = parseInt(document.getElementById('adv-av-student').value, 10);
        var extra    = parseInt(document.getElementById('adv-av-extra').value, 10);
        document.getElementById('adv-av-cc-display').textContent      = fmtDollarFull(cc);
        document.getElementById('adv-av-car-display').textContent     = fmtDollarFull(car);
        document.getElementById('adv-av-student-display').textContent = fmtDollarFull(student);
        document.getElementById('adv-av-extra-display').textContent   = '$' + extra;
        var debts = [
            { name: 'Credit Card', balance: cc,      apr: 0.24, minPayment: Math.max(cc * 0.02, 25) },
            { name: 'Auto Loan',   balance: car,     apr: 0.07, minPayment: calcLoan(car, 0.07, 4).monthlyPayment },
            { name: 'Student Loan',balance: student, apr: 0.05, minPayment: calcLoan(student, 0.05, 10).monthlyPayment },
        ];
        var r = calcAvalancheVsSnowball(debts, extra);
        document.getElementById('adv-av-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Avalanche payoff time</span><span class="stat-value green">' + fmtMonths(r.avalanche.months) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Avalanche total interest</span><span class="stat-value red">' + fmtDollarFull(r.avalanche.totalInterest) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Snowball payoff time</span><span class="stat-value gold">' + fmtMonths(r.snowball.months) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Snowball total interest</span><span class="stat-value red">' + fmtDollarFull(r.snowball.totalInterest) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Avalanche saves vs Snowball</span><span class="stat-value green">' + fmtDollarFull(Math.abs(r.snowball.totalInterest - r.avalanche.totalInterest)) + '</span></div>',
        ].join('');
    }
    var avCC = document.getElementById('adv-av-cc');
    if (avCC) {
        ['adv-av-cc','adv-av-car','adv-av-student','adv-av-extra'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateAvalanche);
        });
        updateAvalanche();
    }

    function updateBT() {
        var bal   = parseInt(document.getElementById('adv-bt-bal').value, 10);
        var fee   = parseFloat(document.getElementById('adv-bt-fee').value);
        var promo = parseInt(document.getElementById('adv-bt-promo').value, 10);
        var pay   = parseInt(document.getElementById('adv-bt-pay').value, 10);
        document.getElementById('adv-bt-bal-display').textContent   = fmtDollarFull(bal);
        document.getElementById('adv-bt-promo-display').textContent = promo;
        document.getElementById('adv-bt-pay-display').textContent   = '$' + pay;
        var r = calcBalanceTransfer(bal, fee, promo, pay, 0.28);
        document.getElementById('adv-bt-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Transfer fee</span><span class="stat-value red">' + fmtDollarFull(r.transferFee) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Balance remaining at promo end</span><span class="stat-value ' + (r.paidOffInPromo ? 'green' : 'red') + '">' + fmtDollarFull(r.balanceAtPromoEnd) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Interest after promo (if not paid off)</span><span class="stat-value red">' + fmtDollarFull(r.fallbackInterest) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Total extra cost (fee + fallback interest)</span><span class="stat-value red">' + fmtDollarFull(r.totalCost) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Savings vs staying on old card</span><span class="stat-value ' + (r.savings > 0 ? 'green' : 'red') + '">' + (r.savings > 0 ? '+' : '') + fmtDollarFull(r.savings) + '</span></div>',
            r.paidOffInPromo ? '<div style="color:var(--green);font-size:0.85rem;margin-top:8px">✓ Paid off during promo — no fallback interest!</div>' :
                '<div style="color:var(--red);font-size:0.85rem;margin-top:8px">⚠ Not paid off during promo. Increase payment or choose longer promo.</div>',
        ].join('');
    }
    var btBal = document.getElementById('adv-bt-bal');
    if (btBal) {
        ['adv-bt-bal','adv-bt-promo','adv-bt-pay'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateBT);
        });
        document.getElementById('adv-bt-fee').addEventListener('change', updateBT);
        updateBT();
    }
}

// ----- ADVANCED HOME -----
function loadAdvancedHome() {
    chartWrapper.classList.add('hidden');
    scenarioInsight.classList.add('hidden');
    scenarioControls.innerHTML = '';

    var html = '<div class="adv-section">';

    // --- Sub-topic 1: Rent vs Buy ---
    html += advBlock('🏘️', 'Rent vs Buy Break-Even Analysis',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group"><div class="control-label">Home Price</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-rvb-price-display">$350,000</span></div>' +
        '<input type="range" id="adv-rvb-price" min="150000" max="800000" step="10000" value="350000"></div>' +
        '<div class="control-group"><div class="control-label">Down Payment</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-rvb-down-display">20%</span></div>' +
        '<input type="range" id="adv-rvb-down" min="5" max="40" step="5" value="20"></div>' +
        '<div class="control-group"><div class="control-label">Equivalent Monthly Rent</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-rvb-rent-display">$1,800</span></div>' +
        '<input type="range" id="adv-rvb-rent" min="500" max="5000" step="100" value="1800"></div>' +
        '<div class="control-group"><div class="control-label">Annual Home Appreciation</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-rvb-appr-display">3%</span></div>' +
        '<input type="range" id="adv-rvb-appr" min="0" max="7" step="0.5" value="3"></div>' +
        '</div>' +
        '<div class="adv-results"><div class="stats-block" id="adv-rvb-results">—</div></div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('The Price-to-Rent Ratio', 'Divide the home price by annual rent. Under 15: buying likely makes sense. 15–20: neutral zone. Over 20: renting is often cheaper. In expensive cities this ratio is often 25–40.') +
        conceptCard('Transaction Costs', 'Buying a home costs 2–5% in closing costs upfront. Selling costs ~6% in agent fees. These transaction costs mean you need to stay long enough for appreciation to cover them — typically 4–7 years.') +
        conceptCard('The True Cost of Renting', 'Renters often invest the money they would have used for a down payment. If invested well, this can partially or fully offset the "lost" equity of renting.') +
        '</div>' +
        caseStudy('In a median US market, a $350k home at 7% on a 30-year mortgage vs renting the equivalent for $1,800/mo: owning typically breaks even vs renting in 5–7 years after accounting for appreciation, transaction costs, and the invested down payment.') +
        learnMoreLinks([
            { label: 'NYT Rent vs Buy Calculator', url: 'https://www.nytimes.com/interactive/2014/upshot/buy-rent-calculator.html' },
            { label: 'CFPB Mortgage Guide', url: 'https://www.consumerfinance.gov/owning-a-home/' },
        ]) +
        quizHtml([
            { q: 'A house costs $400,000. Annual rent for a comparable home is $18,000. What is the price-to-rent ratio?', opts: ['About 10', 'About 14', 'About 22', 'About 33'], correct: 2, explanation: '$400,000 / $18,000 = 22.2. This is in the "high" range, suggesting renting may be cheaper unless you plan to stay long-term and expect significant appreciation.' },
            { q: 'Why do transaction costs make short-term homeownership risky?', opts: ['You pay property taxes from day one', 'Buying + selling costs ~8–11% of the home price, requiring appreciation to break even', 'Mortgage rates are higher for short terms', 'Banks charge prepayment penalties'], correct: 1, explanation: 'Closing costs to buy (~3%) plus agent fees to sell (~6%) total ~9% of the home price. On a $300k home that\'s $27,000 you need to "earn back" through appreciation before you truly profit.' },
        ])
    );

    // --- Sub-topic 2: PMI ---
    html += advBlock('🛡️', 'PMI — The Hidden Cost of Putting Less Than 20% Down',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group"><div class="control-label">Home Price</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-pmi-price-display">$300,000</span></div>' +
        '<input type="range" id="adv-pmi-price" min="100000" max="700000" step="10000" value="300000"></div>' +
        '<div class="control-group"><div class="control-label">Down Payment %</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-pmi-down-display">10%</span></div>' +
        '<input type="range" id="adv-pmi-down" min="3" max="19" step="1" value="10"></div>' +
        '<div class="control-group"><div class="control-label">PMI Rate (annual)</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-pmi-rate-display">0.8%</span></div>' +
        '<input type="range" id="adv-pmi-rate" min="0.3" max="1.5" step="0.1" value="0.8"></div>' +
        '</div>' +
        '<div class="adv-results"><div class="stats-block" id="adv-pmi-results">—</div></div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('PMI (Private Mortgage Insurance)', 'Required when your down payment is less than 20%. It protects the lender — not you — if you default. Typically 0.5–1.5% of the loan annually, added to your monthly payment.') +
        conceptCard('How to Get Rid of PMI', 'Under the Homeowners Protection Act, you can request PMI cancellation when you reach 20% equity. Lenders must automatically cancel it at 22% equity. You can also request a new appraisal if your home appreciated.') +
        conceptCard('FHA Loans', 'FHA loans allow as low as 3.5% down but require mortgage insurance premium (MIP) for the life of the loan (if less than 10% down). Conventional loans are often better long-term once you have 5–10% down.') +
        '</div>' +
        learnMoreLinks([
            { label: 'CFPB: What is PMI?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/' },
            { label: 'HUD FHA Loan Info', url: 'https://www.hud.gov/buying/loans' },
        ]) +
        quizHtml([
            { q: 'PMI (Private Mortgage Insurance) primarily protects whom?', opts: ['The homebuyer', 'The lender', 'The insurance company', 'The government'], correct: 1, explanation: 'PMI protects the lender if you default on your loan. You pay for it monthly, but it provides zero benefit to you. It exists because lenders consider loans with less than 20% equity higher risk.' },
            { q: 'At what equity percentage can you request PMI cancellation on a conventional loan?', opts: ['10%', '15%', '20%', '25%'], correct: 2, explanation: 'Under the Homeowners Protection Act of 1998, you can request PMI cancellation once you reach 20% equity. Lenders must automatically cancel it at 22% equity based on the original amortization schedule.' },
        ])
    );

    // --- Sub-topic 3: True Monthly Cost ---
    html += advBlock('📋', 'True Monthly Cost of Homeownership',
        '<div class="adv-cols">' +
        '<div class="adv-controls">' +
        '<div class="control-group"><div class="control-label">Home Price</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tmc-price-display">$350,000</span></div>' +
        '<input type="range" id="adv-tmc-price" min="150000" max="800000" step="10000" value="350000"></div>' +
        '<div class="control-group"><div class="control-label">Property Tax Rate</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tmc-tax-display">1.2%</span></div>' +
        '<input type="range" id="adv-tmc-tax" min="0.3" max="3.0" step="0.1" value="1.2"></div>' +
        '<div class="control-group"><div class="control-label">Annual Insurance</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tmc-ins-display">$1,500</span></div>' +
        '<input type="range" id="adv-tmc-ins" min="500" max="5000" step="100" value="1500"></div>' +
        '<div class="control-group"><div class="control-label">Monthly HOA</div>' +
        '<div class="slider-display"><span class="slider-value" id="adv-tmc-hoa-display">$0</span></div>' +
        '<input type="range" id="adv-tmc-hoa" min="0" max="800" step="25" value="0"></div>' +
        '</div>' +
        '<div class="adv-results"><div class="stats-block" id="adv-tmc-results">—</div></div>' +
        '</div>' +
        '<div class="concept-cards" style="margin-top:16px">' +
        conceptCard('PITI', 'Principal, Interest, Taxes, Insurance — the four components of a full mortgage payment. Lenders qualify you based on PITI, not just the principal + interest.') +
        conceptCard('The 1% Maintenance Rule', 'Budget 1–2% of your home\'s value per year for maintenance and repairs. On a $350k home, that\'s $3,500–$7,000/year ($290–$580/month) — on top of your mortgage.') +
        conceptCard('Escrow Account', 'Most lenders collect property taxes and insurance monthly via an escrow account, then pay them annually on your behalf. This is why your "mortgage payment" is typically higher than just principal + interest.') +
        '</div>' +
        caseStudy('A $350k home at 7% (30yr, 20% down) has a P+I payment of $1,863/mo. Add property tax ($350/mo), insurance ($125/mo), and maintenance reserve ($350/mo) — true monthly cost: ~$2,688. That\'s $825/mo more than the advertised payment.') +
        learnMoreLinks([
            { label: 'Bankrate Mortgage Calculator', url: 'https://www.bankrate.com/mortgages/mortgage-calculator/' },
            { label: 'CFPB: Understanding Closing Costs', url: 'https://www.consumerfinance.gov/owning-a-home/closing-disclosure/' },
        ]) +
        quizHtml([
            { q: 'What does PITI stand for in mortgage terminology?', opts: ['Payment, Interest, Taxes, Insurance', 'Principal, Interest, Taxes, Insurance', 'Principal, Installment, Title, Insurance', 'Payment, Index, Taxes, Installment'], correct: 1, explanation: 'PITI = Principal + Interest + Taxes + Insurance. These are the four components that make up your total monthly housing payment. Lenders use PITI to calculate your debt-to-income ratio.' },
            { q: 'Using the 1% maintenance rule, how much should you budget annually for a $400,000 home?', opts: ['$400/year', '$2,000/year', '$4,000/year', '$10,000/year'], correct: 2, explanation: '1% of $400,000 = $4,000/year, or about $333/month. This covers routine maintenance, appliance replacement, and unexpected repairs. Older homes or those in harsh climates should budget 1.5–2%.' },
        ])
    );

    html += '</div>';
    scenarioStats.innerHTML = html;
    comparisonCards.innerHTML = '';
    attachAdvHomeEvents();
}

function attachAdvHomeEvents() {
    function updateRvB() {
        var price = parseInt(document.getElementById('adv-rvb-price').value, 10);
        var downP = parseInt(document.getElementById('adv-rvb-down').value, 10) / 100;
        var rent  = parseInt(document.getElementById('adv-rvb-rent').value, 10);
        var appr  = parseFloat(document.getElementById('adv-rvb-appr').value) / 100;
        document.getElementById('adv-rvb-price-display').textContent = fmtDollarFull(price);
        document.getElementById('adv-rvb-down-display').textContent  = Math.round(downP * 100) + '%';
        document.getElementById('adv-rvb-rent-display').textContent  = fmtDollarFull(rent);
        document.getElementById('adv-rvb-appr-display').textContent  = (appr * 100).toFixed(1) + '%';
        var r = calcRentVsBuy(price, downP, RATES.mortgage30yr, rent, appr, 15);
        var beText = r.breakEvenYear ? 'Year ' + r.breakEvenYear : 'Renting costs less for full 15-year window';
        document.getElementById('adv-rvb-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Break-even year (buying becomes cheaper)</span><span class="stat-value gold">' + beText + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Home value at year 15</span><span class="stat-value green">' + fmtDollarFull(r.homeValueAtEnd) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Remaining mortgage at year 15</span><span class="stat-value red">' + fmtDollarFull(r.remainingBalance) + '</span></div>',
            '<div class="stat-row"><span class="stat-label">Net equity at year 15</span><span class="stat-value green">' + fmtDollarFull(r.homeValueAtEnd - r.remainingBalance) + '</span></div>',
        ].join('');
    }
    var rvbPrice = document.getElementById('adv-rvb-price');
    if (rvbPrice) {
        ['adv-rvb-price','adv-rvb-down','adv-rvb-rent','adv-rvb-appr'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateRvB);
        });
        updateRvB();
    }

    function updatePMI() {
        var price   = parseInt(document.getElementById('adv-pmi-price').value, 10);
        var downPct = parseInt(document.getElementById('adv-pmi-down').value, 10) / 100;
        var pmiRate = parseFloat(document.getElementById('adv-pmi-rate').value) / 100;
        document.getElementById('adv-pmi-price-display').textContent = fmtDollarFull(price);
        document.getElementById('adv-pmi-down-display').textContent  = Math.round(downPct * 100) + '%';
        document.getElementById('adv-pmi-rate-display').textContent  = (pmiRate * 100).toFixed(1) + '%';
        var r = calcPMI(price, downPct, pmiRate, RATES.mortgage30yr, 30);
        document.getElementById('adv-pmi-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Base monthly payment (P+I only)</span><span class="stat-value">' + fmtDollarFull(r.basePayment) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">PMI monthly cost</span><span class="stat-value red">' + fmtDollarFull(r.monthlyPMI) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Total monthly with PMI</span><span class="stat-value red">' + fmtDollarFull(r.monthlyPaymentWithPMI) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Months until PMI drops off</span><span class="stat-value gold">' + r.pmiMonths + ' months (' + (r.pmiMonths / 12).toFixed(1) + ' years)</span></div>',
            '<div class="stat-row"><span class="stat-label">Total PMI paid</span><span class="stat-value red">' + fmtDollarFull(r.totalPMI) + '</span></div>',
        ].join('');
    }
    var pmiPrice = document.getElementById('adv-pmi-price');
    if (pmiPrice) {
        ['adv-pmi-price','adv-pmi-down','adv-pmi-rate'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updatePMI);
        });
        updatePMI();
    }

    function updateTMC() {
        var price = parseInt(document.getElementById('adv-tmc-price').value, 10);
        var tax   = parseFloat(document.getElementById('adv-tmc-tax').value) / 100;
        var ins   = parseInt(document.getElementById('adv-tmc-ins').value, 10);
        var hoa   = parseInt(document.getElementById('adv-tmc-hoa').value, 10);
        document.getElementById('adv-tmc-price-display').textContent = fmtDollarFull(price);
        document.getElementById('adv-tmc-tax-display').textContent   = (tax * 100).toFixed(1) + '%';
        document.getElementById('adv-tmc-ins-display').textContent   = fmtDollarFull(ins);
        document.getElementById('adv-tmc-hoa-display').textContent   = '$' + hoa;
        var r = calcTrueMonthlyCost(price, RATES.mortgage30yr, 30, tax, ins, hoa, 0.01);
        document.getElementById('adv-tmc-results').innerHTML = [
            '<div class="stat-row"><span class="stat-label">Mortgage (P+I)</span><span class="stat-value">' + fmtDollarFull(r.mortgage) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Property tax</span><span class="stat-value red">' + fmtDollarFull(r.tax) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Homeowner\'s insurance</span><span class="stat-value red">' + fmtDollarFull(r.insurance) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">HOA</span><span class="stat-value red">' + fmtDollarFull(r.hoa) + '/mo</span></div>',
            '<div class="stat-row"><span class="stat-label">Maintenance reserve (1%/yr)</span><span class="stat-value red">' + fmtDollarFull(r.maintenance) + '/mo</span></div>',
            '<div class="stat-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px"><span class="stat-label"><strong>True Monthly Cost</strong></span><span class="stat-value red"><strong>' + fmtDollarFull(r.total) + '/mo</strong></span></div>',
            '<div class="stat-row"><span class="stat-label">vs advertised P+I payment</span><span class="stat-value gold">+' + fmtDollarFull(r.difference) + '/mo more</span></div>',
        ].join('');
    }
    var tmcPrice = document.getElementById('adv-tmc-price');
    if (tmcPrice) {
        ['adv-tmc-price','adv-tmc-tax','adv-tmc-ins','adv-tmc-hoa'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateTMC);
        });
        updateTMC();
    }
}
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

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-basic').classList.toggle('active', tab === 'basic');
    document.getElementById('tab-advanced').classList.toggle('active', tab === 'advanced');
    scenarioControls.innerHTML = '';
    scenarioStats.innerHTML    = '';
    comparisonCards.innerHTML  = '';
    scenarioInsight.classList.add('hidden');
    chartWrapper.classList.add('hidden');
    if (tab === 'basic') {
        if (currentScenario === 'invest') loadScenarioInvest();
        if (currentScenario === 'car')    loadScenarioCar();
        if (currentScenario === 'credit') loadScenarioCredit();
        if (currentScenario === 'home')   loadScenarioHome();
    } else {
        if (currentScenario === 'invest') loadAdvancedInvest();
        if (currentScenario === 'car')    loadAdvancedCar();
        if (currentScenario === 'credit') loadAdvancedCredit();
        if (currentScenario === 'home')   loadAdvancedHome();
    }
}

document.getElementById('tab-basic').addEventListener('click', function() { switchTab('basic'); });
document.getElementById('tab-advanced').addEventListener('click', function() { switchTab('advanced'); });

document.querySelectorAll('.scenario-card').forEach(function(card) {
    card.addEventListener('click', function() {
        var sc = this.getAttribute('data-scenario');
        currentScenario = sc;
        currentTab = 'basic';
        document.getElementById('tab-basic').classList.add('active');
        document.getElementById('tab-advanced').classList.remove('active');
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
