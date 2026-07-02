/** Resolve unit of measure for a cart / order line. */
export function resolveLineUom(
  lineUom?: string | null,
  itemUom?: string | null,
): string {
  return lineUom?.trim() || itemUom?.trim() || 'Pcs';
}

export function formatPricePerUom(
  priceLabel: string,
  uom: string,
): string {
  return `${priceLabel} / ${uom}`;
}

/** Receipt line detail, e.g. "2 Pcs x 100.00". */
export function formatReceiptQtyDetail(
  qty: number,
  unitPriceLabel: string,
  uom?: string | null,
): string {
  const unit = resolveLineUom(uom);
  return `${qty} ${unit} x ${unitPriceLabel}`;
}

/** Compact qty label for receipt tables, e.g. "2 Pcs". */
export function formatQtyWithUom(qty: number, uom?: string | null): string {
  return `${qty} ${resolveLineUom(uom)}`;
}

export interface CartUomLine {
  qty: number;
  uom?: string | null;
}

/** Dock cart summary, e.g. "5 Pcs" or "3 Pcs · 2 Kg". */
export function summarizeCartQtyByUom(lines: CartUomLine[]): string {
  if (lines.length === 0) {
    return '';
  }

  const totals = new Map<string, number>();
  for (const line of lines) {
    const uom = resolveLineUom(line.uom);
    totals.set(uom, (totals.get(uom) ?? 0) + line.qty);
  }

  const formatQty = (qty: number) =>
    qty % 1 === 0 ? String(qty) : qty.toFixed(1);

  return [...totals.entries()]
    .map(([uom, qty]) => `${formatQty(qty)} ${uom}`)
    .join(' · ');
}
