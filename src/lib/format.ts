export function formatPrice(price: number, currency: string): string {
  const formatted = new Intl.NumberFormat('ar-SY').format(price);
  return `${formatted} ${currency}`;
}

export function formatPriceInput(price: number): string {
  return new Intl.NumberFormat('en-US').format(price);
}
