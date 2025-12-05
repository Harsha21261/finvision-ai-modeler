export interface FinancialYear {
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  netIncome: number;
  cashBalance: number;
}

export interface ScenarioData {
  name: string; // "Base", "Optimistic", "Pessimistic"
  description: string;
  assumptions: string[];
  projections: FinancialYear[];
}

export interface BenchmarkData {
  industry: string;
  avgGrowthRate: string;
  avgEbitdaMargin: string;
  sources: { title: string; uri: string }[];
}

export interface UserInput {
  companyName: string;
  industry: string;
  country: string;
  currency: string;
  locale: string; // e.g., 'en-US', 'en-IN' for formatting
  currentRevenue: number;
  currentExpenses: number;
  currentCash: number;
  businessContext: string; // Description for AI context
}

export enum LoadingState {
  IDLE,
  BENCHMARKING,
  MODELING,
  COMPLETE,
  ERROR
}