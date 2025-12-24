import { ScenarioData } from '../types';

export interface FinancialRatios {
  profitabilityRatios: {
    grossMargin: number;
    ebitdaMargin: number;
    netMargin: number;
    roa: number; // Return on Assets (simplified)
  };
  growthRatios: {
    revenueGrowth: number;
    ebitdaGrowth: number;
    netIncomeGrowth: number;
  };
  efficiencyRatios: {
    assetTurnover: number; // Simplified
    cogsRatio: number;
    opexRatio: number;
  };
}

/**
 * Calculate comprehensive financial ratios for a scenario
 */
export const calculateFinancialRatios = (scenario: ScenarioData): FinancialRatios => {
  const projections = scenario.projections;
  const latestYear = projections[projections.length - 1];
  const firstYear = projections[0];
  
  // Calculate growth rates using CAGR formula
  const years = projections.length;
  const revenueGrowth = years > 1 ? 
    (Math.pow(latestYear.revenue / firstYear.revenue, 1/(years-1)) - 1) * 100 : 0;
  const ebitdaGrowth = years > 1 && firstYear.ebitda > 0 ? 
    (Math.pow(latestYear.ebitda / firstYear.ebitda, 1/(years-1)) - 1) * 100 : 0;
  const netIncomeGrowth = years > 1 && firstYear.netIncome > 0 ? 
    (Math.pow(latestYear.netIncome / firstYear.netIncome, 1/(years-1)) - 1) * 100 : 0;
  
  return {
    profitabilityRatios: {
      grossMargin: (latestYear.grossProfit / latestYear.revenue) * 100,
      ebitdaMargin: (latestYear.ebitda / latestYear.revenue) * 100,
      netMargin: (latestYear.netIncome / latestYear.revenue) * 100,
      roa: (latestYear.netIncome / latestYear.cashBalance) * 100 // Simplified ROA
    },
    growthRatios: {
      revenueGrowth,
      ebitdaGrowth,
      netIncomeGrowth
    },
    efficiencyRatios: {
      assetTurnover: latestYear.revenue / latestYear.cashBalance, // Simplified
      cogsRatio: (latestYear.cogs / latestYear.revenue) * 100,
      opexRatio: (latestYear.opex / latestYear.revenue) * 100
    }
  };
};