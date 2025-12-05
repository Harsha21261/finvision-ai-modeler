import OpenAI from "openai";
import { BenchmarkData, ScenarioData, UserInput } from "../types";

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  apiKey: process.env.API_KEY, // Use your OpenRouter API Key here
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true
});

const MODEL_ID = "amazon/nova-2-lite-v1:free";

/**
 * Uses the API to find industry benchmarks.
 * Note: Since we are using a generic model without native search tools, 
 * we ask the model to provide benchmarks based on its training data.
 */
export const fetchIndustryBenchmarks = async (industry: string, country: string): Promise<BenchmarkData> => {
  try {
    const response = await openai.chat.completions.create({
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
      ]
    });

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
    throw new Error("Failed to fetch benchmarks");
  }
};

/**
 * Uses the API for financial modeling.
 */
export const generateFinancialModel = async (input: UserInput, benchmarks: string): Promise<ScenarioData[]> => {
  
  const prompt = `
    Act as a CFO and Financial Modeler based in ${input.country}.
    
    Context:
    Company: ${input.companyName}
    Industry: ${input.industry}
    Country: ${input.country}
    Currency: ${input.currency}
    Current Annual Revenue: ${input.currentRevenue}
    Current Monthly Expenses (OpEx + COGS approx): ${input.currentExpenses}
    Current Cash: ${input.currentCash}
    Business Context: ${input.businessContext}
    
    Industry Benchmarks found: ${benchmarks}

    Task:
    Generate 3 detailed financial scenarios for the next 3 years (Year 1, Year 2, Year 3).
    1. Base Case: Realistic growth based on current trajectory and local market conditions in ${input.country}.
    2. Optimistic Case: Aggressive growth.
    3. Pessimistic Case: Recession or specific ${input.country} economic risks.

    MATH & ACCURACY RULES:
    - Revenue: Must change YoY based on the scenario's growth rate.
    - Gross Profit = Revenue - COGS.
    - EBITDA = Gross Profit - OpEx.
    - Net Income = EBITDA - Taxes. (Estimate appropriate corporate tax rate for ${input.country}).
    - Cash Balance = Previous Year Cash + Net Income.

    Provide specific "assumptions" for each scenario (e.g., "Assumed 15% growth due to new product").

    Output Format: 
    Return ONLY valid JSON. The JSON should be an array of objects matching this structure:
    [
      {
        "name": "Base Case",
        "description": "...",
        "assumptions": ["..."],
        "projections": [
          {
            "year": 1,
            "revenue": 1000,
            "cogs": 400,
            "grossProfit": 600,
            "opex": 300,
            "ebitda": 300,
            "netIncome": 240,
            "cashBalance": 1240
          },
          ...
        ]
      }
    ]
    Do not include markdown formatting (like \`\`\`json). Just the raw JSON string.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_ID,
      messages: [
        { role: "system", content: "You are a financial modeling expert. Output valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" } // Try to enforce JSON mode if supported
    });

    let jsonStr = response.choices[0]?.message?.content || "[]";
    
    // Cleanup potential markdown code blocks if the model adds them
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr) as ScenarioData[];
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
    const response = await openai.chat.completions.create({
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
      ]
    });
    return response.choices[0]?.message?.content || "Analysis unavailable.";
  } catch (e) {
    return "Could not generate insights.";
  }
};
