export interface CompanySettings {
  id?: number;
  name: string;
  logo_url?: string | null;
  industry?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  tax_id?: string;
  registration_number?: string;
  currency?: string;
  language?: string;
}

export interface PrintHeaderSettings {
  company_name: string;
  logo_url?: string | null;
  address_line?: string;
  email?: string;
  phone?: string;
  tax_id?: string | null;
  registration_number?: string | null;
}

export interface PosMobileSettings {
  company: CompanySettings;
  printHeader: PrintHeaderSettings;
  inventory: Record<string, unknown>;
  item: Record<string, unknown>;
  order: Record<string, unknown>;
  hardware: Record<string, unknown>;
  employee: Record<string, unknown>;
  alert: Record<string, unknown>;
  notifications: Record<string, unknown>;
}
