import { ScenarioData } from '../types';

export interface ValuationMetrics {
  dcfValuation: number;
  terminalValue: number;
  presentValue: number;
  wacc: number;
  enterpriseValue: number;
  equityValue: number;
  sharePrice: number;
  multipleValuation: {
    revenueMultiple: number;
    ebitdaMultiple: number;
    peRatio: number;
  };
  valuationMethod?: string; // Add method explanation
}

/**
 * Calculate DCF valuation and key valuation metrics
 */
export const calculateValuation = (scenario: ScenarioData, assumptions: {
  wacc?: number;
  terminalGrowthRate?: number;
  sharesOutstanding?: number;
  industryMultiples?: { revenue: number; ebitda: number; pe: number };
}): ValuationMetrics => {
  const wacc = assumptions.wacc || 0.15; // Higher WACC for early-stage startups
  const terminalGrowthRate = assumptions.terminalGrowthRate || 0.025;
  const sharesOutstanding = assumptions.sharesOutstanding || 1000000;
  const multiples = assumptions.industryMultiples || { revenue: 4, ebitda: 20, pe: 25 }; // Lower multiples for early stage

  const lastYear = scenario.projections[scenario.projections.length - 1];
  const firstYear = scenario.projections[0];
  
  // Determine company stage for appropriate valuation
  const isEarlyStage = firstYear.revenue < 1000000 && firstYear.ebitda < 0; // < ₹10L and loss-making
  const stageMultiplier = isEarlyStage ? 0.6 : 1.0; // 40% discount for early stage
  
  // Calculate present value of free cash flows
  let presentValue = 0;
  scenario.projections.forEach((proj, index) => {
    const year = index + 1;
    const discountFactor = Math.pow(1 + wacc, year);
    const taxRate = 0.30; // India corporate tax rate
    const capexRate = 0.03; // Lower CapEx for SaaS
    const workingCapitalChange = Math.max(0, proj.revenue * 0.05); // 5% of revenue
    
    // For negative EBITDA companies, use revenue-based valuation
    const fcf = proj.ebitda > 0 ? 
      proj.ebitda * (1 - taxRate) - (proj.revenue * capexRate) - workingCapitalChange :
      proj.revenue * 0.1; // 10% of revenue for loss-making companies
    
    presentValue += Math.max(fcf, 0) / discountFactor;
  });

  // Terminal value calculation
  const finalFCF = lastYear.ebitda > 0 ? 
    lastYear.ebitda * (1 - 0.30) - (lastYear.revenue * 0.03) - (lastYear.revenue * 0.05) :
    lastYear.revenue * 0.15; // 15% of revenue for terminal
    
  const terminalFCF = finalFCF * (1 + terminalGrowthRate);
  const terminalValue = terminalFCF / (wacc - terminalGrowthRate);
  const discountedTerminalValue = terminalValue / Math.pow(1 + wacc, scenario.projections.length);

  // For early-stage companies, use revenue multiples as primary valuation method
  // DCF is less reliable for loss-making companies
  let primaryValuation: number;
  let valuationMethod: string;
  const adjustedRevenueMultiple = multiples.revenue * stageMultiplier;
  const adjustedEbitdaMultiple = multiples.ebitda * stageMultiplier;
  const enterpriseValue = presentValue + discountedTerminalValue;
  
  if (isEarlyStage) {
    // Revenue multiple is more appropriate for early-stage SaaS
    const adjustedRevenueMultiple = multiples.revenue * stageMultiplier;
    primaryValuation = lastYear.revenue * adjustedRevenueMultiple;
    valuationMethod = "Revenue Multiple (Primary for early-stage)";
  } else {
    // DCF for profitable companies
    primaryValuation = enterpriseValue;
    valuationMethod = "DCF (Primary for profitable companies)";
  }

  return {
    dcfValuation: enterpriseValue,
    terminalValue: discountedTerminalValue * stageMultiplier,
    presentValue: presentValue * stageMultiplier,
    wacc,
    enterpriseValue: primaryValuation, // Use primary valuation method
    equityValue: primaryValuation,
    sharePrice: primaryValuation / sharesOutstanding,
    multipleValuation: {
      revenueMultiple: lastYear.revenue * adjustedRevenueMultiple,
      ebitdaMultiple: lastYear.ebitda > 0 ? lastYear.ebitda * adjustedEbitdaMultiple : 0, // No EBITDA multiple for loss-making
      peRatio: lastYear.netIncome > 0 ? lastYear.netIncome * multiples.pe * stageMultiplier : 0
    },
    valuationMethod // Add method explanation
  };
};