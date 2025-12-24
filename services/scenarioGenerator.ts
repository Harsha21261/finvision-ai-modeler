import { ScenarioData } from '../types';

export interface UserInputs {
  companyName: string;
  annualRevenue: number;
  monthlyExpenses: number;
  availableCash: number;
  industry?: string;
  country?: string;
  businessContext: string;
  growthRate?: number;
}

export const generateScenariosFromInputs = (inputs: UserInputs): ScenarioData[] => {
  const { companyName, annualRevenue, monthlyExpenses, availableCash, industry = 'SaaS', country = 'India', businessContext } = inputs;
  
  // Country-specific configurations
  const getCountryConfig = (country: string) => {
    const configs = {
      'India': { taxRate: 0.30, currency: '₹', salaryMultiplier: 1.0 },
      'USA': { taxRate: 0.21, currency: '$', salaryMultiplier: 4.0 },
      'UK': { taxRate: 0.19, currency: '£', salaryMultiplier: 3.5 },
      'Germany': { taxRate: 0.30, currency: '€', salaryMultiplier: 3.2 },
      'Singapore': { taxRate: 0.17, currency: 'S$', salaryMultiplier: 2.8 },
      'Australia': { taxRate: 0.30, currency: 'A$', salaryMultiplier: 3.0 },
      'Canada': { taxRate: 0.26, currency: 'C$', salaryMultiplier: 3.1 },
      'Japan': { taxRate: 0.30, currency: '¥', salaryMultiplier: 2.5 },
      'South Korea': { taxRate: 0.25, currency: '₩', salaryMultiplier: 2.2 },
      'China': { taxRate: 0.25, currency: '¥', salaryMultiplier: 1.8 },
      'Brazil': { taxRate: 0.34, currency: 'R$', salaryMultiplier: 1.5 },
      'Mexico': { taxRate: 0.30, currency: '$', salaryMultiplier: 1.3 },
      'France': { taxRate: 0.32, currency: '€', salaryMultiplier: 3.0 },
      'Netherlands': { taxRate: 0.25, currency: '€', salaryMultiplier: 3.4 },
      'Switzerland': { taxRate: 0.18, currency: 'CHF', salaryMultiplier: 4.5 },
      'Sweden': { taxRate: 0.21, currency: 'kr', salaryMultiplier: 3.3 },
      'Norway': { taxRate: 0.22, currency: 'kr', salaryMultiplier: 4.2 },
      'Denmark': { taxRate: 0.22, currency: 'kr', salaryMultiplier: 3.8 },
      'Israel': { taxRate: 0.23, currency: '₪', salaryMultiplier: 2.7 },
      'UAE': { taxRate: 0.09, currency: 'د.إ', salaryMultiplier: 2.5 },
      'Saudi Arabia': { taxRate: 0.20, currency: 'ر.س', salaryMultiplier: 2.3 },
      'South Africa': { taxRate: 0.28, currency: 'R', salaryMultiplier: 0.8 },
      'Nigeria': { taxRate: 0.30, currency: '₦', salaryMultiplier: 0.6 },
      'Kenya': { taxRate: 0.30, currency: 'KSh', salaryMultiplier: 0.5 },
      'Egypt': { taxRate: 0.22, currency: 'ج.م', salaryMultiplier: 0.4 },
      'Turkey': { taxRate: 0.25, currency: '₺', salaryMultiplier: 0.7 },
      'Russia': { taxRate: 0.20, currency: '₽', salaryMultiplier: 0.9 },
      'Poland': { taxRate: 0.19, currency: 'zł', salaryMultiplier: 1.4 },
      'Czech Republic': { taxRate: 0.19, currency: 'Kč', salaryMultiplier: 1.2 },
      'Hungary': { taxRate: 0.09, currency: 'Ft', salaryMultiplier: 1.1 },
      'Romania': { taxRate: 0.16, currency: 'lei', salaryMultiplier: 0.9 },
      'Bulgaria': { taxRate: 0.10, currency: 'лв', salaryMultiplier: 0.7 },
      'Croatia': { taxRate: 0.18, currency: '€', salaryMultiplier: 1.3 },
      'Serbia': { taxRate: 0.15, currency: 'дин', salaryMultiplier: 0.6 },
      'Ukraine': { taxRate: 0.18, currency: '₴', salaryMultiplier: 0.5 },
      'Belarus': { taxRate: 0.18, currency: 'Br', salaryMultiplier: 0.4 },
      'Lithuania': { taxRate: 0.15, currency: '€', salaryMultiplier: 1.5 },
      'Latvia': { taxRate: 0.20, currency: '€', salaryMultiplier: 1.3 },
      'Estonia': { taxRate: 0.20, currency: '€', salaryMultiplier: 1.6 },
      'Finland': { taxRate: 0.20, currency: '€', salaryMultiplier: 3.1 },
      'Austria': { taxRate: 0.25, currency: '€', salaryMultiplier: 3.0 },
      'Belgium': { taxRate: 0.29, currency: '€', salaryMultiplier: 3.2 },
      'Spain': { taxRate: 0.25, currency: '€', salaryMultiplier: 2.4 },
      'Italy': { taxRate: 0.24, currency: '€', salaryMultiplier: 2.6 },
      'Portugal': { taxRate: 0.21, currency: '€', salaryMultiplier: 1.8 },
      'Greece': { taxRate: 0.24, currency: '€', salaryMultiplier: 1.7 },
      'Ireland': { taxRate: 0.12, currency: '€', salaryMultiplier: 3.5 },
      'Luxembourg': { taxRate: 0.24, currency: '€', salaryMultiplier: 4.0 },
      'Malta': { taxRate: 0.35, currency: '€', salaryMultiplier: 2.2 },
      'Cyprus': { taxRate: 0.12, currency: '€', salaryMultiplier: 2.0 },
      'Slovenia': { taxRate: 0.19, currency: '€', salaryMultiplier: 1.9 },
      'Slovakia': { taxRate: 0.21, currency: '€', salaryMultiplier: 1.6 }
    };
    return configs[country as keyof typeof configs] || configs['India'];
  };
  
  const countryConfig = getCountryConfig(country);
  
  // CRITICAL: Use EXACT user inputs as Year 1 base - NO ADJUSTMENTS
  const userAnnualRevenue = annualRevenue; // Use exactly what user entered
  const userMonthlyExpenses = monthlyExpenses; // Use exactly what user entered  
  const userAvailableCash = availableCash; // Use exactly what user entered
  
  // Remove all "realistic" overrides - use ONLY user inputs
  // const actualMonthlyExpenses = userMonthlyExpenses; // Use user input exactly
  // const actualAnnualExpenses = userMonthlyExpenses * 12; // User input * 12
  
  // Determine company stage based on revenue and adjust costs accordingly
  const getStageAdjustedCosts = (revenue: number, baseFixedCost: number, countryMultiplier: number) => {
    if (revenue < 1000000) { // Pre-seed: < ₹10L
      return baseFixedCost * countryMultiplier * 0.3; // 30% of base costs
    } else if (revenue < 5000000) { // Seed: ₹10L - ₹50L
      return baseFixedCost * countryMultiplier * 0.6; // 60% of base costs
    } else if (revenue < 20000000) { // Series A: ₹50L - ₹2Cr
      return baseFixedCost * countryMultiplier * 1.0; // Full base costs
    } else { // Series B+: > ₹2Cr
      return baseFixedCost * countryMultiplier * 1.5; // 150% of base costs
    }
  };
  
  const getMarginProfile = (industry: string) => {
    const baseProfiles = {
      'SaaS': { grossMargin: 0.60, baseCost: 2000000, variableOpexRate: 0.15 },
      'E-commerce': { grossMargin: 0.25, baseCost: 2500000, variableOpexRate: 0.25 },
      'FinTech': { grossMargin: 0.50, baseCost: 3000000, variableOpexRate: 0.18 },
      'HealthTech': { grossMargin: 0.55, baseCost: 3500000, variableOpexRate: 0.20 },
      'Manufacturing': { grossMargin: 0.30, baseCost: 4000000, variableOpexRate: 0.35 }
    };
    
    const profile = baseProfiles[industry as keyof typeof baseProfiles] || baseProfiles['SaaS'];
    
    return {
      grossMargin: profile.grossMargin,
      ebitdaMargin: profile.grossMargin - profile.variableOpexRate, // Approximate EBITDA margin
      fixedOpex: getStageAdjustedCosts(userAnnualRevenue, profile.baseCost, countryConfig.salaryMultiplier),
      variableOpexRate: profile.variableOpexRate,
      taxRate: countryConfig.taxRate
    };
  };
  
  const marginProfile = getMarginProfile(industry);
  
  // Derive a baseline fixed Opex from user inputs to make scenarios comparable
  const baseCogs = userAnnualRevenue * (1 - marginProfile.grossMargin);
  const baseAnnualExpenses = userMonthlyExpenses * 12;
  const baseOpex = baseAnnualExpenses - baseCogs;
  const baseVariableOpex = userAnnualRevenue * marginProfile.variableOpexRate;
  const derivedFixedOpex = baseOpex - baseVariableOpex;

  // Base scenario - EXACT user inputs with realistic margins
  const baseScenario: ScenarioData = {
    name: companyName ? `${companyName} - Business Plan` : "Your Business Plan",
    description: `Early-stage ${industry} in ${country}${businessContext ? ' - ' + businessContext.substring(0, 50) + '...' : ''}`,
    assumptions: [
      `Year 1 Revenue: ${countryConfig.currency}${(userAnnualRevenue/100000).toFixed(1)}L (your input)`,
      `Monthly Expenses: ${countryConfig.currency}${(userMonthlyExpenses/1000).toFixed(0)}K (your input)`,
      `Starting Cash: ${countryConfig.currency}${(userAvailableCash/100000).toFixed(1)}L (your input)`,
      `Tax Rate: ${(marginProfile.taxRate * 100).toFixed(0)}% (${country} corporate tax)`,
      `Industry: ${industry} with ${(marginProfile.grossMargin*100).toFixed(0)}% gross margin`
    ],
    projections: []
  };
  
  // Generate 3-year projections using EXACT user inputs for Year 1
  for (let year = 1; year <= 3; year++) {
    // Year 1 MUST match user inputs exactly
    const yearRevenue = year === 1 ? userAnnualRevenue : userAnnualRevenue * Math.pow(1.10, year - 1);
    
    // Calculate COGS and OpEx from total expenses using industry ratios
    const yearCogs = yearRevenue * (1 - marginProfile.grossMargin);
    const yearGrossProfit = yearRevenue - yearCogs;
    
    // Recalculate Opex based on a fixed + variable model derived from user input
    const yearOpex = derivedFixedOpex + (yearRevenue * marginProfile.variableOpexRate);
    
    // EBITDA and Net Income
    const yearEbitda = yearGrossProfit - yearOpex;
    const yearNetIncome = yearEbitda > 0 ? yearEbitda * (1 - marginProfile.taxRate) : yearEbitda;
    
    // Cash calculation
    const yearCashBalance = year === 1 ? 
      userAvailableCash + yearNetIncome : 
      baseScenario.projections[year - 2].cashBalance + yearNetIncome;
    
    baseScenario.projections.push({
      year,
      revenue: Math.round(yearRevenue),
      cogs: Math.round(yearCogs),
      grossProfit: Math.round(yearGrossProfit),
      opex: Math.round(yearOpex),
      ebitda: Math.round(yearEbitda),
      netIncome: Math.round(yearNetIncome),
      cashBalance: Math.round(Math.max(0, yearCashBalance))
    });
  }
  
  // Optimistic scenario (25% growth from user's base)
  const optimisticScenario: ScenarioData = {
    name: companyName ? `${companyName} - Growth Scenario` : "Growth Scenario",
    description: "AI feature launch success with market expansion in " + country,
    assumptions: [
      "25% annual revenue growth from AI features",
      "Improved gross margins through automation",
      "Successful market expansion",
      "Economies of scale in operations"
    ],
    projections: []
  };
  
  for (let year = 1; year <= 3; year++) {
    const yearRevenue = year === 1 ? userAnnualRevenue : userAnnualRevenue * Math.pow(1.25, year - 1);

    // Use industry ratios to split expenses between COGS and OpEx
    const yearGrossMargin = Math.min(marginProfile.grossMargin + 0.05 + (year - 1) * 0.02, 0.85);
    const yearGrossProfit = yearRevenue * yearGrossMargin;
    const yearCogs = yearRevenue - yearGrossProfit;
    
    // Opex has economies of scale in the optimistic case (variable rate reduction)
    const yearVariableOpexRate = marginProfile.variableOpexRate * Math.pow(0.95, year - 1);
    const yearOpex = derivedFixedOpex + (yearRevenue * yearVariableOpexRate);
    
    const yearEbitda = yearGrossProfit - yearOpex;
    const yearNetIncome = yearEbitda > 0 ? yearEbitda * (1 - marginProfile.taxRate) : yearEbitda;

    const yearCashBalance = year === 1 ?
      userAvailableCash + yearNetIncome :
      optimisticScenario.projections[year - 2].cashBalance + yearNetIncome;

    optimisticScenario.projections.push({
      year,
      revenue: Math.round(yearRevenue),
      cogs: Math.round(yearCogs),
      grossProfit: Math.round(yearGrossProfit),
      opex: Math.round(yearOpex),
      ebitda: Math.round(yearEbitda),
      netIncome: Math.round(yearNetIncome),
      cashBalance: Math.round(Math.max(0, yearCashBalance))
    });
  }
  
  // Pessimistic scenario (competition pressure from user's base)
  const pessimisticScenario: ScenarioData = {
    name: companyName ? `${companyName} - Conservative Scenario` : "Conservative Scenario",
    description: "Legacy provider competition and market challenges in " + country,
    assumptions: [
      "5% annual revenue decline due to competition",
      "Increased customer acquisition costs",
      "Margin pressure from legacy providers",
      "Higher operational costs"
    ],
    projections: []
  };
  
  for (let year = 1; year <= 3; year++) {
    const yearRevenue = year === 1 ? userAnnualRevenue : userAnnualRevenue * Math.pow(0.95, year - 1);
    
    // Use industry ratios to split expenses
    const yearGrossMargin = Math.max(marginProfile.grossMargin - 0.03 - (year - 1) * 0.01, 0.15);
    const yearGrossProfit = yearRevenue * yearGrossMargin;
    const yearCogs = yearRevenue - yearGrossProfit;

    // Opex has diseconomies of scale in the pessimistic case (variable rate increase)
    const yearVariableOpexRate = marginProfile.variableOpexRate * Math.pow(1.05, year - 1);
    const yearOpex = derivedFixedOpex + (yearRevenue * yearVariableOpexRate);

    const yearEbitda = yearGrossProfit - yearOpex;
    const yearNetIncome = yearEbitda > 0 ? yearEbitda * (1 - marginProfile.taxRate) : yearEbitda;
    
    const yearCashBalance = year === 1 ? 
      userAvailableCash + yearNetIncome : 
      pessimisticScenario.projections[year - 2].cashBalance + yearNetIncome;
    
    pessimisticScenario.projections.push({
      year,
      revenue: Math.round(yearRevenue),
      cogs: Math.round(yearCogs),
      grossProfit: Math.round(yearGrossProfit),
      opex: Math.round(yearOpex),
      ebitda: Math.round(yearEbitda),
      netIncome: Math.round(yearNetIncome),
      cashBalance: Math.round(Math.max(0, yearCashBalance))
    });
  }
  
  return [baseScenario, optimisticScenario, pessimisticScenario];
};