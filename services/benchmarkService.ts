import { ScenarioData } from '../types';

export interface BenchmarkComparison {
  companyMargin: number;
  industryAvgMargin: number;
  marginPercentile: number;
  companyGrowth: number;
  industryAvgGrowth: number;
  growthPercentile: number;
  overallRanking: 'Top 10%' | 'Top 25%' | 'Top 50%' | 'Below Average';
  insights: string[];
}

const SAAS_INDIA_BENCHMARKS = {
  avgEbitdaMargin: -25, // Early stage SaaS typically -20% to -40%
  avgGrowthRate: 45, // Indian SaaS companies grow fast
  avgBurnMultiple: 2.5, // Revenue / Net Burn
  avgCacPayback: 18 // months
};

export const compareToBenchmarks = (scenario: ScenarioData): BenchmarkComparison => {
  const year1 = scenario.projections[0];
  const year2 = scenario.projections[1];
  
  // Calculate company metrics
  const companyMargin = (year1.ebitda / year1.revenue) * 100;
  const companyGrowth = ((year2.revenue - year1.revenue) / year1.revenue) * 100;
  
  // Dynamic benchmarks based on company size
  const revenueSize = year1.revenue;
  let benchmarks;
  
  if (revenueSize < 200000) {
    // Very early stage (< ₹2L ARR)
    benchmarks = { avgEbitdaMargin: -40, avgGrowthRate: 100 };
  } else if (revenueSize < 1000000) {
    // Early stage (₹2L - ₹10L ARR)
    benchmarks = { avgEbitdaMargin: -25, avgGrowthRate: 45 };
  } else if (revenueSize < 10000000) {
    // Growth stage (₹10L - ₹1Cr ARR)
    benchmarks = { avgEbitdaMargin: -10, avgGrowthRate: 30 };
  } else {
    // Scale stage (> ₹1Cr ARR)
    benchmarks = { avgEbitdaMargin: 5, avgGrowthRate: 20 };
  }
  
  // Calculate percentiles with appropriate standard deviations
  const marginStdDev = revenueSize < 1000000 ? 15 : 10;
  const growthStdDev = revenueSize < 1000000 ? 30 : 20;
  
  const marginPercentile = calculatePercentile(companyMargin, benchmarks.avgEbitdaMargin, marginStdDev);
  const growthPercentile = calculatePercentile(companyGrowth, benchmarks.avgGrowthRate, growthStdDev);
  
  // Overall ranking
  const avgPercentile = (marginPercentile + growthPercentile) / 2;
  let overallRanking: 'Top 10%' | 'Top 25%' | 'Top 50%' | 'Below Average';
  
  if (avgPercentile >= 90) overallRanking = 'Top 10%';
  else if (avgPercentile >= 75) overallRanking = 'Top 25%';
  else if (avgPercentile >= 50) overallRanking = 'Top 50%';
  else overallRanking = 'Below Average';
  
  // Generate stage-appropriate insights
  const insights = [];
  const stageLabel = revenueSize < 200000 ? 'very early-stage' : 
                    revenueSize < 1000000 ? 'early-stage' : 
                    revenueSize < 10000000 ? 'growth-stage' : 'scale-stage';
  
  if (companyMargin > benchmarks.avgEbitdaMargin) {
    insights.push(`✅ EBITDA margin is healthy for ${stageLabel} SaaS`);
  } else {
    insights.push(`⚠️ EBITDA margin below ${stageLabel} average - monitor burn rate`);
  }
  
  if (companyGrowth > benchmarks.avgGrowthRate) {
    insights.push(`✅ Growth rate exceeds ${stageLabel} benchmark`);
  } else {
    insights.push(`⚠️ Growth rate below ${stageLabel} benchmark - consider growth investments`);
  }
  
  return {
    companyMargin: Math.round(companyMargin * 10) / 10,
    industryAvgMargin: benchmarks.avgEbitdaMargin,
    marginPercentile: Math.round(marginPercentile),
    companyGrowth: Math.round(companyGrowth * 10) / 10,
    industryAvgGrowth: benchmarks.avgGrowthRate,
    growthPercentile: Math.round(growthPercentile),
    overallRanking,
    insights
  };
};

function calculatePercentile(value: number, benchmark: number, stdDev: number): number {
  // Simplified percentile calculation
  const zScore = (value - benchmark) / stdDev;
  const percentile = 50 + (zScore * 20); // Rough conversion
  return Math.max(0, Math.min(100, percentile));
}