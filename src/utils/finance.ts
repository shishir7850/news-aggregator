// Simplify finance jargon for easier understanding

const FINANCE_JARGON: Record<string, string> = {
  'bull market': 'rising prices (good for investors)',
  'bear market': 'falling prices (bad for investors)',
  'ipo': 'company going public (selling shares for first time)',
  'dividend': 'money paid to shareholders',
  'yield': 'return on investment',
  'equity': 'ownership/stocks',
  'bond': 'loan to company/government',
  'fed': 'Federal Reserve (US central bank)',
  'inflation': 'prices going up',
  'recession': 'economy shrinking',
  'gdp': 'total economic output',
  'earnings': 'company profits',
  'revenue': 'total sales',
  'margin': 'profit percentage',
  'volatility': 'price swings',
  'liquidity': 'ease of buying/selling',
  'portfolio': 'collection of investments',
  'hedge': 'protection against losses',
  'futures': 'contracts to buy/sell later',
  'etf': 'basket of stocks you can trade',
  'index': 'measure of market performance',
  's&p 500': 'top 500 US companies index',
  'dow': 'top 30 US companies index',
  'nasdaq': 'tech-focused stock exchange',
  'nyse': 'New York Stock Exchange',
  'sec': 'Securities regulator (US)',
  'quarterly': 'every 3 months',
  'fiscal': 'financial/budget-related',
  'merger': 'two companies combining',
  'acquisition': 'one company buying another',
  'leverage': 'using borrowed money',
  'cap': 'total company value',
  'rally': 'prices rising quickly',
  'correction': 'prices dropping 10%+',
  'crash': 'prices dropping sharply',
};

export function simplifyFinanceSummary(text: string): string {
  if (!text) return text;

  let simplified = text;

  // Add explanations for jargon
  for (const [term, explanation] of Object.entries(FINANCE_JARGON)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(simplified) && !simplified.includes(explanation)) {
      simplified = simplified.replace(regex, `${term} (${explanation})`);
      break; // Only explain one term to avoid clutter
    }
  }

  return simplified;
}

export function getFinanceEmoji(title: string): string {
  const lower = title.toLowerCase();

  if (lower.includes('rise') || lower.includes('gain') || lower.includes('surge') || lower.includes('rally')) {
    return '📈';
  }
  if (lower.includes('fall') || lower.includes('drop') || lower.includes('crash') || lower.includes('down')) {
    return '📉';
  }
  if (lower.includes('bank') || lower.includes('fed')) {
    return '🏦';
  }
  if (lower.includes('crypto') || lower.includes('bitcoin')) {
    return '₿';
  }
  if (lower.includes('oil') || lower.includes('energy')) {
    return '⛽';
  }
  if (lower.includes('gold') || lower.includes('silver')) {
    return '🥇';
  }

  return '💰';
}
