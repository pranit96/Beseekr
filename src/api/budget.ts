import { api as apiClient } from "@/lib/apiWrapper";

export interface Transaction {
  id: string;
  user_id?: string;
  telegram_user_id?: string;
  type: "income" | "expense" | "transfer" | "refund";
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  merchant: string | null;
  source: string;
  transaction_date: string;
  created_at: string;
}

export interface BudgetPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  income_target: number | null;
  expense_budget: number | null;
}

export interface SavingGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string | null;
  priority: string;
  icon: string;
  status: string;
  notes: string | null;
}

export interface BudgetDashboard {
  period: {
    month: number;
    year: number;
    name: string;
    startDate: string;
    endDate: string;
    daysElapsed: number;
    daysInMonth: number;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalRefunds: number;
    netSavings: number;
    savingsRate: number;
    avgDailySpend: number;
    projectedMonthlySpend: number;
    transactionCount: number;
  };
  categoryBreakdown: {
    [category: string]: {
      total: number;
      count: number;
    };
  };
  dailySpending: {
    [date: string]: number;
  };
  topMerchants: Array<{ name: string; total: number }>;
  savingGoals: SavingGoal[];
  recentTransactions: Transaction[];
}

export interface BudgetInsights {
  id: string;
  ai_summary: string;
  ai_tips: string[];
  anomalies: string[];
  spending_patterns: string[];
  month_over_month: {
    income_change_pct?: number;
    expense_change_pct?: number;
  };
}

export interface YearlyOverview {
  year: number;
  monthly: {
    [month: string]: {
      income: number;
      expenses: number;
      savings: number;
    };
  };
  totals: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
  };
}

export const budgetApi = {
  getDashboard: (params?: { month?: number; year?: number }) =>
    apiClient.get<{ success: boolean; data: BudgetDashboard }>("/api/budget/dashboard", { params }),

  getTransactions: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    category?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiClient.get<{ success: boolean; data: { transactions: Transaction[]; total: number } }>("/api/budget/transactions", { params }),

  addTransaction: (payload: {
    type: "income" | "expense" | "transfer" | "refund";
    amount: number;
    category: string;
    description?: string;
    date?: string;
    merchant?: string;
  }) =>
    apiClient.post<{ success: boolean; data: Transaction }>("/api/budget/transactions", payload),

  updateTransaction: (id: string, payload: Partial<Transaction>) =>
    apiClient.put<{ success: boolean; data: Transaction }>(`/api/budget/transactions/${id}`, payload),

  deleteTransaction: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/budget/transactions/${id}`),

  importStatement: (formData: FormData) =>
    apiClient.post<{
      success: boolean;
      data: {
        importId: string;
        status: string;
        transactionsFound: number;
        transactionsImported: number;
        duplicatesSkipped: number;
        message: string;
      };
    }>("/api/budget/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getImportHistory: () =>
    apiClient.get<{ success: boolean; data: any[] }>("/api/budget/import/history"),

  getGoals: () =>
    apiClient.get<{ success: boolean; data: SavingGoal[] }>("/api/budget/goals"),

  createGoal: (payload: {
    name: string;
    targetAmount: number;
    deadline?: string;
    priority?: "low" | "medium" | "high" | "critical";
    icon?: string;
    notes?: string;
  }) =>
    apiClient.post<{ success: boolean; data: SavingGoal }>("/api/budget/goals", payload),

  updateGoal: (id: string, payload: Partial<SavingGoal>) =>
    apiClient.put<{ success: boolean; data: SavingGoal }>(`/api/budget/goals/${id}`, payload),

  contributeToGoal: (id: string, payload: { amount: number; note?: string }) =>
    apiClient.post<{ success: boolean; data: { progress: number; goal: SavingGoal } }>(
      `/api/budget/goals/${id}/contribute`,
      payload
    ),

  getInsights: (params?: { month?: number; year?: number }) =>
    apiClient.get<{ success: boolean; data: BudgetInsights }>("/api/budget/insights", { params }),

  generateInsights: () =>
    apiClient.post<{ success: boolean; data: BudgetInsights }>("/api/budget/insights/generate", {}),

  getYearlyOverview: (year?: number) =>
    apiClient.get<{ success: boolean; data: YearlyOverview }>("/api/budget/overview/yearly", {
      params: year ? { year } : {},
    }),
};
export default budgetApi;
