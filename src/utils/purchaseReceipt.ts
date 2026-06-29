import type { PurchaseCartLine } from '@/hooks/usePurchaseCreate';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import type { PosMobileSettings } from '@/types/settings';

export function buildPurchaseReceiptPayload(input: {
  invoiceId: string;
  location: string;
  supplierName: string;
  supplierContactNo?: string | null;
  supplierEmail?: string | null;
  purchaseDate: string;
  lines: PurchaseCartLine[];
  subTotal: number;
  discount?: number;
  amount: number;
  paymentMethod: string;
  amountPaid?: number;
  notes?: string | null;
  settings?: PosMobileSettings | null;
}): PurchaseReceiptPayload {
  const header: Record<string, unknown> = {};
  if (input.settings?.printHeader) {
    const ph = input.settings.printHeader;
    header.company_name = ph.company_name;
    header.address_line = ph.address_line;
    header.phone = ph.phone;
    header.email = ph.email;
    header.tax_id = ph.tax_id;
    header.registration_number = ph.registration_number;
    header.logo_url = ph.logo_url;
  } else if (input.settings?.company) {
    const c = input.settings.company;
    header.company_name = c.name;
    header.address = c.address;
    header.phone = c.phone;
    header.email = c.email;
    header.tax_id = c.tax_id;
    header.registration_number = c.registration_number;
    header.logo_url = c.logo_url;
  }

  return {
    header,
    purchase: {
      invoice_id: input.invoiceId,
      purchase_date: input.purchaseDate,
      location: input.location,
      supplier_name: input.supplierName,
      supplier_contact_no: input.supplierContactNo ?? null,
      supplier_email: input.supplierEmail ?? null,
      sub_total: input.subTotal,
      discount: input.discount ?? 0,
      amount: input.amount,
      payment_method: input.paymentMethod,
      amount_paid: input.amountPaid ?? input.amount,
      notes: input.notes ?? null,
      lines: input.lines.map(line => ({
        item_number: line.item_number,
        description: line.description,
        qty: line.qty,
        unit_price: line.unit_price,
        line_total: line.line_total,
        uom: line.uom?.trim() || 'Pcs',
        expiry_date: line.expiry_date?.trim() || null,
      })),
    },
  };
}
