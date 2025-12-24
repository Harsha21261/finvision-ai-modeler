import { ScenarioData } from '../types';

export interface MarketBenchmarks {
  industry: string;
  metrics: {
    grossMargin: { min: number; avg: number; max: number };
    ebitdaMargin: { min: number; avg: number; max: number };
    revenueGrowth: { min: number; avg: number; max: number };
    burnRate: { min: number; avg: number; max: number };
    cashRunway: { min: number; avg: number; max: number };
  };
  valuation: {
    revenueMultiple: { min: number; avg: number; max: number };
    ebitdaMultiple: { min: number; avg: number; max: number };
  };
  funding: {
    seedRange: { min: number; max: number };
    seriesARange: { min: number; max: number };
    typicalDilution: { seed: number; seriesA: number };
  };
}

// 2024-2025 Market Benchmarks by Industry (Stage-Aware)
const INDUSTRY_BENCHMARKS: Record<string, MarketBenchmarks> = {
  'SaaS': {
    industry: 'Software as a Service',
    metrics: {
      grossMargin: { min: 60, avg: 75, max: 85 },
      ebitdaMargin: { min: -15, avg: 10, max: 35 }, // Early stage can be negative
      revenueGrowth: { min: 20, avg: 40, max: 100 },
      burnRate: { min: 50000, avg: 150000, max: 500000 },
      cashRunway: { min: 12, avg: 18, max: 36 }
    },
    valuation: {
      revenueMultiple: { min: 3, avg: 6, max: 12 }, // Lower for early stage
      ebitdaMultiple: { min: 15, avg: 25, max: 50 }
    },
    funding: {
      seedRange: { min: 500000, max: 3000000 },
      seriesARange: { min: 2000000, max: 15000000 },
      typicalDilution: { seed: 15, seriesA: 20 }
    }
  },
  'E-commerce': {
    industry: 'E-commerce & Retail',
    metrics: {
      grossMargin: { min: 20, avg: 35, max: 50 },
      ebitdaMargin: { min: -8, avg: 8, max: 20 }, // Early stage often negative
      revenueGrowth: { min: 15, avg: 30, max: 80 },
      burnRate: { min: 30000, avg: 100000, max: 300000 },
      cashRunway: { min: 8, avg: 15, max: 24 }
    },
    valuation: {
      revenueMultiple: { min: 0.5, avg: 2, max: 5 },
      ebitdaMultiple: { min: 8, avg: 15, max: 25 }
    },
    funding: {
      seedRange: { min: 250000, max: 2000000 },
      seriesARange: { min: 1000000, max: 10000000 },
      typicalDilution: { seed: 18, seriesA: 22 }
    }
  },
  'FinTech': {
    industry: 'Financial Technology',
    metrics: {
      grossMargin: { min: 50, avg: 65, max: 80 },
      ebitdaMargin: { min: -20, avg: 15, max: 35 }, // High compliance costs early on
      revenueGrowth: { min: 25, avg: 50, max: 120 },
      burnRate: { min: 75000, avg: 200000, max: 600000 },
      cashRunway: { min: 15, avg: 24, max: 48 }
    },
    valuation: {
      revenueMultiple: { min: 4, avg: 8, max: 18 },
      ebitdaMultiple: { min: 20, avg: 30, max: 55 }
    },
    funding: {
      seedRange: { min: 1000000, max: 5000000 },
      seriesARange: { min: 3000000, max: 20000000 },
      typicalDilution: { seed: 12, seriesA: 18 }
    }
  },
  'HealthTech': {
    industry: 'Healthcare Technology',
    metrics: {
      grossMargin: { min: 55, avg: 70, max: 85 },
      ebitdaMargin: { min: -25, avg: 12, max: 30 }, // High R&D and regulatory costs
      revenueGrowth: { min: 20, avg: 45, max: 90 },
      burnRate: { min: 60000, avg: 180000, max: 450000 },
      cashRunway: { min: 18, avg: 30, max: 60 }
    },
    valuation: {
      revenueMultiple: { min: 3, avg: 7, max: 15 },
      ebitdaMultiple: { min: 15, avg: 28, max: 50 }
    },
    funding: {
      seedRange: { min: 750000, max: 4000000 },
      seriesARange: { min: 2500000, max: 18000000 },
      typicalDilution: { seed: 14, seriesA: 19 }
    }
  },
  'Manufacturing': {
    industry: 'Manufacturing & Hardware',
    metrics: {
      grossMargin: { min: 25, avg: 40, max: 55 },
      ebitdaMargin: { min: 2, avg: 12, max: 25 }, // More stable, rarely negative
      revenueGrowth: { min: 10, avg: 25, max: 50 },
      burnRate: { min: 40000, avg: 120000, max: 350000 },
      cashRunway: { min: 12, avg: 20, max: 36 }
    },
    valuation: {
      revenueMultiple: { min: 0.8, avg: 2, max: 4 },
      ebitdaMultiple: { min: 6, avg: 12, max: 20 }
    },
    funding: {
      seedRange: { min: 500000, max: 3000000 },
      seriesARange: { min: 2000000, max: 12000000 },
      typicalDilution: { seed: 20, seriesA: 25 }
    }
  }
};

export const getIndustryBenchmarks = (industry: string): MarketBenchmarks => {
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['SaaS'];
};

export const compareToMarket = (scenario: ScenarioData, industry: string) => {
  const benchmarks = getIndustryBenchmarks(industry);
  const lastYear = scenario.projections[scenario.projections.length - 1];
  const firstYear = scenario.projections[0];
  
  // Scenario-aware benchmark adjustments
  const scenarioType = scenario.name.toLowerCase();
  const isOptimistic = scenarioType.includes('optimistic') || scenarioType.includes('aggressive');
  const isPessimistic = scenarioType.includes('pessimistic') || scenarioType.includes('downturn');
  
  let adjustedBenchmarks = { ...benchmarks };
  if (isOptimistic) {
    // Higher expectations for optimistic scenarios
    adjustedBenchmarks.metrics.grossMargin.avg = benchmarks.metrics.grossMargin.avg * 1.1;
    adjustedBenchmarks.metrics.revenueGrowth.avg = benchmarks.metrics.revenueGrowth.avg * 1.3;
  } else if (isPessimistic) {
    // Lower expectations for pessimistic scenarios
    adjustedBenchmarks.metrics.grossMargin.avg = benchmarks.metrics.grossMargin.avg * 0.9;
    adjustedBenchmarks.metrics.ebitdaMargin.avg = benchmarks.metrics.ebitdaMargin.avg * 0.8;
    adjustedBenchmarks.metrics.revenueGrowth.avg = 5; // Low positive growth expectation
  }
  
  const grossMargin = (lastYear.grossProfit / lastYear.revenue) * 100;
  const ebitdaMargin = (lastYear.ebitda / lastYear.revenue) * 100;
  const revenueGrowth = ((Math.pow(lastYear.revenue / firstYear.revenue, 1/3) - 1) * 100);
  
  return {
    grossMargin: {
      value: grossMargin,
      percentile: getPercentile(grossMargin, adjustedBenchmarks.metrics.grossMargin),
      status: getStatus(grossMargin, adjustedBenchmarks.metrics.grossMargin),
      context: isOptimistic ? 'vs optimistic targets' : isPessimistic ? 'vs downturn expectations' : 'vs industry average'
    },
    ebitdaMargin: {
      value: ebitdaMargin,
      percentile: getPercentile(ebitdaMargin, adjustedBenchmarks.metrics.ebitdaMargin),
      status: getStatus(ebitdaMargin, adjustedBenchmarks.metrics.ebitdaMargin),
      context: isOptimistic ? 'vs optimistic targets' : isPessimistic ? 'vs downturn expectations' : 'vs industry average'
    },
    revenueGrowth: {
      value: revenueGrowth,
      percentile: getPercentile(revenueGrowth, adjustedBenchmarks.metrics.revenueGrowth),
      status: getStatus(revenueGrowth, adjustedBenchmarks.metrics.revenueGrowth),
      context: isOptimistic ? 'vs aggressive growth targets' : isPessimistic ? 'vs recession resilience' : 'vs industry average'
    }
  };
};

const getPercentile = (value: number, benchmark: { min: number; avg: number; max: number }): number => {
  if (value <= benchmark.min) return 10;
  if (value >= benchmark.max) return 90;
  if (value <= benchmark.avg) {
    return 10 + ((value - benchmark.min) / (benchmark.avg - benchmark.min)) * 40;
  } else {
    return 50 + ((value - benchmark.avg) / (benchmark.max - benchmark.avg)) * 40;
  }
};

const getStatus = (value: number, benchmark: { min: number; avg: number; max: number }): 'Poor' | 'Below Average' | 'Average' | 'Above Average' | 'Excellent' => {
  const percentile = getPercentile(value, benchmark);
  if (percentile >= 80) return 'Excellent';
  if (percentile >= 60) return 'Above Average';
  if (percentile >= 40) return 'Average';
  if (percentile >= 20) return 'Below Average';
  return 'Poor';
};