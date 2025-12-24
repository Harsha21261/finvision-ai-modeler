import React, { useState } from 'react';
import { LayoutDashboard, ShieldCheck, Sparkles, TrendingUp, History } from 'lucide-react';
import FinancialInputForm from './components/FinancialInputForm';
import Dashboard from './components/Dashboard';
import { InvestorDashboard } from './components/InvestorDashboard';
import { ScenarioData, UserInput } from './types';
import './styles/InvestorDashboard.css';

const App: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioData[] | null>(null);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  
  const handleScenariosGenerated = (generatedScenarios: ScenarioData[], inputData: UserInput) => {
    setScenarios(generatedScenarios);
    setUserInput(inputData);
  };
  
  const handleStartOver = () => {
    setScenarios(null);
    setUserInput(null);
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
              FinVision AI Modeler
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
        {!scenarios ? (
          <div>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                AI-Powered Financial Modeling
              </h2>
              <p className="text-slate-600 text-lg">
                Generate scenarios based on YOUR actual financial inputs - no more hardcoded data!
              </p>
            </div>
            <FinancialInputForm onScenariosGenerated={handleScenariosGenerated} />
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Your Financial Analysis</h2>
               <button 
                 onClick={handleStartOver}
                 className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
               >
                 <LayoutDashboard size={16} /> New Analysis
               </button>
            </div>
            <Dashboard 
              scenarios={scenarios}
              userInput={userInput}
            />
            {userInput && (
              <InvestorDashboard 
                scenarios={scenarios}
                currentCash={userInput.availableCash}
                industry={userInput.industry || 'SaaS'}
                userInputs={userInput}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;