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
- **Inputs**: Monthly contribution slider ($50–$1,000), simulation mode (average 10.5% / historical S&P 500), start year picker
- **Comparison**: Player (starts at chosen age) vs Jordan (starts at 40, same contribution)
- **Chart**: SVG line chart — two diverging lines to age 65, hover scrubber
- **Comparison cards**: Wealth at ages 30, 40, 50, 65
- **Buffett Quote #1**: *"Someone is sitting in the shade today because someone planted a tree a long time ago."*

### 🚗 Scenario B — Buying a Car
- **Inputs**: Car price ($10k–$60k), down payment, loan term (3–7 years)
- **Comparison**: Finance new car (7% APR) vs invest the car payment instead
- **Visual**: Side-by-side cost breakdown (monthly payment, total interest, total cost) + what that money becomes at age 65 if invested
- **Key insight**: The true cost of a car loan is not just interest — it's the compound growth you gave up

### 💳 Scenario C — Credit Card Debt
- **Inputs**: Balance ($500–$10k), monthly payment slider ($25–$500)
- **Comparison**: Player (set payment) vs Jordan (minimum payments only — 2% of balance or $25)
- **Chart**: Debt paydown line chart — two lines showing remaining balance over months
- **Stats**: Payoff date, total interest paid, lost investment gains
- **Buffett Quote #2**: *"The stock market is a device for transferring money from the impatient to the patient."*

### 🏠 Scenario D — Home Loan Comparison
- **Inputs**: Home price ($150k–$800k), down payment percentage
- **Comparison**: 15-year at 6.5% vs 30-year at 7.0%
- **Visual**: Stacked bar showing principal vs interest for each option + monthly payment difference invested over 15 years
- **Key insight**: The 30-year saves $X/month short-term but costs $Y more in total — and the payment difference invested over 15 years = $Z

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

## Jordan's Defaults (the comparison character)
- Starts investing at **age 40** (Invest scenario)
- Finances a **new car** at 7% APR (Car scenario)
- Pays only **minimum payments** on credit card (Credit scenario)
- Takes a **30-year mortgage** (Home scenario)

---

## Summary Screen
- Shows combined results from all explored scenarios
- Displays wealth gap between player and Jordan across explored scenarios
- Features Buffett Quote #3 + VOO/SPY nudge
- Educational disclaimer: "For educational purposes only. Not financial advice."
