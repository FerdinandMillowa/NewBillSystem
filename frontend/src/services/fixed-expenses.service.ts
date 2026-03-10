import api from './api';

export type FixedExpenseCategory =
  | 'rent'
  | 'salaries_wages'
  | 'licenses_permits'
  | 'insurance';

export type PaymentMethod = 'cash' | 'airtel_money' | 'mpamba' | 'bank';

export interface FixedExpense {
  id: string;
  category: FixedExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  notes?: string;
  createdAt: string;
}

export interface CreateFixedExpenseDto {
  category: FixedExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  notes?: string;
}

export const FIXED_EXPENSE_CATEGORY_LABELS: Record<FixedExpenseCategory, string> = {
  rent: 'Rent',
  salaries_wages: 'Salaries & Wages',
  licenses_permits: 'Licenses & Permits',
  insurance: 'Insurance',
};

export const fixedExpensesService = {
  getAll: async (startDate?: string, endDate?: string) => {
    const { data } = await api.get('/fixed-expenses', {
      params: { startDate, endDate },
    });
    return data;
  },

  create: async (dto: CreateFixedExpenseDto): Promise<FixedExpense> => {
    const { data } = await api.post('/fixed-expenses', dto);
    return data;
  },

  update: async (
    id: string,
    dto: Partial<CreateFixedExpenseDto>,
  ): Promise<FixedExpense> => {
    const { data } = await api.put(`/fixed-expenses/${id}`, dto);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/fixed-expenses/${id}`);
  },
};