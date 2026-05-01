// Money Moves — Financial Data
// S&P 500 Annual Total Returns (price + dividends reinvested, approximate)
// Source: Macrotrends / Slickcharts historical data — for educational purposes only

const SP500_RETURNS = [
    { year: 1990, return: -0.0310 },
    { year: 1991, return:  0.3047 },
    { year: 1992, return:  0.0762 },
    { year: 1993, return:  0.1008 },
    { year: 1994, return:  0.0132 },
    { year: 1995, return:  0.3758 },
    { year: 1996, return:  0.2296 },
    { year: 1997, return:  0.3336 },
    { year: 1998, return:  0.2858 },
    { year: 1999, return:  0.2104 },
    { year: 2000, return: -0.0910 },
    { year: 2001, return: -0.1189 },
    { year: 2002, return: -0.2210 },
    { year: 2003, return:  0.2868 },
    { year: 2004, return:  0.1088 },
    { year: 2005, return:  0.0491 },
    { year: 2006, return:  0.1579 },
    { year: 2007, return:  0.0549 },
    { year: 2008, return: -0.3700 },
    { year: 2009, return:  0.2646 },
    { year: 2010, return:  0.1506 },
    { year: 2011, return:  0.0211 },
    { year: 2012, return:  0.1600 },
    { year: 2013, return:  0.3239 },
    { year: 2014, return:  0.1369 },
    { year: 2015, return:  0.0138 },
    { year: 2016, return:  0.1196 },
    { year: 2017, return:  0.2183 },
    { year: 2018, return: -0.0438 },
    { year: 2019, return:  0.3149 },
    { year: 2020, return:  0.1840 },
    { year: 2021, return:  0.2871 },
    { year: 2022, return: -0.1811 },
    { year: 2023, return:  0.2629 },
    { year: 2024, return:  0.2331 },
];

// Historical average annual total return, S&P 500, 1957–2024
const SP500_AVG = 0.1052;

const RATES = {
    sp500Avg:       SP500_AVG,
    carLoan:        0.0700,   // 7.0%  — average new car loan rate (2024)
    creditCard:     0.2400,   // 24.0% — average credit card APR (2024)
    mortgage30yr:   0.0700,   // 7.0%  — 30-year fixed mortgage (2024)
    mortgage15yr:   0.0650,   // 6.5%  — 15-year fixed mortgage (2024)
};

const DEFAULTS = {
    startAge:           18,
    retireAge:          65,
    monthlyContrib:     100,
    jordanInvestAge:    40,     // Jordan starts investing at 40
    carPrice:           30000,
    carDown:            5000,
    carLoanYears:       5,
    creditBalance:      5000,
    homePrice:          350000,
    homeDownPct:        0.20,
};

const BUFFETT_QUOTES = [
    {
        text:    '"Someone is sitting in the shade today because someone planted a tree a long time ago."',
        context: '— Warren Buffett, on starting early',
        id:      'invest',
    },
    {
        text:    '"The stock market is a device for transferring money from the impatient to the patient."',
        context: '— Warren Buffett, on credit card debt',
        id:      'credit',
    },
    {
        text:    '"Our favorite holding period is forever."',
        context: '— Warren Buffett, on long-term investing',
        id:      'summary',
    },
];

// =========================================================================
// ADVANCED DEEP DIVE DATA
// =========================================================================

// Major S&P 500 bear markets — for the bear market recovery visualizer
const BEAR_MARKETS = [
    {
        name:             'Dot-com Crash',
        start:            'Mar 2000',
        trough:           'Oct 2002',
        peakDrop:         -0.491,
        recoveryMonths:   87,
        note:             'The Nasdaq fell ~78%. The S&P 500 took over 7 years to recover. Investors who stayed in recovered fully; those who sold locked in losses.',
    },
    {
        name:             'Global Financial Crisis',
        start:            'Oct 2007',
        trough:           'Mar 2009',
        peakDrop:         -0.565,
        recoveryMonths:   49,
        note:             'The worst crash since the Great Depression. Banks failed, housing collapsed. The S&P 500 took ~4 years to recover — DCA investors who kept buying at the bottom were richly rewarded.',
    },
    {
        name:             'COVID Crash',
        start:            'Feb 2020',
        trough:           'Mar 2020',
        peakDrop:         -0.340,
        recoveryMonths:   5,
        note:             'The fastest bear market in history — and the fastest recovery. The market was back to all-time highs in just 5 months. Investors who sold in panic missed the entire rebound.',
    },
    {
        name:             '2022 Rate Hike Bear',
        start:            'Jan 2022',
        trough:           'Oct 2022',
        peakDrop:         -0.252,
        recoveryMonths:   21,
        note:             'The Fed raised rates aggressively to fight 40-year-high inflation. Growth stocks were hit hardest. The market recovered to new highs by early 2024.',
    },
];

// Approximate average new car value retention by year (year 0 = purchase price = 1.0)
const DEPRECIATION_CURVE = [1.0, 0.80, 0.67, 0.56, 0.48, 0.42, 0.37, 0.33, 0.30, 0.27, 0.25];

// FICO score factor breakdown for the credit donut chart
const FICO_FACTORS = [
    { label: 'Payment History',        pct: 35, color: '#00f0ff', description: 'Whether you pay bills on time. A single missed payment can drop your score 60–110 points.' },
    { label: 'Amounts Owed',           pct: 30, color: '#00ff88', description: 'Your credit utilization ratio — how much of your available credit you\'re using. Keep it below 30%, ideally below 10%.' },
    { label: 'Length of History',      pct: 15, color: '#ffaa00', description: 'How long your accounts have been open. Don\'t close old cards — they help your average age.' },
    { label: 'New Credit',             pct: 10, color: '#ff4466', description: 'Hard inquiries from applying for new credit. Each application can ding your score by 5–10 points temporarily.' },
    { label: 'Credit Mix',             pct: 10, color: '#a78bfa', description: 'Having a variety of credit types (credit card, auto loan, mortgage) shows you can manage different debt.' },
];
