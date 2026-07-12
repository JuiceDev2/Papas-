export function formatMXN(amount: number): string {
  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export function formatPresentation(p: "150g" | "1000g"): string {
  return p === "150g" ? "Bolsa 150 g" : "Kilo 1000 g";
}
