import React, { useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { generateFinancialModel, fetchIndustryBenchmarks } from '../services/geminiService';
import { UserInput, ScenarioData } from '../types';

interface Props {
  onScenariosGenerated: (scenarios: ScenarioData[], inputData: UserInput) => void;
}

const COUNTRY_CONFIG = {
  'India': { currency: '₹', symbol: 'INR' },
  'USA': { currency: '$', symbol: 'USD' },
  'UK': { currency: '£', symbol: 'GBP' },
  'Germany': { currency: '€', symbol: 'EUR' },
  'Singapore': { currency: 'S$', symbol: 'SGD' },
  'Australia': { currency: 'A$', symbol: 'AUD' },
  'Canada': { currency: 'C$', symbol: 'CAD' },
  'Japan': { currency: '¥', symbol: 'JPY' },
  'South Korea': { currency: '₩', symbol: 'KRW' },
  'China': { currency: '¥', symbol: 'CNY' },
  'Brazil': { currency: 'R$', symbol: 'BRL' },
  'Mexico': { currency: '$', symbol: 'MXN' },
  'France': { currency: '€', symbol: 'EUR' },
  'Netherlands': { currency: '€', symbol: 'EUR' },
  'Switzerland': { currency: 'CHF', symbol: 'CHF' },
  'Sweden': { currency: 'kr', symbol: 'SEK' },
  'Norway': { currency: 'kr', symbol: 'NOK' },
  'Denmark': { currency: 'kr', symbol: 'DKK' },
  'Israel': { currency: '₪', symbol: 'ILS' },
  'UAE': { currency: 'د.إ', symbol: 'AED' },
  'Saudi Arabia': { currency: 'ر.س', symbol: 'SAR' },
  'South Africa': { currency: 'R', symbol: 'ZAR' },
  'Nigeria': { currency: '₦', symbol: 'NGN' },
  'Kenya': { currency: 'KSh', symbol: 'KES' },
  'Egypt': { currency: 'ج.م', symbol: 'EGP' },
  'Turkey': { currency: '₺', symbol: 'TRY' },
  'Russia': { currency: '₽', symbol: 'RUB' },
  'Poland': { currency: 'zł', symbol: 'PLN' },
  'Czech Republic': { currency: 'Kč', symbol: 'CZK' },
  'Hungary': { currency: 'Ft', symbol: 'HUF' },
  'Romania': { currency: 'lei', symbol: 'RON' },
  'Bulgaria': { currency: 'лв', symbol: 'BGN' },
  'Croatia': { currency: '€', symbol: 'EUR' },
  'Serbia': { currency: 'дин', symbol: 'RSD' },
  'Ukraine': { currency: '₴', symbol: 'UAH' },
  'Belarus': { currency: 'Br', symbol: 'BYN' },
  'Lithuania': { currency: '€', symbol: 'EUR' },
  'Latvia': { currency: '€', symbol: 'EUR' },
  'Estonia': { currency: '€', symbol: 'EUR' },
  'Finland': { currency: '€', symbol: 'EUR' },
  'Austria': { currency: '€', symbol: 'EUR' },
  'Belgium': { currency: '€', symbol: 'EUR' },
  'Spain': { currency: '€', symbol: 'EUR' },
  'Italy': { currency: '€', symbol: 'EUR' },
  'Portugal': { currency: '€', symbol: 'EUR' },
  'Greece': { currency: '€', symbol: 'EUR' },
  'Ireland': { currency: '€', symbol: 'EUR' },
  'Luxembourg': { currency: '€', symbol: 'EUR' },
  'Malta': { currency: '€', symbol: 'EUR' },
  'Cyprus': { currency: '€', symbol: 'EUR' },
  'Slovenia': { currency: '€', symbol: 'EUR' },
  'Slovakia': { currency: '€', symbol: 'EUR' }
};

const FinancialInputForm: React.FC<Props> = ({ onScenariosGenerated }) => {
  const [inputs, setInputs] = useState<UserInput>({
    companyName: '',
    industry: 'SaaS',
    country: 'India',
    currency: 'INR',
    currentRevenue: 500000,
    currentExpenses: 35000,
    currentCash: 2000000,
    businessContext: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentCountry = inputs.country as keyof typeof COUNTRY_CONFIG;
  const currencySymbol = COUNTRY_CONFIG[currentCountry]?.currency || '₹';
  
  const handleGenerate = async () => {
    setIsGenerating(true);

    // Validate inputs
    if (!inputs.companyName.trim()) {
      alert('Please enter your company name');
      setIsGenerating(false);
      return;
    }
    if (!inputs.businessContext.trim()) {
      alert('Please enter your business context');
      setIsGenerating(false);
      return;
    }
    if (inputs.currentRevenue <= 0 || inputs.currentExpenses <= 0 || inputs.currentCash < 0) {
      alert('Please enter valid financial numbers');
      setIsGenerating(false);
      return;
    }

    try {
      // 1. Fetch industry benchmarks
      const benchmarks = await fetchIndustryBenchmarks(inputs.industry, inputs.country);
      const benchmarkText = `Average Growth: ${benchmarks.avgGrowthRate}, Average EBITDA Margin: ${benchmarks.avgEbitdaMargin}`;

      // 2. Generate financial model using the API
      const scenarios = await generateFinancialModel(inputs, benchmarkText);

      onScenariosGenerated(scenarios, inputs);
    } catch (error) {
      console.error("Error generating scenarios:", error);
      alert("Failed to generate financial scenarios. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-600 rounded-lg">
          <Calculator className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Model Generator</h2>
          <p className="text-slate-600">Enter your business financials to generate scenarios</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={inputs.companyName}
            onChange={(e) => setInputs({...inputs, companyName: e.target.value})}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your company name"
          />
          <p className="text-xs text-slate-500 mt-1">Your business or startup name</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Country
          </label>
          <select
            value={inputs.country}
            onChange={(e) => {
              const country = e.target.value as keyof typeof COUNTRY_CONFIG;
              const currency = COUNTRY_CONFIG[country]?.symbol || 'INR';
              setInputs({...inputs, country, currency });
            }}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.keys(COUNTRY_CONFIG).map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Annual Revenue ({currencySymbol})
          </label>
          <input
            type="number"
            value={inputs.currentRevenue}
            onChange={(e) => setInputs({...inputs, currentRevenue: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="500000"
          />
          <p className="text-xs text-slate-500 mt-1">How much your business earns per year</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Monthly Expenses ({currencySymbol})
          </label>
          <input
            type="number"
            value={inputs.currentExpenses}
            onChange={(e) => setInputs({...inputs, currentExpenses: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="35000"
          />
          <p className="text-xs text-slate-500 mt-1">Total monthly operating expenses (COGS + OpEx)</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Available Cash ({currencySymbol})
          </label>
          <input
            type="number"
            value={inputs.currentCash}
            onChange={(e) => setInputs({...inputs, currentCash: Number(e.target.value)})}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="2000000"
          />
          <p className="text-xs text-slate-500 mt-1">Cash you have available for operations</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Industry
          </label>
          <select
            value={inputs.industry}
            onChange={(e) => setInputs({...inputs, industry: e.target.value})}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="SaaS">SaaS</option>
            <option value="E-commerce">E-commerce</option>
            <option value="FinTech">FinTech</option>
            <option value="HealthTech">HealthTech</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Business Context
          </label>
          <textarea
            value={inputs.businessContext}
            onChange={(e) => setInputs({...inputs, businessContext: e.target.value})}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your business model, target market, key challenges..."
            rows={3}
          />
          <p className="text-xs text-slate-500 mt-1">Help us generate more accurate scenarios</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating Scenarios...
            </>
          ) : (
            <>
              <TrendingUp size={20} />
              Generate Financial Model
            </>
          )}
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 3 scenarios based on your inputs (Base, Growth, Conservative)</li>
          <li>• 3-year financial projections</li>
          <li>• Industry benchmarking and validation</li>
          <li>• Cash flow analysis and funding recommendations</li>
        </ul>
      </div>
    </div>
  );
};

export default FinancialInputForm;