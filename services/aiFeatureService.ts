import { ScenarioData } from '../types';

export interface AIFeatureImpact {
  revenueUplift: number;
  revenueUpliftPercent: number;
  additionalCosts: number;
  computeCosts: number;
  rdCosts: number;
  competitiveMoatScore: number;
  netImpact: number;
  roiPercent: number;
}

export const calculateAIFeatureImpact = (
  baseScenario: ScenarioData,
  hasAIFeature: boolean = true,
  userInputs?: { revenue: number; industry?: string }
): AIFeatureImpact => {
  const year1 = baseScenario.projections[0];
  
  if (!hasAIFeature) {
    return {
      revenueUplift: 0,
      revenueUpliftPercent: 0,
      additionalCosts: 0,
      computeCosts: 0,
      rdCosts: 0,
      competitiveMoatScore: 3,
      netImpact: 0,
      roiPercent: 0
    };
  }
  
  // Use actual user revenue instead of scenario revenue
  const revenueSize = userInputs?.revenue || year1.revenue;
  let revenueUpliftPercent, computePercent, rdPercent;
  
  if (revenueSize < 200000) {
    // Very early stage - AI is experimental
    revenueUpliftPercent = 10;
    computePercent = 0.08;
    rdPercent = 0.25; // High R&D relative to revenue
  } else if (revenueSize < 1000000) {
    // Early stage - AI becoming core
    revenueUpliftPercent = 20;
    computePercent = 0.15;
    rdPercent = 0.18;
  } else if (revenueSize < 10000000) {
    // Growth stage - AI is differentiator
    revenueUpliftPercent = 25;
    computePercent = 0.12;
    rdPercent = 0.15;
  } else {
    // Scale stage - AI is optimization
    revenueUpliftPercent = 15;
    computePercent = 0.10;
    rdPercent = 0.12;
  }
  
  const revenueUplift = revenueSize * (revenueUpliftPercent / 100);
  
  // Scale costs with minimums based on stage
  const minCompute = revenueSize < 200000 ? 20000 : revenueSize < 1000000 ? 50000 : 100000;
  const minRD = revenueSize < 200000 ? 50000 : revenueSize < 1000000 ? 120000 : 200000;
  
  const computeCosts = Math.max(minCompute, revenueSize * computePercent);
  const rdCosts = Math.max(minRD, revenueSize * rdPercent);
  const additionalCosts = computeCosts + rdCosts;
  
  // Competitive moat varies by stage
  const competitiveMoatScore = revenueSize < 200000 ? 5 : revenueSize < 1000000 ? 7 : 8;
  
  const netImpact = revenueUplift - additionalCosts;
  const roiPercent = additionalCosts > 0 ? (netImpact / additionalCosts) * 100 : 0;
  
  return {
    revenueUplift: Math.round(revenueUplift),
    revenueUpliftPercent,
    additionalCosts: Math.round(additionalCosts),
    computeCosts: Math.round(computeCosts),
    rdCosts: Math.round(rdCosts),
    competitiveMoatScore,
    netImpact: Math.round(netImpact),
    roiPercent: Math.round(roiPercent)
  };
};