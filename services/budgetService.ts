import { ScenarioData } from '../types';

export interface BudgetBreakdown {
  totalBudget: number;
  allocation: {
    operations: { amount: number; percentage: number; description: string };
    marketing: { amount: number; percentage: number; description: string };
    development: { amount: number; percentage: number; description: string };
    reserves: { amount: number; percentage: number; description: string };
  };
  adequacy: {
    isAdequate: boolean;
    shortfall: number;
    recommendedBudget: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
  monthlyBurn: number;
  runwayMonths: number;
}

/**
 * Analyze budget breakdown and funding adequacy
 */
export const analyzeBudget = (scenario: ScenarioData, currentBudget: number): BudgetBreakdown => {
  console.log('Budget Analysis - Input currentBudget:', currentBudget);
  
  // Use fallback if currentBudget is undefined
  const budget = currentBudget || 2000000; // Default ₹20L
  
  const firstYear = scenario.projections[0];
  
  // Scenario-aware budget analysis
  const scenarioType = scenario.name.toLowerCase();
  const isOptimistic = scenarioType.includes('optimistic') || scenarioType.includes('aggressive');
  const isPessimistic = scenarioType.includes('pessimistic') || scenarioType.includes('downturn');
  
  // Calculate required funding based on scenario context
  const annualOperatingCosts = firstYear.cogs + firstYear.opex;
  
  // Scenario-specific adjustments
  let workingCapitalRate = 0.10;
  let contingencyRate = 0.15;
  let allocationRules = {
    operations: 0.70,
    marketing: 0.15,
    development: 0.10,
    reserves: 0.05
  };
  
  if (isOptimistic) {
    workingCapitalRate = 0.15;
    contingencyRate = 0.10;
    allocationRules = {
      operations: 0.60,
      marketing: 0.25,
      development: 0.12,
      reserves: 0.03
    };
  } else if (isPessimistic) {
    workingCapitalRate = 0.08;
    contingencyRate = 0.25;
    allocationRules = {
      operations: 0.75,
      marketing: 0.10,
      development: 0.05,
      reserves: 0.10
    };
  }
  
  const workingCapitalNeeds = firstYear.revenue * workingCapitalRate;
  const contingencyBuffer = annualOperatingCosts * contingencyRate;
  const recommendedBudget = annualOperatingCosts + workingCapitalNeeds + contingencyBuffer;
  
  // Calculate allocations
  const allocation = {
    operations: {
      amount: budget * allocationRules.operations,
      percentage: allocationRules.operations * 100,
      description: 'Cost of goods sold and operational expenses'
    },
    marketing: {
      amount: budget * allocationRules.marketing,
      percentage: allocationRules.marketing * 100,
      description: 'Customer acquisition and marketing campaigns'
    },
    development: {
      amount: budget * allocationRules.development,
      percentage: allocationRules.development * 100,
      description: 'Product development and R&D investments'
    },
    reserves: {
      amount: budget * allocationRules.reserves,
      percentage: allocationRules.reserves * 100,
      description: 'Emergency reserves and unexpected costs'
    }
  };
  
  // Calculate realistic monthly burn for risk assessment
  const actualMonthlyBurn = Math.abs(firstYear.netIncome) / 12;
  const monthlyRevenue = firstYear.revenue / 12;
  const monthlyNetCashFlow = monthlyRevenue - actualMonthlyBurn;
  
  // Fix runway calculation to prevent infinite values
  let runwayMonths: number;
  if (monthlyNetCashFlow >= 0) {
    runwayMonths = 999; // Profitable, very long runway
  } else {
    const monthlyBurn = Math.abs(monthlyNetCashFlow);
    runwayMonths = Math.max(0, budget / Math.max(1, monthlyBurn));
  }
  
  // Scenario-aware adequacy assessment
  const shortfall = Math.max(0, recommendedBudget - budget);
  
  let riskLevel: 'Low' | 'Medium' | 'High';
  if (runwayMonths >= 18) {
    riskLevel = 'Low';
  } else if (runwayMonths >= 12) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }
  
  return {
    totalBudget: budget,
    allocation,
    adequacy: {
      isAdequate: runwayMonths >= 12,
      shortfall,
      recommendedBudget,
      riskLevel
    },
    monthlyBurn: actualMonthlyBurn,
    runwayMonths
  };
};