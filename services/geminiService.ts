import OpenAI from "openai";
import { BenchmarkData, ScenarioData, UserInput } from "../types";

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  apiKey: process.env.API_KEY, // Use your OpenRouter API Key here
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true
});

const MODEL_ID = "xiaomi/mimo-v2-flash:free";

// Retry helper function
const retryWithDelay = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.code === 'rate_limit_exceeded')) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithDelay(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Uses the API to find industry benchmarks.
 * Note: Since we are using a generic model without native search tools, 
 * we ask the model to provide benchmarks based on its training data.
 */
export const fetchIndustryBenchmarks = async (industry: string, country: string): Promise<BenchmarkData> => {
  try {
    const response = await retryWithDelay(() => openai.chat.completions.create({
      model: MODEL_ID,
      messages: [
        {
          role: "system",
          content: "You are a helpful market researcher."
        },
        {
          role: "user",
          content: `Find the typical 2024/2025 financial benchmarks for the ${industry} industry in ${country}.
      Specifically look for average Revenue Growth Rate (%) and average EBITDA Margin (%).
      If specific ${country} data is hard to find, provide global or regional equivalents.
      Return a brief summary of the numbers found.`
        }
      ],
      extra_body: { reasoning: { enabled: true } }
    } as any));

    const text = response.choices[0]?.message?.content || "";
    
    // We don't have direct source citations from this model like we did with Gemini Search
    return {
      industry,
      avgGrowthRate: "See analysis", 
      avgEbitdaMargin: "See analysis",
      sources: [{ title: "AI Model Knowledge Base", uri: "#" }],
    };
  } catch (error) {
    console.error("Benchmark error:", error);
    return {
      industry,
      avgGrowthRate: "Data unavailable", 
      avgEbitdaMargin: "Data unavailable",
      sources: [{ title: "Fallback Data", uri: "#" }],
    };
  }
};

/**
 * Uses the API for financial modeling.
 */
export const generateFinancialModel = async (input: UserInput, benchmarks: string): Promise<ScenarioData[]> => {
  
  const prompt = `Generate 3 financial scenarios for ${input.companyName} (${input.industry} in ${input.country}).

Current Data:
- Revenue: ${input.currentRevenue} ${input.currency}
- Monthly Expenses: ${input.currentExpenses} ${input.currency}
- Cash: ${input.currentCash} ${input.currency}
- Context: ${input.businessContext}

Create Base Case, Optimistic Case, and Pessimistic Case scenarios for 3 years.

Return valid JSON only:
{
  "scenarios": [
    {
      "name": "Base Case",
      "description": "Brief description",
      "assumptions": ["Clear assumption 1", "Clear assumption 2"],
      "projections": [
        {"year": 1, "revenue": 50000, "cogs": 1500, "grossProfit": 48500, "opex": 40000, "ebitda": 8500, "netIncome": 6800, "cashBalance": 206800},
        {"year": 2, "revenue": 55000, "cogs": 1650, "grossProfit": 53350, "opex": 44000, "ebitda": 9350, "netIncome": 7480, "cashBalance": 214280},
        {"year": 3, "revenue": 60000, "cogs": 1800, "grossProfit": 58200, "opex": 48000, "ebitda": 10200, "netIncome": 8160, "cashBalance": 222440}
      ]
    }
  ]
}`;

  try {
    const response = await retryWithDelay(() => openai.chat.completions.create({
      model: MODEL_ID,
      messages: [
        { role: "system", content: "You are a financial modeling expert. Output a valid JSON object with a 'scenarios' key." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      stream: false,
      extra_body: { reasoning: { enabled: true } }
    } as any));

    let jsonStr = response.choices[0]?.message?.content || '{"scenarios": []}';
    
    console.log('Raw response:', jsonStr.substring(0, 200) + '...');
    
    // Cleanup of potential markdown and HTML entities
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
      // Clean up common JSON corruption issues
      jsonStr = jsonStr
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/&quot;/g, '"') // Fix HTML entities
        .replace(/&#39;/g, "'") // Fix HTML entities
        .replace(/&amp;/g, '&') // Fix HTML entities
        .replace(/\\n/g, ' ') // Replace escaped newlines
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', jsonStr.substring(0, 500) + '...');
      
      // Use current input values for fallback scenarios
      const baseRevenue = Number(input.currentRevenue) || 50000;
      const baseExpenses = Number(input.currentExpenses) * 12 || 30000;
      const baseCash = Number(input.currentCash) || 200000;
      
      return [
        {
          name: "Base Case",
          description: "Conservative growth scenario based on current performance",
          assumptions: ["10% annual revenue growth", "Stable operating margins", "Current expense structure maintained"],
          projections: [
            { year: 1, revenue: Math.round(baseRevenue * 1.1), cogs: Math.round(baseRevenue * 0.03), grossProfit: Math.round(baseRevenue * 1.07), opex: baseExpenses, ebitda: Math.round(baseRevenue * 1.07 - baseExpenses), netIncome: Math.round((baseRevenue * 1.07 - baseExpenses) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 1.07 - baseExpenses) * 0.8) },
            { year: 2, revenue: Math.round(baseRevenue * 1.21), cogs: Math.round(baseRevenue * 0.033), grossProfit: Math.round(baseRevenue * 1.177), opex: Math.round(baseExpenses * 1.1), ebitda: Math.round(baseRevenue * 1.177 - baseExpenses * 1.1), netIncome: Math.round((baseRevenue * 1.177 - baseExpenses * 1.1) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 1.07 - baseExpenses) * 0.8 + (baseRevenue * 1.177 - baseExpenses * 1.1) * 0.8) },
            { year: 3, revenue: Math.round(baseRevenue * 1.331), cogs: Math.round(baseRevenue * 0.036), grossProfit: Math.round(baseRevenue * 1.295), opex: Math.round(baseExpenses * 1.21), ebitda: Math.round(baseRevenue * 1.295 - baseExpenses * 1.21), netIncome: Math.round((baseRevenue * 1.295 - baseExpenses * 1.21) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 1.07 - baseExpenses) * 0.8 + (baseRevenue * 1.177 - baseExpenses * 1.1) * 0.8 + (baseRevenue * 1.295 - baseExpenses * 1.21) * 0.8) }
          ]
        },
        {
          name: "Optimistic Case",
          description: "Strong growth scenario with market expansion",
          assumptions: ["25% annual revenue growth", "Improved operational efficiency", "Market share gains"],
          projections: [
            { year: 1, revenue: Math.round(baseRevenue * 1.25), cogs: Math.round(baseRevenue * 0.025), grossProfit: Math.round(baseRevenue * 1.225), opex: Math.round(baseExpenses * 1.1), ebitda: Math.round(baseRevenue * 1.225 - baseExpenses * 1.1), netIncome: Math.round((baseRevenue * 1.225 - baseExpenses * 1.1) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 1.225 - baseExpenses * 1.1) * 0.8) },
            { year: 2, revenue: Math.round(baseRevenue * 1.5625), cogs: Math.round(baseRevenue * 0.031), grossProfit: Math.round(baseRevenue * 1.531), opex: Math.round(baseExpenses * 1.2), ebitda: Math.round(baseRevenue * 1.531 - baseExpenses * 1.2), netIncome: Math.round((baseRevenue * 1.531 - baseExpenses * 1.2) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 1.225 - baseExpenses * 1.1) * 0.8 + (baseRevenue * 1.531 - baseExpenses * 1.2) * 0.8) },
            { year: 3, revenue: Math.round(baseRevenue * 1.953), cogs: Math.round(baseRevenue * 0.039), grossProfit: Math.round(baseRevenue * 1.914), opex: Math.round(baseExpenses * 1.3), ebitda: Math.round(baseRevenue * 1.914 - baseExpenses * 1.3), netIncome: Math.round((baseRevenue * 1.914 - baseExpenses * 1.3) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 1.225 - baseExpenses * 1.1) * 0.8 + (baseRevenue * 1.531 - baseExpenses * 1.2) * 0.8 + (baseRevenue * 1.914 - baseExpenses * 1.3) * 0.8) }
          ]
        },
        {
          name: "Pessimistic Case",
          description: "Economic downturn with reduced demand",
          assumptions: ["Revenue decline due to market conditions", "Increased operational costs", "Cash flow challenges"],
          projections: [
            { year: 1, revenue: Math.round(baseRevenue * 0.9), cogs: Math.round(baseRevenue * 0.04), grossProfit: Math.round(baseRevenue * 0.86), opex: baseExpenses, ebitda: Math.round(baseRevenue * 0.86 - baseExpenses), netIncome: Math.round((baseRevenue * 0.86 - baseExpenses) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 0.86 - baseExpenses) * 0.8) },
            { year: 2, revenue: Math.round(baseRevenue * 0.855), cogs: Math.round(baseRevenue * 0.043), grossProfit: Math.round(baseRevenue * 0.812), opex: Math.round(baseExpenses * 1.05), ebitda: Math.round(baseRevenue * 0.812 - baseExpenses * 1.05), netIncome: Math.round((baseRevenue * 0.812 - baseExpenses * 1.05) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 0.86 - baseExpenses) * 0.8 + (baseRevenue * 0.812 - baseExpenses * 1.05) * 0.8) },
            { year: 3, revenue: Math.round(baseRevenue * 0.85), cogs: Math.round(baseRevenue * 0.045), grossProfit: Math.round(baseRevenue * 0.805), opex: Math.round(baseExpenses * 1.1), ebitda: Math.round(baseRevenue * 0.805 - baseExpenses * 1.1), netIncome: Math.round((baseRevenue * 0.805 - baseExpenses * 1.1) * 0.8), cashBalance: Math.round(baseCash + (baseRevenue * 0.86 - baseExpenses) * 0.8 + (baseRevenue * 0.812 - baseExpenses * 1.05) * 0.8 + (baseRevenue * 0.805 - baseExpenses * 1.1) * 0.8) }
          ]
        }
      ];
    }

    const scenarios = parsedData.scenarios;

    if (!scenarios) {
      if (Array.isArray(parsedData)) {
        return parsedData as ScenarioData[];
      }
      if (parsedData.name && parsedData.projections) {
        return [parsedData] as ScenarioData[];
      }
      throw new Error("Could not find 'scenarios' key in the response and the response is not a valid scenario object.");
    }

    return Array.isArray(scenarios) ? scenarios : [scenarios];
  } catch (error) {
    console.error("Modeling error:", error);
    throw new Error("Failed to generate financial models");
  }
};
/**
 * Uses API for quick ratio analysis.
 */
export const analyzeRatios = async (scenario: ScenarioData, currency: string): Promise<string> => {
  try {
    const dataStr = JSON.stringify(scenario.projections);
    const response = await retryWithDelay(() => openai.chat.completions.create({
      model: MODEL_ID,
      messages: [
        {
          role: "system",
          content: "You are a financial analyst providing structured insights. Always format your response with clear sections and bullet points."
        },
        {
          role: "user",
          content: `Analyze these 3-year financial projections for a company dealing in ${currency}. Provide a structured analysis with the following format:

**Key Strengths:**
- [List 2-3 specific strengths with brief explanations]

**Key Risks:**
- [List 2-3 specific risks with brief explanations]

**Overall Assessment:**
- [One sentence summary of financial health]

Keep each point concise (1-2 sentences max). Focus on trends, ratios, and cash flow patterns from the data: ${dataStr}`
        }
      ],
      stream: false,
      extra_body: { reasoning: { enabled: true } }
    } as any));
    return response.choices[0]?.message?.content || "Analysis unavailable.";
  } catch (e) {
    return "Analysis temporarily unavailable due to rate limits. Please try again in a moment.";
  }
};