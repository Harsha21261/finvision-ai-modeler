import { ScenarioData } from '../types';

export interface FounderScenario {
  scenario: string;
  impact: {
    monthlyBurnIncrease: number;
    runwayReduction: number;
    revenueImpact: number;
    breakEvenDelay: number;
  };
  recommendation: string;
  urgency: 'Low' | 'Medium' | 'High';
}

export const analyzeFounderScenarios = (baseScenario: ScenarioData, currentCash: number): FounderScenario[] => {
  const year1 = baseScenario.projections[0];
  const currentMonthlyBurn = Math.abs(year1.netIncome) / 12;
  const currentRunway = year1.netIncome > 0 ? Infinity : currentCash / Math.max(1, currentMonthlyBurn);
  
  // Scale scenarios based on company size
  const revenueSize = year1.revenue;
  const isEarlyStage = revenueSize < 1000000;
  
  return [
    analyzeHiring5Engineers(year1, currentMonthlyBurn, currentRunway, isEarlyStage),
    analyzeAWSCostDouble(year1, currentMonthlyBurn, currentRunway, revenueSize),
    analyzeMarketingSpend2x(year1, currentMonthlyBurn, currentRunway),
    analyzeOfficeRent(year1, currentMonthlyBurn, currentRunway),
    analyzeSalesTeamHire(year1, currentMonthlyBurn, currentRunway)
  ];
};

function analyzeHiring5Engineers(year1: any, currentBurn: number, currentRunway: number, isEarlyStage: boolean): FounderScenario {
  // Scale engineer costs based on stage
  const engineerCost = isEarlyStage ? 120000 : 180000; // Early vs growth stage salaries
  const engineerCount = isEarlyStage ? 3 : 5; // Hire fewer if early stage
  const totalCost = engineerCost * engineerCount;
  const newBurn = currentBurn + totalCost;
  const newRunway = Math.max(0, currentRunway * (currentBurn / newBurn));
  
  // Revenue impact scales with stage
  const revenueImpactPercent = isEarlyStage ? 0.5 : 0.3; // Higher impact for early stage
  const revenueImpact = year1.revenue * revenueImpactPercent;
  
  return {
    scenario: `Hire ${engineerCount} Engineers (₹${(totalCost/100000).toFixed(1)}L/month)`,
    impact: {
      monthlyBurnIncrease: totalCost,
      runwayReduction: Math.max(0, currentRunway - newRunway),
      revenueImpact: revenueImpact,
      breakEvenDelay: isEarlyStage ? 9 : 6 // Longer for early stage
    },
    recommendation: revenueImpact > totalCost * 12 ? 
      "✅ ROI positive - hire if you have >12 months runway" : 
      "⚠️ High risk - ensure strong product-market fit first",
    urgency: newRunway < 12 ? 'High' : newRunway < 18 ? 'Medium' : 'Low'
  };
}

function analyzeAWSCostDouble(year1: any, currentBurn: number, currentRunway: number, revenueSize: number): FounderScenario {
  // Scale AWS costs based on revenue size and AI usage
  let baseAWSPercent = 0.08;
  if (revenueSize < 200000) baseAWSPercent = 0.05; // Very early stage
  else if (revenueSize < 1000000) baseAWSPercent = 0.12; // Early stage with AI
  else baseAWSPercent = 0.15; // Growth stage with heavy AI usage
  
  const currentAWSCost = Math.max(20000, year1.revenue * baseAWSPercent);
  const additionalCost = currentAWSCost; // Double means +100%
  const newBurn = currentBurn + (additionalCost / 12);
  const newRunway = Math.max(0, currentRunway * (currentBurn / newBurn));
  
  return {
    scenario: "AWS Costs Double",
    impact: {
      monthlyBurnIncrease: additionalCost / 12,
      runwayReduction: Math.max(0, currentRunway - newRunway),
      revenueImpact: 0,
      breakEvenDelay: 2
    },
    recommendation: "🔧 Optimize infrastructure, consider reserved instances, multi-cloud strategy",
    urgency: additionalCost > year1.revenue * 0.15 ? 'High' : 'Medium'
  };
}

function analyzeMarketingSpend2x(year1: any, currentBurn: number, currentRunway: number): FounderScenario {
  const currentMarketing = year1.opex * 0.25; // Assume 25% of OpEx
  const additionalCost = currentMarketing; // Double means +100%
  const newBurn = currentBurn + (additionalCost / 12);
  const newRunway = Math.max(0, currentRunway * (currentBurn / newBurn));
  
  // Assume 2x marketing = 50% more revenue over 3 months
  const revenueImpact = year1.revenue * 0.5;
  
  return {
    scenario: "Double Marketing Spend",
    impact: {
      monthlyBurnIncrease: additionalCost / 12,
      runwayReduction: Math.max(0, currentRunway - newRunway),
      revenueImpact: revenueImpact,
      breakEvenDelay: 3 // months
    },
    recommendation: revenueImpact > additionalCost ? 
      "✅ Strong ROI - proceed if CAC payback <12 months" : 
      "⚠️ Monitor CAC closely, test with smaller budget first",
    urgency: 'Medium'
  };
}

function analyzeOfficeRent(year1: any, currentBurn: number, currentRunway: number): FounderScenario {
  const officeRent = 200000; // ₹2L per month for decent office
  const newBurn = currentBurn + officeRent;
  const newRunway = Math.max(0, currentRunway * (currentBurn / newBurn));
  
  return {
    scenario: "Get Office Space (₹2L/month)",
    impact: {
      monthlyBurnIncrease: officeRent,
      runwayReduction: Math.max(0, currentRunway - newRunway),
      revenueImpact: year1.revenue * 0.1, // 10% productivity boost
      breakEvenDelay: 12 // months
    },
    recommendation: "🏢 Consider co-working first, office only if team >15 people",
    urgency: 'Low'
  };
}

function analyzeSalesTeamHire(year1: any, currentBurn: number, currentRunway: number): FounderScenario {
  const salesTeamCost = 400000; // ₹4L per month (2 sales people)
  const newBurn = currentBurn + salesTeamCost;
  const newRunway = Math.max(0, currentRunway * (currentBurn / newBurn));
  
  // Sales team should 2x revenue over 6 months
  const revenueImpact = year1.revenue * 2;
  
  return {
    scenario: "Hire Sales Team (₹4L/month)",
    impact: {
      monthlyBurnIncrease: salesTeamCost,
      runwayReduction: Math.max(0, currentRunway - newRunway),
      revenueImpact: revenueImpact,
      breakEvenDelay: 6 // months
    },
    recommendation: revenueImpact > salesTeamCost * 12 ? 
      "✅ High impact - hire if you have proven sales process" : 
      "⚠️ Validate sales process with founder-led sales first",
    urgency: year1.revenue > 500000 ? 'High' : 'Medium'
  };
}