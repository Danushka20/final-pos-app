import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';

export interface SupplierSummary {
  id: number;
  supplier_name: string;
  contact_no?: string | null;
  email?: string | null;
}

/** Default supplier when no registered supplier is chosen */
export const WALK_IN_SUPPLIER: SupplierSummary = {
  id: 0,
  supplier_name: 'Walk-in Supplier',
};

type SupplierApiRow = {
  id: number;
  supplier_name?: string;
  first_name?: string;
  name?: string;
  contact_no?: string | null;
  phone?: string | null;
  phone_display?: string | null;
  email?: string | null;
};

type SupplierListPayload =
  | SupplierApiRow[]
  | {
      suppliers?: SupplierApiRow[];
      filters?: { locations?: string[] };
    };

const mapSupplier = (row: SupplierApiRow): SupplierSummary => ({
  id: row.id,
  supplier_name:
    row.supplier_name?.trim() ||
    row.first_name?.trim() ||
    row.name?.trim() ||
    `Supplier #${row.id}`,
  contact_no: row.contact_no ?? row.phone ?? row.phone_display ?? null,
  email: row.email ?? null,
});

const extractSupplierRows = (payload: SupplierListPayload | undefined): SupplierApiRow[] => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.suppliers ?? [];
};

export const supplierService = {
  async list(): Promise<SupplierSummary[]> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<SupplierListPayload>
    >('/suppliers');

    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load suppliers');
    }

    return extractSupplierRows(data.data).map(mapSupplier);
  },
};
