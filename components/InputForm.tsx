import React, { useState } from 'react';
import { UserInput } from '../types';
import { ArrowRight, BarChart3, Building2, DollarSign, Globe } from 'lucide-react';

interface Props {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

// Internal state interface allows strings for easier typing in number inputs
interface FormState {
  companyName: string;
  industry: string;
  country: string;
  currencyCode: string;
  currentRevenue: string | number;
  currentExpenses: string | number;
  currentCash: string | number;
  businessContext: string;
}

const InputForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormState>({
    companyName: 'TechNova Solutions',
    industry: 'SaaS / Enterprise Software',
    country: 'United States',
    currencyCode: 'USD',
    currentRevenue: 500000,
    currentExpenses: 35000,
    currentCash: 120000,
    businessContext: 'We are launching a new AI feature next quarter but facing stiff competition from legacy providers.'
  });

  const currencyOptions = [
    { code: 'USD', label: 'USD ($) - United States', locale: 'en-US', country: 'United States' },
    { code: 'EUR', label: 'EUR (€) - Europe', locale: 'en-IE', country: 'Europe' },
    { code: 'GBP', label: 'GBP (£) - United Kingdom', locale: 'en-GB', country: 'United Kingdom' },
    { code: 'INR', label: 'INR (₹) - India', locale: 'en-IN', country: 'India' },
    { code: 'CAD', label: 'CAD ($) - Canada', locale: 'en-CA', country: 'Canada' },
    { code: 'AUD', label: 'AUD ($) - Australia', locale: 'en-AU', country: 'Australia' },
    { code: 'JPY', label: 'JPY (¥) - Japan', locale: 'ja-JP', country: 'Japan' },
  ];

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = currencyOptions.find(c => c.code === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        currencyCode: selected.code,
        country: selected.country // Auto-update country for convenience
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currencyMeta = currencyOptions.find(c => c.code === formData.currencyCode) || currencyOptions[0];
    
    onSubmit({
      ...formData,
      currency: formData.currencyCode,
      locale: currencyMeta.locale,
      currentRevenue: Number(formData.currentRevenue),
      currentExpenses: Number(formData.currentExpenses),
      currentCash: Number(formData.currentCash),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <Building2 size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Model Configuration</h2>
          <p className="text-slate-500 text-sm">Define your business parameters and location.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Location Section */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
             <Globe size={18} />
             <span>Location & Currency</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <select
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleCurrencyChange}
                className="w-full px-4 py-2 bg-white text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country / Region</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g. United States"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. Fintech"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Annual Revenue</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-400 font-semibold text-xs">{formData.currencyCode}</div>
              <input
                type="number"
                name="currentRevenue"
                value={formData.currentRevenue}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Expenses</label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-400 font-semibold text-xs">{formData.currencyCode}</div>
              <input
                type="number"
                name="currentExpenses"
                value={formData.currentExpenses}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Cash</label>
            <div className="relative">
               <div className="absolute left-3 top-2.5 text-slate-400 font-semibold text-xs">{formData.currencyCode}</div>
              <input
                type="number"
                name="currentCash"
                value={formData.currentCash}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Scenario Context</label>
          <textarea
            name="businessContext"
            value={formData.businessContext}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            placeholder="Describe upcoming product launches, market risks, or funding rounds..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all
            ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Model...
            </>
          ) : (
            <>
              <BarChart3 size={20} />
              Generate Financial Model
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;