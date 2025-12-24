import { ScenarioData } from '../types';
import { getIndustryBenchmarks } from './marketBenchmarks';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  reliability: 'High' | 'Medium' | 'Low';
}

export const validateFinancialModel = (scenario: ScenarioData, industry: string = 'SaaS'): ValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  
  const benchmarks = getIndustryBenchmarks(industry);
  const projections = scenario.projections;
  
  // Scenario-specific validation thresholds
  const scenarioType = scenario.name.toLowerCase();
  const isOptimistic = scenarioType.includes('optimistic') || scenarioType.includes('aggressive');
  const isPessimistic = scenarioType.includes('pessimistic') || scenarioType.includes('downturn');
  const isBase = scenarioType.includes('base') || scenarioType.includes('conservative');
  
  // Adjust benchmarks based on scenario
  let adjustedBenchmarks = { ...benchmarks };
  if (isOptimistic) {
    adjustedBenchmarks.metrics.revenueGrowth.min = benchmarks.metrics.revenueGrowth.avg;
    adjustedBenchmarks.metrics.revenueGrowth.max = benchmarks.metrics.revenueGrowth.max * 1.5;
  } else if (isPessimistic) {
    adjustedBenchmarks.metrics.revenueGrowth.min = -20; // Allow negative growth
    adjustedBenchmarks.metrics.revenueGrowth.max = benchmarks.metrics.revenueGrowth.min;
    adjustedBenchmarks.metrics.grossMargin.min = benchmarks.metrics.grossMargin.min * 0.8;
  }
  
  // Basic data validation
  projections.forEach((proj, index) => {
    // Revenue consistency
    if (proj.revenue <= 0) {
      errors.push(`Year ${proj.year}: Revenue must be positive`);
    }
    
    // P&L consistency
    const calculatedGrossProfit = proj.revenue - proj.cogs;
    if (Math.abs(calculatedGrossProfit - proj.grossProfit) > 1) {
      errors.push(`Year ${proj.year}: Gross Profit calculation error (${proj.grossProfit} vs ${calculatedGrossProfit})`);
    }
    
    const calculatedEbitda = proj.grossProfit - proj.opex;
    if (Math.abs(calculatedEbitda - proj.ebitda) > 1) {
      errors.push(`Year ${proj.year}: EBITDA calculation error (${proj.ebitda} vs ${calculatedEbitda})`);
    }
    
    // Margin validation with scenario context
    const grossMargin = (proj.grossProfit / proj.revenue) * 100;
    if (grossMargin < 0) {
      errors.push(`Year ${proj.year}: Negative gross margin (${grossMargin.toFixed(1)}%)`);
    } else if (grossMargin < adjustedBenchmarks.metrics.grossMargin.min) {
      const severity = isPessimistic ? 'expected in downturn' : 'concerning';
      warnings.push(`Year ${proj.year}: Gross margin (${grossMargin.toFixed(1)}%) below industry minimum - ${severity}`);
    }
    
    // Growth validation with scenario expectations
    if (index > 0) {
      const prevProj = projections[index - 1];
      const revenueGrowth = ((proj.revenue - prevProj.revenue) / prevProj.revenue) * 100;
      
      if (isOptimistic && revenueGrowth < adjustedBenchmarks.metrics.revenueGrowth.min) {
        warnings.push(`Year ${proj.year}: Growth (${revenueGrowth.toFixed(1)}%) seems low for optimistic scenario`);
      } else if (isPessimistic && revenueGrowth > 10) {
        warnings.push(`Year ${proj.year}: Growth (${revenueGrowth.toFixed(1)}%) seems high for pessimistic scenario`);
      } else if (isBase && (revenueGrowth < 5 || revenueGrowth > 50)) {
        warnings.push(`Year ${proj.year}: Growth (${revenueGrowth.toFixed(1)}%) outside typical base case range`);
      }
      
      if (revenueGrowth < -50) {
        warnings.push(`Year ${proj.year}: Extreme revenue decline (${revenueGrowth.toFixed(1)}%)`);
      } else if (revenueGrowth > 300 && !isOptimistic) {
        warnings.push(`Year ${proj.year}: Unrealistic revenue growth (${revenueGrowth.toFixed(1)}%) for ${scenario.name}`);
      }
    }
    
    // Cash flow validation
    if (proj.netIncome < 0 && proj.cashBalance < projections[0].cashBalance * 0.1) {
      warnings.push(`Year ${proj.year}: Low cash balance with negative income - funding may be needed`);
    }
  });
  
  // Scenario-aware market alignment validation
  const lastYear = projections[projections.length - 1];
  const firstYear = projections[0];
  const avgGrossMargin = (lastYear.grossProfit / lastYear.revenue) * 100;
  const avgEbitdaMargin = (lastYear.ebitda / lastYear.revenue) * 100;
  const cagr = ((Math.pow(lastYear.revenue / firstYear.revenue, 1/3) - 1) * 100);
  
  // Industry benchmark comparisons with scenario context
  if (avgGrossMargin < adjustedBenchmarks.metrics.grossMargin.avg * 0.8) {
    const context = isPessimistic ? ' (acceptable given economic downturn scenario)' : '';
    recommendations.push(`Consider improving gross margin - currently ${avgGrossMargin.toFixed(1)}%, industry average is ${benchmarks.metrics.grossMargin.avg}%${context}`);
  }
  
  if (avgEbitdaMargin < adjustedBenchmarks.metrics.ebitdaMargin.avg * 0.7) {
    const context = isPessimistic ? ' (focus on cost management in downturn)' : isOptimistic ? ' (leverage growth for efficiency)' : '';
    recommendations.push(`EBITDA margin (${avgEbitdaMargin.toFixed(1)}%) is below industry standards${context}`);
  }
  
  // Scenario-specific growth recommendations
  if (isOptimistic && cagr < adjustedBenchmarks.metrics.revenueGrowth.min) {
    recommendations.push(`Revenue growth (${cagr.toFixed(1)}%) is conservative for optimistic scenario - consider more aggressive targets`);
  } else if (isPessimistic && cagr > 0) {
    recommendations.push(`Positive growth (${cagr.toFixed(1)}%) in pessimistic scenario - validate market resilience assumptions`);
  } else if (isBase && (cagr < benchmarks.metrics.revenueGrowth.min || cagr > benchmarks.metrics.revenueGrowth.max)) {
    recommendations.push(`Revenue growth (${cagr.toFixed(1)}%) outside typical range for base case scenario`);
  }
  
  // Scenario-aware funding recommendations
  const totalOperatingCosts = lastYear.cogs + lastYear.opex;
  const monthlyBurn = totalOperatingCosts / 12;
  const monthlyRevenue = lastYear.revenue / 12;
  const monthlyNetCash = monthlyRevenue - monthlyBurn;
  
  if (monthlyNetCash < 0) {
    const runwayMonths = isOptimistic ? 12 : isPessimistic ? 24 : 18; // Scenario-based runway
    const recommendedFunding = Math.abs(monthlyNetCash) * runwayMonths;
    const context = isPessimistic ? ' (extended runway for economic uncertainty)' : 
                   isOptimistic ? ' (shorter runway due to growth potential)' : '';
    recommendations.push(`Consider raising ${(recommendedFunding/100000).toFixed(1)}L to maintain ${runwayMonths}-month runway${context}`);
  }
  
  // Scenario-specific risk assessment
  if (isPessimistic && lastYear.ebitda < 0) {
    recommendations.push('Focus on cost reduction and cash preservation strategies for economic downturn');
  } else if (isOptimistic && avgEbitdaMargin < 20) {
    recommendations.push('Optimize operations to capture full benefit of aggressive growth scenario');
  }
  
  // Determine reliability
  let reliability: 'High' | 'Medium' | 'Low' = 'High';
  if (errors.length > 0) reliability = 'Low';
  else if (warnings.length > 2) reliability = 'Medium';
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    recommendations,
    reliability
  };
};