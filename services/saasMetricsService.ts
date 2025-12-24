import { ScenarioData } from '../types';

export interface SaaSMetrics {
  cac: number;
  ltv: number;
  churnRate: number;
  mrr: number;
  arr: number;
  paybackPeriod: number;
  ltvCacRatio: number;
}

export const calculateSaaSMetrics = (scenario: ScenarioData, userInputs?: { revenue: number; customers?: number }): SaaSMetrics => {
  const year1 = scenario.projections[0];
  const year3 = scenario.projections[2];
  
  // Use actual user inputs instead of defaults
  const actualRevenue = userInputs?.revenue || year1.revenue;
  const customerCount = userInputs?.customers || Math.max(10, Math.round(actualRevenue / 50000)); // ₹50K ARPU
  
  // Calculate MRR/ARR from actual revenue
  const arr = actualRevenue;
  const mrr = arr / 12;
  
  // Dynamic CAC calculation based on actual revenue size
  const revenueSize = actualRevenue;
  const marketingSpend = year1.opex * 0.30; // 30% of OpEx for customer acquisition
  const newCustomers = Math.max(5, customerCount * 0.20); // At least 5 new customers
  
  // Scale CAC based on revenue size and market maturity
  let baseCac = marketingSpend / newCustomers;
  if (revenueSize < 200000) baseCac = Math.max(5000, baseCac); // Very early stage
  else if (revenueSize < 1000000) baseCac = Math.max(8000, baseCac); // Early stage
  else baseCac = Math.max(12000, baseCac); // Growth stage
  
  const cac = Math.round(baseCac);
  
  // Dynamic LTV calculation based on revenue and customer base
  const avgRevenuePerCustomer = arr / customerCount;
  const grossMarginPercent = (year1.grossProfit / year1.revenue) * 100;
  const churnRate = 5; // 5% monthly churn
  
  // Scale LTV based on business maturity and ARPU
  let baseLtv = (avgRevenuePerCustomer * (grossMarginPercent / 100)) / (churnRate / 100);
  if (revenueSize < 200000) baseLtv = Math.min(25000, baseLtv); // Cap for very early
  else if (revenueSize < 1000000) baseLtv = Math.min(40000, baseLtv); // Cap for early
  else baseLtv = Math.min(80000, baseLtv); // Higher cap for growth stage
  
  const ltv = Math.round(baseLtv);
  
  // Payback period calculation
  const monthlyGrossProfit = (avgRevenuePerCustomer * (grossMarginPercent / 100)) / 12;
  const paybackPeriod = Math.min(24, Math.round(cac / Math.max(1, monthlyGrossProfit)));
  
  return {
    cac,
    ltv,
    churnRate,
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    paybackPeriod,
    ltvCacRatio: Math.round((ltv / cac) * 10) / 10
  };
};