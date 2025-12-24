import { ScenarioData } from '../types';
import { calculateRunway, RunwayStatus } from './runwayUtils';

export interface BreakEvenAnalysis {
  breakEvenRevenue: number;
  breakEvenUnits: number;
  marginOfSafety: number;
  operatingLeverage: number;
  runway: RunwayStatus;
  burnRate: number;
  breakEvenMonth: number;
  monthsToBreakEven: number;
  requiredGrowthRate: number;
  probability: number;
  strategy: string[];
}

/**
 * Calculate break-even analysis and cash runway
 */
export const calculateBreakEven = (scenario: ScenarioData, assumptions: {
  pricePerUnit?: number;
  variableCostPerUnit?: number;
  currentCash?: number;
  userInputs?: { monthlyExpenses: number; availableCash: number };
}): BreakEvenAnalysis => {
  const firstYear = scenario.projections[0];
  const secondYear = scenario.projections[1];
  const currentCash = assumptions.currentCash || assumptions.userInputs?.availableCash || firstYear.cashBalance;
  
  // Use actual user monthly expenses instead of hardcoded values
  const userMonthlyExpenses = assumptions.userInputs?.monthlyExpenses || 0;
  const actualMonthlyCosts = Math.max(userMonthlyExpenses, (firstYear.cogs + firstYear.opex) / 12);
  const monthlyRevenue = firstYear.revenue / 12;
  
  // Calculate runway using utility (prevents negative values)
  const runway = calculateRunway(currentCash, actualMonthlyCosts, monthlyRevenue);
  
  // Calculate break-even using proper cost structure
  const fixedCosts = firstYear.opex;
  const variableCostRatio = firstYear.cogs / firstYear.revenue;
  const contributionMarginRatio = 1 - variableCostRatio;
  const breakEvenRevenue = fixedCosts / contributionMarginRatio;
  
  const breakEvenUnits = assumptions.pricePerUnit ? 
    breakEvenRevenue / assumptions.pricePerUnit : 
    breakEvenRevenue / 100;
  
  const marginOfSafety = ((firstYear.revenue - breakEvenRevenue) / firstYear.revenue) * 100;
  const contributionMargin = firstYear.revenue - firstYear.cogs;
  const operatingLeverage = firstYear.ebitda > 0 ? contributionMargin / firstYear.ebitda : 0;
  
  const breakEvenMonth = monthlyRevenue > 0 ? breakEvenRevenue / monthlyRevenue : 0;
  
  // Calculate months to break-even
  let monthsToBreakEven: number;
  if (firstYear.revenue >= breakEvenRevenue) {
    monthsToBreakEven = 0;
  } else {
    const revenueGap = breakEvenRevenue - firstYear.revenue;
    const monthlyGrowth = (secondYear.revenue - firstYear.revenue) / 12;
    monthsToBreakEven = monthlyGrowth > 0 ? Math.min(36, revenueGap / monthlyGrowth) : runway.months;
  }
  
  // Required growth rate
  const requiredGrowthRate = firstYear.revenue > 0 ? 
    ((breakEvenRevenue - firstYear.revenue) / firstYear.revenue) * 100 : 100;
  
  // Probability based on runway and growth
  let probability: number;
  if (monthsToBreakEven === 0) probability = 100;
  else if (monthsToBreakEven <= runway.months && runway.months > 12) probability = 80;
  else if (monthsToBreakEven <= runway.months) probability = 60;
  else probability = 30;
  
  // Strategy based on runway status
  const strategy = [
    `Target monthly revenue: ${Math.round(breakEvenRevenue / 12).toLocaleString()}`,
    'Optimize unit economics and reduce CAC',
    runway.months < 6 ? 'URGENT: Secure emergency funding' : 'Plan next funding round',
    'Focus on customer retention and upselling',
    'Monitor burn rate weekly'
  ];

  return {
    breakEvenRevenue,
    breakEvenUnits,
    marginOfSafety,
    operatingLeverage,
    runway,
    burnRate: actualMonthlyCosts,
    breakEvenMonth,
    monthsToBreakEven: Math.round(monthsToBreakEven),
    requiredGrowthRate: Math.round(requiredGrowthRate * 10) / 10,
    probability: Math.round(probability),
    strategy
  };
};