import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useReceiptLogoUri } from '@/hooks/useReceiptLogoUri';
import { formatCurrency, resolveCurrencyCode } from '@/utils/format';
import { colors } from '@/theme';
import type { SaleReceiptPayload } from '@/types/sales';
import type { PosMobileSettings } from '@/types/settings';

interface SaleReceiptViewProps {
  receipt: SaleReceiptPayload;
  settings?: PosMobileSettings | null;
}

export const SaleReceiptView: React.FC<SaleReceiptViewProps> = ({
  receipt,
  settings,
}) => {
  const sale = receipt.sale;
  const header = receipt.header as Record<string, string | undefined>;
  const hardware = (settings?.hardware ??
    receipt.hardware_settings ??
    {}) as Record<string, unknown>;
  const logoUrl = useReceiptLogoUri(settings, receipt);

  const currency = resolveCurrencyCode(settings?.company?.currency);
  const companyName =
    header.company_name ??
    settings?.printHeader?.company_name ??
    settings?.company?.name ??
    'Tax Invoice';
  const address =
    header.address_line ?? header.address ?? settings?.printHeader?.address_line;
  const phone = header.phone ?? settings?.printHeader?.phone;
  const email = header.email ?? settings?.printHeader?.email;
  const taxId = header.tax_id ?? settings?.printHeader?.tax_id;
  const regNo =
    header.registration_number ?? settings?.printHeader?.registration_number;

  const showLogo = Boolean(
    logoUrl && hardware.allow_logo_on_sales_receipt !== false,
  );

  const now = new Date();
  const printedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const change =
    sale.amount_received != null
      ? sale.amount_received - sale.net_amount
      : null;
  const customerInfoRows = [
    { label: 'Customer', value: sale.customer_name },
    { label: 'Customer ID', value: sale.customer_code },
    { label: 'Phone', value: sale.customer_contact_no },
    { label: 'Email', value: sale.customer_email },
    { label: 'Location', value: sale.customer_location },
    { label: 'Address', value: sale.customer_address },
    { label: 'Tax ID', value: sale.customer_tax_id },
  ].filter(row => Boolean(row.value && String(row.value).trim().length > 0));

  return (
    <View style={styles.paper}>
      {showLogo && logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
      ) : null}

      <Text style={styles.companyName}>{companyName}</Text>
      {address ? <Text style={styles.mutedCenter}>{address}</Text> : null}
      {phone ? <Text style={styles.mutedCenter}>Tel: {phone}</Text> : null}
      {email ? <Text style={styles.mutedCenter}>{email}</Text> : null}
      {taxId ? <Text style={styles.mutedCenter}>Tax ID: {taxId}</Text> : null}
      {regNo ? (
        <Text style={styles.mutedCenter}>Reg: {regNo}</Text>
      ) : null}

      <View style={styles.divider} />
      <Text
        style={[
          styles.invoiceTitle,
          sale.is_return ? { color: colors.error } : undefined,
        ]}>
        {sale.is_return ? 'SALES RETURN' : 'TAX INVOICE'}
      </Text>
      <Text style={styles.mutedCenter}>
        {sale.is_return ? 'Return No' : 'Bill No'}: {sale.sales_id}
      </Text>

      <View style={styles.metaBlock}>
        <MetaRow label="Date" value={sale.sale_date} />
        {sale.location ? <MetaRow label="Branch" value={sale.location} /> : null}
        <MetaRow label="Payment" value={sale.payment_method ?? 'Cash'} />
      </View>

      {customerInfoRows.length > 0 ? (
        <>
          <View style={styles.dividerThin} />
          <Text style={styles.partyTitle}>Customer Information</Text>
          <View style={styles.partyBlock}>
            {customerInfoRows.map(row => (
              <MetaRow key={row.label} label={row.label} value={String(row.value)} />
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.colItem]}>Item</Text>
        <Text style={[styles.th, styles.colQty]}>Qty</Text>
        <Text style={[styles.th, styles.colAmt]}>Amount</Text>
      </View>
      <View style={styles.dividerThin} />

      {sale.lines.map((line, idx) => (
        <View key={`${line.item_number}-${idx}`} style={styles.lineRow}>
          <VStack style={styles.colItem} flex={1}>
            <Text style={styles.lineDesc}>{line.description}</Text>
            <Text style={styles.lineSub}>
              {line.item_number ? `ID ${line.item_number} · ` : ''}
              {line.qty} × {formatCurrency(line.unit_price, currency)}
            </Text>
          </VStack>
          <Text style={[styles.lineAmt, styles.colAmt]}>
            {formatCurrency(line.line_total, currency)}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />

      <TotalRow
        label="Subtotal"
        value={formatCurrency(sale.sub_total, currency)}
      />
      {sale.discount > 0 ? (
        <TotalRow
          label={sale.discount_label ?? 'Discount'}
          value={`-${formatCurrency(sale.discount, currency)}`}
        />
      ) : null}
      {(sale.service_charge ?? 0) > 0 ? (
        <TotalRow
          label="Service charge"
          value={formatCurrency(sale.service_charge ?? 0, currency)}
        />
      ) : null}
      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>TOTAL</Text>
        <Text style={styles.grandValue}>
          {formatCurrency(sale.net_amount, currency)}
        </Text>
      </View>
      {sale.amount_received != null ? (
        <>
          <TotalRow
            label="Received"
            value={formatCurrency(sale.amount_received, currency)}
          />
          {change != null && change >= 0 ? (
            <TotalRow label="Change" value={formatCurrency(change, currency)} />
          ) : null}
        </>
      ) : null}

      <View style={styles.divider} />
      <Text style={styles.thankYou}>Thank you for your business!</Text>
      <Text style={styles.footerNote}>Printed: {printedAt}</Text>
      {sale.show_barcode && sale.barcode_value ? (
        <Text style={styles.barcode}>{sale.barcode_value}</Text>
      ) : null}
    </View>
  );
};

const MetaRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <HStack justifyContent="space-between" py="$0.5">
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </HStack>
);

const TotalRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <HStack justifyContent="space-between" py="$1">
    <Text style={styles.totalLabel}>{label}</Text>
    <Text style={styles.totalValue}>{value}</Text>
  </HStack>
);

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 56,
    alignSelf: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    letterSpacing: 0.3,
  },
  mutedCenter: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.text,
    marginVertical: 12,
    opacity: 0.2,
  },
  dividerThin: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  metaBlock: {
    marginTop: 8,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '65%',
    textAlign: 'right',
  },
  partyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  partyBlock: {
    marginTop: 4,
    marginBottom: 8,
  },
  tableHead: {
    flexDirection: 'row',
    marginTop: 4,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  colItem: { flex: 1 },
  colQty: { width: 36, textAlign: 'right' },
  colAmt: { width: 80, textAlign: 'right' },
  lineRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lineDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  lineSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  lineAmt: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  grandLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  grandValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  thankYou: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
  barcode: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
    letterSpacing: 2,
  },
});
