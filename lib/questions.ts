export type QuestionType = 'behavioral' | 'technical'
export type Topic = 'accounting' | 'valuation' | 'dcf' | 'lbo' | 'ma' | 'restructuring' | 'financial_markets'
export type Difficulty = 'easy' | 'medium' | 'advanced'

export type Question = {
  id: string
  question_type: QuestionType
  topic: Topic | null        // null for behavioral questions
  difficulty: Difficulty | null  // null for behavioral questions
  question: string
  answer: string
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
}

export const TOPIC_LABELS: Record<Topic, string> = {
  accounting:       'Accounting',
  valuation:        'Valuation',
  dcf:              'DCF',
  lbo:              'LBO',
  ma:               'M&A',
  restructuring:    'Restructuring',
  financial_markets:'Financial Markets',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:     'Easy',
  medium:   'Medium',
  advanced: 'Advanced',
}

export const TOPICS: Topic[] = ['accounting', 'valuation', 'dcf', 'lbo', 'ma', 'restructuring', 'financial_markets']
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'advanced']
export const QUESTION_TYPES: QuestionType[] = ['behavioral', 'technical']

// ── Static fallback question bank ──────────────────────────────────────────────
// Used when the Supabase `questions` table is empty or unavailable.

export const QUESTIONS: Question[] = [

  // ── BEHAVIORAL ────────────────────────────────────────────────────────────────

  {
    id: 'beh-e-1',
    question_type: 'behavioral',
    topic: null,
    difficulty: null,
    question: 'Tell me about yourself.',
    answer: `Give a concise, structured 90-second pitch covering three things: who you are academically/professionally, what experiences have led you to investment banking, and why you're excited about this firm specifically.\n\nStructure: Past → Present → Future\n• Past: Where you're from, school, relevant coursework or prior experience.\n• Present: What you're doing now (current role, internships, clubs) that is directly relevant.\n• Future: Why IB, why this bank, why this group.\n\nTips:\n• Every sentence should earn its place. Cut anything that doesn't build toward "I belong in IB."\n• End on a forward-looking note that invites conversation.\n• Practice until it sounds natural, not memorized.`,
  },
  {
    id: 'beh-e-2',
    question_type: 'behavioral',
    topic: null,
    difficulty: null,
    question: 'Why investment banking?',
    answer: `Strong answers tie together three threads: intellectual interest, skills, and career goals.\n\nIntellectual interest: You find deals, capital markets, and corporate strategy genuinely interesting — be specific. Reference a transaction, a market trend, or a course that clicked.\n\nSkills: You want the fast-paced, analytical, high-output environment that builds a toolkit you can't get elsewhere as quickly — financial modeling, client exposure, industry depth.\n\nCareer goals: IB is the right foundation for where you want to go (stay in banking, go to PE/HF, operate in industry). Make it specific and credible — not "I want to keep all my options open."\n\nAvoid clichés: "I love finance," "I'm a hard worker," "I want to learn a lot." Everyone says these. Differentiate with a specific experience or transaction that inspired you.`,
  },
  {
    id: 'beh-m-1',
    question_type: 'behavioral',
    topic: null,
    difficulty: null,
    question: 'Tell me about a time you worked under significant pressure or a tight deadline. How did you handle it?',
    answer: `Use the STAR format: Situation → Task → Action → Result.\n\nSituation: Set the scene briefly — what project, team, and timeline were involved?\nTask: What was your specific responsibility? What was at stake?\nAction: Walk through concretely what you did. Focus on: how you prioritized, how you communicated, how you managed your own performance under stress. Show judgment and composure.\nResult: Quantify if possible (delivered on time, grade received, client was satisfied). What did you learn?\n\nWhat bankers are actually assessing:\n• Can you stay organized and effective when stressed?\n• Do you communicate proactively when you're at risk of missing a deadline?\n• Are you self-aware about what went well and what you'd do differently?\n\nCommon mistake: Picking a low-stakes example or spending too long on the situation and not enough on your specific actions.`,
  },
  {
    id: 'beh-m-2',
    question_type: 'behavioral',
    topic: null,
    difficulty: null,
    question: 'Walk me through a deal or transaction you\'ve been following closely. What is your view on it?',
    answer: `Pick a deal you genuinely understand well — ideally an M&A transaction, LBO, or major financing announced in the past 6–12 months. Do NOT pick something just because it's big and well-known if you can't speak to the details.\n\nStructure your answer:\n1. What is the deal? (acquirer, target, size, structure)\n2. What's the strategic rationale? (Why now? What does the acquirer get?)\n3. How is it being financed? (All-cash, stock, debt — and implications)\n4. What synergies are anticipated? Are they credible?\n5. What risks concern you? (Regulatory, integration, valuation, macro)\n6. Your view: Do you think it's a good deal? Would it be accretive/dilutive? Is the premium justified?\n\nWhat makes this answer stand out:\n• Show you read the merger agreement or at least the investor presentation\n• Reference specific numbers (EV/EBITDA multiple paid, synergy targets, leverage ratio)\n• Have a real opinion — don't just summarize the press release`,
  },
  {
    id: 'beh-a-1',
    question_type: 'behavioral',
    topic: null,
    difficulty: null,
    question: 'Describe a time you disagreed with a supervisor or senior colleague. How did you handle it?',
    answer: `This question tests maturity, professionalism, and communication skills. Bankers want to see that you can push back thoughtfully — not that you just comply or that you're combative.\n\nIdeal answer structure:\n• Context: What was the disagreement? (Analytical conclusion, approach to client, prioritization?)\n• How you raised it: Did you wait for the right moment? Did you come prepared with data/reasoning?\n• What happened: Did you persuade them, or did they persuade you? Either outcome is fine.\n• Takeaway: What did you learn about communication, hierarchy, or the substance of the issue?\n\nWhat to avoid:\n• Making your supervisor look incompetent or unreasonable\n• Portraying yourself as always right\n• Picking a trivial example\n\nBest examples come from: research or analysis where you found a different answer and had to defend your methodology; a client situation where you had a different view on strategy; prioritizing competing deliverables.`,
  },

  // ── ACCOUNTING ────────────────────────────────────────────────────────────────

  {
    id: 'acc-e-1',
    question_type: 'technical',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'Walk me through the three financial statements.',
    answer: `The three statements are the Income Statement, Balance Sheet, and Cash Flow Statement.\n\nThe Income Statement shows revenue, expenses, and net income over a period. Net income flows into retained earnings on the Balance Sheet and is the starting point of the Cash Flow Statement.\n\nThe Balance Sheet is a snapshot of assets, liabilities, and equity at a point in time. Assets = Liabilities + Equity.\n\nThe Cash Flow Statement reconciles net income to actual cash generated, broken into operating, investing, and financing activities. The ending cash balance ties to cash on the Balance Sheet.`,
  },
  {
    id: 'acc-e-2',
    question_type: 'technical',
    topic: 'accounting',
    difficulty: 'easy',
    question: 'A company records $10 more in depreciation. How does this affect the three financial statements?',
    answer: `Income Statement: Pre-tax income decreases by $10. Assuming a 40% tax rate, net income decreases by $6.\n\nBalance Sheet: PP&E decreases by $10 (accumulated depreciation increases). Retained earnings decrease by $6 and taxes payable decrease by $4 — balance sheet still balances.\n\nCash Flow Statement: Net income is down $6, but depreciation is a non-cash charge so you add back $10 in the operating section. Net effect on cash is +$4 (the tax shield).`,
  },
  {
    id: 'acc-m-1',
    question_type: 'technical',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'How does a $50 inventory write-down affect the three financial statements?',
    answer: `Income Statement: COGS increases by $50. Pre-tax income decreases by $50, net income decreases by $30 (at 40% tax rate).\n\nBalance Sheet: Inventory decreases by $50. Retained earnings decreases by $30. Taxes payable decreases by $20. Balance sheet remains balanced.\n\nCash Flow Statement: Net income is down $30. The write-down is a non-cash charge, so you add back $50 in the operating section. Net cash impact is +$20 (the tax benefit). No actual cash was spent — this reflects the reduced value of an asset already on the books.`,
  },
  {
    id: 'acc-m-2',
    question_type: 'technical',
    topic: 'accounting',
    difficulty: 'medium',
    question: 'What is deferred revenue, and how does it flow through the financial statements?',
    answer: `Deferred revenue is a liability that arises when a company receives cash before delivering goods or services.\n\nWhen cash is received:\n• Cash +$X on the Balance Sheet\n• Deferred Revenue +$X (liability) on the Balance Sheet\n• No revenue recognized yet on the Income Statement\n\nAs the service is delivered:\n• Deferred Revenue decreases on the Balance Sheet\n• Revenue is recognized on the Income Statement\n\nExample: A SaaS company receives $1,200 for an annual subscription. Each month, $100 moves from deferred revenue to revenue.`,
  },
  {
    id: 'acc-a-1',
    question_type: 'technical',
    topic: 'accounting',
    difficulty: 'advanced',
    question: 'What is the difference between LIFO and FIFO inventory accounting, and which results in higher net income in an inflationary environment?',
    answer: `FIFO (First In, First Out): Oldest inventory is sold first. In inflation, COGS reflects old (lower) costs, so gross profit and net income are higher. Inventory on the balance sheet is at newer (higher) prices — closer to replacement cost.\n\nLIFO (Last In, First Out): Newest inventory is sold first. In inflation, COGS reflects recent (higher) costs, so gross profit and net income are lower. But cash flow is better (lower taxes). Inventory on the balance sheet is at old (lower) prices.\n\nIn an inflationary environment: FIFO produces higher net income. LIFO produces higher cash flow (due to tax savings).\n\nNote: LIFO is not permitted under IFRS and is rarely used outside the US. Most companies use FIFO or weighted average cost.`,
  },

  // ── VALUATION ─────────────────────────────────────────────────────────────────

  {
    id: 'val-e-1',
    question_type: 'technical',
    topic: 'valuation',
    difficulty: 'easy',
    question: 'What are the three main valuation methodologies used in investment banking?',
    answer: `1. Comparable Company Analysis (Trading Comps): Values a company based on the valuation multiples (EV/EBITDA, P/E, EV/Revenue) of similar publicly traded companies. Reflects current market sentiment.\n\n2. Precedent Transaction Analysis (Deal Comps): Values a company based on multiples paid in past M&A transactions involving similar companies. Typically higher than trading comps because it includes a control premium.\n\n3. Discounted Cash Flow (DCF): Values a company based on the present value of its projected free cash flows, discounted at the weighted average cost of capital (WACC). Intrinsic valuation — not dependent on market prices.\n\nBankers typically present all three in a "football field" chart to show a range of implied values.`,
  },
  {
    id: 'val-e-2',
    question_type: 'technical',
    topic: 'valuation',
    difficulty: 'easy',
    question: 'What is Enterprise Value, and how does it differ from Equity Value?',
    answer: `Enterprise Value (EV) represents the total value of a business — what it would cost to acquire the entire company, including its debt.\n\nEV = Equity Value + Debt + Preferred Stock + Minority Interest − Cash\n\nEquity Value (Market Cap) is just the value attributable to equity holders: share price × diluted shares outstanding.\n\nKey distinction:\n• EV is capital-structure neutral — you can compare companies with different debt levels.\n• Equity Value is what shareholders receive after all debt obligations are settled.\n\nEV multiples (EV/EBITDA, EV/Revenue) are preferred for operational comparisons. Equity multiples (P/E) are more sensitive to leverage.`,
  },
  {
    id: 'val-m-1',
    question_type: 'technical',
    topic: 'valuation',
    difficulty: 'medium',
    question: 'When would you use EV/EBITDA vs. P/E as a valuation multiple?',
    answer: `EV/EBITDA is used when:\n• Comparing companies with different capital structures (different debt levels)\n• Valuing capital-intensive businesses (EBITDA before D&A strips out capex timing differences)\n• In LBO analysis (buyers look at cash generation before financing costs)\n• Industries: manufacturing, industrials, infrastructure, telecom\n\nP/E is used when:\n• Comparing companies within the same industry with similar leverage\n• For financial companies (banks, insurance) where debt is part of the business model, not just financing\n• When EPS is the most relevant investor metric (mature, profitable companies)\n\nWeaknesses:\n• EV/EBITDA ignores capex differences (hence EV/EBIT or EV/EBITDA–Capex is sometimes preferred)\n• P/E is meaningless for unprofitable companies and is distorted by capital structure`,
  },
  {
    id: 'val-a-1',
    question_type: 'technical',
    topic: 'valuation',
    difficulty: 'advanced',
    question: 'Walk me through how you would build a comparable company analysis from scratch.',
    answer: `Step 1 — Select the peer set: Choose 6–10 publicly traded companies that are comparable in business model, industry, size, growth profile, and geography. Be prepared to defend each inclusion/exclusion.\n\nStep 2 — Gather financial data: Pull LTM (last twelve months) and forward estimates for Revenue, EBITDA, EBIT, EPS, and Free Cash Flow. Use the most recent filings and consensus estimates from Bloomberg/FactSet.\n\nStep 3 — Calculate equity value and enterprise value for each comp: Market cap from share price × diluted shares; EV = market cap + net debt + minority interest + preferred stock.\n\nStep 4 — Calculate trading multiples: EV/Revenue, EV/EBITDA, EV/EBIT, P/E, Price/FCF for both LTM and forward year.\n\nStep 5 — Spread and analyze: Look at median, mean, 25th/75th percentile. Identify outliers and understand why they trade differently.\n\nStep 6 — Apply to target: Apply selected multiple range to the target's corresponding metric to get implied enterprise value, then bridge to equity value per share.`,
  },

  // ── DCF ───────────────────────────────────────────────────────────────────────

  {
    id: 'dcf-e-1',
    question_type: 'technical',
    topic: 'dcf',
    difficulty: 'easy',
    question: 'Walk me through a DCF analysis.',
    answer: `A DCF values a company based on the present value of its future free cash flows.\n\nStep 1 — Project Free Cash Flow: Typically 5–10 years. FCF = EBIT × (1 − tax rate) + D&A − Capex − Increase in Working Capital.\n\nStep 2 — Calculate Terminal Value: Represents value beyond the projection period. Two methods:\n• Gordon Growth Model: TV = FCF_final × (1 + g) / (WACC − g)\n• Exit Multiple Method: TV = EBITDA_final × exit multiple\n\nStep 3 — Calculate WACC: Weighted average of the cost of equity (using CAPM) and after-tax cost of debt, weighted by their proportions in the capital structure.\n\nStep 4 — Discount everything: PV = FCF_t / (1 + WACC)^t. Sum all discounted FCFs plus discounted terminal value.\n\nStep 5 — Bridge to equity value: EV − Net Debt = Equity Value. Divide by diluted shares for implied price per share.`,
  },
  {
    id: 'dcf-m-1',
    question_type: 'technical',
    topic: 'dcf',
    difficulty: 'medium',
    question: 'What is WACC and how do you calculate the cost of equity?',
    answer: `WACC (Weighted Average Cost of Capital) is the blended required return across all sources of capital:\n\nWACC = (E/V) × Ke + (D/V) × Kd × (1 − t)\n\nwhere E = equity value, D = debt value, V = E + D, Ke = cost of equity, Kd = cost of debt, t = tax rate.\n\nCost of equity uses CAPM:\nKe = Risk-Free Rate + Beta × Equity Risk Premium\n\n• Risk-free rate: Typically the 10-year US Treasury yield\n• Beta: Measure of systematic risk relative to the market. For private companies, unlever comparable public company betas, then relever at the target capital structure\n• Equity Risk Premium (ERP): Historical or implied premium equity earns over risk-free rate — typically 5–7%\n\nCost of debt: Use the company's current borrowing rate or yield to maturity on outstanding debt, tax-effected: Kd × (1 − t).`,
  },
  {
    id: 'dcf-a-1',
    question_type: 'technical',
    topic: 'dcf',
    difficulty: 'advanced',
    question: 'What are the main limitations of a DCF analysis?',
    answer: `1. Sensitivity to terminal value: TV often represents 60–80%+ of total DCF value. Small changes in WACC or the terminal growth rate create massive swings in valuation.\n\n2. WACC is difficult to pin down: Beta varies by period and comparables chosen. ERP is debated. Capital structure assumptions are circular (equity value depends on WACC which depends on equity value).\n\n3. Long-term projections are unreliable: 5–10 year forecasts involve compounding uncertainty, especially for growth assumptions.\n\n4. Doesn't reflect current market conditions: A DCF might show intrinsic value well above or below what markets will actually pay — markets can be irrationally priced for extended periods.\n\n5. Management bias: Projections are often provided by management and can be optimistic. Garbage in, garbage out.\n\n6. Ignores optionality: Standard DCF doesn't capture the value of flexibility (real options) or staged investments.\n\nIn practice, DCF is most useful as a sanity check alongside comps — not as a standalone answer.`,
  },

  // ── LBO ───────────────────────────────────────────────────────────────────────

  {
    id: 'lbo-e-1',
    question_type: 'technical',
    topic: 'lbo',
    difficulty: 'easy',
    question: 'What is an LBO, and why do private equity firms use leverage?',
    answer: `An LBO (Leveraged Buyout) is the acquisition of a company using a significant amount of debt — typically 50–70% of the purchase price — with the acquired company's assets and cash flows serving as collateral.\n\nWhy use leverage?\n1. Amplifies equity returns: If you buy a company for $100 with $70 of debt and $30 of equity, and sell it later for $130, you've made $30 on a $30 investment — a 100% return. Without leverage, that's only a 30% return.\n\n2. Tax shield: Interest expense is tax-deductible, reducing the effective cost of debt financing.\n\n3. Discipline: Leverage forces management to generate cash flow to service debt, reducing agency problems.\n\nTypical LBO targets have: stable, predictable cash flows; strong market position; low existing debt; potential for operational improvement; and ideally a clear exit path.`,
  },
  {
    id: 'lbo-m-1',
    question_type: 'technical',
    topic: 'lbo',
    difficulty: 'medium',
    question: 'Walk me through the key value creation drivers in an LBO.',
    answer: `Three primary sources of PE return:\n\n1. EBITDA growth: Revenue growth, margin expansion (cost cuts, pricing power, operational improvements). The biggest driver of sustainable returns.\n\n2. Multiple expansion: Buying at a lower multiple and selling at a higher multiple. Example: buy at 7x EBITDA, exit at 9x — even with flat EBITDA, this alone creates significant equity value. Relies on market conditions, not always controllable.\n\n3. Debt paydown (leverage): As the company generates free cash flow and pays down debt, more of the enterprise value accrues to equity holders. Sometimes called "equity build-up."\n\nReturn attribution: In a good deal, EBITDA growth and debt paydown are the primary drivers. Multiple expansion is a bonus. Heavy reliance on multiple expansion implies financial engineering, not operational value creation — less defensible.\n\nKey metric: IRR (Internal Rate of Return) and MOIC (Multiple on Invested Capital). Target IRR for buyout funds is typically 20–25%+.`,
  },
  {
    id: 'lbo-a-1',
    question_type: 'technical',
    topic: 'lbo',
    difficulty: 'advanced',
    question: 'Walk me through an LBO model.',
    answer: `Step 1 — Transaction structure: Determine purchase price (entry EV/EBITDA × EBITDA). Build Sources & Uses: debt (senior secured, subordinated) and equity from the PE firm finance the purchase price + fees.\n\nStep 2 — Debt schedule: Model each debt tranche (revolver, TLA, TLB, high-yield bonds). Each has its own interest rate, amortization schedule, and maturity. Cash sweep: excess FCF pays down debt starting with most senior.\n\nStep 3 — Integrated 3-statement model: Income Statement (start with revenue, model to EBITDA, subtract D&A, interest, taxes → net income), Balance Sheet, Cash Flow Statement. All three must balance.\n\nStep 4 — Free Cash Flow calculation: EBITDA − Interest − Taxes − Capex ± Working Capital changes − Mandatory amortization = Cash available for optional debt paydown.\n\nStep 5 — Exit: Assume exit in Year 5 at an exit multiple × exit year EBITDA = exit EV. Subtract remaining debt → equity proceeds.\n\nStep 6 — Returns: Calculate IRR and MOIC on the equity investment. Sensitivity: vary entry multiple, exit multiple, EBITDA growth, and leverage ratio.`,
  },

  // ── M&A ───────────────────────────────────────────────────────────────────────

  {
    id: 'ma-e-1',
    question_type: 'technical',
    topic: 'ma',
    difficulty: 'easy',
    question: 'What are the main reasons a company would acquire another?',
    answer: `Strategic rationales for M&A:\n\n1. Revenue synergies: Cross-selling products, entering new geographies, expanding customer base, acquiring technology or IP.\n\n2. Cost synergies: Eliminating duplicate headcount, consolidating facilities, procurement savings, shared back-office functions. These are more certain and faster to achieve than revenue synergies.\n\n3. Vertical integration: Acquiring a supplier (backward) or a customer (forward) to control the value chain and improve margins.\n\n4. Market consolidation / removing a competitor: Reduce competitive intensity, gain pricing power.\n\n5. Acqui-hire: Buying a company primarily for its talent — common in tech.\n\n6. Diversification: Reducing business risk by entering new markets (though markets often penalize this with a conglomerate discount).\n\nRed flags: "Transformative" acquisitions with vague synergies, large control premiums, or acquisitions that primarily serve to boost reported EPS through financial engineering.`,
  },
  {
    id: 'ma-m-1',
    question_type: 'technical',
    topic: 'ma',
    difficulty: 'medium',
    question: 'What is accretion/dilution analysis and when is a deal accretive?',
    answer: `Accretion/dilution analysis compares the acquirer's pro forma EPS (after the deal) to its standalone EPS. If pro forma EPS is higher, the deal is accretive. If lower, it's dilutive.\n\nKey driver — the "yield" on the acquisition vs. the acquirer's cost:\n• If the target's earnings yield (earnings / price paid) exceeds the cost of the consideration (interest on debt or equity issuance cost), the deal accrets.\n• All-cash/debt deals: accretive when target P/E < acquirer P/E (roughly speaking)\n• All-stock deals: accretive when acquirer P/E > target P/E\n\nOther factors:\n• Synergies increase pro forma earnings, helping accretion\n• Amortization of intangibles (PPA) reduces pro forma earnings\n• Transaction fees are typically one-time charges\n\nImportant caveat: Accretion/dilution is an accounting metric. A deal can be EPS accretive yet value-destructive if the acquirer overpays — synergies are uncertain, while the premium is real and immediate.`,
  },
  {
    id: 'ma-a-1',
    question_type: 'technical',
    topic: 'ma',
    difficulty: 'advanced',
    question: 'Walk me through how a merger model works.',
    answer: `A merger model (combination model) determines the pro forma financial impact of an acquisition on the acquirer.\n\nStep 1 — Standalone models: Build or obtain financial models for both acquirer and target.\n\nStep 2 — Transaction assumptions: Purchase price and form of consideration (cash, stock, or mix), financing structure (revolver, term loan, new equity), expected synergies and phasing, and transaction fees.\n\nStep 3 — Sources & Uses: How the deal is financed and what the money pays for.\n\nStep 4 — Purchase Price Allocation: Write up target assets to fair value, record goodwill (purchase price minus fair value of net assets), determine incremental D&A from asset write-ups.\n\nStep 5 — Pro forma income statement:\n• Combine acquirer + target revenue and expenses\n• Add synergies (phased in over 2–3 years)\n• Subtract incremental D&A and interest expense on new debt\n• Calculate pro forma taxes and net income\n\nStep 6 — Accretion/Dilution analysis: Compare pro forma EPS to acquirer standalone EPS.\n\nStep 7 — Sensitivity analysis: Vary purchase price premium, synergies, and financing mix.`,
  },

  // ── RESTRUCTURING ─────────────────────────────────────────────────────────────

  {
    id: 'res-e-1',
    question_type: 'technical',
    topic: 'restructuring',
    difficulty: 'easy',
    question: 'What is the difference between Chapter 7 and Chapter 11 bankruptcy?',
    answer: `Chapter 7 — Liquidation:\n• The company ceases operations. A court-appointed trustee sells all assets and distributes proceeds to creditors in priority order.\n• Used when a business has no viable path to recovery or when liquidation value exceeds going-concern value.\n• Equity holders almost always receive nothing.\n\nChapter 11 — Reorganization:\n• The company continues operating as a "debtor in possession" while negotiating a plan to restructure its obligations.\n• Goal is to preserve going-concern value — keep the business alive, just with a restructured balance sheet.\n• Secured creditors, unsecured creditors, and equity holders negotiate new terms (debt-for-equity swaps, extended maturities, haircuts on principal).\n• Confirmation of the reorganization plan requires approval from creditor classes and the court.\n\nKey concept: The "absolute priority rule" — senior creditors must be made whole before junior creditors receive anything, and creditors before equity holders.`,
  },
  {
    id: 'res-m-1',
    question_type: 'technical',
    topic: 'restructuring',
    difficulty: 'medium',
    question: 'What is a distressed company, and what are the main tools available to restructure its balance sheet?',
    answer: `A distressed company typically has debt trading at a significant discount (often below 70–80 cents on the dollar), faces difficulty servicing debt, or is at risk of covenant violation or default.\n\nOut-of-court tools (faster, cheaper, require creditor cooperation):\n• Amend & extend: Extend maturity on existing debt in exchange for higher coupons or new fees\n• Debt buyback: Repurchase debt at a discount to par, recognizing a gain\n• Exchange offer: Offer creditors new securities (lower principal, new maturity) in exchange for existing debt\n• Covenant waiver: Get lenders to waive an imminent covenant violation\n\nIn-court tools (Chapter 11):\n• Prepackaged bankruptcy: Terms pre-negotiated with major creditors before filing — faster process\n• Prenegotiated: Outline terms before filing; negotiate fully in court\n• Free-fall: No pre-arrangement; fully negotiated in court — most expensive and time-consuming\n\nDebt-for-equity swap: Senior creditors exchange debt claims for equity in the reorganized company — common when debt exceeds enterprise value.`,
  },
  {
    id: 'res-a-1',
    question_type: 'technical',
    topic: 'restructuring',
    difficulty: 'advanced',
    question: 'How do you determine the recovery value for different creditor classes in a restructuring?',
    answer: `Recovery analysis starts with estimating the enterprise value of the reorganized company, then distributing that value down the capital structure according to the absolute priority rule.\n\nStep 1 — Estimate reorganized EV: Use a going-concern DCF and trading/precedent comps for the reorganized entity (assuming a de-levered balance sheet). This is the contested number in many restructurings.\n\nStep 2 — Build the waterfall:\n• Start with total enterprise value available for distribution\n• Subtract: administrative claims, DIP financing repayment, professional fees\n• Then distribute in seniority order: secured creditors first (first lien, then second lien), then unsecured creditors, then subordinated debt, then preferred equity, then common equity.\n\nStep 3 — Determine recovery at each level:\n• If EV > claims at a given level: that tranche recovers 100% (par); value passes to next level\n• If EV < claims: that tranche is impaired; recovers EV / outstanding claims × 100%\n• The fulcrum security is the tranche that is partially impaired — it will become the new equity in the reorganized company\n\nStep 4 — Cross-check with liquidation analysis: Ensures going-concern reorganization delivers more value than Chapter 7 liquidation (required by the "best interests of creditors" test).`,
  },

  // ── FINANCIAL MARKETS ─────────────────────────────────────────────────────────

  {
    id: 'fm-e-1',
    question_type: 'technical',
    topic: 'financial_markets',
    difficulty: 'easy',
    question: 'What is the yield curve and what does an inverted yield curve signal?',
    answer: `The yield curve plots the interest rates (yields) of bonds with equal credit quality but different maturities — typically US Treasuries from 3-month to 30-year.\n\nNormal yield curve: Upward sloping. Longer maturities carry higher yields, compensating investors for time risk and inflation uncertainty.\n\nInverted yield curve: Short-term rates exceed long-term rates. This is unusual and historically a reliable recession predictor (roughly 12–24 months lead time). The most watched spread is the 2-year vs. 10-year Treasury.\n\nWhy inversion signals recession:\n• Reflects expectations that the Fed will need to cut rates in the future (cutting = responding to economic weakness)\n• Short rates reflect current Fed policy (restrictive), long rates reflect growth/inflation expectations (falling)\n• Banks borrow short and lend long — inversion compresses margins and reduces credit creation\n\nFlat yield curve: Transition state — often precedes inversion. Signals uncertainty about the economic outlook.`,
  },
  {
    id: 'fm-m-1',
    question_type: 'technical',
    topic: 'financial_markets',
    difficulty: 'medium',
    question: 'If interest rates rise 100 basis points, how does that affect a company\'s valuation?',
    answer: `Rising rates affect valuation through multiple channels:\n\n1. Higher discount rate (WACC): WACC increases because the risk-free rate (used in CAPM for cost of equity) increases, and the cost of debt rises. Higher WACC reduces the PV of future cash flows — compresses valuation multiples, especially for long-duration assets (high-growth companies with cash flows far in the future).\n\n2. Multiple compression: Markets re-rate growth companies lower because future earnings are worth less today. EV/EBITDA and P/E multiples across the market tend to compress when rates rise.\n\n3. Higher interest expense: Companies with floating-rate debt face higher interest costs, directly reducing FCF and net income. This can push levered companies closer to distress.\n\n4. Economic drag: Higher rates slow the broader economy (consumer spending, housing, business investment), which can reduce revenue growth expectations.\n\nImpact varies by company: A high-growth tech company (most value in terminal year) is hit harder than a mature, low-growth, high-dividend company. Leveraged companies are hit harder than unlevered ones.`,
  },
  {
    id: 'fm-a-1',
    question_type: 'technical',
    topic: 'financial_markets',
    difficulty: 'advanced',
    question: 'Estimate the size of the US IPO market and the key factors that drive IPO activity.',
    answer: `Market sizing:\n• In a normal year, the US sees approximately 150–300 IPOs\n• Average deal size for significant IPOs: roughly $200–500M; mega IPOs can be $5B+\n• Total annual US IPO proceeds: typically $30–80B in active markets, can exceed $150B in boom years (2020–2021 saw $300B+ including SPACs)\n• Including SPACs at peak: effectively 900+ "IPOs" in 2021\n\nKey drivers of IPO activity:\n1. Market conditions: Strong equity markets (high valuations, low volatility) give companies confidence they can achieve good prices. VIX < 20 is generally supportive.\n2. Interest rates: Low rates push investors into equities (seeking yield), supporting valuations and IPO windows.\n3. Investor appetite: Availability of growth-oriented mutual funds, hedge funds, and retail demand.\n4. Private market backlog: Companies that raised large VC rounds need liquidity events for investors.\n5. Sector rotation: Hot sectors (tech, biotech, energy) see IPO clusters.\n\nIPO windows open and close quickly — bankers spend significant time advising clients on timing relative to market conditions and comparable company performance.`,
  },
]
