import { ScenarioData } from '../types';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true
});

const MODEL_ID = "xiaomi/mimo-v2-flash:free";

export interface RiskScoring {
  marketRisk: number;
  techRisk: number;
  cashRisk: number;
  competitionRisk: number;
  overallRisk: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendations: string[];
}

export const calculateRiskScoring = async (
  scenario: ScenarioData,
  industry: string = 'SaaS',
  hasAIFeature: boolean = false,
  userInputs?: { revenue: number; expenses: number; cash: number; country: string }
): Promise<RiskScoring> => {
  try {
    const inputs = userInputs || { revenue: 500000, expenses: 35000, cash: 1000000, country: 'India' };
    
    const response = await openai.chat.completions.create({
      model: MODEL_ID,
      messages: [
        {
          role: "system",
          content: "You are a startup risk analyst. Analyze the provided financial data and return ONLY valid JSON with risk scores (1-10) and recommendations."
        },
        {
          role: "user",
          content: `Analyze this ${industry || 'SaaS'} startup in ${inputs.country}:

Financial Data:
- Annual Revenue: ${inputs.revenue}
- Monthly Expenses: ${inputs.expenses}
- Available Cash: ${inputs.cash}
- Has AI Features: ${hasAIFeature}

Projections: ${JSON.stringify(scenario.projections)}

Return JSON with this exact structure:
{
  "marketRisk": 1-10,
  "techRisk": 1-10,
  "cashRisk": 1-10,
  "competitionRisk": 1-10,
  "overallRisk": 1-10,
  "riskLevel": "Low|Medium|High|Critical",
  "recommendations": ["specific actionable recommendations based on the data"]
}`
        }
      ],
      stream: false
    }) as any;

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    
    return {
      marketRisk: parsed.marketRisk || 5,
      techRisk: parsed.techRisk || 5,
      cashRisk: parsed.cashRisk || 5,
      competitionRisk: parsed.competitionRisk || 5,
      overallRisk: parsed.overallRisk || 5,
      riskLevel: parsed.riskLevel || 'Medium',
      recommendations: parsed.recommendations || ['Analysis unavailable']
    };
  } catch (error) {
    console.error('Risk analysis error:', error);
    return {
      marketRisk: 5,
      techRisk: 5,
      cashRisk: 5,
      competitionRisk: 5,
      overallRisk: 5,
      riskLevel: 'Medium',
      recommendations: ['Risk analysis temporarily unavailable']
    };
  }
};