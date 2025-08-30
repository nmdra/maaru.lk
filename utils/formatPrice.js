export default function formatPrice(amount, currency = 'LKR', locale) {
  if (amount == null) return '';
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isNaN(num)) return String(amount);

  try {
    // If no locale provided, Intl will use the runtime default
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch (e) {
    // Fallback
    return `${currency} ${num.toFixed(2)}`;
  }
}
