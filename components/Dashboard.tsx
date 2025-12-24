import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';
import { ScenarioData, BenchmarkData } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Search, HelpCircle, BookOpen, Download, FileText, BarChart3, DollarSign, Target, TrendingUp as Growth } from 'lucide-react';
import { analyzeRatios } from '../services/geminiService';
import { exportToCSV, exportToJSON } from '../services/exportService';
import { generatePDFReport } from '../services/pdfService';
import { calculateFinancialRatios } from '../services/ratiosService';
import { performSensitivityAnalysis } from '../services/sensitivityService';
import { calculateValuation } from '../services/valuationService';
import { calculateBreakEven } from '../services/breakEvenService';
import { calculateFundingRequirements } from '../services/fundingService';
import { analyzeBudget, BudgetBreakdown } from '../services/budgetService';
import { getIndustryBenchmarks, compareToMarket } from '../services/marketBenchmarks';
import { validateFinancialModel } from '../services/validationService';
import { UserInputs } from '../services/scenarioGenerator';
import FinancialChatbot from './FinancialChatbot';

interface Props {
  scenarios: ScenarioData[];
  benchmarkData?: BenchmarkData;
  userInput: UserInputs | null;
}

// Helper component for tooltips
const MetricWithTooltip: React.FC<{ label: string; tooltip: string; className?: string }> = ({ label, tooltip, className = "" }) => (
  <span className={`flex items-center gap-1.5 cursor-help group ${className}`} title={tooltip}>
    {label}
    <HelpCircle size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
  </span>
);

const Dashboard: React.FC<Props> = ({ scenarios, benchmarkData, userInput }) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('annual');
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [showBreakEven, setShowBreakEven] = useState(false);
  const [showFunding, setShowFunding] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(2000000); // Default ₹20L budget
  const [selectedIndustry, setSelectedIndustry] = useState('SaaS');
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (userInput?.currentCash) {
      setBudgetAmount(userInput.currentCash);
    }
  }, [userInput]);
  
  // Safety check for scenarios
  if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p>No scenarios available to display</p>
        </div>
      </div>
    );
  }
  
  const activeScenario = scenarios[activeScenarioIdx] || scenarios[0];

  // Dynamic currency formatter based on user's locale choice
  const formatCurrency = (val: number) => {
    try {
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: userInput?.currency || 'INR', 
        maximumFractionDigits: 0,
        notation: "compact" 
      }).format(val);
    } catch (e) {
      // Fallback if locale/currency combo is invalid
      return `$${(val/1000).toFixed(1)}k`;
    }
  };

  // Quick Ratio Analysis Effect
  useEffect(() => {
    if (!activeScenario || !activeScenario.projections) return;
    
    let isMounted = true;
    const fetchAnalysis = async () => {
        setAiAnalysis("Analyzing scenario metrics...");
        const text = await analyzeRatios(activeScenario, userInput?.currency || 'INR');
        if(isMounted) setAiAnalysis(text);
    }
    fetchAnalysis();
    return () => { isMounted = false; };
  }, [activeScenarioIdx, scenarios, userInput, activeScenario]);

  const kpis = useMemo(() => {
    if (!activeScenario?.projections || activeScenario.projections.length === 0) {
      return [];
    }
    
    const lastYear = activeScenario.projections[activeScenario.projections.length - 1];
    const firstYear = activeScenario.projections[0];
    const cagr = ((Math.pow(lastYear.revenue / firstYear.revenue, 1/3) - 1) * 100).toFixed(1);
    const netMargin = ((lastYear.netIncome / lastYear.revenue) * 100).toFixed(1);
    
    return [
      { 
        label: "Year 3 Revenue", 
        fullForm: "Total projected income in the final year",
        value: formatCurrency(lastYear.revenue), 
        icon: TrendingUp, 
        color: "text-emerald-600", 
        bg: "bg-emerald-100" 
      },
      { 
        label: "3-Year CAGR", 
        fullForm: "Compound Annual Growth Rate - The smooth average growth rate per year",
        value: `${cagr}%`, 
        icon: BarChart, 
        color: "text-blue-600", 
        bg: "bg-blue-100" 
      },
      { 
        label: "Net Margin (Y3)", 
        fullForm: "Net Profit Margin - Percentage of revenue kept as profit",
        value: `${netMargin}%`, 
        icon: CheckCircle2, 
        color: "text-indigo-600", 
        bg: "bg-indigo-100" 
      },
      { 
        label: "Cash Position (Y3)", 
        fullForm: "Total cash in bank estimated at the end of Year 3",
        value: formatCurrency(lastYear.cashBalance), 
        icon: TrendingUp, 
        color: "text-amber-600", 
        bg: "bg-amber-100" 
      }
    ];
  }, [activeScenario, userInput]); // Re-calc if currency/locale changes

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Benchmark Banner */}
      {benchmarkData && benchmarkData.sources.length > 0 && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex gap-3">
            <div className="p-2 bg-slate-800 rounded-lg shrink-0">
              <Search className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Market Grounding: {benchmarkData.industry}
                <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full text-white">AI Knowledge</span>
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Data sources: {benchmarkData.sources.slice(0, 2).map(s => s.title).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-200 p-1 rounded-lg">
          {scenarios.map((s, idx) => {
            console.log(`Scenario ${idx}: ${s.name}, Active: ${activeScenarioIdx === idx}`);
            return (
              <button
                key={s.name}
                onClick={() => {
                  console.log(`Switching to scenario ${idx}: ${s.name}`);
                  setActiveScenarioIdx(idx);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeScenarioIdx === idx 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => exportToCSV(scenarios)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => exportToJSON(scenarios, { currency: userInput?.currency || 'INR', exportDate: new Date().toISOString() })}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              JSON
            </button>
            <button
              onClick={async () => {
                if (userInput) {
                  try {
                    // Convert UserInputs to UserInput format for PDF service
                    const userInputsForPDF = {
                      companyName: userInput.companyName,
                      currency: userInput.currency || 'INR',
                      currentRevenue: userInput.currentRevenue,
                      currentExpenses: userInput.currentExpenses,
                      currentCash: userInput.currentCash,
                      industry: userInput.industry,
                      country: userInput.country,
                      businessContext: userInput.businessContext
                    };
                    await generatePDFReport(scenarios, userInputsForPDF, userInput.currentCash);
                  } catch (e) {
                    console.error("Error generating PDF:", e);
                    alert(`PDF generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
                  }
                } else {
                  alert("Cannot generate PDF: user input is not available.");
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              PDF
            </button>
          </div>
          <div className="text-sm text-slate-500 italic">
            AI Model: Nova 2 Lite (OpenRouter)
          </div>
        </div>
      </div>

      {/* Industry Selection & Validation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Market Intelligence</h3>
              <p className="text-sm text-blue-700">Industry benchmarks and validation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowValidation(!showValidation)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <CheckCircle2 size={16} />
              {showValidation ? 'Hide' : 'Show'} Validation
            </button>
          </div>
        </div>
        
        {/* Market Comparison with Scenario Context */}
        {(() => {
          const marketComparison = compareToMarket(activeScenario, selectedIndustry);
          const benchmarks = getIndustryBenchmarks(selectedIndustry);
          const scenarioName = activeScenario.name;
          const scenarioDesc = activeScenario.description;
          
          return (
            <div className="mt-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-1">📊 Analyzing: {scenarioName}</h4>
                <p className="text-sm text-blue-700 mb-2">{scenarioDesc}</p>
                <div className="text-xs text-blue-600">
                  <strong>Key Assumptions:</strong> {activeScenario.assumptions.join(' • ')}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">Gross Margin</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      marketComparison.grossMargin.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                      marketComparison.grossMargin.status === 'Above Average' ? 'bg-blue-100 text-blue-800' :
                      marketComparison.grossMargin.status === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {marketComparison.grossMargin.status}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">{marketComparison.grossMargin.value.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Industry: {benchmarks.metrics.grossMargin.avg}%</div>
                  <div className="text-xs text-blue-600 mt-1">{marketComparison.grossMargin.context}</div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">EBITDA Margin</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      marketComparison.ebitdaMargin.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                      marketComparison.ebitdaMargin.status === 'Above Average' ? 'bg-blue-100 text-blue-800' :
                      marketComparison.ebitdaMargin.status === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {marketComparison.ebitdaMargin.status}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">{marketComparison.ebitdaMargin.value.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Industry: {benchmarks.metrics.ebitdaMargin.avg}%</div>
                  <div className="text-xs text-blue-600 mt-1">{marketComparison.ebitdaMargin.context}</div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">Revenue Growth</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      marketComparison.revenueGrowth.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                      marketComparison.revenueGrowth.status === 'Above Average' ? 'bg-blue-100 text-blue-800' :
                      marketComparison.revenueGrowth.status === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {marketComparison.revenueGrowth.status}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">{marketComparison.revenueGrowth.value.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Industry: {benchmarks.metrics.revenueGrowth.avg}%</div>
                  <div className="text-xs text-blue-600 mt-1">{marketComparison.revenueGrowth.context}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Model Validation */}
      {showValidation && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Financial Model Validation</h3>
          {(() => {
            const validation = validateFinancialModel(activeScenario, selectedIndustry);
            const scenarioName = activeScenario.name;
            const scenarioType = scenarioName.toLowerCase().includes('optimistic') ? 'Optimistic' :
                               scenarioName.toLowerCase().includes('pessimistic') ? 'Pessimistic' : 'Base Case';
            
            return (
              <div className="space-y-4">
                {/* Scenario Context Header */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2">🎯 Validation for {scenarioName}</h4>
                  <p className="text-sm text-indigo-700 mb-2">{activeScenario.description}</p>
                  <div className="text-xs text-indigo-600">
                    <strong>Scenario Type:</strong> {scenarioType} | 
                    <strong>Validation Context:</strong> {scenarioType === 'Optimistic' ? 'Higher growth expectations' : 
                                                         scenarioType === 'Pessimistic' ? 'Economic downturn resilience' : 
                                                         'Industry standard benchmarks'}
                  </div>
                </div>
                {/* Reliability Score */}
                <div className={`p-4 rounded-lg border-2 ${
                  validation.reliability === 'High' ? 'bg-green-50 border-green-200' :
                  validation.reliability === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {validation.reliability === 'High' ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : validation.reliability === 'Medium' ? (
                      <AlertCircle size={20} className="text-yellow-600" />
                    ) : (
                      <AlertCircle size={20} className="text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      validation.reliability === 'High' ? 'text-green-800' :
                      validation.reliability === 'Medium' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      Model Reliability: {validation.reliability}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {validation.reliability === 'High' ? 'Your financial model meets industry standards and appears reliable.' :
                     validation.reliability === 'Medium' ? 'Your model has some areas for improvement but is generally sound.' :
                     'Your model has significant issues that should be addressed.'}
                  </p>
                </div>
                
                {/* Errors */}
                {validation.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">🚨 Critical Errors</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Recommendations */}
                {validation.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Recommendations</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {validation.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Cost Breakdown Analysis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Cost Breakdown Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {(() => {
            const annualCosts = {
              totalExpenses: (userInput?.currentExpenses || 0) * 12,
              cogs: activeScenario.projections[0].cogs,
              opex: activeScenario.projections[0].opex,
              grossProfit: activeScenario.projections[0].grossProfit
            };
            
            return [
              { label: 'Total Annual Costs', value: formatCurrency(annualCosts.totalExpenses), color: 'text-red-600' },
              { label: 'COGS', value: formatCurrency(annualCosts.cogs), color: 'text-orange-600' },
              { label: 'Operating Expenses', value: formatCurrency(annualCosts.opex), color: 'text-blue-600' },
              { label: 'Gross Profit', value: formatCurrency(annualCosts.grossProfit), color: 'text-green-600' }
            ].map((item, index) => (
              <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ));
          })()}
        </div>
        
        <h4 className="text-md font-semibold text-slate-700 mb-3">Cost Efficiency Ratios</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const revenue = userInput?.currentRevenue || 1;
            const annualCosts = {
              cogs: activeScenario.projections[0].cogs,
              opex: activeScenario.projections[0].opex,
              grossProfit: activeScenario.projections[0].grossProfit
            };
            
            const cogsRatio = (annualCosts.cogs / revenue * 100).toFixed(1);
            const opexRatio = (annualCosts.opex / revenue * 100).toFixed(1);
            const grossMargin = (annualCosts.grossProfit / revenue * 100).toFixed(1);
            
            return [
              { label: 'COGS Ratio', value: `${cogsRatio}%`, color: 'text-orange-600' },
              { label: 'OpEx Ratio', value: `${opexRatio}%`, color: 'text-blue-600' },
              { label: 'Gross Margin', value: `${grossMargin}%`, color: 'text-green-600' }
            ].map((item, index) => (
              <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Advanced Analytics Toggles */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowSensitivity(!showSensitivity)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <BarChart3 size={16} />
          {showSensitivity ? 'Hide' : 'Show'} Sensitivity
        </button>
        <button
          onClick={() => setShowValuation(!showValuation)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <DollarSign size={16} />
          {showValuation ? 'Hide' : 'Show'} Valuation
        </button>
        <button
          onClick={() => setShowBreakEven(!showBreakEven)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          <Target size={16} />
          {showBreakEven ? 'Hide' : 'Show'} Break-Even
        </button>
        <button
          onClick={() => setShowFunding(!showFunding)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Growth size={16} />
          {showFunding ? 'Hide' : 'Show'} Funding
        </button>
        <button
          onClick={() => setShowBudget(!showBudget)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          <DollarSign size={16} />
          {showBudget ? 'Hide' : 'Show'} Cash Flow
        </button>
      </div>

      {/* Sensitivity Analysis */}
      {showSensitivity && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sensitivity Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performSensitivityAnalysis(activeScenario).map((test, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-700 mb-3">{test.parameter}</h4>
                <p className="text-sm text-slate-600 mb-3">Base: {test.baseValue}%</p>
                <div className="space-y-2">
                  {test.variations.map((variation, vIndex) => (
                    <div key={vIndex} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{variation.change}</span>
                      <span className={`font-medium ${
                        variation.impact > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {variation.impact > 0 ? '+' : ''}{variation.impact.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Valuation Analysis */}
      {showValuation && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Company Valuation Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const benchmarks = getIndustryBenchmarks(selectedIndustry);
              const valuation = calculateValuation(activeScenario, { 
                wacc: 0.12, 
                terminalGrowthRate: 0.025,
                industryMultiples: {
                  revenue: benchmarks.valuation.revenueMultiple.avg,
                  ebitda: benchmarks.valuation.ebitdaMultiple.avg,
                  pe: 25
                }
              });
              return [
                {
                  title: 'DCF Valuation',
                  value: formatCurrency(valuation.dcfValuation),
                  subtitle: `WACC: ${(valuation.wacc * 100).toFixed(1)}%`,
                  color: 'text-green-600',
                  benchmark: 'Market-based discount rate'
                },
                {
                  title: 'Revenue Multiple',
                  value: formatCurrency(valuation.multipleValuation.revenueMultiple),
                  subtitle: `${benchmarks.valuation.revenueMultiple.avg}x Revenue Multiple`,
                  color: 'text-blue-600',
                  benchmark: `Industry range: ${benchmarks.valuation.revenueMultiple.min}-${benchmarks.valuation.revenueMultiple.max}x`
                },
                {
                  title: 'EBITDA Multiple',
                  value: formatCurrency(valuation.multipleValuation.ebitdaMultiple),
                  subtitle: `${benchmarks.valuation.ebitdaMultiple.avg}x EBITDA Multiple`,
                  color: 'text-purple-600',
                  benchmark: `Industry range: ${benchmarks.valuation.ebitdaMultiple.min}-${benchmarks.valuation.ebitdaMultiple.max}x`
                }
              ].map((item, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold text-slate-700 mb-2">{item.title}</h4>
                  <p className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</p>
                  <p className="text-sm text-slate-600 mb-1">{item.subtitle}</p>
                  <p className="text-xs text-slate-500">{item.benchmark}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Break-Even Analysis */}
      {showBreakEven && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Break-Even Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const breakEven = calculateBreakEven(activeScenario, { pricePerUnit: 100, variableCostPerUnit: 40 });
              return [
                { label: 'Break-Even Revenue', value: formatCurrency(breakEven.breakEvenRevenue), color: 'text-orange-600' },
                { label: 'Margin of Safety', value: `${breakEven.marginOfSafety.toFixed(1)}%`, color: 'text-green-600' },
                { label: 'Monthly Burn Rate', value: formatCurrency(breakEven.burnRate), color: 'text-red-600' },
                { label: 'Cash Runway', value: `${Math.min(breakEven.runway.months, 99).toFixed(0)} months`, color: 'text-blue-600' }
              ].map((item, index) => (
                <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Budget Analysis */}
      {showBudget && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Cash Flow Analysis & Allocation</h3>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Available Cash/Budget:</label>
              <input
                type="number"
                value={userInput?.currentCash || budgetAmount}
                onChange={(e) => setBudgetAmount(Number(e.target.value))}
                className="px-3 py-1 border border-slate-300 rounded-md text-sm w-32"
                placeholder="Enter cash amount"
                disabled
              />
              <span className="text-xs text-slate-500">Cash you have for operations (separate from revenue)</span>
            </div>
          </div>
          
          {(() => {
            const budgetAnalysis = analyzeBudget(activeScenario, userInput?.currentCash || budgetAmount);
            const scenarioName = activeScenario.name;
            const scenarioType = scenarioName.toLowerCase().includes('optimistic') ? 'Growth-Focused' :
                               scenarioName.toLowerCase().includes('pessimistic') ? 'Conservative' : 'Balanced';
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scenario Context Header */}
                <div className="md:col-span-2 bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">💰 Cash Analysis for {scenarioName}</h4>
                  <p className="text-sm text-indigo-700 mb-2">{activeScenario.description}</p>
                  <div className="text-xs text-indigo-600">
                    <strong>Allocation Strategy:</strong> {scenarioType} | 
                    <strong>Context:</strong> {scenarioType === 'Growth-Focused' ? 'Higher marketing & development allocation' : 
                                              scenarioType === 'Conservative' ? 'Focus on operations & reserves' : 
                                              'Standard industry allocation'}
                  </div>
                </div>
                {/* Budget Allocation */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Scenario-Based Allocation Strategy</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <span className="font-medium text-blue-800">Operations</span>
                        <p className="text-xs text-blue-600">{budgetAnalysis.allocation.operations.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-800">{formatCurrency(budgetAnalysis.allocation.operations.amount)}</div>
                        <div className="text-xs text-blue-600">{budgetAnalysis.allocation.operations.percentage}%</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <span className="font-medium text-green-800">Marketing</span>
                        <p className="text-xs text-green-600">{budgetAnalysis.allocation.marketing.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-800">{formatCurrency(budgetAnalysis.allocation.marketing.amount)}</div>
                        <div className="text-xs text-green-600">{budgetAnalysis.allocation.marketing.percentage}%</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <span className="font-medium text-purple-800">Development</span>
                        <p className="text-xs text-purple-600">{budgetAnalysis.allocation.development.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-800">{formatCurrency(budgetAnalysis.allocation.development.amount)}</div>
                        <div className="text-xs text-purple-600">{budgetAnalysis.allocation.development.percentage}%</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <span className="font-medium text-orange-800">Reserves</span>
                        <p className="text-xs text-orange-600">{budgetAnalysis.allocation.reserves.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-800">{formatCurrency(budgetAnalysis.allocation.reserves.amount)}</div>
                        <div className="text-xs text-orange-600">{budgetAnalysis.allocation.reserves.percentage}%</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Budget Adequacy */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Funding Adequacy Assessment</h4>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      budgetAnalysis.adequacy.isAdequate 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {budgetAnalysis.adequacy.isAdequate ? (
                          <CheckCircle2 size={20} className="text-green-600" />
                        ) : (
                          <AlertCircle size={20} className="text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          budgetAnalysis.adequacy.isAdequate ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {budgetAnalysis.adequacy.isAdequate ? 'Cash Adequate' : 'Cash Insufficient'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Available Cash:</span>
                          <span className="font-medium">{formatCurrency(userInput?.currentCash || budgetAnalysis.totalBudget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cash Needed:</span>
                          <span className="font-medium">{formatCurrency(budgetAnalysis.adequacy.recommendedBudget)}</span>
                        </div>
                        {budgetAnalysis.adequacy.shortfall > 0 && (
                          <div className="flex justify-between">
                            <span className="text-red-600">Additional Funding Needed:</span>
                            <span className="font-bold text-red-600">{formatCurrency(budgetAnalysis.adequacy.shortfall)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-600">Risk Level:</span>
                          <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                            budgetAnalysis.adequacy.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                            budgetAnalysis.adequacy.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {budgetAnalysis.adequacy.riskLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Monthly Burn Rate</p>
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(budgetAnalysis.monthlyBurn)}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Runway</p>
                        <p className="text-lg font-bold text-slate-800">{budgetAnalysis.runwayMonths.toFixed(1)} months</p>
                      </div>
                    </div>
                    
                    {budgetAnalysis.adequacy.shortfall > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="font-semibold text-yellow-800 mb-2">💡 Funding Recommendations</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Consider raising {formatCurrency(budgetAnalysis.adequacy.shortfall)} in additional funding</li>
                          <li>• Focus on revenue acceleration to improve cash flow</li>
                          <li>• Review and optimize operational expenses</li>
                          <li>• Maintain {formatCurrency(budgetAnalysis.allocation.reserves.amount)} as emergency reserves</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Funding Requirements */}
      {showFunding && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Funding Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Investment Metrics</h4>
              {(() => {
                const funding = calculateFundingRequirements(activeScenario, { currentValuation: 5000000 });
                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Funding Needed:</span>
                      <span className="font-semibold">{formatCurrency(funding.totalFundingNeeded)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ROI Projection:</span>
                      <span className="font-semibold text-green-600">{funding.roiProjection.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payback Period:</span>
                      <span className="font-semibold">{funding.paybackPeriod} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">IRR:</span>
                      <span className="font-semibold text-blue-600">{funding.irr.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Recommended Funding Rounds</h4>
              {(() => {
                const funding = calculateFundingRequirements(activeScenario, { currentValuation: 5000000 });
                return funding.recommendedFundingRounds.length > 0 ? (
                  <div className="space-y-2">
                    {funding.recommendedFundingRounds.map((round, index) => (
                      <div key={index} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{round.round}</span>
                          <span className="text-sm text-slate-600">{round.timing}</span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          Amount: {formatCurrency(round.amount)} | Dilution: {round.dilution.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 italic">No external funding required based on projections</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Financial Ratios Dashboard */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Key Financial Ratios (Year 3)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(() => {
            const ratios = calculateFinancialRatios(activeScenario);
            return [
              { label: 'Gross Margin', value: `${ratios.profitabilityRatios.grossMargin.toFixed(1)}%`, color: 'text-green-600' },
              { label: 'EBITDA Margin', value: `${ratios.profitabilityRatios.ebitdaMargin.toFixed(1)}%`, color: 'text-blue-600' },
              { label: 'Net Margin', value: `${ratios.profitabilityRatios.netMargin.toFixed(1)}%`, color: 'text-purple-600' },
              { label: 'Revenue CAGR', value: `${ratios.growthRatios.revenueGrowth.toFixed(1)}%`, color: 'text-indigo-600' }
            ].map((ratio, index) => (
              <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">{ratio.label}</p>
                <p className={`text-xl font-bold ${ratio.color}`}>{ratio.value}</p>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Narrative & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Narrative */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{activeScenario.name} Scenario</h3>
          <p className="text-slate-600 mb-4">{activeScenario.description}</p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Key Assumptions</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              {activeScenario.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          {/* AI Risk/Strength Analysis */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg shadow-md">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">AI Risk & Strength Analysis</h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">AI Insights</span>
              </div>
            </div>
            
            {aiAnalysis ? (
              <div className="space-y-4">
                {aiAnalysis
                  .replace(/[^\w\s.,!?()-]/g, '')
                  .split(/[.!?]+/)
                  .filter(point => point.trim().length > 10)
                  .map((point, index) => {
                    const trimmedPoint = point.trim();
                    const lowerPoint = trimmedPoint.toLowerCase();
                    const isRisk = lowerPoint.includes('risk') || lowerPoint.includes('weakness') || lowerPoint.includes('concern') || lowerPoint.includes('challenge');
                    const isStrength = lowerPoint.includes('strength') || lowerPoint.includes('advantage') || lowerPoint.includes('opportunity') || lowerPoint.includes('positive');

                    if (isRisk) {
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                          <div className="p-2 bg-red-100 rounded-full">
                            <TrendingDown size={16} className="text-red-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-red-800 mb-1">Risk Factor</h5>
                            <p className="text-red-700 text-sm leading-relaxed">{trimmedPoint}</p>
                          </div>
                        </div>
                      );
                    } else if (isStrength) {
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                          <div className="p-2 bg-green-100 rounded-full">
                            <TrendingUp size={16} className="text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-green-800 mb-1">Strength</h5>
                            <p className="text-green-700 text-sm leading-relaxed">{trimmedPoint}</p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                          </div>
                          <div>
                            <h5 className="font-semibold text-blue-800 mb-1">Analysis</h5>
                            <p className="text-blue-700 text-sm leading-relaxed">{trimmedPoint}</p>
                          </div>
                        </div>
                      );
                    }
                  })}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
                  <p className="text-slate-600 font-medium">Analyzing scenario metrics...</p>
                  <p className="text-slate-500 text-sm mt-1">This may take a few moments</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: KPIs */}
        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <MetricWithTooltip label={kpi.label} tooltip={kpi.fullForm} className="text-sm text-slate-500 mb-1" />
                <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* P&L Composition */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h4 className="text-lg font-bold text-slate-800 mb-6">
            {viewMode === 'annual' ? 'Annual P&L Trajectory' : 'Quarterly Breakdown (Year 1)'}
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={viewMode === 'annual' ? activeScenario.projections : 
              Array.from({length: 4}, (_, i) => {
                const yearData = activeScenario.projections[0];
                return {
                  year: `Q${i+1}`,
                  revenue: yearData.revenue / 4,
                  ebitda: yearData.ebitda / 4,
                  netIncome: yearData.netIncome / 4
                };
              })
            }>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(val) => formatCurrency(val)} width={80} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#10b981" strokeWidth={3} />
              <Line type="monotone" dataKey="netIncome" name="Net Income" stroke="#6366f1" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Stack */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Cash Position & OpEx</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activeScenario.projections}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(val) => formatCurrency(val)} width={80} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="cashBalance" name="Cash Balance" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCash)" />
              <Area type="monotone" dataKey="opex" name="OpEx" stroke="#ef4444" fill="none" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

       {/* Detailed Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-700">Detailed Projections</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Metric</th>
                {activeScenario.projections.map(p => (
                  <th key={p.year} className="px-6 py-3 text-right">Year {p.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">Revenue</td>
                {activeScenario.projections.map(p => <td key={p.year} className="px-6 py-3 text-right text-slate-700">{formatCurrency(p.revenue)}</td>)}
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">
                  <MetricWithTooltip label="COGS" tooltip="Cost of Goods Sold - Direct costs attributable to the production of goods/services." />
                </td>
                {activeScenario.projections.map(p => <td key={p.year} className="px-6 py-3 text-right text-red-600">({formatCurrency(p.cogs)})</td>)}
              </tr>
              <tr className="hover:bg-slate-50 bg-slate-50/50">
                <td className="px-6 py-3 font-bold text-slate-900">
                   <MetricWithTooltip label="Gross Profit" tooltip="Revenue minus Cost of Goods Sold. Represents core efficiency." />
                </td>
                {activeScenario.projections.map(p => <td key={p.year} className="px-6 py-3 text-right font-bold text-slate-900">{formatCurrency(p.grossProfit)}</td>)}
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">
                  <MetricWithTooltip label="OpEx" tooltip="Operating Expenses - Day-to-day costs like rent, marketing, and salaries." />
                </td>
                {activeScenario.projections.map(p => <td key={p.year} className="px-6 py-3 text-right text-red-600">({formatCurrency(p.opex)})</td>)}
              </tr>
              <tr className="hover:bg-slate-50 bg-blue-50/30">
                <td className="px-6 py-3 font-bold text-blue-900">
                   <MetricWithTooltip label="EBITDA" tooltip="Earnings Before Interest, Taxes, Depreciation, and Amortization. A proxy for operational cash flow." />
                </td>
                {activeScenario.projections.map(p => <td key={p.year} className="px-6 py-3 text-right font-bold text-blue-700">{formatCurrency(p.ebitda)}</td>)}
              </tr>
               <tr className="hover:bg-slate-50 bg-indigo-50/30">
                <td className="px-6 py-3 font-bold text-indigo-900">
                   <MetricWithTooltip label="Net Income" tooltip="Also known as Net Profit. The bottom line after all costs, taxes, and interest." />
                </td>
                {activeScenario.projections.map(p => <td key={p.year} className="px-6 py-3 text-right font-bold text-indigo-700">{formatCurrency(p.netIncome)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Glossary Section */}
      <div className="bg-slate-100 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-800">
          <BookOpen size={20} className="text-blue-600" />
          <h3 className="font-bold text-lg">Financial Glossary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <span className="font-bold text-slate-900">CAGR (Compound Annual Growth Rate):</span> 
            <p className="mt-1">The mean annual growth rate of your revenue over the specified time period (3 years).</p>
          </div>
          <div>
            <span className="font-bold text-slate-900">EBITDA:</span> 
            <p className="mt-1">Earnings Before Interest, Taxes, Depreciation, and Amortization. Shows how much profit you make from pure operations.</p>
          </div>
          <div>
            <span className="font-bold text-slate-900">COGS (Cost of Goods Sold):</span> 
            <p className="mt-1">Direct costs to produce your product (e.g., hosting costs, raw materials). Higher COGS means lower Gross Margin.</p>
          </div>
          <div>
            <span className="font-bold text-slate-900">OpEx (Operating Expenses):</span> 
            <p className="mt-1">Indirect costs to run the business (e.g., rent, sales & marketing, legal, admin salaries).</p>
          </div>
          <div>
            <span className="font-bold text-slate-900">Net Income:</span> 
            <p className="mt-1">The actual profit remaining after EVERYTHING is paid (including taxes). This helps determine your cash balance.</p>
          </div>
        </div>
      </div>

      {/* Financial Chatbot */}
      <FinancialChatbot
        financialData={{
          revenue: userInput?.currentRevenue || 0,
          expenses: userInput?.currentExpenses || 0,
          cash: userInput?.currentCash || 0,
          profitability: (userInput?.currentRevenue || 0) > ((userInput?.currentExpenses || 0) * 12),
          runway: (userInput?.currentRevenue || 0) > ((userInput?.currentExpenses || 0) * 12) ? 'Cash-flow positive' : `${Math.floor((userInput?.currentCash || 0) / Math.abs(((userInput?.currentRevenue || 0) / 12) - (userInput?.currentExpenses || 0)))} months`,
          ebitdaMargin: (((userInput?.currentRevenue || 0) - ((userInput?.currentExpenses || 0) * 12)) / (userInput?.currentRevenue || 1)) * 100,
          riskLevel: 'Medium'
        }}
      />

    </div>
  );
};

export default Dashboard;