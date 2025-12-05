import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';
import { ScenarioData, BenchmarkData } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Search, HelpCircle, BookOpen } from 'lucide-react';
import { analyzeRatios } from '../services/geminiService';

interface Props {
  scenarios: ScenarioData[];
  benchmarkData?: BenchmarkData;
  currency: string;
  locale: string;
}

// Helper component for tooltips
const MetricWithTooltip: React.FC<{ label: string; tooltip: string; className?: string }> = ({ label, tooltip, className = "" }) => (
  <span className={`flex items-center gap-1.5 cursor-help group ${className}`} title={tooltip}>
    {label}
    <HelpCircle size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
  </span>
);

const Dashboard: React.FC<Props> = ({ scenarios, benchmarkData, currency, locale }) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const activeScenario = scenarios[activeScenarioIdx];

  // Dynamic currency formatter based on user's locale choice
  const formatCurrency = (val: number) => {
    try {
      return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency, 
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
    let isMounted = true;
    const fetchAnalysis = async () => {
        setAiAnalysis("Analyzing scenario metrics...");
        const text = await analyzeRatios(activeScenario, currency);
        if(isMounted) setAiAnalysis(text);
    }
    fetchAnalysis();
    return () => { isMounted = false; };
  }, [activeScenarioIdx, scenarios, currency]);

  const kpis = useMemo(() => {
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
  }, [activeScenario, currency, locale]); // Re-calc if currency/locale changes

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
          {scenarios.map((s, idx) => (
            <button
              key={s.name}
              onClick={() => setActiveScenarioIdx(idx)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeScenarioIdx === idx 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="text-sm text-slate-500 italic">
          AI Model: Nova 2 Lite (OpenRouter)
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
          <div className="mt-6 pt-6 border-t border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full shadow-md animate-pulse">
                 <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    AI Risk/Strength Analysis
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">AI Insights</span>
                  </h4>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {aiAnalysis ? (
                      <div className="space-y-3">
                        {aiAnalysis
                          .replace(/[^\w\s.,!?()-]/g, '') // Remove special characters
                          .split(/[.!?]+/)
                          .filter(point => point.trim().length > 0)
                          .map((point, index) => {
                            const trimmedPoint = point.trim();
                            const lowerPoint = trimmedPoint.toLowerCase();
                            const isRisk = lowerPoint.includes('risk') || lowerPoint.includes('weakness') || lowerPoint.includes('concern');
                            const isStrength = lowerPoint.includes('strength') || lowerPoint.includes('advantage') || lowerPoint.includes('opportunity');

                            if (isRisk) {
                              return (
                                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-md">
                                  <TrendingDown size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                  <span className="font-medium text-red-800">{trimmedPoint}</span>
                                </div>
                              );
                            } else if (isStrength) {
                              return (
                                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-md">
                                  <TrendingUp size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="font-medium text-green-800">{trimmedPoint}</span>
                                </div>
                              );
                            } else {
                              return (
                                <div key={index} className="flex items-start gap-3 p-2">
                                  <div className="w-4 h-4 bg-purple-200 rounded-full mt-0.5 flex-shrink-0"></div>
                                  <span>{trimmedPoint}</span>
                                </div>
                              );
                            }
                          })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        Analyzing scenario metrics...
                      </div>
                    )}
                  </div>
              </div>
            </div>
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
          <h4 className="text-lg font-bold text-slate-800 mb-6">Profit & Loss Trajectory</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={activeScenario.projections}>
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

    </div>
  );
};

export default Dashboard;