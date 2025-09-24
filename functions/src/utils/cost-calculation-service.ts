// Token fiyatları (USD)
const GEMINI_FLASH_INPUT_PRICE_PER_MILLION_TOKENS = 0.3; // 1M input token başına $0.30
const GEMINI_FLASH_OUTPUT_PRICE_PER_MILLION_TOKENS = 2.5; // 1M output token başına $2.50

// Maksimum aylık maliyet limiti
const MAX_MONTHLY_COST_PER_USER = 7.0; // Kullanıcı başına $7

// Varsayılan ücretli kullanıcı sayısı
const NUMBER_OF_PAID_USERS = 1000;

export async function calculateTokenCost(text: string, type: 'input' | 'output'): Promise<number> {
  // Basit bir token sayımı (gerçekte daha karmaşık olabilir)
  const estimatedTokens = text.length / 4; // Ortalama 4 karakter = 1 token

  let cost = 0;
  if (type === 'input') {
    cost = (estimatedTokens / 1_000_000) * GEMINI_FLASH_INPUT_PRICE_PER_MILLION_TOKENS;
  } else {
    cost = (estimatedTokens / 1_000_000) * GEMINI_FLASH_OUTPUT_PRICE_PER_MILLION_TOKENS;
  }
  return cost;
}

export async function calculateMonthlyAgentCostEstimate(
  monthlyAgentGenerationsPerUser: number,
  avgInputTokensPerGeneration: number,
  avgOutputTokensPerGeneration: number
): Promise<{
  totalMonthlyCost: number;
  costPerUser: number;
  exceedsBudget: boolean;
}> {
  // Tek bir agent oluşturmanın tahmini maliyeti
  const singleGenerationInputCost =
    (avgInputTokensPerGeneration / 1_000_000) * GEMINI_FLASH_INPUT_PRICE_PER_MILLION_TOKENS;
  const singleGenerationOutputCost =
    (avgOutputTokensPerGeneration / 1_000_000) * GEMINI_FLASH_OUTPUT_PRICE_PER_MILLION_TOKENS;
  const costPerGeneration = singleGenerationInputCost + singleGenerationOutputCost;

  // Kullanıcı başına aylık toplam maliyet
  const costPerUser = costPerGeneration * monthlyAgentGenerationsPerUser;

  // Toplam aylık maliyet (1000 ücretli kullanıcı varsayımıyla)
  const totalMonthlyCost = costPerUser * NUMBER_OF_PAID_USERS;

  const exceedsBudget = costPerUser > MAX_MONTHLY_COST_PER_USER;

  return {
    totalMonthlyCost,
    costPerUser,
    exceedsBudget,
  };
}
