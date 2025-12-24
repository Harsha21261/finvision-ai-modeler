import { ScenarioData } from '../types';

export interface SensitivityTest {
  parameter: string;
  baseValue: number;
  variations: { change: string; value: number; impact: number }[];
}

/**
 * Perform sensitivity analysis on key parameters
 */
export const performSensitivityAnalysis = (baseScenario: ScenarioData): SensitivityTest[] => {
  const baseProjection = baseScenario.projections[0];
  const baseRevenue = baseProjection.revenue;
  const baseEbitda = baseProjection.ebitda;
  const baseGrossProfit = baseProjection.grossProfit;
  const baseOpex = baseProjection.opex;
  
  return [
    {
      parameter: 'Revenue Growth Rate',
      baseValue: 10, // 10% base growth assumption
      variations: [
        { 
          change: '5% growth (vs 10% base)', 
          value: 5, 
          impact: calculateRevenueImpact(baseRevenue, baseEbitda, -5) 
        },
        { 
          change: '8% growth (vs 10% base)', 
          value: 8, 
          impact: calculateRevenueImpact(baseRevenue, baseEbitda, -2) 
        },
        { 
          change: '12% growth (vs 10% base)', 
          value: 12, 
          impact: calculateRevenueImpact(baseRevenue, baseEbitda, 2) 
        },
        { 
          change: '15% growth (vs 10% base)', 
          value: 15, 
          impact: calculateRevenueImpact(baseRevenue, baseEbitda, 5) 
        }
      ]
    },
    {
      parameter: 'Customer Acquisition Cost',
      baseValue: Math.round((baseOpex * 0.4 / baseRevenue) * 100), // 40% of OpEx as CAC
      variations: [
        { 
          change: '+10% CAC increase', 
          value: Math.round((baseOpex * 0.44 / baseRevenue) * 100), 
          impact: calculateCACImpact(baseEbitda, baseRevenue, 0.10) 
        },
        { 
          change: '+5% CAC increase', 
          value: Math.round((baseOpex * 0.42 / baseRevenue) * 100), 
          impact: calculateCACImpact(baseEbitda, baseRevenue, 0.05) 
        },
        { 
          change: '-5% CAC reduction', 
          value: Math.round((baseOpex * 0.38 / baseRevenue) * 100), 
          impact: calculateCACImpact(baseEbitda, baseRevenue, -0.05) 
        },
        { 
          change: '-10% CAC reduction', 
          value: Math.round((baseOpex * 0.36 / baseRevenue) * 100), 
          impact: calculateCACImpact(baseEbitda, baseRevenue, -0.10) 
        }
      ]
    },
    {
      parameter: 'Gross Margin',
      baseValue: Math.round((baseGrossProfit / baseRevenue) * 100),
      variations: [
        { 
          change: '-3% margin compression', 
          value: Math.round((baseGrossProfit / baseRevenue) * 100) - 3, 
          impact: calculateMarginImpact(baseEbitda, baseRevenue, -0.03) 
        },
        { 
          change: '-1% margin compression', 
          value: Math.round((baseGrossProfit / baseRevenue) * 100) - 1, 
          impact: calculateMarginImpact(baseEbitda, baseRevenue, -0.01) 
        },
        { 
          change: '+1% margin expansion', 
          value: Math.round((baseGrossProfit / baseRevenue) * 100) + 1, 
          impact: calculateMarginImpact(baseEbitda, baseRevenue, 0.01) 
        },
        { 
          change: '+3% margin expansion', 
          value: Math.round((baseGrossProfit / baseRevenue) * 100) + 3, 
          impact: calculateMarginImpact(baseEbitda, baseRevenue, 0.03) 
        }
      ]
    }
  ];
};

// Helper functions for clear impact calculations
const calculateRevenueImpact = (baseRevenue: number, baseEbitda: number, growthChange: number): number => {
  const revenueChange = baseRevenue * (growthChange / 100);
  const ebitdaChange = revenueChange * 0.6; // Assume 60% flows to EBITDA
  return baseEbitda !== 0 ? (ebitdaChange / Math.abs(baseEbitda)) * 100 : growthChange;
};

const calculateCACImpact = (baseEbitda: number, baseRevenue: number, cacChange: number): number => {
  const cacImpact = baseRevenue * 0.4 * cacChange; // 40% of revenue affected by CAC
  return baseEbitda !== 0 ? (-cacImpact / Math.abs(baseEbitda)) * 100 : -cacChange * 100;
};

const calculateMarginImpact = (baseEbitda: number, baseRevenue: number, marginChange: number): number => {
  const marginImpact = baseRevenue * marginChange;
  return baseEbitda !== 0 ? (marginImpact / Math.abs(baseEbitda)) * 100 : marginChange * 100;
};