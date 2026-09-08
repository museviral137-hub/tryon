/**
 * Formats monetary amounts according to shop currency preferences.
 * Defaults to Indian Rupee (₹ INR) with standard Indian numbering format (e.g. ₹2,999).
 */
export function formatPrice(amount: number | string | undefined | null, symbol: string = '₹'): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol}0`;
  }

  const num = Number(amount);
  
  // If Indian Rupee, format using Indian locale (en-IN)
  if (symbol === '₹' || symbol === 'Rs' || symbol === 'INR') {
    return `${symbol}${num.toLocaleString('en-IN')}`;
  }

  // General formatting for other currencies ($ USD, € EUR, £ GBP, etc.)
  return `${symbol}${num.toLocaleString('en-US')}`;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹ INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($ USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€ EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£ GBP)' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
];
