import jsPDF from 'jspdf';
import { ScenarioData, UserInput } from '../types';
import { calculateFinancialRatios } from './ratiosService';
import { calculateValuation } from './valuationService';
import { calculateBreakEven } from './breakEvenService';
import { analyzeBudget } from './budgetService';
import { performSensitivityAnalysis } from './sensitivityService';

export const generatePDFReport = async (
  scenarios: ScenarioData[],
  userInputs: UserInput,
  currentCash: number
) => {
  // Input validation - check for valid numeric values
  console.log('PDF Service - userInputs:', userInputs);
  
  const revenue = (userInputs as any).currentRevenue || (userInputs as any).annualRevenue;
  const expenses = (userInputs as any).currentExpenses || (userInputs as any).monthlyExpenses;
  
  if (!revenue || isNaN(Number(revenue)) || Number(revenue) <= 0) {
    throw new Error(`Invalid annual revenue input: ${revenue}`);
  }
  
  if (!expenses || isNaN(Number(expenses)) || Number(expenses) <= 0) {
    throw new Error(`Invalid monthly expenses input: ${expenses}`);
  }
  
  if (!currentCash || isNaN(currentCash) || currentCash < 0) {
    throw new Error('Invalid cash input.');
  }
  
  // User inputs - handle both UserInput and UserInputs types
  const annualRevenue = Number(revenue);
  const monthlyExpenses = Number(expenses);
  const availableCash = currentCash;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 16
  });
  const baseScenario = scenarios.find(s => s.name.includes('Business Plan')) || scenarios[0];
  
  if (!baseScenario || !baseScenario.projections || baseScenario.projections.length === 0) {
    throw new Error('Invalid scenario data.');
  }
  
  // Calculate metrics
  const ratios = calculateFinancialRatios(baseScenario);
  const valuation = calculateValuation(baseScenario, {});
  const breakEven = calculateBreakEven(baseScenario, { pricePerUnit: 100, variableCostPerUnit: 40 });
  const budgetAnalysis = analyzeBudget(baseScenario, currentCash);
  const sensitivity = performSensitivityAnalysis(baseScenario);
  
  // Currency formatting
  const getCountryConfig = (country: string) => {
    const configs = {
      'USA': { format: (val: number) => `$${val.toLocaleString()}` },
      'India': { format: (val: number) => `₹${val.toLocaleString()}` },
      'UK': { format: (val: number) => `£${val.toLocaleString()}` },
      'Germany': { format: (val: number) => `€${val.toLocaleString()}` },
      'Singapore': { format: (val: number) => `S$${val.toLocaleString()}` },
      'Australia': { format: (val: number) => `A$${val.toLocaleString()}` },
      'Canada': { format: (val: number) => `C$${val.toLocaleString()}` }
    };
    return configs[country as keyof typeof configs] || configs['USA'];
  };
  
  const countryConfig = getCountryConfig(userInputs.country || 'USA');
  const formatCurrency = countryConfig.format;

  
  // Calculate runway
  const monthlyRevenue = annualRevenue / 12;
  const netMonthlyCashFlow = monthlyRevenue - monthlyExpenses;
  let runwayText = netMonthlyCashFlow >= 0 ? 'Cash-flow positive' : `${Math.floor(availableCash / Math.abs(netMonthlyCashFlow))} months`;
  
  // Colors
  const colors = {
    primary: [41, 98, 255] as [number, number, number],
    secondary: [99, 102, 241] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [251, 191, 36] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    accent: [168, 85, 247] as [number, number, number],
    darkGray: [55, 65, 81] as [number, number, number],
    gray: [107, 114, 128] as [number, number, number],
    lightGray: [229, 231, 235] as [number, number, number],
    white: [255, 255, 255] as [number, number, number]
  };
  
  // Helper functions
  const addMetricBox = (label: string, value: string, x: number, y: number, color: [number, number, number]) => {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(x, y, 80, 30, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x + 2, y + 2, 76, 26, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    pdf.text(label, x + 5, y + 12);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    pdf.text(value, x + 5, y + 22);
  };
  
  // PAGE 1: Cover Page
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, 210, 297, 'F');
  
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('AI-POWERED FINANCIAL', 105, 80, { align: 'center' });
  pdf.text('INTELLIGENCE REPORT', 105, 110, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(userInputs.companyName || 'Company Analysis', 105, 140, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text(`${userInputs.industry || 'Technology'} • ${userInputs.country || 'USA'}`, 105, 160, { align: 'center' });
  pdf.text(`${baseScenario.name}`, 105, 180, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 220, { align: 'center' });
  
  // PAGE 2: Executive Summary
  pdf.addPage();
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Executive Summary', 20, 30);
  
  const isCurrentlyProfitable = annualRevenue > (monthlyExpenses * 12);
  const currentEBITDAMargin = ((annualRevenue - (monthlyExpenses * 12)) / annualRevenue) * 100;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
  
  const summaryText = `${userInputs.companyName || 'This company'} is a ${isCurrentlyProfitable ? 'profitable' : 'pre-revenue'} ${userInputs.industry || 'technology'} company in ${userInputs.country || 'USA'} with ${isCurrentlyProfitable ? 'positive' : 'negative'} cash flow and ${budgetAnalysis.adequacy.riskLevel.toLowerCase()} financial risk.`;
  
  const wrappedSummary = pdf.splitTextToSize(summaryText, 170);
  pdf.text(wrappedSummary, 20, 50);
  
  // Key metrics
  addMetricBox('Annual Revenue', formatCurrency(annualRevenue), 20, 80, colors.success);
  addMetricBox('Monthly Expenses', formatCurrency(monthlyExpenses), 110, 80, colors.warning);
  addMetricBox('Available Cash', formatCurrency(availableCash), 20, 120, colors.primary);
  addMetricBox('Cash Runway', runwayText, 110, 120, colors.secondary);
  addMetricBox('EBITDA Margin', `${currentEBITDAMargin.toFixed(1)}%`, 20, 160, colors.accent);
  addMetricBox('Risk Level', budgetAnalysis.adequacy.riskLevel, 110, 160, budgetAnalysis.adequacy.riskLevel === 'Low' ? colors.success : budgetAnalysis.adequacy.riskLevel === 'Medium' ? colors.warning : colors.danger);
  
  // PAGE 3: Financial Projections
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.primary);
  pdf.text('Financial Projections (3 Years)', 20, 30);

  const tableData = [
    { metric: 'Revenue', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.revenue))) },
    { metric: 'COGS', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.cogs))) },
    { metric: 'Gross Profit', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.grossProfit))) },
    { metric: 'OpEx', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.opex))) },
    { metric: 'EBITDA', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.ebitda))) },
    { metric: 'Net Income', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.netIncome))) },
    { metric: 'Cash Balance', projections: scenarios.map(s => s.projections.map(p => formatCurrency(p.cashBalance))) },
  ];

  let tableY = 50;

  // Table Header
  pdf.setFillColor(...colors.lightGray);
  pdf.rect(20, tableY - 8, 170, 12, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.darkGray);
  pdf.text('Metric', 25, tableY);
  pdf.text('Year 1', 80, tableY);
  pdf.text('Year 2', 120, tableY);
  pdf.text('Year 3', 160, tableY);
  tableY += 15;

  // Table Body
  tableData.forEach(({ metric, projections }) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.darkGray);
    pdf.text(metric, 25, tableY);
    
    projections.forEach((scenarioProjections, scenarioIndex) => {
      const scenario = scenarios[scenarioIndex];
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.gray);
      
      const yOffset = tableY + 6 + (scenarioIndex * 6);
      pdf.text(scenario.name, 30, yOffset);
      
      scenarioProjections.forEach((proj, yearIndex) => {
        pdf.text(proj, 80 + (yearIndex * 40), yOffset);
      });
    });
    
    tableY += 8 + (projections.length * 8);
    
    // Separator
    pdf.setDrawColor(...colors.lightGray);
    pdf.line(20, tableY - 2, 190, tableY - 2);
    tableY += 8;
  });

  // PAGE 4: Market Intelligence
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.primary);
  pdf.text('Market Intelligence & Benchmarks', 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.darkGray);
  pdf.text(`Industry: ${userInputs.industry || 'Technology'}`, 20, 50);
  pdf.text(`Market: ${userInputs.country || 'USA'}`, 20, 65);
  
  // Benchmark metrics
  addMetricBox('Gross Margin', `${ratios.profitabilityRatios.grossMargin.toFixed(1)}%`, 20, 80, colors.success);
  addMetricBox('EBITDA Margin', `${ratios.profitabilityRatios.ebitdaMargin.toFixed(1)}%`, 110, 80, colors.primary);
  addMetricBox('Revenue Growth', `${ratios.growthRatios.revenueGrowth.toFixed(1)}%`, 20, 120, colors.accent);
  addMetricBox('Net Margin', `${ratios.profitabilityRatios.netMargin.toFixed(1)}%`, 110, 120, colors.secondary);
  
  // PAGE 5: AI Insights & Risks
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.primary);
  pdf.text('AI Insights & Risk Assessment', 20, 30);
  
  const insights = [
    { type: 'Strength', text: isCurrentlyProfitable ? 'Business is already profitable with positive cash flow' : 'Strong cost discipline with controlled burn rate', color: colors.success },
    { type: 'Risk', text: budgetAnalysis.adequacy.riskLevel === 'High' ? 'Limited runway requires immediate funding or revenue acceleration' : 'Market competition may pressure margins', color: colors.danger },
    { type: 'Opportunity', text: 'AI features can improve customer retention and pricing power', color: colors.primary },
    { type: 'Market Risk', text: `${userInputs.industry || 'Technology'} sector faces increasing competition and margin pressure`, color: colors.warning },
    { type: 'Financial Health', text: `Current EBITDA margin of ${currentEBITDAMargin.toFixed(1)}% ${currentEBITDAMargin > 15 ? 'indicates strong operational efficiency' : 'suggests need for cost optimization'}`, color: currentEBITDAMargin > 15 ? colors.success : colors.warning },
    { type: 'Growth Potential', text: `3-year revenue CAGR of ${ratios.growthRatios.revenueGrowth.toFixed(1)}% ${ratios.growthRatios.revenueGrowth > 20 ? 'shows strong growth trajectory' : 'indicates moderate growth expectations'}`, color: ratios.growthRatios.revenueGrowth > 20 ? colors.success : colors.warning },
    { type: 'Cash Management', text: runwayText === 'Cash-flow positive' ? 'Excellent cash generation provides financial flexibility' : `${runwayText} runway requires careful cash management`, color: runwayText === 'Cash-flow positive' ? colors.success : colors.danger },
    { type: 'Scalability', text: `Gross margin of ${ratios.profitabilityRatios.grossMargin.toFixed(1)}% ${ratios.profitabilityRatios.grossMargin > 60 ? 'indicates highly scalable business model' : 'suggests moderate scalability potential'}`, color: ratios.profitabilityRatios.grossMargin > 60 ? colors.success : colors.warning },
    { type: 'Investment Risk', text: budgetAnalysis.adequacy.isAdequate ? 'Low funding risk with adequate capital reserves' : 'High funding risk - immediate capital injection needed', color: budgetAnalysis.adequacy.isAdequate ? colors.success : colors.danger },
    { type: 'Competitive Position', text: `Net margin of ${ratios.profitabilityRatios.netMargin.toFixed(1)}% ${ratios.profitabilityRatios.netMargin > 10 ? 'demonstrates competitive advantage' : 'indicates need for differentiation strategy'}`, color: ratios.profitabilityRatios.netMargin > 10 ? colors.success : colors.warning }
  ];
  
  let insightY = 50;
  insights.forEach(insight => {
    if (insightY > 250) {
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.primary);
      pdf.text('AI Insights & Risk Assessment (Continued)', 20, 30);
      insightY = 50;
    }
    
    pdf.setFillColor(...insight.color);
    pdf.circle(25, insightY + 5, 3, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...insight.color);
    pdf.text(insight.type, 35, insightY + 3);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.darkGray);
    const wrappedText = pdf.splitTextToSize(insight.text, 150);
    pdf.text(wrappedText, 35, insightY + 15);
    
    insightY += Math.max(25, wrappedText.length * 5 + 20);
  });
  
  // Add AI Risk Score Summary
  if (insightY > 220) {
    pdf.addPage();
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('AI Risk Assessment Summary', 20, 30);
    insightY = 50;
  } else {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('AI Risk Assessment Summary', 20, insightY + 10);
    insightY += 30;
  }
  
  const overallRiskScore = budgetAnalysis.adequacy.riskLevel === 'Low' ? 3 : budgetAnalysis.adequacy.riskLevel === 'Medium' ? 6 : 9;
  const riskColor = overallRiskScore <= 3 ? colors.success : overallRiskScore <= 6 ? colors.warning : colors.danger;
  
  addMetricBox('Overall Risk Score', `${overallRiskScore}/10`, 20, insightY, riskColor);
  addMetricBox('Investment Grade', budgetAnalysis.adequacy.riskLevel === 'Low' ? 'A-Grade' : budgetAnalysis.adequacy.riskLevel === 'Medium' ? 'B-Grade' : 'C-Grade', 110, insightY, riskColor);
  
  // PAGE 6: Scenario Analysis
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Scenario Analysis', 20, 30);
  
  let scenarioY = 50;
  scenarios.forEach((scenario, index) => {
    const scenarioColors = [colors.success, colors.warning, colors.danger];
    const color = scenarioColors[index % 3];
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(20, scenarioY - 5, 170, 8, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${index + 1}. ${scenario.name}`, 25, scenarioY);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
    pdf.text(scenario.description, 25, scenarioY + 15);
    
    const y3 = scenario.projections[2];
    addMetricBox('Y3 Revenue', formatCurrency(y3.revenue), 20, scenarioY + 25, color);
    addMetricBox('Y3 EBITDA', formatCurrency(y3.ebitda), 110, scenarioY + 25, color);
    
    scenarioY += 75;
  });
  
  // PAGE 7: Break-Even & Valuation
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Break-Even Analysis & Valuation', 20, 30);
  
  // Break-even section
  pdf.setFontSize(14);
  pdf.text('Break-Even Analysis', 20, 55);
  
  const isAlreadyProfitable = annualRevenue > (monthlyExpenses * 12);
  if (isAlreadyProfitable) {
    addMetricBox('Status', 'Already Profitable', 20, 70, colors.success);
    addMetricBox('Monthly Profit', formatCurrency(Math.abs(netMonthlyCashFlow)), 110, 70, colors.success);
  } else {
    addMetricBox('Break-Even Revenue', formatCurrency(breakEven.breakEvenRevenue), 20, 70, colors.warning);
    addMetricBox('Months to Break-Even', `${breakEven.monthsToBreakEven}`, 110, 70, colors.warning);
  }
  
  // Valuation section
  pdf.setFontSize(14);
  pdf.text('Company Valuation', 20, 125);
  
  addMetricBox('DCF Valuation', formatCurrency(valuation.dcfValuation), 20, 140, colors.primary);
  addMetricBox('Enterprise Value', formatCurrency(valuation.enterpriseValue), 110, 140, colors.accent);
  
  // PAGE 8: Cost Breakdown Analysis
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Cost Breakdown Analysis', 20, 30);
  
  // Annual cost breakdown
  pdf.setFontSize(14);
  pdf.text('Annual Cost Structure', 20, 55);
  
  const annualCosts = {
    totalExpenses: monthlyExpenses * 12,
    cogs: baseScenario.projections[0].cogs,
    opex: baseScenario.projections[0].opex,
    grossProfit: baseScenario.projections[0].grossProfit
  };
  
  addMetricBox('Total Annual Costs', formatCurrency(annualCosts.totalExpenses), 20, 70, colors.danger);
  addMetricBox('COGS', formatCurrency(annualCosts.cogs), 110, 70, colors.warning);
  addMetricBox('Operating Expenses', formatCurrency(annualCosts.opex), 20, 110, colors.secondary);
  addMetricBox('Gross Profit', formatCurrency(annualCosts.grossProfit), 110, 110, colors.success);
  
  // Cost ratios
  pdf.setFontSize(14);
  pdf.text('Cost Efficiency Ratios', 20, 165);
  
  const cogsRatio = (annualCosts.cogs / annualRevenue * 100).toFixed(1);
  const opexRatio = (annualCosts.opex / annualRevenue * 100).toFixed(1);
  const grossMargin = (annualCosts.grossProfit / annualRevenue * 100).toFixed(1);
  
  addMetricBox('COGS Ratio', `${cogsRatio}%`, 20, 180, colors.warning);
  addMetricBox('OpEx Ratio', `${opexRatio}%`, 110, 180, colors.secondary);
  addMetricBox('Gross Margin', `${grossMargin}%`, 65, 220, colors.success);
  
  // PAGE 9: Cash Flow & Funding
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Cash Flow & Funding Analysis', 20, 30);
  
  // Cash flow metrics
  pdf.setFontSize(14);
  pdf.text('Cash Flow Status', 20, 55);
  
  addMetricBox('Monthly Cash Flow', formatCurrency(netMonthlyCashFlow), 20, 70, netMonthlyCashFlow >= 0 ? colors.success : colors.danger);
  addMetricBox('Burn Rate', formatCurrency(Math.abs(netMonthlyCashFlow)), 110, 70, colors.warning);
  
  // Funding adequacy
  pdf.setFontSize(14);
  pdf.text('Funding Adequacy', 20, 125);
  
  addMetricBox('Risk Level', budgetAnalysis.adequacy.riskLevel, 20, 140, budgetAnalysis.adequacy.riskLevel === 'Low' ? colors.success : budgetAnalysis.adequacy.riskLevel === 'Medium' ? colors.warning : colors.danger);
  addMetricBox('Recommended Budget', formatCurrency(budgetAnalysis.adequacy.recommendedBudget), 110, 140, colors.primary);
  
  if (budgetAnalysis.adequacy.shortfall > 0) {
    addMetricBox('Funding Shortfall', formatCurrency(budgetAnalysis.adequacy.shortfall), 20, 180, colors.danger);
  }
  
  // PAGE 9: Sensitivity Analysis
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.primary);
  pdf.text('Sensitivity Analysis', 20, 30);
  
  let sensitivityY = 50;
  sensitivity.forEach((test, index) => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text(`${test.parameter} (Base: ${test.baseValue}%)`, 20, sensitivityY);
    
    sensitivityY += 15;
    
    test.variations.forEach(variation => {
      const impactColor = variation.impact > 0 ? colors.success : colors.danger;
      pdf.setFillColor(...impactColor);
      pdf.circle(25, sensitivityY - 2, 2, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.darkGray);
      pdf.text(`${variation.change}: ${variation.impact > 0 ? '+' : ''}${variation.impact.toFixed(1)}% impact`, 30, sensitivityY);
      sensitivityY += 12;
    });
    
    sensitivityY += 10;
  });
  
  // PAGE 10: Strategic Recommendations
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.primary);
  pdf.text('Strategic Recommendations', 20, 30);
  
  const recommendations = [
    { 
      text: isCurrentlyProfitable ? 
        `Maintain current profitability with ${currentEBITDAMargin.toFixed(1)}% EBITDA margin` : 
        `Improve margins to achieve profitability (current: ${currentEBITDAMargin.toFixed(1)}%)`, 
      priority: isCurrentlyProfitable ? 'medium' : 'high' 
    },
    { 
      text: netMonthlyCashFlow >= 0 ? 
        'Business is cash-flow positive - focus on growth opportunities' : 
        `Monitor ${runwayText} cash runway closely`, 
      priority: netMonthlyCashFlow >= 0 ? 'low' : 'high' 
    },
    { 
      text: availableCash > (monthlyExpenses * 12) ? 
        'Current funding appears adequate for operations' : 
        'Consider raising additional funding for growth', 
      priority: availableCash > (monthlyExpenses * 6) ? 'low' : 'high' 
    },
    { 
      text: isAlreadyProfitable ? 
        `Already exceeded break-even at ${formatCurrency(annualRevenue)} revenue` : 
        `Target break-even at ${formatCurrency(breakEven.breakEvenRevenue)} revenue milestone`, 
      priority: isAlreadyProfitable ? 'low' : 'medium' 
    }
  ];
  
  let recY = 50;
  recommendations.forEach((rec, index) => {
    const priorityColors = {
      'high': colors.danger,
      'medium': colors.warning,
      'low': colors.success
    };
    
    const priorityColor = priorityColors[rec.priority as keyof typeof priorityColors];
    pdf.setFillColor(...priorityColor);
    pdf.circle(25, recY + 5, 4, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...priorityColor);
    pdf.text(rec.priority.toUpperCase(), 35, recY + 3);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.darkGray);
    const wrappedRec = pdf.splitTextToSize(rec.text, 150);
    pdf.text(wrappedRec, 35, recY + 15);
    
    recY += wrappedRec.length * 5 + 25;
  });
  
  // PAGE 11: Methodology & Disclaimer
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.primary);
  pdf.text('Methodology & Disclaimer', 20, 30);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.darkGray);
  
  const methodology = [
    'Data Sources: User inputs, industry benchmarks, AI analysis',
    'Assumptions: 3-year projection period, standard tax rates',
    'AI Model: Financial pattern recognition and risk assessment',
    'Limitations: Projections are estimates, not guarantees',
    'Purpose: For planning and analysis purposes only'
  ];
  
  let methodY = 50;
  methodology.forEach(item => {
    pdf.text(`• ${item}`, 25, methodY);
    methodY += 15;
  });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...colors.gray);
  pdf.text('This report is generated by AI and should be used for planning purposes only.', 20, 200);
  pdf.text('Consult with financial professionals for investment decisions.', 20, 215);
  
  // Footer
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 270, 210, 27, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('FinVision AI Financial Intelligence Report', 105, 282, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString()} | Confidential`, 105, 290, { align: 'center' });

  // Open PDF in new tab for preview/save
  const companyName = userInputs.companyName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Company';
  const fileName = `FinVision-AI-Report-${companyName}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Create blob and open in new tab
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  // Open PDF in new tab
  const newTab = window.open(url, '_blank');
  if (newTab) {
    newTab.document.title = fileName;
  }
  
  // Clean up URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
};