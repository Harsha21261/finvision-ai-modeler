import React, { useState, useEffect } from 'react';
import { ScenarioData } from '../types';
import { calculateSaaSMetrics, SaaSMetrics } from '../services/saasMetricsService';
import { calculateAIFeatureImpact, AIFeatureImpact } from '../services/aiFeatureService';
import { compareToBenchmarks, BenchmarkComparison } from '../services/benchmarkService';
import { calculateRiskScoring, RiskScoring } from '../services/riskScoringService';
import { analyzeFounderScenarios, FounderScenario } from '../services/founderScenariosService';
import { generatePDFReport } from '../services/pdfService';
import { UserInputs } from '../services/scenarioGenerator';

interface InvestorDashboardProps {
  scenarios: ScenarioData[];
  currentCash: number;
  industry: string;
  userInputs: UserInputs;
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({
  scenarios,
  currentCash,
  industry,
  userInputs
}) => {
  const [riskScoring, setRiskScoring] = useState<RiskScoring | null>(null);
  
  const baseScenario = scenarios.find(s => s.name === 'Base Case') || scenarios[0];
  
  const saasMetrics = calculateSaaSMetrics(baseScenario);
  const aiImpact = calculateAIFeatureImpact(baseScenario, true);
  const benchmarks = compareToBenchmarks(baseScenario);
  const founderScenarios = analyzeFounderScenarios(baseScenario, currentCash);

  useEffect(() => {
    const loadRiskScoring = async () => {
      try {
        const risk = await calculateRiskScoring(baseScenario, industry || 'SaaS', true);
        setRiskScoring(risk);
      } catch (error) {
        console.error('Risk scoring error:', error);
        setRiskScoring({
          marketRisk: 5,
          techRisk: 5,
          cashRisk: 5,
          competitionRisk: 5,
          overallRisk: 5,
          riskLevel: 'Medium',
          recommendations: ['Risk analysis unavailable']
        });
      }
    };
    loadRiskScoring();
  }, [baseScenario, industry]);

  return (
    <div className="investor-dashboard">
      <div className="flex justify-between items-center mb-6">
        <h2>📊 Investor-Grade Analysis</h2>
      </div>
      
      {/* SaaS Metrics */}
      <div className="metrics-section">
        <h3>🚀 SaaS Metrics</h3>
        <div className="metrics-grid">
          <MetricCard 
            title="CAC" 
            value={`₹${saasMetrics.cac.toLocaleString()}`}
            subtitle="Customer Acquisition Cost"
            status={saasMetrics.cac < 50000 ? 'good' : 'warning'}
          />
          <MetricCard 
            title="LTV" 
            value={`₹${saasMetrics.ltv.toLocaleString()}`}
            subtitle="Lifetime Value"
            status="good"
          />
          <MetricCard 
            title="LTV:CAC" 
            value={`${saasMetrics.ltvCacRatio}:1`}
            subtitle="Should be >3:1"
            status={saasMetrics.ltvCacRatio > 3 ? 'good' : 'warning'}
          />
          <MetricCard 
            title="Payback" 
            value={`${saasMetrics.paybackPeriod}mo`}
            subtitle="CAC Payback Period"
            status={saasMetrics.paybackPeriod < 18 ? 'good' : 'warning'}
          />
          <MetricCard 
            title="ARR" 
            value={`₹${saasMetrics.arr.toLocaleString()}`}
            subtitle="Annual Recurring Revenue"
            status="good"
          />
          <MetricCard 
            title="Churn" 
            value={`${saasMetrics.churnRate}%`}
            subtitle="Monthly Churn Rate"
            status={saasMetrics.churnRate < 5 ? 'good' : 'warning'}
          />
        </div>
      </div>

      {/* AI Feature Impact */}
      <div className="metrics-section">
        <h3>🤖 AI Feature Impact</h3>
        <div className="ai-impact-grid">
          <div className="impact-card">
            <h4>Revenue Uplift</h4>
            <div className="big-number">+₹{aiImpact.revenueUplift.toLocaleString()}</div>
            <div className="subtitle">+{aiImpact.revenueUpliftPercent}% increase</div>
          </div>
          <div className="impact-card">
            <h4>Additional Costs</h4>
            <div className="big-number">₹{aiImpact.additionalCosts.toLocaleString()}</div>
            <div className="cost-breakdown">
              <div>Compute: ₹{aiImpact.computeCosts.toLocaleString()}</div>
              <div>R&D: ₹{aiImpact.rdCosts.toLocaleString()}</div>
            </div>
          </div>
          <div className="impact-card">
            <h4>Net Impact</h4>
            <div className={`big-number ${aiImpact.netImpact > 0 ? 'positive' : 'negative'}`}>
              ₹{aiImpact.netImpact.toLocaleString()}
            </div>
            <div className="subtitle">ROI: {aiImpact.roiPercent}%</div>
          </div>
          <div className="impact-card">
            <h4>Competitive Moat</h4>
            <div className="moat-score">
              <div className="score">{aiImpact.competitiveMoatScore}/10</div>
              <div className="moat-bar">
                <div 
                  className="moat-fill" 
                  style={{width: `${aiImpact.competitiveMoatScore * 10}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Benchmarks */}
      <div className="metrics-section">
        <h3>📈 Industry Benchmarks</h3>
        <div className="benchmark-card">
          <div className="ranking-badge">{benchmarks.overallRanking}</div>
          <div className="benchmark-grid">
            <div className="benchmark-item">
              <h4>EBITDA Margin</h4>
              <div className="comparison">
                <span className="your-metric">{benchmarks.companyMargin}%</span>
                <span className="vs">vs</span>
                <span className="industry-avg">{benchmarks.industryAvgMargin}%</span>
              </div>
              <div className="percentile">Percentile: {benchmarks.marginPercentile}th</div>
            </div>
            <div className="benchmark-item">
              <h4>Growth Rate</h4>
              <div className="comparison">
                <span className="your-metric">{benchmarks.companyGrowth}%</span>
                <span className="vs">vs</span>
                <span className="industry-avg">{benchmarks.industryAvgGrowth}%</span>
              </div>
              <div className="percentile">Percentile: {benchmarks.growthPercentile}th</div>
            </div>
          </div>
          <div className="insights">
            {benchmarks.insights.map((insight, idx) => (
              <div key={idx} className="insight">{insight}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Scoring */}
      <div className="metrics-section">
        <h3>⚠️ Risk Analysis</h3>
        <div className="risk-overview">
          <div className={`risk-level ${riskScoring?.riskLevel?.toLowerCase() || 'medium'}`}>
            {riskScoring?.riskLevel || 'Loading...'} Risk ({riskScoring?.overallRisk || '-'}/10)
          </div>
        </div>
        <div className="risk-breakdown">
          <RiskBar label="Market Risk" value={riskScoring?.marketRisk || 0} />
          <RiskBar label="Tech Risk" value={riskScoring?.techRisk || 0} />
          <RiskBar label="Cash Risk" value={riskScoring?.cashRisk || 0} />
          <RiskBar label="Competition Risk" value={riskScoring?.competitionRisk || 0} />
        </div>
        <div className="recommendations">
          <h4>Recommendations:</h4>
          {(riskScoring?.recommendations || ['Loading analysis...']).map((rec, idx) => (
            <div key={idx} className="recommendation">{rec}</div>
          ))}
        </div>
      </div>

      {/* Founder Scenarios */}
      <div className="metrics-section">
        <h3>🤔 Founder-Friendly Scenarios</h3>
        <div className="scenarios-grid">
          {founderScenarios.map((scenario, idx) => (
            <FounderScenarioCard key={idx} scenario={scenario} />
          ))}
        </div>
      </div>
    </div>
  );
};

const exportToJSON = (scenarios: ScenarioData[], userInputs: UserInputs) => {
  const data = {
    userInputs,
    scenarios,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financial-analysis-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToCSV = (scenarios: ScenarioData[]) => {
  const headers = ['Scenario', 'Year', 'Revenue', 'COGS', 'Gross Profit', 'OpEx', 'EBITDA', 'Net Income', 'Cash Balance'];
  const rows = [];
  
  scenarios.forEach(scenario => {
    scenario.projections.forEach(proj => {
      rows.push([
        scenario.name,
        proj.year,
        proj.revenue,
        proj.cogs,
        proj.grossProfit,
        proj.opex,
        proj.ebitda,
        proj.netIncome,
        proj.cashBalance
      ]);
    });
  });
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financial-projections-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  status: 'good' | 'warning' | 'danger';
}> = ({ title, value, subtitle, status }) => (
  <div className={`metric-card ${status}`}>
    <h4>{title}</h4>
    <div className="metric-value">{value}</div>
    <div className="metric-subtitle">{subtitle}</div>
  </div>
);

const RiskBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="risk-bar">
    <div className="risk-label">{label}</div>
    <div className="risk-bar-container">
      <div 
        className="risk-bar-fill" 
        style={{
          width: `${value * 10}%`,
          backgroundColor: value > 7 ? '#ff4444' : value > 5 ? '#ffaa00' : '#44ff44'
        }}
      ></div>
    </div>
    <div className="risk-value">{value}/10</div>
  </div>
);

const FounderScenarioCard: React.FC<{ scenario: FounderScenario }> = ({ scenario }) => (
  <div className={`scenario-card ${scenario.urgency.toLowerCase()}`}>
    <h4>{scenario.scenario}</h4>
    <div className="scenario-impact">
      <div>Burn: +₹{scenario.impact.monthlyBurnIncrease.toLocaleString()}/mo</div>
      <div>Runway: -{scenario.impact.runwayReduction.toFixed(1)} months</div>
      {scenario.impact.revenueImpact > 0 && (
        <div>Revenue: +₹{scenario.impact.revenueImpact.toLocaleString()}</div>
      )}
    </div>
    <div className="scenario-recommendation">{scenario.recommendation}</div>
    <div className={`urgency-badge ${scenario.urgency.toLowerCase()}`}>
      {scenario.urgency} Priority
    </div>
  </div>
);