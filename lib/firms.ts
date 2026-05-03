// Domain → firm name mapping.
// Only include obvious, well-known domains where the firm name is unambiguous.
// If a domain isn't here, leave firm blank and let the user fill it in.
const DOMAIN_MAP: Record<string, string> = {
  // Bulge Bracket Banks
  'gs.com':              'Goldman Sachs',
  'jpmchase.com':        'JPMorgan',
  'jpmorgan.com':        'JPMorgan',
  'ms.com':              'Morgan Stanley',
  'morganstanley.com':   'Morgan Stanley',
  'baml.com':            'Bank of America',
  'bankofamerica.com':   'Bank of America',
  'citi.com':            'Citi',
  'citigroup.com':       'Citi',
  'barclays.com':        'Barclays',
  'ubs.com':             'UBS',
  'db.com':              'Deutsche Bank',
  'deutschebank.com':    'Deutsche Bank',
  'credit-suisse.com':   'Credit Suisse',
  'wellsfargo.com':      'Wells Fargo',
  'bmo.com':             'BMO Capital Markets',
  'scotiabank.com':      'Scotiabank',
  'td.com':              'TD Securities',
  'rbc.com':             'RBC Capital Markets',
  'rbccm.com':           'RBC Capital Markets',
  'bnpparibas.com':      'BNP Paribas',
  'societegenerale.com': 'Société Générale',
  'hsbc.com':            'HSBC',
  'nomura.com':          'Nomura',
  'mizuho-sc.com':       'Mizuho',
  'mizuhogroup.com':     'Mizuho',
  'smbcgroup.com':       'SMBC',
  // Elite Boutiques
  'lazard.com':          'Lazard',
  'evercore.com':        'Evercore',
  'moelis.com':          'Moelis & Company',
  'centerview.com':      'Centerview Partners',
  'pwp.com':             'Perella Weinberg Partners',
  'pjsolomon.com':       'PJ Solomon',
  'guggenheim.com':      'Guggenheim Partners',
  'greenhill.com':       'Greenhill',
  'rothschild.com':      'Rothschild & Co',
  'hlhz.com':            'Houlihan Lokey',
  'hl.com':              'Houlihan Lokey',
  'jefferies.com':       'Jefferies',
  'william-blair.com':   'William Blair',
  'williamblair.com':    'William Blair',
  'baird.com':           'Robert W. Baird',
  'stifel.com':          'Stifel',
  'piper-sandler.com':   'Piper Sandler',
  'pipersandler.com':    'Piper Sandler',
  'tdcowen.com':         'TD Cowen',
  'cowen.com':           'TD Cowen',
  'leerink.com':         'Leerink Partners',
  'pjt.com':             'PJT Partners',
  'imhoffcapital.com':   'Imperial Capital',
  'lincolnint.com':      'Lincoln International',
  // Private Equity
  'kkr.com':             'KKR',
  'blackstone.com':      'Blackstone',
  'apolloglobal.com':    'Apollo Global Management',
  'apollo.com':          'Apollo Global Management',
  'carlyle.com':         'The Carlyle Group',
  'tpg.com':             'TPG',
  'baincapital.com':     'Bain Capital',
  'warburg.com':         'Warburg Pincus',
  'generalatlantic.com': 'General Atlantic',
  'silverlake.com':      'Silver Lake',
  'thomabravo.com':      'Thoma Bravo',
  'advent.com':          'Advent International',
  'ares.com':            'Ares Management',
  'oaktree.com':         'Oaktree Capital',
  'brookfield.com':      'Brookfield Asset Management',
  'hgcapital.com':       'HG Capital',
  // Hedge Funds
  'citadel.com':         'Citadel',
  'citadelsecurities.com': 'Citadel Securities',
  'twosigma.com':        'Two Sigma',
  'deshaw.com':          'D.E. Shaw',
  'bridgewater.com':     'Bridgewater Associates',
  'aqr.com':             'AQR Capital Management',
  'point72.com':         'Point72',
  'millennium.com':      'Millennium Management',
  'elliottmgmt.com':     'Elliott Management',
  'janestreet.com':      'Jane Street',
  'virtu.com':           'Virtu Financial',
  'hudsonrivertrading.com': 'Hudson River Trading',
  'imc.com':             'IMC Trading',
  // Asset Management
  'blackrock.com':       'BlackRock',
  'vanguard.com':        'Vanguard',
  'fidelity.com':        'Fidelity',
  'pimco.com':           'PIMCO',
  'wellington.com':      'Wellington Management',
  'troweprice.com':      'T. Rowe Price',
  'mfs.com':             'MFS Investment Management',
  'capitalgroup.com':    'Capital Group',
  'franklintempleton.com': 'Franklin Templeton',
  'alliancebernstein.com': 'AllianceBernstein',
  'nuveen.com':          'Nuveen',
  'pgim.com':            'PGIM',
  'ninetyoneinvestments.com': 'Ninety One',
  // Big 4 / Advisory (relevant for recruiting)
  'deloitte.com':        'Deloitte',
  'pwc.com':             'PwC',
  'ey.com':              'EY',
  'kpmg.com':            'KPMG',
}

/**
 * Infer firm name from an email address.
 * Returns null if the domain is not in the known mapping (e.g. gmail.com, edu).
 */
export function inferFirmFromEmail(email: string): string | null {
  if (!email) return null
  const parts = email.toLowerCase().split('@')
  if (parts.length < 2) return null
  const domain = parts[1].trim()
  return DOMAIN_MAP[domain] ?? null
}

export function isFinanceDomain(email: string): boolean {
  if (!email) return false
  const parts = email.toLowerCase().split('@')
  if (parts.length < 2) return false
  return parts[1].trim() in DOMAIN_MAP
}
