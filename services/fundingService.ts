import { ScenarioData } from '../types';

export interface FundingRequirements {
  totalFundingNeeded: number;
  fundingByYear: { year: number; amount: number; purpose: string }[];
  dilution: number;
  roiProjection: number;
  paybackPeriod: number;
  irr: number;
  recommendedFundingRounds: {
    round: string;
    amount: number;
    timing: string;
    valuation: number;
    dilution: number;
  }[];
}

/**
 * Calculate funding requirements and investment metrics
 */
export const calculateFundingRequirements = (scenario: ScenarioData, assumptions: {
  currentValuation?: number;
  targetOwnership?: number;
  minimumCashBuffer?: number;
}): FundingRequirements => {
  const currentValuation = assumptions.currentValuation || 2000000; // ₹20L realistic for early SaaS
  const minimumCashBuffer = assumptions.minimumCashBuffer || 500000;

  // Realistic SaaS startup monthly burn (India)
  const realisticMonthlyBurn = 260000; // ₹2.6L (salaries + infra + marketing)
  const firstYear = scenario.projections[0];
  const actualMonthlyBurn = Math.max(realisticMonthlyBurn, (firstYear.cogs + firstYear.opex) / 12);
  
  // Calculate funding needs based on realistic cash flow analysis
  let runningCashBalance = firstYear.cashBalance;
  const fundingByYear: { year: number; amount: number; purpose: string }[] = [];
  let totalFundingNeeded = 0;

  scenario.projections.forEach((proj, index) => {
    const year = index + 1;
    const monthlyRevenue = proj.revenue / 12;
    const monthlyNetCashFlow = monthlyRevenue - actualMonthlyBurn;
    const yearlyNetCashFlow = monthlyNetCashFlow * 12;
    
    runningCashBalance += yearlyNetCashFlow;
    
    // Check if funding is needed
    if (runningCashBalance < minimumCashBuffer) {
      const monthsOfRunwayNeeded = year === 1 ? 18 : 12; // 18 months for first round
      const fundingNeeded = (actualMonthlyBurn * monthsOfRunwayNeeded) - runningCashBalance + minimumCashBuffer;
      
      if (fundingNeeded > 0) {
        fundingByYear.push({
          year,
          amount: fundingNeeded,
          purpose: year === 1 ? 'Seed funding for 18-month runway' : 
                  year === 2 ? 'Series A for growth acceleration' : 'Series B for scale'
        });
        totalFundingNeeded += fundingNeeded;
        runningCashBalance += fundingNeeded;
      }
    }
  });

  // Calculate realistic investment metrics
  const totalCashGenerated = scenario.projections.reduce((sum, proj) => sum + proj.netIncome, 0);
  const finalCashBalance = scenario.projections[scenario.projections.length - 1].cashBalance;
  
  // ROI calculation - realistic for loss-making startups
  const roiProjection = totalFundingNeeded > 0 ? 
    ((finalCashBalance - totalFundingNeeded) / totalFundingNeeded) * 100 : 0;
  
  // Payback period - when cumulative cash flows turn positive
  let paybackPeriod = 0;
  let cumulativeCashFlow = -totalFundingNeeded; // Start with negative investment
  
  for (let i = 0; i < scenario.projections.length; i++) {
    const monthlyRevenue = scenario.projections[i].revenue / 12;
    const monthlyNetCashFlow = monthlyRevenue - actualMonthlyBurn;
    cumulativeCashFlow += monthlyNetCashFlow * 12;
    
    if (cumulativeCashFlow >= 0) {
      paybackPeriod = i + 1;
      break;
    }
  }
  if (paybackPeriod === 0) paybackPeriod = 5; // Beyond projection period

  // IRR calculation - realistic for early-stage startups
  let irr = -0.50; // Start with -50% for loss-making startups
  if (totalFundingNeeded > 0 && finalCashBalance > totalFundingNeeded) {
    // Simple IRR approximation
    const totalReturn = finalCashBalance / totalFundingNeeded;
    irr = Math.pow(totalReturn, 1/3) - 1; // 3-year IRR
    irr = Math.max(-0.90, Math.min(irr, 2.0)); // Bound between -90% and 200%
  }

  // Realistic funding rounds for Indian SaaS
  const recommendedFundingRounds = [];
  if (totalFundingNeeded > 0) {
    if (totalFundingNeeded <= 2000000) {
      recommendedFundingRounds.push({
        round: 'Seed Round',
        amount: totalFundingNeeded,
        timing: 'Year 1 Q1',
        valuation: currentValuation,
        dilution: (totalFundingNeeded / (currentValuation + totalFundingNeeded)) * 100
      });
    } else if (totalFundingNeeded <= 8000000) {
      const seedAmount = Math.min(totalFundingNeeded, 3000000);
      recommendedFundingRounds.push({
        round: 'Seed Round',
        amount: seedAmount,
        timing: 'Year 1 Q1',
        valuation: currentValuation,
        dilution: (seedAmount / (currentValuation + seedAmount)) * 100
      });
      
      if (totalFundingNeeded > seedAmount) {
        const seriesAAmount = totalFundingNeeded - seedAmount;
        recommendedFundingRounds.push({
          round: 'Series A',
          amount: seriesAAmount,
          timing: 'Year 2 Q1',
          valuation: currentValuation * 2.5,
          dilution: (seriesAAmount / (currentValuation * 2.5 + seriesAAmount)) * 100
        });
      }
    }
  }

  const totalDilution = recommendedFundingRounds.reduce((sum, round) => sum + round.dilution, 0);

  return {
    totalFundingNeeded,
    fundingByYear,
    dilution: totalDilution,
    roiProjection,
    paybackPeriod,
    irr: irr * 100,
    recommendedFundingRounds
  };
};