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
