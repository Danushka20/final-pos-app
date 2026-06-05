import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { HStack, Text, VStack } from '@gluestack-ui/themed';
import { useReceiptLogoUri } from '@/hooks/useReceiptLogoUri';
import { formatCurrency, resolveCurrencyCode } from '@/utils/format';
import { colors } from '@/theme';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import type { PosMobileSettings } from '@/types/settings';

interface PurchaseReceiptViewProps {
  receipt: PurchaseReceiptPayload;
  settings?: PosMobileSettings | null;
}

export const PurchaseReceiptView: React.FC<PurchaseReceiptViewProps> = ({
  receipt,
  settings,
}) => {
  const purchase = receipt.purchase;
  const header = receipt.header as Record<string, string | undefined>;
  const logoUrl = useReceiptLogoUri(settings, receipt);

  const currency = resolveCurrencyCode(settings?.company?.currency);
  const companyName =
    header.company_name ??
    settings?.printHeader?.company_name ??
    settings?.company?.name ??
    'Purchase Bill';
  const address =
    header.address_line ?? header.address ?? settings?.printHeader?.address_line;
  const phone = header.phone ?? settings?.printHeader?.phone;

  const now = new Date();
  const printedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
  const supplierInfoRows = [
    { label: 'Supplier', value: purchase.supplier_name },
    { label: 'Phone', value: purchase.supplier_contact_no },
    { label: 'Email', value: purchase.supplier_email },
  ].filter(row => Boolean(row.value && String(row.value).trim().length > 0));

  return (
    <View style={styles.paper}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
      ) : null}

      <Text style={styles.companyName}>{companyName}</Text>
      {address ? <Text style={styles.mutedCenter}>{address}</Text> : null}
      {phone ? <Text style={styles.mutedCenter}>Tel: {phone}</Text> : null}

      <View style={styles.divider} />
      <Text style={styles.invoiceTitle}>PURCHASE BILL</Text>
      <Text style={styles.mutedCenter}>Invoice: {purchase.invoice_id}</Text>

      <View style={styles.metaBlock}>
        <MetaRow label="Date" value={purchase.purchase_date} />
        {purchase.location ? <MetaRow label="Location" value={purchase.location} /> : null}
        <MetaRow label="Payment" value={purchase.payment_method ?? 'Cash'} />
      </View>

      {supplierInfoRows.length > 0 ? (
        <>
          <View style={styles.dividerThin} />
          <Text style={styles.partyTitle}>Supplier Information</Text>
          <View style={styles.partyBlock}>
            {supplierInfoRows.map(row => (
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

      {purchase.lines.map((line, idx) => (
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
      <TotalRow label="Subtotal" value={formatCurrency(purchase.sub_total, currency)} />
      {purchase.discount > 0 ? (
        <TotalRow
          label="Discount"
          value={`-${formatCurrency(purchase.discount, currency)}`}
        />
      ) : null}
      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>TOTAL</Text>
        <Text style={styles.grandValue}>{formatCurrency(purchase.amount, currency)}</Text>
      </View>
      {purchase.amount_paid != null ? (
        <TotalRow label="Paid" value={formatCurrency(purchase.amount_paid, currency)} />
      ) : null}
      {purchase.notes ? (
        <Text style={styles.notes}>{purchase.notes}</Text>
      ) : null}

      <View style={styles.divider} />
      <Text style={styles.thankYou}>Purchase recorded successfully</Text>
      <Text style={styles.footerNote}>Printed: {printedAt}</Text>
    </View>
  );
};

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <HStack justifyContent="space-between" py="$0.5">
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </HStack>
);

const TotalRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
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
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 4,
  },
  mutedCenter: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  dividerThin: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    color: colors.text,
    marginBottom: 4,
  },
  metaBlock: {
    marginTop: 10,
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
    maxWidth: '62%',
    textAlign: 'right',
  },
  partyTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  partyBlock: {
    marginTop: 4,
    marginBottom: 10,
  },
  tableHead: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  colItem: { flex: 1 },
  colQty: { width: 36, textAlign: 'right' },
  colAmt: { width: 72, textAlign: 'right' },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  lineDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  lineSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  lineAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  grandValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  notes: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  thankYou: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    marginTop: 4,
  },
  footerNote: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
