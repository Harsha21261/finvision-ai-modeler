import React, { useState } from 'react';
import { LayoutDashboard, ShieldCheck, Sparkles, TrendingUp, History } from 'lucide-react';
import InputForm from './components/InputForm';
import Dashboard from './components/Dashboard';
import { UserInput, ScenarioData, BenchmarkData, LoadingState } from './types';
import { generateFinancialModel, fetchIndustryBenchmarks } from './services/geminiService';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [scenarios, setScenarios] = useState<ScenarioData[] | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // State for currency formatting in dashboard
  const [displayCurrency, setDisplayCurrency] = useState<{code: string, locale: string}>({ code: 'USD', locale: 'en-US'});

  const handleGenerate = async (input: UserInput) => {
    setLoadingState(LoadingState.BENCHMARKING);
    setErrorMsg(null);
    setScenarios(null);
    setDisplayCurrency({ code: input.currency, locale: input.locale });

    try {
      // Step 1: Get Real-world Benchmarks
      let benchmarksStr = "Use general market knowledge.";
      try {
        const benchmarks = await fetchIndustryBenchmarks(input.industry, input.country);
        setBenchmarkData(benchmarks);
        benchmarksStr = `Revenue Growth Avg: ${benchmarks.avgGrowthRate}, EBITDA Margin Avg: ${benchmarks.avgEbitdaMargin}.`;
      } catch (err) {
        console.warn("Benchmark fetch failed, proceeding with general knowledge");
      }

      // Step 2: Generate Complex Scenarios
      setLoadingState(LoadingState.MODELING);
      const generatedScenarios = await generateFinancialModel(input, benchmarksStr);
      setScenarios(generatedScenarios);
      
      setLoadingState(LoadingState.COMPLETE);
    } catch (e: any) {
      console.error(e);
      setLoadingState(LoadingState.ERROR);
      setErrorMsg("Failed to generate model. Please check your API Key and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
              P - financial model AI
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
              <ShieldCheck size={16} /> Risk Analysis
            </span>
            <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
              <TrendingUp size={16} /> Forecasting
            </span>
            <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
              <History size={16} /> Scenarios
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Section */}
        {!scenarios && loadingState === LoadingState.IDLE && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              AI-Powered Financial Modeling
            </h2>
            <p className="text-slate-600 text-lg">
              Generate robust 3-year projections, perform sensitivity analysis, and benchmark against real-world industry data in seconds.
            </p>
          </div>
        )}

        {/* Input Form */}
        <div className={`transition-all duration-500 ${scenarios ? 'hidden' : 'block'}`}>
           <InputForm onSubmit={handleGenerate} isLoading={loadingState !== LoadingState.IDLE && loadingState !== LoadingState.ERROR} />
        </div>

        {/* Loading States */}
        {loadingState === LoadingState.BENCHMARKING && (
          <div className="text-center py-20 animate-pulse">
            <h3 className="text-xl font-semibold text-blue-600">Gathering Market Intelligence...</h3>
            <p className="text-slate-500">Searching specifically for {benchmarkData ? benchmarkData.industry : 'industry'} benchmarks</p>
          </div>
        )}
        {loadingState === LoadingState.MODELING && (
          <div className="text-center py-20 animate-pulse">
            <h3 className="text-xl font-semibold text-purple-600">Generating Projections...</h3>
            <p className="text-slate-500">Calculating P&L, Cash Flow, and Scenarios (AI Reasoning)</p>
          </div>
        )}

        {/* Error State */}
        {loadingState === LoadingState.ERROR && (
           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
             <strong className="font-bold">Error: </strong>
             <span className="block sm:inline">{errorMsg}</span>
             <button 
                onClick={() => setLoadingState(LoadingState.IDLE)}
                className="mt-2 text-sm underline hover:text-red-900"
             >
                Try Again
             </button>
           </div>
        )}

        {/* Results Dashboard */}
        {scenarios && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Financial Projections</h2>
               <button 
                 onClick={() => { setScenarios(null); setLoadingState(LoadingState.IDLE); }}
                 className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
               >
                 <LayoutDashboard size={16} /> New Model
               </button>
            </div>
            <Dashboard 
              scenarios={scenarios} 
              benchmarkData={benchmarkData} 
              currency={displayCurrency.code} 
              locale={displayCurrency.locale} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;