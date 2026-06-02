import type { LucideIcon } from 'lucide-react-native';
import {
  Banknote,
  Building2,
  Clock,
  CreditCard,
  FileText,
  Globe,
} from 'lucide-react-native';
import { colors } from '@/theme';

export type PaymentMethodMeta = {
  label: string;
  Icon: LucideIcon;
  activeColor: string;
  inactiveBg: string;
};

const DEFAULT_META: PaymentMethodMeta = {
  label: '',
  Icon: CreditCard,
  activeColor: colors.primary,
  inactiveBg: colors.backgroundAlt,
};

const META: Record<string, PaymentMethodMeta> = {
  cash: {
    label: 'Cash',
    Icon: Banknote,
    activeColor: colors.primary,
    inactiveBg: colors.backgroundAlt,
  },
  card: {
    label: 'Card',
    Icon: CreditCard,
    activeColor: colors.primary,
    inactiveBg: colors.backgroundAlt,
  },
  cheque: {
    label: 'Cheque',
    Icon: FileText,
    activeColor: colors.primary,
    inactiveBg: colors.backgroundAlt,
  },
  credit: {
    label: 'Credit',
    Icon: Clock,
    activeColor: colors.primary,
    inactiveBg: colors.backgroundAlt,
  },
  'bank transfer': {
    label: 'Bank',
    Icon: Building2,
    activeColor: colors.primary,
    inactiveBg: colors.backgroundAlt,
  },
  online: {
    label: 'Online',
    Icon: Globe,
    activeColor: colors.primary,
    inactiveBg: colors.backgroundAlt,
  },
};

export function getPaymentMethodMeta(method: string): PaymentMethodMeta {
  const key = method.trim().toLowerCase();
  const found = META[key];
  if (found) {
    return { ...found, label: method };
  }
  return {
    ...DEFAULT_META,
    label: method,
  };
}
