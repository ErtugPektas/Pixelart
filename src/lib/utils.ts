export function formatCurrency(amount: number, currency: string = "TRY"): string {
  const symbolMap: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbolMap[currency] || currency;
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${symbol}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}
