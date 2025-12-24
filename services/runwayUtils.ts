/**
 * Utility service for standardized runway calculations
 * Prevents negative runway values and provides professional status labels
 */

export interface RunwayStatus {
  months: number;
  status: 'Healthy' | 'Caution' | 'Critical' | 'Exhausted';
  label: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export const calculateRunway = (
  currentCash: number,
  monthlyBurn: number,
  monthlyRevenue: number = 0
): RunwayStatus => {
  // Ensure positive values
  const safeCash = Math.max(0, currentCash);
  const safeBurn = Math.max(1, monthlyBurn); // Minimum ₹1 to prevent division by zero
  
  // Calculate net burn (burn - revenue)
  const netBurn = Math.max(1, safeBurn - monthlyRevenue);
  
  // Calculate runway months (capped at 0)
  const runwayMonths = Math.max(0, safeCash / netBurn);
  
  // Determine status and labels
  let status: 'Healthy' | 'Caution' | 'Critical' | 'Exhausted';
  let label: string;
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  
  if (runwayMonths === 0) {
    status = 'Exhausted';
    label = 'Runway exhausted - Immediate shutdown risk';
    riskLevel = 'Critical';
  } else if (runwayMonths < 3) {
    status = 'Critical';
    label = 'Critical runway - Emergency funding needed';
    riskLevel = 'Critical';
  } else if (runwayMonths < 6) {
    status = 'Critical';
    label = 'Low runway - Urgent funding required';
    riskLevel = 'High';
  } else if (runwayMonths < 12) {
    status = 'Caution';
    label = 'Moderate runway - Plan fundraising';
    riskLevel = 'Medium';
  } else if (runwayMonths < 18) {
    status = 'Caution';
    label = 'Adequate runway - Monitor closely';
    riskLevel = 'Medium';
  } else {
    status = 'Healthy';
    label = 'Strong runway - Focus on growth';
    riskLevel = 'Low';
  }
  
  return {
    months: Math.round(runwayMonths * 10) / 10, // Round to 1 decimal
    status,
    label,
    riskLevel
  };
};

export const formatRunwayDisplay = (runway: RunwayStatus): string => {
  if (runway.months === 0) {
    return '0 months (Exhausted)';
  }
  return `${runway.months} months (${runway.status})`;
};