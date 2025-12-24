import { ScenarioData, UserInput } from '../types';
import { generatePDFReport } from './pdfService';

/**
 * Export scenarios to CSV format
 */
export const exportToCSV = (scenarios: ScenarioData[]): void => {
  const headers = ['Scenario', 'Year', 'Revenue', 'COGS', 'Gross Profit', 'OpEx', 'EBITDA', 'Net Income', 'Cash Balance'];
  
  const rows = scenarios.flatMap(scenario => 
    scenario.projections.map(projection => [
      scenario.name,
      projection.year,
      projection.revenue,
      projection.cogs,
      projection.grossProfit,
      projection.opex,
      projection.ebitda,
      projection.netIncome,
      projection.cashBalance
    ])
  );

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-projections-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export scenarios to JSON format
 */
export const exportToJSON = (scenarios: ScenarioData[], metadata: any): void => {
  const exportData = {
    exportDate: new Date().toISOString(),
    metadata,
    scenarios
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-model-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export scenarios to PDF format
 */
export const exportToPDF = async (scenarios: ScenarioData[], userInputs: UserInput, currentCash: number): Promise<void> => {
  await generatePDFReport(scenarios, userInputs, currentCash);
};