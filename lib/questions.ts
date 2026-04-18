export type Difficulty = 'easy' | 'medium' | 'advanced'
export type Topic = 'accounting' | 'valuation' | 'dcf' | 'lbo' | 'other' | 'brainteaser'

export type Question = {
  id: string
  topic: Topic
  difficulty: Difficulty
  question: string
  answer: string
}

export const TOPIC_LABELS: Record<Topic, string> = {
  accounting: 'Accounting',
  valuation: 'Valuation',
  dcf: 'DCF',
  lbo: 'LBO',
  other: 'Other',
  brainteaser: 'Brain Teaser',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  advanced: 'Advanced',
}

export const QUESTIONS: Question[] = [
  // ── ACCOUNTING — EASY ──────────────────────────────────────────────────────
  {
    id: 'acc-e-1',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'Walk me through the three financial statements.',
    answer: `The three statements are the Income Statement, Balance Sheet, and Cash Flow Statement.\n\nThe Income Statement shows revenue, expenses, and net income over a period. Net income flows into retained earnings on the Balance Sheet and is the starting point of the Cash Flow Statement.\n\nThe Balance Sheet is a snapshot of assets, liabilities, and equity at a point in time. Assets = Liabilities + Equity.\n\nThe Cash Flow Statement reconciles net income to actual cash generated, broken into operating, investing, and financing activities. The ending cash balance ties to cash on the Balance Sheet.`,
  },
  {
    id: 'acc-e-2',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'A company records $10 more in depreciation. How does this affect the three financial statements?',
    answer: `Income Statement: Pre-tax income decreases by $10. Assuming a 40% tax rate, net income decreases by $6.\n\nBalance Sheet: PP&E decreases by $10 (accumulated depreciation increases). On the liabilities side, retained earnings decrease by $6 and taxes payable decrease by $4 — so the balance sheet still balances.\n\nCash Flow Statement: Net income is down $6, but depreciation is a non-cash charge, so you add back $10 in the operating section. Net effect on cash is +$4 (the tax shield).`,
  },
  {
    id: 'acc-e-3',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'What is working capital and how is it calculated?',
    answer: `Working capital = Current Assets − Current Liabilities.\n\nIt measures a company's short-term liquidity — whether it has enough liquid assets to cover near-term obligations.\n\nIn financial modeling, we typically focus on operating working capital, which excludes cash (since it's captured separately in a DCF) and excludes debt (since financing is modeled separately). So: Operating Working Capital = (Current Assets − Cash) − (Current Liabilities − Short-term Debt).`,
  },
  {
    id: 'acc-e-4',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'What is the difference between cash-basis and accrual accounting?',
    answer: `Under cash-basis accounting, revenue is recognized when cash is received and expenses are recorded when cash is paid. Simple but not GAAP-compliant for most companies.\n\nUnder accrual accounting, revenue is recognized when earned (goods/services delivered) and expenses when incurred, regardless of when cash changes hands. This gives a more accurate picture of economic performance.\n\nExample: A company signs a $1,200 annual subscription in January. Under cash-basis, all $1,200 is revenue in January. Under accrual, $100 is recognized each month.`,
  },
  {
    id: 'acc-e-5',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'How are the income statement and balance sheet connected?',
    answer: `Net income from the Income Statement flows into retained earnings on the Balance Sheet (as part of shareholders' equity). Retained earnings = prior retained earnings + net income − dividends paid.\n\nThis is the primary link. If a company earns $50 in net income and pays $10 in dividends, retained earnings increases by $40, and equity (and therefore total assets or reduced liabilities) rises by the same amount.`,
  },

  // ── ACCOUNTING — MEDIUM ────────────────────────────────────────────────────
  {
    id: 'acc-m-1',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'A company buys $100 of PP&E using cash. Walk me through the impact on the three statements in Year 1, assuming straight-line depreciation over 5 years and a 40% tax rate.',
    answer: `At time of purchase:\n• Balance Sheet: Cash −$100, PP&E +$100. No income statement impact yet.\n\nYear 1 Income Statement:\n• Depreciation expense: $100 / 5 = $20\n• Pre-tax income −$20, tax savings +$8, net income −$12\n\nYear 1 Balance Sheet:\n• PP&E net: $100 − $20 = $80\n• Cash: no further change (purchase already recorded)\n• Retained earnings −$12, taxes payable −$8\n\nYear 1 Cash Flow Statement:\n• Net income: −$12\n• Add back depreciation: +$20\n• Capex (investing): −$100\n• Net cash change: −$92 (the original $100 purchase minus the $8 tax shield)`,
  },
  {
    id: 'acc-m-2',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'What is deferred revenue, and how does it flow through the financial statements?',
    answer: `Deferred revenue is a liability that arises when a company receives cash before delivering goods or services. It represents an obligation to perform in the future.\n\nWhen cash is received:\n• Cash +$X on the Balance Sheet\n• Deferred Revenue +$X (liability) on the Balance Sheet\n• No revenue recognized yet on the Income Statement\n\nAs the service is delivered:\n• Deferred Revenue decreases on the Balance Sheet\n• Revenue is recognized on the Income Statement\n\nExample: A SaaS company receives $1,200 for an annual subscription. Each month, $100 moves from deferred revenue to revenue.`,
  },
  {
    id: 'acc-m-3',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'How does a $50 inventory write-down affect the three financial statements?',
    answer: `Income Statement: COGS increases by $50 (or a separate write-down charge). Pre-tax income decreases by $50, net income decreases by $30 (assuming 40% tax rate).\n\nBalance Sheet: Inventory decreases by $50. Retained earnings decreases by $30. Taxes payable decreases by $20. The balance sheet remains balanced.\n\nCash Flow Statement: Net income is down $30. The inventory write-down is a non-cash charge, so you add back $50 in the operating section. Net cash impact is +$20 (the tax benefit). Note: no actual cash was spent — this just reflects the reduced value of an asset already on the books.`,
  },
  {
    id: 'acc-m-4',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'A company issues $30 of stock-based compensation. How does this affect the three financial statements?',
    answer: `Income Statement: SBC is an operating expense, so pre-tax income decreases by $30. Net income decreases by $18 (at 40% tax rate).\n\nBalance Sheet: Additional paid-in capital (equity) increases by $30. Taxes payable decreases by $12. Retained earnings decreases by $18. The balance sheet remains balanced — no cash moves.\n\nCash Flow Statement: Net income −$18. Add back SBC (non-cash) +$30. Net operating cash flow impact is +$12 (the tax shield). SBC is added back in the operating section just like depreciation.`,
  },
  {
    id: 'acc-m-5',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'What is goodwill, and how is it created?',
    answer: `Goodwill is an intangible asset created in an acquisition when the purchase price exceeds the fair value of the target's identifiable net assets (assets minus liabilities).\n\nFormula: Goodwill = Purchase Price − Fair Value of Net Identifiable Assets\n\nIt represents things like brand value, customer relationships, workforce quality, and synergies that aren't individually identifiable on a balance sheet.\n\nUnder GAAP, goodwill is not amortized but is tested for impairment annually (or more frequently if triggering events occur). If the fair value of the reporting unit falls below its carrying value, goodwill is written down.`,
  },

  // ── ACCOUNTING — ADVANCED ──────────────────────────────────────────────────
  {
    id: 'acc-a-1',
    topic: 'accounting',
    difficulty: 'advanced',
    question: 'Walk me through how a leveraged buyout affects the three financial statements at close.',
    answer: `At close of an LBO, the acquirer (a PE-backed Newco) buys the target using a mix of debt and equity. Here's the impact:\n\nBalance Sheet:\n• Assets: Target's assets are written up to fair value via purchase price allocation. Goodwill is created for any excess of purchase price over fair value of net assets.\n• Liabilities: Significant new debt (senior, sub-debt, etc.) is added.\n• Equity: Pre-existing equity is eliminated; PE firm's new equity contribution replaces it.\n\nIncome Statement (going forward):\n• Depreciation/amortization increases due to asset write-ups and intangible amortization\n• Interest expense increases substantially due to the debt load\n• These reduce net income significantly in early years\n\nCash Flow Statement:\n• Higher interest payments reduce operating cash flow\n• Debt principal repayment is a financing outflow\n• Free cash flow is used to pay down debt (deleveraging)`,
  },
  {
    id: 'acc-a-2',
    topic: 'accounting',
    difficulty: 'advanced',
    question: 'What is the difference between LIFO and FIFO inventory accounting, and how do they affect the financial statements in an inflationary environment?',
    answer: `FIFO (First In, First Out): The oldest (cheapest) inventory is sold first. In inflation, COGS is lower, gross profit is higher, taxes are higher, but ending inventory on the balance sheet reflects current (higher) costs.\n\nLIFO (Last In, First Out): The newest (most expensive) inventory is sold first. In inflation, COGS is higher, gross profit is lower, taxes are lower, and ending inventory reflects older (lower) costs.\n\nKey differences in an inflationary environment:\n• LIFO: Lower taxes (cash benefit), lower reported earnings, lower balance sheet inventory value\n• FIFO: Higher taxes, higher reported earnings, higher balance sheet inventory\n\nNote: LIFO is permitted under GAAP but not IFRS. When comparing companies using different methods, you can adjust using the LIFO reserve disclosed in footnotes.`,
  },
  {
    id: 'acc-a-3',
    topic: 'accounting',
    difficulty: 'advanced',
    question: 'How do you account for minority interest (non-controlling interest) on the financial statements?',
    answer: `Minority interest (or non-controlling interest, NCI) arises when a parent company owns more than 50% but less than 100% of a subsidiary, and therefore consolidates 100% of the subsidiary's financials.\n\nIncome Statement: 100% of the subsidiary's revenue and expenses are consolidated. At the bottom, a "Net income attributable to non-controlling interest" line subtracts out the minority's share of net income, leaving "Net income attributable to parent."\n\nBalance Sheet: 100% of assets and liabilities are consolidated. NCI appears as a separate component of equity (not debt), representing the minority shareholders' claim on net assets.\n\nEnterprise Value: Because you've consolidated 100% of the subsidiary's operations, you must add NCI to enterprise value (EV = Equity Value + Debt − Cash + NCI + Preferred Stock).`,
  },

  // ── VALUATION — EASY ──────────────────────────────────────────────────────
  {
    id: 'val-e-1',
    topic: 'valuation',
    difficulty: 'easy',
    question: 'What are the three main valuation methodologies?',
    answer: `1. Comparable Company Analysis (Comps / Trading Multiples): Values a company based on how similar public companies are currently trading. Uses multiples like EV/EBITDA, EV/Revenue, and P/E applied to the subject company's metrics.\n\n2. Precedent Transactions (Deal Comps): Values a company based on multiples paid in past M&A transactions of similar companies. Usually yields higher values than public comps because of the acquisition premium.\n\n3. Discounted Cash Flow (DCF): Values a company based on the present value of its projected future free cash flows, discounted at WACC. Most theoretically rigorous but highly sensitive to assumptions.\n\nThe three methods are often displayed together in a "football field" chart to show the range of implied values.`,
  },
  {
    id: 'val-e-2',
    topic: 'valuation',
    difficulty: 'easy',
    question: 'What is enterprise value and how do you calculate it from equity value?',
    answer: `Enterprise value (EV) represents the total value of a company's core operations, available to all capital providers (debt holders, equity holders, preferred stockholders, minority interest holders).\n\nFormula: EV = Equity Value + Total Debt + Preferred Stock + Minority Interest − Cash & Cash Equivalents\n\nIntuition: If you bought 100% of a company's equity, you'd still inherit its debt obligations (a cost) and receive its cash (a benefit). EV captures the total acquisition cost on a debt-free, cash-free basis.\n\nEquity Value (market cap) = Share Price × Diluted Shares Outstanding`,
  },
  {
    id: 'val-e-3',
    topic: 'valuation',
    difficulty: 'easy',
    question: 'What is EBITDA and why is it commonly used in valuation?',
    answer: `EBITDA = Earnings Before Interest, Taxes, Depreciation & Amortization.\n\nIt's used as a proxy for operating cash flow and is popular in valuation because:\n• Capital structure neutral: Excludes interest, so it's the same regardless of debt levels — useful for comparing companies with different financing.\n• Accounting neutral: Adds back D&A, which varies based on asset age and accounting policy, making comparisons cleaner.\n• Tax neutral: Excludes taxes, which differ by jurisdiction and structure.\n\nLimitations: Ignores capex, changes in working capital, and the real cost of maintaining assets. Critics (notably Buffett) point out that depreciation is a very real economic cost.`,
  },
  {
    id: 'val-e-4',
    topic: 'valuation',
    difficulty: 'easy',
    question: 'What is the difference between a strategic buyer and a financial buyer?',
    answer: `Strategic Buyer: A corporation acquiring a company in the same or adjacent industry. They can pay more because they realize operational synergies (cost savings, revenue cross-sell, etc.). They typically buy to hold permanently and integrate.\n\nFinancial Buyer: A private equity firm or similar investor. They buy companies with a 3–7 year exit in mind, typically using leverage (LBO) to enhance returns. They cannot pay as much as a strategic buyer because they don't get synergies, but they aim to improve operations and exit at a higher multiple.`,
  },

  // ── VALUATION — MEDIUM ────────────────────────────────────────────────────
  {
    id: 'val-m-1',
    topic: 'valuation',
    difficulty: 'medium',
    question: 'Why might comparable company analysis give a different valuation than a DCF?',
    answer: `They measure different things. Comps reflect what the market is currently willing to pay for similar businesses — they're market-based and incorporate sentiment, macro conditions, and liquidity. A DCF reflects the intrinsic value of a specific company based on its projected cash flows.\n\nKey reasons for divergence:\n• Market conditions: In a bull market, comps will be elevated; a DCF may give a lower value based on fundamentals.\n• Company-specific factors: The subject company may have a different growth profile or margin structure than peers.\n• DCF sensitivity: Small changes in WACC or terminal growth rate cause large value swings.\n• Timing: Comps are live market data; a DCF uses multi-year projections that may not reflect current market expectations.\n\nIn practice, analysts triangulate across all three methods and explain the gaps.`,
  },
  {
    id: 'val-m-2',
    topic: 'valuation',
    difficulty: 'medium',
    question: 'Why do we add debt and subtract cash when going from equity value to enterprise value?',
    answer: `Think of it from an acquirer's perspective. If you buy 100% of a company's equity for $500M, but the company also has $200M of debt:\n• You now own the business but must service or repay that $200M in debt — it's an additional cost to you. So you add debt.\n\nIf the company also has $50M in cash:\n• That cash comes to you as the new owner — it offsets your purchase cost, or you can use it to repay debt immediately. So you subtract cash.\n\nResult: EV = $500M + $200M − $50M = $650M, which represents what it truly costs to own the entire business, capital structure-neutral.\n\nNote: Only excess cash (above operating needs) should technically be subtracted, though in practice the full cash balance is often used.`,
  },
  {
    id: 'val-m-3',
    topic: 'valuation',
    difficulty: 'medium',
    question: 'When would you use a sum-of-the-parts (SOTP) valuation?',
    answer: `SOTP is used when a company has multiple distinct business segments that would be better valued independently — typically because different segments warrant different multiples or methodologies.\n\nCommon situations:\n• A conglomerate with unrelated divisions (e.g., a company with both a mature industrial segment and a high-growth tech segment)\n• A company with significant non-operating assets (real estate, equity stakes in other companies)\n• Spin-off or breakup analysis, where you want to show that the parts are worth more than the whole\n\nProcess: Value each segment using appropriate methodology (comps, DCF, etc.), then add them together and subtract corporate overhead and net debt to arrive at equity value.`,
  },
  {
    id: 'val-m-4',
    topic: 'valuation',
    difficulty: 'medium',
    question: 'How do you value a company with negative EBITDA?',
    answer: `You cannot use EV/EBITDA directly. Alternative approaches:\n\n1. Revenue multiples (EV/Revenue): Works when revenue exists but profitability doesn't yet — common for early-stage tech or biotech.\n\n2. DCF: Project out to when the company becomes cash flow positive, and discount those future cash flows. The terminal value will drive most of the value.\n\n3. Comparable transactions: Look at what was paid for similar companies at similar stages — often expressed as EV/Revenue or EV/Gross Profit.\n\n4. Asset-based valuation: For companies close to distress, value the underlying assets (liquidation value).\n\n5. Venture/growth metrics: For early-stage companies, investors may use metrics like EV/users, EV/GMV, or customer lifetime value analysis.`,
  },
  {
    id: 'val-m-5',
    topic: 'valuation',
    difficulty: 'medium',
    question: 'What is the difference between a trailing and a forward multiple?',
    answer: `Trailing multiple: Uses the most recent historical period (LTM = last twelve months). It reflects actual, audited results. More reliable but backward-looking.\n\nForward multiple: Uses projected future metrics (NTM = next twelve months, or a specific future year). Better for fast-growing or recovering companies where trailing results understate future earning power.\n\nExample: A company trading at $1B EV with LTM EBITDA of $100M and NTM EBITDA of $150M trades at 10x trailing but 6.7x forward.\n\nIn practice: Investment banks show both. For high-growth sectors (tech, biotech), forward multiples dominate because trailing results aren't representative. For stable, mature sectors, trailing multiples are more commonly used.`,
  },

  // ── VALUATION — ADVANCED ──────────────────────────────────────────────────
  {
    id: 'val-a-1',
    topic: 'valuation',
    difficulty: 'advanced',
    question: 'Walk me through how you would value a cyclical company.',
    answer: `Valuing a cyclical company is tricky because using peak or trough earnings as your base case will significantly distort the valuation.\n\nKey approaches:\n\n1. Normalize earnings: Use mid-cycle EBITDA rather than current results. Look at a full cycle (typically 7–10 years) and average the margins/earnings.\n\n2. EV/mid-cycle EBITDA: Apply a multiple to normalized EBITDA rather than LTM.\n\n3. DCF with scenario analysis: Build an explicit forecast through a full cycle (expansion and contraction), then run scenarios or use probability-weighted outcomes.\n\n4. Replacement cost / NAV: Common in mining, oil & gas, and real estate — value the underlying assets rather than earnings.\n\n5. Be careful with comps: If you're at a trough, EV/EBITDA will look inflated vs. peers. If at a peak, the opposite. Always flag where in the cycle you are.`,
  },
  {
    id: 'val-a-2',
    topic: 'valuation',
    difficulty: 'advanced',
    question: 'What are the pros and cons of each of the three main valuation methodologies?',
    answer: `Comparable Company Analysis:\n+ Reflects current market conditions and investor sentiment\n+ Easy to explain to clients; objective market data\n+ Quick to run once comps are selected\n− Assumes the market is pricing comps correctly (could be over/undervalued)\n− Rarely a perfect comparable; requires significant judgment in adjustments\n− Doesn't capture company-specific factors\n\nPrecedent Transactions:\n+ Reflects real prices paid (including acquisition premium)\n+ Most relevant for M&A situations\n− Data is stale (deals can be years old)\n− Deal terms, motivations, and market conditions vary widely\n− Less liquid market; fewer data points\n\nDCF:\n+ Theoretically most rigorous; captures intrinsic value\n+ Not distorted by current market sentiment\n− Highly sensitive to assumptions (WACC, terminal growth rate)\n− Terminal value often 60–80% of total value — tail wags the dog\n− Garbage in, garbage out; projections are inherently uncertain`,
  },

  // ── DCF — EASY ────────────────────────────────────────────────────────────
  {
    id: 'dcf-e-1',
    topic: 'dcf',
    difficulty: 'easy',
    question: 'What is a DCF and when would you use it?',
    answer: `A Discounted Cash Flow (DCF) analysis values a company by projecting its future free cash flows and discounting them back to the present at a rate that reflects the riskiness of those cash flows (WACC).\n\nFormula: Value = Σ [FCF_t / (1 + WACC)^t] + Terminal Value / (1 + WACC)^n\n\nBest used when:\n• The company has relatively stable, predictable cash flows\n• You have enough information to build a credible multi-year forecast\n• You want to determine intrinsic value independent of market sentiment\n\nLess reliable when:\n• Cash flows are highly volatile or negative\n• The company is early-stage with no revenue\n• Terminal value assumptions would be purely speculative`,
  },
  {
    id: 'dcf-e-2',
    topic: 'dcf',
    difficulty: 'easy',
    question: 'What is WACC and what does it represent?',
    answer: `WACC stands for Weighted Average Cost of Capital. It represents the blended required rate of return for all of a company's capital providers — debt and equity — weighted by their proportion in the capital structure.\n\nFormula: WACC = (E/V) × Re + (D/V) × Rd × (1 − Tax Rate)\n\nWhere:\n• E = Equity value, D = Debt value, V = E + D\n• Re = Cost of equity (typically from CAPM)\n• Rd = Cost of debt (pre-tax yield on the company's debt)\n• (1 − Tax Rate) = tax shield on interest (debt is tax-deductible)\n\nIt's used as the discount rate in a DCF because it represents the minimum return the company must generate to satisfy all its capital providers. A higher WACC means a lower present value.`,
  },
  {
    id: 'dcf-e-3',
    topic: 'dcf',
    difficulty: 'easy',
    question: 'What is terminal value and why does it matter?',
    answer: `Terminal value (TV) represents the value of all cash flows beyond the explicit forecast period (typically years 6–10+). It captures the going-concern value of the business into perpetuity.\n\nWhy it matters: Terminal value often represents 60–80% of total DCF value. This means the DCF is extremely sensitive to how you estimate TV — small changes in the terminal growth rate or exit multiple cause large swings in valuation.\n\nTwo methods:\n1. Gordon Growth Model (Perpetuity Growth): TV = FCF_n × (1 + g) / (WACC − g), where g is the long-term growth rate. Typically 2–3% (GDP growth).\n2. Exit Multiple: TV = EBITDA_n × EV/EBITDA multiple. More commonly used in banking; anchors terminal value to market comps.`,
  },
  {
    id: 'dcf-e-4',
    topic: 'dcf',
    difficulty: 'easy',
    question: 'What is the difference between free cash flow to the firm (FCFF) and free cash flow to equity (FCFE)?',
    answer: `FCFF (Unlevered FCF): Cash flows available to all capital providers — both debt and equity holders — before any financing payments.\nFCFF = EBIT × (1 − Tax Rate) + D&A − Capex − Change in Working Capital\nDiscounted at WACC to get Enterprise Value.\n\nFCFE (Levered FCF): Cash flows available only to equity holders, after paying interest and principal on debt.\nFCFE = Net Income + D&A − Capex − Change in Working Capital − Debt Repayment + New Debt Issued\nDiscounted at Cost of Equity to get Equity Value directly.\n\nIn most investment banking DCFs, FCFF is used because it's capital structure-neutral — you don't need to forecast debt repayments, and it's easier to compare across companies.`,
  },

  // ── DCF — MEDIUM ──────────────────────────────────────────────────────────
  {
    id: 'dcf-m-1',
    topic: 'dcf',
    difficulty: 'medium',
    question: 'Walk me through how you calculate WACC.',
    answer: `WACC = (E/V) × Re + (D/V) × Rd × (1 − t)\n\nStep 1 — Capital structure weights:\n• E = market value of equity (market cap), D = market value of debt\n• V = E + D; compute E/V and D/V\n\nStep 2 — Cost of equity (Re) using CAPM:\n• Re = Rf + β × ERP\n• Rf = risk-free rate (10-year Treasury yield)\n• β = levered beta (from comps, then un-lever and re-lever to target structure)\n• ERP = equity risk premium (~5–6% in the US)\n\nStep 3 — Cost of debt (Rd):\n• Pre-tax yield on the company's long-term debt (or estimated from credit rating)\n• Multiply by (1 − tax rate) for after-tax cost (interest is tax-deductible)\n\nStep 4 — Combine:\n• Weight each by its share of total capital and add together`,
  },
  {
    id: 'dcf-m-2',
    topic: 'dcf',
    difficulty: 'medium',
    question: 'What are the two methods for calculating terminal value, and when would you use each?',
    answer: `1. Gordon Growth Model (Perpetuity Growth Method):\nTV = FCF_n × (1 + g) / (WACC − g)\nAssumes cash flows grow at a constant rate "g" forever. The growth rate should not exceed long-term GDP growth (typically 2–3%). More theoretically grounded.\n\n2. Exit Multiple Method:\nTV = EBITDA_n × EV/EBITDA multiple\nApplies a market multiple to the final-year EBITDA. More intuitive for practitioners and implicitly ties terminal value to what the market would pay for a comparable company at exit. More commonly used in investment banking.\n\nBest practice: Run both and use as a sanity check. The implied terminal growth rate from the exit multiple method should be reasonable (2–5%), and the implied exit multiple from the perpetuity growth method should be in line with current trading comps.`,
  },
  {
    id: 'dcf-m-3',
    topic: 'dcf',
    difficulty: 'medium',
    question: 'How does an increase in WACC affect a company\'s DCF valuation?',
    answer: `A higher WACC decreases the DCF value — both the present value of near-term cash flows and, more significantly, the terminal value.\n\nIntuition: WACC is the denominator in the discount factor. A higher denominator means each dollar of future cash flow is worth less today.\n\nMagnified impact on terminal value: TV = FCF / (WACC − g). If WACC increases from 10% to 11% and g = 3%, the denominator goes from 7% to 8% — a ~14% increase — which reduces TV by ~14%.\n\nPractical implications:\n• Interest rate increases → higher WACC → lower valuations (this is why rising rates hurt growth stocks most — their cash flows are further in the future)\n• Riskier companies (higher beta, more leverage) → higher WACC → lower valuation vs. safer peers with same cash flows`,
  },
  {
    id: 'dcf-m-4',
    topic: 'dcf',
    difficulty: 'medium',
    question: 'What is CAPM and how is it used in a DCF?',
    answer: `CAPM (Capital Asset Pricing Model) is used to estimate the cost of equity — the return required by equity investors given the systematic risk of the company.\n\nFormula: Re = Rf + β × ERP\n• Rf = Risk-free rate (yield on 10-year US Treasury)\n• β = Beta, which measures the stock's sensitivity to market movements. β > 1 means more volatile than the market.\n• ERP = Equity Risk Premium — the additional return investors demand for holding stocks over the risk-free rate (~5–6% in the US)\n\nIn a DCF:\n1. Pull betas from comparable public companies\n2. Un-lever each beta to remove the effect of their capital structure: βu = βl / (1 + (1−t) × D/E)\n3. Re-lever to the subject company's target capital structure: βl = βu × (1 + (1−t) × D/E)\n4. Plug into CAPM to get Re, then use in WACC`,
  },

  // ── DCF — ADVANCED ────────────────────────────────────────────────────────
  {
    id: 'dcf-a-1',
    topic: 'dcf',
    difficulty: 'advanced',
    question: 'A company currently has significant NOLs (net operating losses). How does this affect your DCF?',
    answer: `NOLs are deferred tax assets — the company has tax losses it can use to offset future taxable income, reducing cash taxes paid in the future.\n\nHow to handle in a DCF:\n1. Build a tax schedule: Explicitly model when the NOLs are utilized (NOLs typically have a 20-year carry-forward under US tax law). Apply them to reduce taxable income year by year.\n2. Use cash taxes (not book taxes) in your FCFF calculation: FCFF = EBIT × (1 − cash tax rate) + D&A − Capex − ΔWC. The cash tax rate will be lower in years when NOLs are utilized.\n3. Value the tax shield separately: Some analysts value the NOLs as a separate asset — PV of future tax savings discounted at an appropriate rate.\n\nImpact: NOLs increase FCF in the near term and therefore increase the DCF value. A company with large NOLs is often an attractive LBO target for this reason.`,
  },
  {
    id: 'dcf-a-2',
    topic: 'dcf',
    difficulty: 'advanced',
    question: 'Walk me through the key sensitivities you would run on a DCF and why.',
    answer: `A DCF output is only as good as its assumptions. The most important sensitivities:\n\n1. WACC vs. Terminal Growth Rate: The classic sensitivity table. Since TV is 60–80% of value, small changes in either input have an outsized impact. Show a 5×5 table varying WACC ±100–200 bps and g ±50–100 bps.\n\n2. WACC vs. Exit Multiple (if using exit multiple method): Shows valuation across a range of market conditions at exit.\n\n3. Revenue growth rate vs. EBITDA margin: Tests how sensitive the model is to your operating assumptions — especially important for growth companies.\n\n4. Entry capex vs. maintenance capex assumptions: Relevant for capital-intensive businesses where near-term capex significantly affects FCF.\n\n5. Working capital assumptions: Can materially affect FCF in businesses with long cash conversion cycles.\n\nPresentation: Tornado charts or sensitivity tables. Always anchor your base case and explain what would need to be true for the bull and bear cases.`,
  },

  // ── LBO — EASY ────────────────────────────────────────────────────────────
  {
    id: 'lbo-e-1',
    topic: 'lbo',
    difficulty: 'easy',
    question: 'What is an LBO and why do private equity firms use leverage?',
    answer: `A Leveraged Buyout (LBO) is the acquisition of a company using a significant amount of borrowed money (debt) to fund the purchase price. The target company's assets and cash flows typically serve as collateral for the debt.\n\nWhy use leverage?\n1. Amplify equity returns: If a PE firm buys a company for $500M using $100M equity + $400M debt, a $50M increase in value represents a 50% return on equity — vs. only 10% if they had used all equity.\n2. Tax shield: Interest on debt is tax-deductible, reducing taxable income and improving after-tax cash flows.\n3. Discipline: The debt load forces management to focus on cash flow generation and operational efficiency.\n4. Capital efficiency: PE firms can diversify across more investments by using leverage rather than committing all equity capital to a single deal.`,
  },
  {
    id: 'lbo-e-2',
    topic: 'lbo',
    difficulty: 'easy',
    question: 'What makes a good LBO candidate?',
    answer: `A good LBO candidate has characteristics that support a highly levered capital structure and attractive equity returns:\n\n1. Strong, stable free cash flows: Needed to service debt. Recurring revenue (subscriptions, contracts) is ideal.\n2. Low existing debt: Room on the balance sheet to add leverage.\n3. Strong market position / defensible business: Reduces risk of cash flow deterioration.\n4. Non-cyclical revenues: Lenders want predictable cash flows to underwrite against.\n5. Tangible assets: Can serve as collateral; also provides downside protection.\n6. Operational improvement potential: PE firms want to add value — room to cut costs, expand margins, or grow revenue.\n7. Clear exit path: Identifiable strategic buyers or ability to re-IPO in 3–7 years.\n8. Reasonable entry price: Low EV/EBITDA multiple relative to the company's quality.`,
  },
  {
    id: 'lbo-e-3',
    topic: 'lbo',
    difficulty: 'easy',
    question: 'What are the three primary ways a PE firm generates returns in an LBO?',
    answer: `1. Multiple expansion: Buying a company at, say, 7x EBITDA and selling it at 10x. The difference in multiple directly accretes to equity value. This is often the biggest driver in strong markets but is not something a PE firm fully controls.\n\n2. EBITDA growth (operational improvement): Growing the company's earnings through revenue growth, margin improvement, add-on acquisitions, or new products. A more "controllable" driver that PE firms focus on — this is where operational value creation happens.\n\n3. Debt paydown (deleveraging): Using the company's free cash flow to repay debt over the holding period. As debt decreases, equity value increases (EV − Debt = Equity). Even if EV stays flat, equity value rises as debt is paid down.`,
  },

  // ── LBO — MEDIUM ──────────────────────────────────────────────────────────
  {
    id: 'lbo-m-1',
    topic: 'lbo',
    difficulty: 'medium',
    question: 'Walk me through the sources and uses of funds in a typical LBO.',
    answer: `Sources and Uses is a table that shows where the money comes from and where it goes at the time of the acquisition.\n\nUSES (what the money pays for):\n• Purchase of equity (purchase price = entry multiple × EBITDA)\n• Debt refinancing (paying off existing target debt)\n• Transaction fees (advisory, financing, legal)\n• Other (working capital adjustments, OID on debt)\n\nSOURCES (how the deal is funded):\n• Senior secured debt (revolver, term loan A/B)\n• Subordinated/mezzanine debt\n• High-yield bonds\n• PE equity contribution (the "check" from the PE fund)\n• Management rollover equity\n• Cash from target's balance sheet\n\nKey rule: Sources must always equal Uses. The mix of debt vs. equity determines the leverage ratio and, in turn, the return profile.`,
  },
  {
    id: 'lbo-m-2',
    topic: 'lbo',
    difficulty: 'medium',
    question: 'How do you calculate IRR in an LBO model?',
    answer: `IRR (Internal Rate of Return) is the discount rate that makes the NPV of all cash flows equal to zero — essentially the compound annual return on the equity investment.\n\nIn an LBO:\n• Year 0 cash flow: −Equity invested (the PE firm's check; negative)\n• Intermediate cash flows: Dividends, dividend recaps, or partial exits (if any)\n• Exit cash flow: Equity proceeds at sale = Exit EV − Remaining Debt\n\nExit EV = Exit EBITDA × Exit Multiple\nEquity proceeds = Exit EV − Net Debt at exit\n\nIRR is solved iteratively (use Excel's IRR or XIRR function). PE firms typically target 20%+ IRR and 2–3x MoM (money-on-money multiple).\n\nSimplified mental math: Roughly, doubling your money in 3 years ≈ 26% IRR; in 5 years ≈ 15% IRR; tripling in 5 years ≈ 25% IRR.`,
  },
  {
    id: 'lbo-m-3',
    topic: 'lbo',
    difficulty: 'medium',
    question: 'How does adding more leverage affect returns in an LBO, and what are the risks?',
    answer: `More leverage amplifies equity returns — but cuts both ways.\n\nPositive effect on returns:\n• Lower equity contribution for the same purchase price → higher return on a smaller equity base\n• Debt is cheaper than equity (tax-deductible interest)\n• If the company is sold at the same EV, more of the value flows to equity once debt is repaid\n\nNegative risks:\n• Higher debt service reduces free cash flow available for reinvestment or operations\n• If EBITDA declines, the company may breach covenants or be unable to service debt → default risk\n• Interest rates rising increases cost of floating-rate debt\n• Lenders constrain leverage based on coverage ratios (Debt/EBITDA typically 4–6x) and interest coverage (EBITDA/Interest ≥ 2–3x)\n\nThe optimal leverage maximizes returns while maintaining sufficient FCF to service debt through a downturn.`,
  },
  {
    id: 'lbo-m-4',
    topic: 'lbo',
    difficulty: 'medium',
    question: 'What is the difference between senior secured debt, subordinated debt, and PIK in an LBO capital structure?',
    answer: `Capital structures are stacked by seniority — higher seniority means paid first in a bankruptcy.\n\nSenior Secured Debt (Term Loans, Revolver):\n• First priority claim on assets\n• Lowest interest rate (safest for lenders)\n• Typically 3–4x EBITDA\n• Floating rate (SOFR + spread)\n\nSubordinated / Mezzanine Debt / High-Yield Bonds:\n• Second priority; higher risk than senior\n• Higher interest rate (8–12%+)\n• Sometimes includes equity warrants (mezzanine)\n• Adds another 1–2x leverage\n\nPIK (Payment-in-Kind) Debt:\n• Interest is not paid in cash — it "accretes" into the principal balance\n• Used when the company can't support more cash interest payments\n• Highest cost of debt; signals significant risk\n• Increases the total debt burden over time\n\nGeneral principle: The further down the stack, the higher the risk and the higher the required return.`,
  },

  // ── LBO — ADVANCED ────────────────────────────────────────────────────────
  {
    id: 'lbo-a-1',
    topic: 'lbo',
    difficulty: 'advanced',
    question: 'Walk me through a simple LBO model from scratch.',
    answer: `Step 1 — Entry assumptions:\n• Purchase price = Entry EBITDA × Entry Multiple\n• Debt = Leverage Multiple × EBITDA (e.g., 5x)\n• Equity = Purchase Price − Total Debt\n\nStep 2 — Operating projections (5-year):\n• Project revenue, EBITDA, D&A, EBIT, taxes, capex, working capital changes\n• Calculate unlevered free cash flow each year\n\nStep 3 — Debt schedule:\n• Start with opening debt balance\n• Add interest expense (cash and PIK)\n• Subtract mandatory amortization and optional cash sweep\n• Ending balance = opening + PIK interest − cash repayment\n\nStep 4 — Exit:\n• Exit EBITDA = Year 5 EBITDA\n• Exit EV = Exit EBITDA × Exit Multiple\n• Equity proceeds = Exit EV − Net Debt at exit\n\nStep 5 — Returns:\n• MoM = Equity proceeds / Initial equity investment\n• IRR = XIRR([-equity, 0, 0, 0, 0, equity_proceeds], dates)\n• Sensitivity table: IRR across entry/exit multiple combinations`,
  },
  {
    id: 'lbo-a-2',
    topic: 'lbo',
    difficulty: 'advanced',
    question: 'What is a dividend recapitalization and when would a PE firm pursue one?',
    answer: `A dividend recapitalization (dividend recap) is when a PE-backed company takes on additional debt and uses the proceeds to pay a special dividend to its equity holders (the PE firm), rather than using the cash for operations or debt paydown.\n\nWhen PE firms pursue it:\n• The company has performed well and de-levered, creating capacity for more debt\n• The PE firm wants to return capital to LPs before a formal exit\n• Market conditions are favorable for new debt issuance (low rates, tight spreads)\n• A sale or IPO isn't yet achievable but the fund wants to lock in some return\n\nEffect on returns:\n• Boosts IRR by pulling forward cash flows (PE receives cash sooner)\n• May reduce MoM if total proceeds are the same, but IRR benefits from timing\n• Increases leverage again, re-loading risk onto the company\n\nRisk: If business conditions deteriorate after the recap, the company is more vulnerable to distress having just extracted cash.`,
  },

  // ── OTHER — EASY ──────────────────────────────────────────────────────────
  {
    id: 'oth-e-1',
    topic: 'other',
    difficulty: 'easy',
    question: 'What is the difference between a merger and an acquisition?',
    answer: `In an acquisition, one company (the acquirer) buys another (the target). The target ceases to exist as an independent entity.\n\nIn a merger, two companies combine to form a new entity, typically as equals. Both companies' shareholders receive shares of the new combined company. True mergers of equals are relatively rare.\n\nIn practice, the terms are often used interchangeably in M&A — most "mergers" are actually acquisitions where the larger company buys the smaller one and the combined entity operates under the acquirer's brand. The legal and structural distinction matters less than the economic one.`,
  },
  {
    id: 'oth-e-2',
    topic: 'other',
    difficulty: 'easy',
    question: 'What are synergies in M&A and what are the main types?',
    answer: `Synergies are the additional value created when two companies combine that couldn't be achieved independently — the rationale for paying an acquisition premium.\n\nCost synergies (more common, more reliable):\n• Eliminating duplicate headcount (corporate functions, back office)\n• Consolidating facilities, vendors, and supply chains\n• Removing redundant technology systems\n• Procurement savings from increased scale\n\nRevenue synergies (less certain, harder to model):\n• Cross-selling products to the other company's customer base\n• Geographic expansion\n• Bundling complementary products\n• Gaining access to new distribution channels\n\nFinancial synergies:\n• Tax benefits (utilizing NOLs)\n• Lower cost of capital at scale\n• Improved debt capacity\n\nBankers typically present synergies in a "synergy case" separate from the base case, given execution risk.`,
  },
  {
    id: 'oth-e-3',
    topic: 'other',
    difficulty: 'easy',
    question: 'What is the difference between a buy-side and sell-side role in investment banking?',
    answer: `In M&A advisory:\n• Sell-side: The bank represents the company being sold. The goal is to run a competitive auction process, maximize the purchase price, and close the deal.\n• Buy-side: The bank represents an acquirer. The goal is to identify targets, value them, structure a deal, and advise on a fair price to pay.\n\nMore broadly in finance:\n• Sell-side: Investment banks, broker-dealers. They sell financial products and advice to clients. Includes IBD, sales & trading, equity research.\n• Buy-side: Asset managers, PE firms, hedge funds, mutual funds. They invest capital with the goal of generating returns.`,
  },

  // ── OTHER — MEDIUM ────────────────────────────────────────────────────────
  {
    id: 'oth-m-1',
    topic: 'other',
    difficulty: 'medium',
    question: 'Walk me through an accretion/dilution analysis.',
    answer: `An accretion/dilution analysis determines whether an acquisition increases (accretive) or decreases (dilutive) the acquirer's EPS.\n\nStep 1 — Calculate the acquirer's standalone EPS: Net income / diluted shares.\n\nStep 2 — Calculate pro forma combined net income:\n• Start with combined net income (acquirer + target)\n• Add synergies (after-tax)\n• Subtract incremental interest expense (if cash deal) × (1 − tax rate)\n• Subtract incremental D&A from purchase price allocation\n\nStep 3 — Calculate pro forma diluted shares:\n• If stock deal: Acquirer shares + new shares issued to target shareholders\n• If cash deal: Acquirer shares unchanged\n\nStep 4 — Pro forma EPS = Pro forma net income / Pro forma diluted shares\n\nIf Pro forma EPS > Standalone EPS → Accretive\nIf Pro forma EPS < Standalone EPS → Dilutive\n\nGeneral rule: Buying a company at a lower P/E than the acquirer is accretive in a stock deal.`,
  },
  {
    id: 'oth-m-2',
    topic: 'other',
    difficulty: 'medium',
    question: 'When is a stock deal more attractive to the acquirer than a cash deal?',
    answer: `A stock deal is more attractive when:\n\n1. The acquirer's stock is highly valued (high P/E): Issuing shares is cheap when the stock trades at a premium. You're paying with "expensive currency."\n\n2. The acquirer wants to share deal risk: If the acquirer uses stock, target shareholders participate in the upside and downside post-close. With cash, all the integration risk stays with the acquirer.\n\n3. Cash is limited or conserving cash matters: Avoids using the balance sheet or taking on acquisition debt.\n\n4. Tax efficiency for target shareholders: In a stock deal, target shareholders can defer capital gains taxes until they sell the new shares (tax-free reorganization).\n\nDownside of stock deals:\n• Dilutive to existing shareholders\n• Implies acquirer may think its stock is fully valued (sends a negative signal to the market)\n• Target shareholders bear integration risk`,
  },
  {
    id: 'oth-m-3',
    topic: 'other',
    difficulty: 'medium',
    question: 'What is purchase price allocation (PPA) and why does it matter?',
    answer: `When a company is acquired, the purchase price must be allocated to the fair value of the target's identifiable assets and liabilities. This is called purchase price allocation under ASC 805.\n\nProcess:\n1. Write up target assets to fair market value (PP&E, intangibles like brand, patents, customer relationships, technology)\n2. Write up (or down) liabilities to fair value\n3. Any remaining excess of purchase price over fair value of net identifiable assets = Goodwill\n\nWhy it matters for financial modeling:\n• Written-up assets generate higher D&A post-deal, reducing future net income\n• Identified intangibles are amortized over their useful life (typically 5–15 years)\n• Higher D&A reduces the EPS benefit of acquisitions (important for accretion/dilution analysis)\n• Goodwill is not amortized under GAAP but is tested for impairment annually`,
  },

  // ── OTHER — ADVANCED ──────────────────────────────────────────────────────
  {
    id: 'oth-a-1',
    topic: 'other',
    difficulty: 'advanced',
    question: 'Walk me through how a merger model works.',
    answer: `A merger model (or combination model) determines the pro forma financial impact of an acquisition on the acquirer.\n\nStep 1 — Standalone models: Build or obtain financial models for both acquirer and target.\n\nStep 2 — Transaction assumptions:\n• Purchase price and form of consideration (cash, stock, or mix)\n• Financing structure (revolver, term loan, new equity)\n• Expected synergies (cost and revenue) and phasing\n• Transaction fees\n\nStep 3 — Sources & Uses: How the deal is financed and what the money pays for.\n\nStep 4 — Purchase price allocation: Write up assets, create goodwill, determine incremental D&A.\n\nStep 5 — Pro forma income statement:\n• Combine acquirer + target revenue and expenses\n• Add synergies (phased in over 2–3 years)\n• Subtract: incremental D&A, interest expense on new debt\n• Add back: avoided interest income on cash used\n• Calculate pro forma taxes\n\nStep 6 — Accretion/Dilution analysis: Compare pro forma EPS to acquirer standalone EPS.\n\nStep 7 — Sensitivity analysis: Vary purchase price premium, synergies, financing mix.`,
  },

  // ── BRAIN TEASERS — EASY ──────────────────────────────────────────────────
  {
    id: 'bt-e-1',
    topic: 'brainteaser',
    difficulty: 'easy',
    question: 'How many gas stations are there in the United States?',
    answer: `This is a market sizing / estimation question. Show your work and logic clearly.\n\nApproach (top-down):\n• US population: ~330 million people\n• ~2.5 people per household → ~130 million households\n• ~80% own a car → ~105 million cars\n• A typical car fills up about once a week, but not all at the same station\n• A gas station can serve ~1,000–1,500 fill-ups per day; say 1,200\n• 1,200 × 365 ≈ 440,000 fill-ups per year per station\n• 105M cars × 52 fill-ups/year = ~5.5 billion fill-ups/year\n• 5.5 billion / 440,000 ≈ ~12,500 stations\n\nActual answer: ~145,000 in the US — so this approach under-estimates. A better adjustment: the average car fills up more like 1–2x per week, many stations are low-volume, and commercial vehicles add significant demand.\n\nKey insight: Show structured thinking. The interviewer wants to see how you decompose a problem, not necessarily the exact answer.`,
  },
  {
    id: 'bt-e-2',
    topic: 'brainteaser',
    difficulty: 'easy',
    question: 'Estimate the size of the US wedding industry.',
    answer: `Approach:\n• US population: 330 million; ~4 million people get married per year (based on ~2M weddings)\n• Average wedding cost: ~$30,000 (widely cited; varies widely by region)\n• Total: 2M weddings × $30,000 = $60 billion/year\n\nBreakdown to validate:\n• Venue & catering: ~$15,000 → $30B\n• Photography/video: ~$3,000 → $6B\n• Flowers/décor: ~$2,500 → $5B\n• Attire (dress, tux): ~$2,000 → $4B\n• Music/entertainment: ~$1,500 → $3B\n• Other (rings, honeymoon, planning, invitations): ~$6,000 → $12B\nTotal: ~$60B ✓\n\nActual industry estimates: $70–80B including honeymoons and rings. Reasonable ballpark.`,
  },

  // ── BRAIN TEASERS — MEDIUM ────────────────────────────────────────────────
  {
    id: 'bt-m-1',
    topic: 'brainteaser',
    difficulty: 'medium',
    question: 'You have a 3-gallon jug and a 5-gallon jug. How do you measure exactly 4 gallons?',
    answer: `Step 1: Fill the 5-gallon jug completely.\nStep 2: Pour from the 5-gallon jug into the 3-gallon jug until the 3-gallon jug is full. You now have 2 gallons in the 5-gallon jug and 3 in the 3-gallon jug.\nStep 3: Empty the 3-gallon jug.\nStep 4: Pour the 2 gallons from the 5-gallon jug into the 3-gallon jug. You now have 2 gallons in the 3-gallon jug and 0 in the 5-gallon jug.\nStep 5: Fill the 5-gallon jug completely.\nStep 6: Pour from the 5-gallon jug into the 3-gallon jug (which already has 2 gallons) until it's full. You'll pour exactly 1 gallon to fill it.\nResult: 5 − 1 = 4 gallons remain in the 5-gallon jug. ✓`,
  },
  {
    id: 'bt-m-2',
    topic: 'brainteaser',
    difficulty: 'medium',
    question: 'A stock is at $100. It can go up 10% or down 10% each day with equal probability. What is the expected value after 2 days?',
    answer: `Four equally likely paths (each with 25% probability):\n• Up, Up: $100 × 1.10 × 1.10 = $121\n• Up, Down: $100 × 1.10 × 0.90 = $99\n• Down, Up: $100 × 0.90 × 1.10 = $99\n• Down, Down: $100 × 0.90 × 0.90 = $81\n\nExpected value = 0.25 × ($121 + $99 + $99 + $81) = 0.25 × $400 = $100\n\nThe expected value is still $100 — the same as the starting price.\n\nKey insight: Multiplicative returns create a downward drag. The geometric mean is less than the arithmetic mean: √(1.10 × 0.90) = √0.99 ≈ 0.995. Over time, this "variance drain" causes the expected ending value to drift below $100, even though each day's expected return is 0%.`,
  },
  {
    id: 'bt-m-3',
    topic: 'brainteaser',
    difficulty: 'medium',
    question: 'You are offered a coin flip game: heads you win $2, tails you lose $1. How much would you pay to play this game?',
    answer: `Expected value per flip: 0.5 × $2 + 0.5 × (−$1) = $1.00 − $0.50 = +$0.50\n\nIn a world of purely rational, risk-neutral actors, you would pay up to $0.50 to play.\n\nBut in practice, it depends:\n• Risk aversion: Most people are risk-averse and would pay less than the EV due to the possibility of loss.\n• Number of plays: If you can play 1,000 times, the law of large numbers kicks in and you'd confidently pay close to $0.50. For a single play, you might pay less.\n• Utility of money: $1 lost has more psychological impact than $2 gained for most people (loss aversion per Kahneman & Tversky).\n\nGood follow-up discussion: How does this relate to investing? Why do investors demand an equity risk premium? Same concept — they need compensation for uncertainty beyond the expected value.`,
  },

  // ── BRAIN TEASERS — ADVANCED ──────────────────────────────────────────────
  {
    id: 'bt-a-1',
    topic: 'brainteaser',
    difficulty: 'advanced',
    question: 'You have 12 identical-looking balls. One is either heavier or lighter than the rest. Using a balance scale exactly 3 times, identify the odd ball and whether it\'s heavier or lighter.',
    answer: `Divide 12 balls into 3 groups of 4: A (1–4), B (5–8), C (9–12).\n\nWeigh 1: A vs. B\n\nCase 1 — They balance: The odd ball is in C.\n• Weigh 2: 3 balls from C vs. 3 known-good balls (from A or B).\n  - If they balance: The 4th ball in C is odd. Weigh 3: That ball vs. a known-good ball → heavier or lighter.\n  - If C-side is heavier: Odd ball is heavier. Weigh 3: 2 of those 3 C-balls against each other → if they balance, it's the 3rd; if not, it's the heavier one.\n  - If C-side is lighter: Same logic, but looking for the lighter ball.\n\nCase 2 — A is heavier than B: The odd ball is in A or B (A could be heavy, B could be light).\n• Weigh 2: Swap 3 balls between A and B, keep 1 from A, 1 from B aside.\n  - Analyze the 3 possible outcomes to narrow down to 1–2 suspect balls.\n  - Weigh 3: Final comparison to identify the odd ball.\n\nKey insight: 3 weighings can distinguish among 3^3 = 27 outcomes — enough to cover 12 × 2 = 24 possibilities (12 balls × heavy or light).`,
  },
  {
    id: 'bt-a-2',
    topic: 'brainteaser',
    difficulty: 'advanced',
    question: 'How would you value a real option — for example, a company\'s right (but not obligation) to expand into a new market in 3 years?',
    answer: `A real option is an option on a real (non-financial) asset. It can be valued similarly to a financial option using the Black-Scholes model or a binomial tree.\n\nKey inputs (analogous to financial options):\n• Underlying asset value (S): PV of cash flows from the expansion opportunity\n• Exercise price (K): Investment required to expand (capex, launch costs)\n• Time to expiration (T): 3 years\n• Volatility (σ): Uncertainty in the value of the expansion opportunity\n• Risk-free rate (r): Prevailing risk-free rate\n\nBlack-Scholes intuition:\n• If S >> K (expansion looks very profitable), the option is deep in-the-money — the company will almost certainly expand.\n• If S << K, the option is out-of-the-money — valuable only if conditions improve.\n• High volatility increases option value: more uncertainty means more upside optionality.\n\nPractical approach:\n• Build a DCF for the expansion scenario\n• Run a Monte Carlo simulation on key value drivers\n• Report the probability-weighted NPV, or use Black-Scholes with estimated volatility\n\nReal options matter most in: mining, pharma (drug pipelines), oil & gas exploration, and tech platform businesses.`,
  },
]
