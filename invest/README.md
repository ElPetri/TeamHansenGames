# Money Moves — Financial Education Game

## Purpose
An interactive, lightly-gamified financial education tool aimed at college students. The goal is to viscerally demonstrate the power of investing early, the compounding cost of debt, and why Warren Buffett recommends index funds like VOO for most people.

**Core message**: Time in the market beats timing the market.

---

## Game Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Format | Blend: scenarios + sliders | Stories create context; sliders make it personal |
| Data | Real historical S&P 500 returns (1990–2024) | Authenticity and credibility |
| Starting defaults | Age 18, $100/month, $15k income | Typical college student baseline |
| Milestone flow | Choosable cards — any order, any subset | Students have different entry points |
| Borrowing lesson | Show debt cost AND lost investment opportunity cost | Most eye-opening when shown together |
| Peer character | "Jordan" starts investing at 40 | Concrete comparison without judgment |
| Visual style | Dark neon — matches the rest of the site | Consistent with TeamHansen.us aesthetic |
| Technology | Pure HTML/CSS/vanilla JS, no build step | Consistent with rest of repo |

---

## Scenarios

### 📈 Scenario A — Investing & Compound Interest
- **Inputs**: Monthly contribution slider ($25–$1,000), simulation mode (Historical S&P 500 **default** / Average 10.5%), start year picker
- **Live rate note**: Below the Start Year dropdown, a cyan callout shows the effective annualised return (geometric mean) for the exact years the simulation cycles through — updates on every change
- **Comparison**: Player (starts at chosen age) vs Jordan — fully configurable (see Jordan Configuration below)
- **Comparison card milestones**: Age-aware — players under 25 get near-term 5-year checkpoints (e.g. age 15 → cards at 20, 25, 30, 40, 50, 65) so the first milestone is never 15+ years away
- **Chart**: SVG line chart — two diverging lines to age 65, hover scrubber
- **Buffett Quote #1**: *"Someone is sitting in the shade today because someone planted a tree a long time ago."*

### 🚗 Scenario B — Buying a Car
- **Player inputs**: Car price ($10k–$60k), down payment ($0–$20k), loan term (3–7 years), APR slider (3–20%)
- **Jordan's Car config box**: Price ($10k–$80k), down payment, loan term, APR — defaults to same price, $0 down, 7yr, 8% (worse credit)
- **Visual**: Side-by-side stats blocks for player and Jordan — loan amount, monthly payment, total interest, opportunity cost, interest bar
- **Opportunity cost panel**: What player's payments would have grown to at avg S&P 500 return

### 💳 Scenario C — Credit Card Debt
- **Player inputs**: Balance ($500–$10k), monthly payment ($25–$500), APR slider (8–36%, default 24%)
- **Jordan's Settings box**: "Minimum payments only" checkbox (default on); uncheck to reveal independent payment slider; separate APR slider (8–36%)
- **Chart**: Debt paydown line chart — player (green) and Jordan (orange) lines; x-axis tick density auto-scales by range so labels never blur
- **Buffett Quote #2**: *"The stock market is a device for transferring money from the impatient to the patient."*

### 🏠 Scenario D — Home Loan Comparison
- **Player inputs**: Home price ($150k–$800k), down payment % (5–40%), 15-year rate slider (3–10%), 30-year rate slider (3–10%)
- **Jordan's Situation box**: Jordan's down payment % (default 5% vs player's 20%) — shows how lower down payment inflates loan and total interest
- **Visual**: Side-by-side 15yr vs 30yr blocks for player + Jordan's 30yr block; monthly difference panel; all with interest bars

---

## Buffett Quotes Placement

| Quote | Placement |
|---|---|
| "Someone is sitting in the shade today because someone planted a tree a long time ago." | Invest scenario results |
| "The stock market is a device for transferring money from the impatient to the patient." | Credit card scenario reveal |
| "Our favorite holding period is forever." | Summary screen + VOO nudge |

---

## Data Sources

- **S&P 500 annual returns**: `data.js` — `SP500_RETURNS` array, 1990–2024, total return (price + dividends reinvested). Source: Macrotrends / Slickcharts historical data.
- **Long-term average**: ~10.52% per year (1957–2024)
- **Credit card APR**: 24% (Federal Reserve 2024 average)
- **New car loan**: 7% (2024 average)
- **Mortgage rates**: 6.5% (15-yr), 7.0% (30-yr) — approximate 2024 rates

---

## File Structure

```
invest/
  index.html    — App shell (3 screens: hub, scenario, summary)
  style.css     — Dark neon theme matching site palette (see Color Theme below)
  script.js     — All game logic: calculators, chart renderer, scenario renderers, state machine
  data.js       — S&P 500 returns, rate constants, Buffett quotes, defaults
  README.md     — This file
```

---

## Color Theme

This game uses the same dark neon palette as the rest of TeamHansen.us. When adding new UI elements, use these CSS variables (defined in `style.css :root`):

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#0a0a0f` | Page background |
| `--surface` | `#12121a` | Cards, chart background |
| `--surface-2` | `#1a1a25` | Inputs, secondary panels |
| `--border` | `#2a2a3a` | All borders and dividers |
| `--text` | `#e0e0e0` | Primary text |
| `--text-mid` | `#aaa` | Secondary / label text |
| `--text-dim` | `#666` | Muted / placeholder text |
| `--accent` | `#00f0ff` | Cyan — headings, slider thumbs, active buttons, hover glows |
| `--green` | `#00ff88` | Positive values, gains, principal bars |
| `--gold` | `#ffaa00` | Buffett quotes, opportunity cost values |
| `--red` | `#ff4466` | Debt, interest paid, negative values |

**Rules:**
- Background radial gradients (`#15152a` top, `#0a1520` bottom) are applied on `body` — do not remove them.
- Button text on `--accent` or `--green` backgrounds should be `#0a0a0f` (dark), not white.
- Glow effects use `--accent-glow: rgba(0, 240, 255, 0.25)` for cyan and `rgba(0,255,136,0.4)` for green.
- The SVG chart uses hardcoded hex values (`#12121a` background, `#aaa` legend text) since SVG elements can't read CSS custom properties from an external stylesheet. Keep these in sync with the token values above if the palette ever changes.

---

## Calculator Formulas

### DCA / Compound Interest (monthly compounding)
```
for each month:
    portfolio = (portfolio + monthlyContrib) × (1 + annualReturn/12)
```

### Credit Card Minimum Payment
```
minimum = max(balance × 0.02, $25)
for each month until balance = 0:
    interest = balance × (APR/12)
    balance = balance + interest - payment
```

### Loan Amortization (car / mortgage)
```
monthlyPayment = P × [r(1+r)^n] / [(1+r)^n - 1]
where P = principal, r = monthly rate, n = total months
```

### Opportunity Cost
```
If that monthly payment were invested at 10.5% instead:
opportunityCost = calcDCA(payment, 0, years, 0.105)
```

---

## Jordan Configuration

Jordan's details in the Investing scenario are now **user-configurable** via controls in the sidebar. This lets users build their own comparison scenarios — e.g. "what if Jordan starts at 35?" or "what if Jordan saves twice as much but started late?"

### Configurable fields
| Field | Default | Range | Control type |
|---|---|---|---|
| Jordan's start age | 40 | playerAge+1 to 64 | Slider |
| Jordan's monthly contribution | Same as player | $25–$1,000 | Toggle + slider |

### "Same as mine" toggle
- Default: Jordan contributes the **same amount as the player**. The contribution slider is hidden/disabled.
- When unchecked/toggled off: a separate slider appears so the user can set Jordan's contribution independently.
- This keeps the default comparison clean (time is the only variable) while allowing "what if Jordan saves harder?" exploration.

### State
Jordan's settings live in `investState.jordan = { startAge: 40, monthly: null }`. When `monthly` is `null`, it mirrors `investState.monthly` at render time. The jordan controls are rendered as part of the `#scenario-controls` sidebar in `loadScenarioInvest()` and update on `input`/`change` events.

### Other scenarios
All four scenarios now have configurable Jordan settings:

| Scenario | Jordan config controls | Defaults |
|---|---|---|
| 💳 Credit | Payment toggle (min-only checkbox) + payment slider + APR slider | Min payments, 24% APR |
| 🚗 Car | Car price, down payment, loan term, APR | Same price, $0 down, 7yr, 8% APR |
| 🏠 Home | Down payment % | 5% down, 30yr mortgage at same rate |

---

## Summary Screen

The summary screen now provides a detailed, educational breakdown of every explored scenario:

### Grand Totals Hero Banner
Shown when 2+ scenarios have been explored:
- **Investing portfolio at 65** — the player's final wealth
- **Total interest paid to lenders** — sum across car + credit + home scenarios
- **That interest if invested instead (30 yrs)** — illustrates the compound opportunity cost of debt

### Per-Scenario Breakdown

#### 📈 Invest
- Portfolio at retirement with contributor/growth split (how much came from contributions vs market gains)
- Jordan comparison: head-start advantage + estimated cost of waiting 1 more year
- "How calculated" explanation: DCA formula with **dynamic return rate** — shows either `10.5% avg annual return (smooth average)` or `historical S&P 500 returns starting YYYY (effective avg: X.X%/yr)` depending on simulation mode and selected start year
- Key takeaway callout: time advantage quantified in dollars

#### 🚗 Car
- Full loan breakdown: sticker → down → borrowed → monthly payment → total paid → interest isolated
- Interest % of total payments; per-cent explanation of how amortization works
- True cost = down + loan payments + opportunity cost (what payments would have grown to)
- Key takeaway: sticker price vs real cost in dollars

#### 💳 Credit
- Balance, payment, payoff time, total interest, total paid, cost-per-$1-borrowed
- Step-by-step explanation of how interest accrues each month and why early payments pay mostly interest
- Jordan comparison: minimum payment outcome; interest saved vs minimum strategy
- Key takeaway: interest cost expressed as a multiplier on the original debt

#### 🏠 Home
- Side-by-side 15yr vs 30yr: monthly payment, total interest, interest as % of all payments
- Extra interest on 30yr; monthly savings from choosing 30yr; what that savings becomes if invested
- Net cost of 30yr after crediting the invested savings
- Key takeaway: the low monthly payment framed as its true 30-year interest cost

---

## UI/UX Details

### Age Input
The "Your current age" field on the hub screen is a `<select>` dropdown (options 15–50, default 18). This prevents invalid values and is faster to use on mobile than a number input.

### Chart Tooltip
The hover scrubber tooltip uses the dark site theme: `#0e0e18` background, `var(--text)` colour, `var(--border)` outline. Earlier versions used `var(--text)` as background (light grey), making it unreadable.

### Chart X-Axis Tick Density
`buildLineChart()` auto-selects a sensible tick step based on x-range:
- ≤20 → step 5 | ≤50 → step 10 | ≤120 → step 12 | ≤300 → step 24 | >300 → step 60

Callers can also pass `xStep` in options to override. This prevents label crowding on month-scale charts (credit card payoff).

### Advanced Tab Pulse
When a scenario is open and the **Basic** tab is active, the **Advanced ↓** tab pulses with a glowing purple animation (`@keyframes advTabPulse`) to draw attention. The animation stops as soon as the user clicks the Advanced tab (once `active` class is applied).

- Colors: `#a855f7` → `#d8b4fe` (purple-500 → purple-200)
- Glow: `text-shadow` cycling from soft to vivid
- Timing: 2s ease-in-out, infinite
- CSS rule: `#tab-advanced:not(.active) { animation: advTabPulse 2s ease-in-out infinite; }`

---

## Advanced Deep Dive — Feature Plan

Each scenario screen has **two tabs at the top**: **Basic** (the existing experience) and **Advanced** (the deep dive). Switching tabs is non-destructive — slider state is preserved. No gamification or badges; this is purely educational.

### Entry Point
- Tabs rendered at the top of `#scenario-screen` alongside the scenario title
- Tab bar: `[ Basic ]  [ Advanced ]` — `--accent` underline on active tab
- Advanced tab content is rendered into the same `scenario-body` layout (controls sidebar + main area) but with richer inputs and additional sections below

### Content Types (all four scenarios)
Every Advanced tab must include:
1. **Extended interactive calculators** — more sliders/inputs than Basic
2. **Plain-language concept explainers** — collapsible definition cards for key terms
3. **Real-world examples / case studies** — concrete dollar figures and named scenarios
4. **Optional quiz** — a "Test yourself" button that reveals 3–5 multiple-choice questions with explanations; not shown by default
5. **"Learn more" links** — Investopedia, IRS.gov, CFPB, etc. (open in new tab)

---

### 📈 Scenario A Advanced — Investing Deep Dive

#### Sub-topic 1: 401(k) / Roth IRA Tax Advantages
- **Calculator inputs**: Gross income, tax bracket (10/12/22/24/32/35/37%), contribution amount, account type (Traditional 401k / Roth IRA / Taxable brokerage)
- **Output**: Side-by-side comparison of after-tax wealth at retirement for each account type; shows tax drag on taxable account
- **Key numbers displayed**: 2024 contribution limits ($23,000 for 401k, $7,000 for IRA), employer match input field
- **Concept cards**: What is tax-deferred growth? What is Roth's tax-free growth? What is an employer match (free money)?
- **Case study**: "Alex earns $55k/yr, invests $300/mo. In a Roth IRA vs taxable account, the difference by retirement is $X."
- **Links**: IRS contribution limits page, Investopedia Roth IRA, NerdWallet 401k explainer

#### Sub-topic 2: Expense Ratios — The Silent Fee
- **Calculator inputs**: Portfolio value or monthly contribution, expense ratio slider (0.03% to 2.0%), years
- **Output**: Line chart — same DCA, two lines: low-cost index fund (0.03%) vs actively managed fund (1.0%) vs loaded fund (2.0%)
- **Key insight stat**: "Over 40 years, a 1% expense ratio costs you $X — that's Y% of your final balance"
- **Concept cards**: What is an expense ratio? What is an index fund? What is active vs passive management?
- **Case study**: VOO (0.03%) vs a typical actively managed fund (0.75–1.2%) on a $200/mo investment from age 22
- **Links**: Vanguard VOO page, SPIVA report (active funds underperform index over time)

#### Sub-topic 3: Lump Sum vs Dollar-Cost Averaging
- **Calculator inputs**: Total amount to invest, period to deploy it (1–24 months), start year (for historical mode)
- **Output**: Comparison of lump-sum-now vs DCA-over-period final value using historical S&P 500 data; shows which won and by how much
- **Concept cards**: What is DCA? What is lump sum investing? Why does lump sum usually win (time in market)?
- **Case study**: "You receive a $10,000 bonus. Invest it all now vs $833/mo for 12 months — historically, lump sum wins ~68% of the time."
- **Links**: Vanguard research paper on lump sum vs DCA

#### Sub-topic 4: Historical Bear Markets & Recovery
- **Visual**: Annotated timeline of S&P 500 bear markets (2000–2002, 2008–2009, 2020, 2022) — peak, trough, recovery date, max drawdown %
- **Interactive**: Slider to pick "what if you panicked and sold at the bottom?" — shows the cost of missing the recovery vs staying invested
- **Concept cards**: What is a bear market? What is dollar-cost averaging through a crash? Why staying invested beats timing?
- **Links**: DALBAR study on investor behavior vs market returns

---

### 🚗 Scenario B Advanced — Car Deep Dive

#### Sub-topic 1: New vs Used — Depreciation Curve
- **Calculator inputs**: New car price, years to buy used (1–5 years old), mileage
- **Output**: Depreciation curve showing value over time; side-by-side total cost comparison (new vs buying 2-yr-old equivalent)
- **Key stat**: "A new car loses ~20% of its value in year 1 and ~50% in 5 years"
- **Concept cards**: What is depreciation? What is a certified pre-owned (CPO) vehicle?
- **Case study**: "$35k new car vs buying the same model 2 years used for $24k — invest the $11k difference"
- **Links**: Edmunds depreciation calculator, CarGurus used vs new analysis

#### Sub-topic 2: Lease vs Buy
- **Calculator inputs**: Car price, lease term (24/36/48 mo), lease money factor (APR equivalent), residual %, down payment
- **Output**: Total cost over 5 years for lease-and-repeat vs buy-and-keep; monthly payment comparison; equity built
- **Concept cards**: What is a money factor? What is residual value? When does leasing make sense (high-mileage business users)?
- **Case study**: "Leasing a $35k car at $450/mo for 3 years, then leasing again, vs buying and driving 8 years — total cost difference: $X"
- **Links**: Consumer Reports lease vs buy guide

#### Sub-topic 3: Total Cost of Ownership
- **Calculator inputs**: Car price, loan details, annual insurance estimate, annual maintenance ($500–$2,000/yr), fuel cost/yr, years owned
- **Output**: Full 5-year and 10-year cost breakdown (loan payments + interest + insurance + maintenance + fuel + depreciation)
- **Concept cards**: What is TCO? Why the sticker price is the least important number?
- **Links**: AAA annual driving cost report

---

### 💳 Scenario C Advanced — Credit Deep Dive

#### Sub-topic 1: Avalanche vs Snowball Payoff Methods
- **Calculator inputs**: Up to 3 debts (balance, APR, minimum payment each)
- **Output**: Side-by-side payoff timeline chart — Avalanche (highest APR first) vs Snowball (lowest balance first); total interest comparison
- **Key insight**: "Avalanche saves more money; Snowball gives faster early wins — choose what keeps you motivated"
- **Concept cards**: What is the avalanche method? What is the snowball method? What is behavioral economics?
- **Case study**: "$3k credit card at 24%, $8k car at 7%, $15k student loan at 5% — which method saves more and by how much"
- **Links**: NerdWallet debt avalanche calculator, Dave Ramsey snowball explainer

#### Sub-topic 2: How Credit Scores Are Calculated
- **Visual**: Donut chart of the 5 FICO score factors with percentages:
  - Payment history: 35%
  - Amounts owed / utilization: 30%
  - Length of credit history: 15%
  - New credit / inquiries: 10%
  - Credit mix: 10%
- **Interactive**: "What if?" sliders — show estimated score impact of paying down balance (utilization) or missing a payment
- **Concept cards**: What is a credit utilization ratio? Why you shouldn't close old cards? What's a hard inquiry?
- **Links**: myFICO, Experian credit score guide

#### Sub-topic 3: Balance Transfer / 0% APR Promotions
- **Calculator inputs**: Balance to transfer, transfer fee (3–5%), 0% promo period (6–21 months), fallback APR after promo
- **Output**: Comparison — paying on current card vs transferring; breakeven if not paid off before promo ends
- **Warning stat**: "If you don't pay it off in time, the fallback rate (often 27–29%) applies to the FULL original balance retroactively on some cards"
- **Concept cards**: What is a balance transfer? What is a promotional APR? What is deferred interest?
- **Links**: CFPB balance transfer guide, NerdWallet best balance transfer cards

---

### 🏠 Scenario D Advanced — Home Deep Dive

#### Sub-topic 1: Rent vs Buy Break-Even
- **Calculator inputs**: Home price, down payment, mortgage rate, rent for equivalent home, annual home appreciation rate (0–5%), years planning to stay
- **Output**: Break-even chart — cumulative cost of renting vs owning over 1–15 years; the year they cross
- **Key insight**: "Buying beats renting only after ~4–7 years in most markets — if you might move sooner, renting may cost less"
- **Concept cards**: What is the price-to-rent ratio? What are transaction costs (closing costs + agent fees ≈ 8–10%)?
- **Case study**: "In a median US market, buying a $350k home breaks even vs renting the equivalent at $1,800/mo after ~5.5 years"
- **Links**: NYT Rent vs Buy calculator, CFPB mortgage guide

#### Sub-topic 2: PMI — The Hidden Cost of < 20% Down
- **Calculator inputs**: Home price, down payment percentage (3–19%), PMI rate (0.5–1.5%), loan term
- **Output**: Monthly payment breakdown showing PMI line item; total PMI paid before 20% equity reached; months until PMI drops off
- **Key insight**: "PMI protects the lender, not you — it adds $100–$300/mo until you hit 20% equity"
- **Concept cards**: What is PMI? How do you request PMI removal? What is an FHA loan vs conventional?
- **Links**: CFPB PMI explainer, HUD FHA loan info

#### Sub-topic 3: Total Cost of Homeownership
- **Calculator inputs**: Home price, mortgage details, property tax rate (0.5–3%), homeowner's insurance estimate, HOA (if any), annual maintenance % of home value (1–2%)
- **Output**: True monthly cost breakdown (PITI + HOA + maintenance reserve) vs the mortgage payment alone; 10-year total cost
- **Concept cards**: What is PITI? What is an escrow account? What is the 1% maintenance rule?
- **Links**: Bankrate mortgage calculator, Zillow homeownership costs

---

### Implementation Architecture

#### Tab System (HTML/CSS)
- Two `<button class="tab-btn">` elements rendered above `.scenario-body` when a scenario loads
- Active tab gets `class="active"` — styled with `--accent` bottom border
- Each tab click calls `renderBasic()` or `renderAdvanced()` for the current scenario, which repopulates `#scenario-controls`, `#scenario-stats`, `#comparison-cards`, `#scenario-insight`, and shows/hides `#chart-wrapper`

#### Advanced Content Rendering (JS)
- Per-scenario advanced loaders: `loadAdvancedInvest()`, `loadAdvancedCar()`, `loadAdvancedCredit()`, `loadAdvancedHome()`
- Each advanced loader renders sub-topic sections with a heading + collapsible body using `<details>/<summary>` elements (no JS needed for show/hide)
- Quiz: rendered inside a `<details>` block with `<summary>Test yourself</summary>` — multiple choice rendered as `<button>` options; correct answer + explanation revealed on click
- Concept definition cards: `<div class="concept-card">` — term in bold, plain-English explanation below
- External links: `<a href="..." target="_blank" rel="noopener noreferrer" class="learn-more-link">` — always open in new tab

#### New Calculators to Add to `script.js`
| Function | Used by |
|---|---|
| `calcTaxAdvantaged(contrib, grossIncome, bracket, accountType, years)` | Invest Advanced — Tax sub-topic |
| `calcExpenseRatioDrag(monthly, years, ratios[])` | Invest Advanced — Expense ratio sub-topic |
| `calcLumpSumVsDCA(total, months, startYear)` | Invest Advanced — Lump sum sub-topic |
| `calcDepreciation(price, years)` | Car Advanced — New vs used sub-topic |
| `calcLeaseVsBuy(price, leaseTerm, moneyFactor, residualPct, years)` | Car Advanced — Lease sub-topic |
| `calcTCO(price, loanDetails, insurance, maintenance, fuel, years)` | Car Advanced — TCO sub-topic |
| `calcAvalancheVsSnowball(debts[])` | Credit Advanced — Payoff methods sub-topic |
| `calcBalanceTransfer(balance, fee, promoMonths, fallbackAPR)` | Credit Advanced — Balance transfer sub-topic |
| `calcRentVsBuy(homePrice, down, rate, rent, appreciation, years)` | Home Advanced — Rent vs buy sub-topic |
| `calcPMI(homePrice, downPct, pmiRate, loanTerm, mortgageRate)` | Home Advanced — PMI sub-topic |
| `calcTrueMonthlyCost(homePrice, loanDetails, taxRate, insurance, hoa, maintenancePct)` | Home Advanced — TCO sub-topic |

#### New Data to Add to `data.js`
- `BEAR_MARKETS` array: `[{ name, startDate, peakDrop, recoveryMonths }, ...]` for 2000–2002 dot-com, 2008–2009 GFC, 2020 COVID, 2022 rate hike
- `DEPRECIATION_CURVE`: approximate value retention by year for average new car `[1.0, 0.80, 0.68, 0.58, 0.50, 0.43, 0.38, ...]`
- `FICO_FACTORS`: `[{ label, pct, description }, ...]` for the donut chart

#### Styling
- Tab bar: `.tab-bar { display:flex; border-bottom: 1px solid var(--border); margin-bottom: 20px; }` — `.tab-btn.active` gets `border-bottom: 2px solid var(--accent); color: var(--accent);`
- Concept cards: `.concept-card { background: var(--surface-2); border-left: 3px solid var(--accent); padding: 12px 16px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }`
- Quiz: `.quiz-option { display:block; background: var(--surface-2); border: 1.5px solid var(--border); ... }` — correct answer gets `--green` border, wrong gets `--red` border on reveal
- Learn-more links: `.learn-more-link { color: var(--accent); font-size: 0.8rem; }` with external link icon (↗)

---

### What Does NOT Change
- The Basic tab is the existing experience — no modifications to existing calculators or rendering logic
- No badges, scores, or gamification
- No modules or build step — all new code goes into `script.js` and `style.css` following existing patterns
- Jordan's comparison character remains in the Basic tab only; Advanced is about education, not head-to-head comparison

