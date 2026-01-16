import { invokeLLM } from "./_core/llm";
import { getTransactions, getDemandForecast, createDemandForecast } from "./db";
import { nanoid } from "nanoid";

interface ConsumptionPattern {
  productId: string;
  productName: string;
  recentConsumption: number[];
  averageMonthlyConsumption: number;
  trend: "increasing" | "stable" | "decreasing";
  seasonality: boolean;
}

/**
 * Analiza el historial de transacciones para obtener patrones de consumo
 */
export async function analyzeConsumptionPatterns(
  productId: string,
  productName: string
): Promise<ConsumptionPattern> {
  const transactions = await getTransactions(productId, "exit", 100);

  // Agrupar por mes
  const monthlyConsumption: Record<string, number> = {};
  const now = new Date();

  transactions.forEach((tx: any) => {
    const txDate = new Date(tx.createdAt);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyConsumption[monthKey] = (monthlyConsumption[monthKey] || 0) + tx.quantity;
  });

  const recentConsumption = Object.values(monthlyConsumption).slice(-6);
  const averageMonthlyConsumption =
    recentConsumption.length > 0
      ? recentConsumption.reduce((a, b) => a + b, 0) / recentConsumption.length
      : 0;

  // Detectar tendencia
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (recentConsumption.length >= 2) {
    const recent = recentConsumption.slice(-2);
    if (recent[1] > recent[0] * 1.2) trend = "increasing";
    else if (recent[1] < recent[0] * 0.8) trend = "decreasing";
  }

  // Detectar estacionalidad (variación > 30%)
  const variance =
    recentConsumption.length > 0
      ? Math.max(...recentConsumption) - Math.min(...recentConsumption)
      : 0;
  const seasonality =
    averageMonthlyConsumption > 0 &&
    variance / averageMonthlyConsumption > 0.3;

  return {
    productId,
    productName,
    recentConsumption,
    averageMonthlyConsumption,
    trend,
    seasonality,
  };
}

/**
 * Usa LLM para predecir demanda futura basada en patrones históricos
 */
export async function predictDemandWithLLM(
  pattern: ConsumptionPattern,
  minStock: number,
  maxStock: number
): Promise<{
  forecastedDemand: number;
  suggestedOrderQuantity: number;
  confidence: number;
  analysis: string;
}> {
  const prompt = `Analiza el siguiente patrón de consumo de inventario y proporciona una predicción de demanda:

Producto: ${pattern.productName}
Consumo mensual promedio: ${pattern.averageMonthlyConsumption.toFixed(2)} unidades
Últimos 6 meses: ${pattern.recentConsumption.join(", ")} unidades
Tendencia: ${pattern.trend}
Estacionalidad detectada: ${pattern.seasonality ? "Sí" : "No"}
Stock mínimo requerido: ${minStock} unidades
Stock máximo permitido: ${maxStock} unidades

Por favor proporciona:
1. Predicción de demanda para el próximo mes (número entero)
2. Cantidad sugerida de compra (número entero)
3. Nivel de confianza en la predicción (0-100)
4. Breve análisis de la recomendación

Responde en formato JSON con las claves: forecastedDemand, suggestedOrderQuantity, confidence, analysis`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Eres un experto en gestión de inventario y análisis de demanda. Proporciona predicciones precisas basadas en datos históricos.",
      } as any,
      {
        role: "user",
        content: prompt,
      } as any,
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "demand_forecast",
        strict: true,
        schema: {
          type: "object",
          properties: {
            forecastedDemand: {
              type: "integer",
              description: "Predicción de demanda para el próximo mes",
            },
            suggestedOrderQuantity: {
              type: "integer",
              description: "Cantidad sugerida de compra",
            },
            confidence: {
              type: "integer",
              description: "Nivel de confianza 0-100",
            },
            analysis: {
              type: "string",
              description: "Análisis de la recomendación",
            },
          },
          required: [
            "forecastedDemand",
            "suggestedOrderQuantity",
            "confidence",
            "analysis",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  const contentStr = typeof content === "string" ? content : JSON.stringify(content);
  const parsed = JSON.parse(contentStr);

  return {
    forecastedDemand: Math.max(1, parsed.forecastedDemand),
    suggestedOrderQuantity: Math.max(1, parsed.suggestedOrderQuantity),
    confidence: Math.min(100, Math.max(0, parsed.confidence)),
    analysis: parsed.analysis,
  };
}

/**
 * Genera predicción de demanda para un producto
 */
export async function generateDemandForecast(
  productId: string,
  productName: string,
  minStock: number,
  maxStock: number
) {
  try {
    // Analizar patrones históricos
    const pattern = await analyzeConsumptionPatterns(productId, productName);

    // Generar predicción con LLM
    const forecast = await predictDemandWithLLM(
      pattern,
      minStock,
      maxStock
    );

    // Guardar en base de datos
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // Válido por 30 días

    await createDemandForecast({
      id: nanoid(),
      productId,
      forecastedDemand: forecast.forecastedDemand,
      suggestedOrderQuantity: forecast.suggestedOrderQuantity,
      confidence: forecast.confidence,
      analysisData: JSON.stringify({
        pattern,
        analysis: forecast.analysis,
      }),
      validUntil: validUntil.toISOString(),
    });

    return forecast;
  } catch (error) {
    console.error("Error generating demand forecast:", error);
    throw error;
  }
}

/**
 * Obtiene o genera predicción de demanda para un producto
 */
export async function getOrGenerateForecast(
  productId: string,
  productName: string,
  minStock: number,
  maxStock: number
) {
  // Intentar obtener predicción existente y válida
  const existing = await getDemandForecast(productId);

  if (existing) {
    const validUntil = new Date(existing.validUntil || 0);
    if (validUntil > new Date()) {
      return existing;
    }
  }

  // Generar nueva predicción
  return await generateDemandForecast(
    productId,
    productName,
    minStock,
    maxStock
  );
}
