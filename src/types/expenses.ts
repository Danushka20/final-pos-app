export interface Expense {
  id: number;
  location: string;
  expense_date: string;
  reference_no: string;
  category: string;
  description: string;
  amount: number;
  discount: number;
  paid_amount: number;
  payment_method: string;
  status: string;
  notes?: string | null;
}

export interface ExpenseSummary {
  total_expenses: number;
  total_expense_amount: number;
}

export interface ExpenseFilters {
  categories: string[];
  locations: string[];
  statuses: string[];
  payment_methods: string[];
}

export interface ExpenseListResponse {
  expenses: Expense[];
  summary: ExpenseSummary;
  filters: ExpenseFilters;
}

export interface ExpensePayload {
  location?: string;
  expense_date?: string;
  reference_no: string;
  category: string;
  description: string;
  amount: number;
  discount?: number;
  payment_method?: string;
  status?: string;
  notes?: string | null;
}
