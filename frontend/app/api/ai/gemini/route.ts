import { NextRequest, NextResponse } from "next/server";

type OhlcPoint = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type GeminiSignal = {
  action: "BUY_WRBTC" | "SELL_WRBTC" | "HOLD";
  confidence: number;
  reason: string;
};

type RiskMode = "conservative" | "balanced" | "aggressive";

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseGeminiJson(text: string): GeminiSignal | null {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : cleaned;

  try {
    const parsed = JSON.parse(candidate) as Partial<GeminiSignal>;
    if (!parsed.action || !parsed.reason) return null;

    const action =
      parsed.action === "BUY_WRBTC" || parsed.action === "SELL_WRBTC" || parsed.action === "HOLD"
        ? parsed.action
        : "HOLD";

    return {
      action,
      confidence: clampConfidence(Number(parsed.confidence ?? 0)),
      reason: String(parsed.reason).slice(0, 280),
    };
  } catch {
    return null;
  }
}

function forcedDirectionalAction(points: OhlcPoint[]): "BUY_WRBTC" | "SELL_WRBTC" {
  if (points.length < 2) {
    return "BUY_WRBTC";
  }

  const previousClose = points[points.length - 2]?.close ?? 0;
  const lastClose = points[points.length - 1]?.close ?? 0;

  if (lastClose === previousClose) {
    return "BUY_WRBTC";
  }

  return lastClose > previousClose ? "BUY_WRBTC" : "SELL_WRBTC";
}

function fallbackSignal(points: OhlcPoint[], forceTrade: boolean, riskMode: RiskMode): GeminiSignal {
  if (points.length < 2) {
    if (forceTrade) {
      return {
        action: "BUY_WRBTC",
        confidence: 51,
        reason: "Modo forzado: datos insuficientes, se ejecuta sesgo largo por demo.",
      };
    }

    return {
      action: "HOLD",
      confidence: 30,
      reason: "No hay suficientes velas para inferir tendencia.",
    };
  }

  const first = points[0]?.close ?? 0;
  const last = points[points.length - 1]?.close ?? 0;
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;

  const bullishThreshold = riskMode === "aggressive" ? 0.4 : riskMode === "balanced" ? 1 : 1.8;
  const bearishThreshold = -bullishThreshold;

  if (pct >= bullishThreshold) {
    return {
      action: "BUY_WRBTC",
      confidence: riskMode === "aggressive" ? 60 : 55,
      reason: `Tendencia alcista detectada (${pct.toFixed(2)}%) en horizonte OHLC.`,
    };
  }

  if (pct <= bearishThreshold) {
    return {
      action: "SELL_WRBTC",
      confidence: riskMode === "aggressive" ? 60 : 55,
      reason: `Tendencia bajista detectada (${pct.toFixed(2)}%) en horizonte OHLC.`,
    };
  }

  if (forceTrade) {
    const forcedAction = forcedDirectionalAction(points);
    return {
      action: forcedAction,
      confidence: riskMode === "aggressive" ? 58 : 52,
      reason:
        forcedAction === "BUY_WRBTC"
          ? "Modo forzado: rango lateral, se toma sesgo comprador para demostrar ejecución."
          : "Modo forzado: rango lateral, se toma sesgo vendedor para demostrar ejecución.",
    };
  }

  return {
    action: "HOLD",
    confidence: 45,
    reason: "Movimiento lateral, sin ventaja clara para rotar exposición.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
    const body = (await request.json()) as {
      ohlc?: OhlcPoint[];
      pair?: string;
      horizon?: string;
      riskMode?: RiskMode;
      forceTrade?: boolean;
    };

    const points = Array.isArray(body.ohlc) ? body.ohlc.slice(-90) : [];
    const riskMode: RiskMode =
      body.riskMode === "conservative" || body.riskMode === "aggressive" || body.riskMode === "balanced"
        ? body.riskMode
        : "balanced";
    const forceTrade = body.forceTrade === true;

    if (points.length === 0) {
      return NextResponse.json({ error: "OHLC vacío" }, { status: 400 });
    }

    if (!apiKey) {
      const fallback = fallbackSignal(points, forceTrade, riskMode);
      return NextResponse.json({
        source: "local-fallback",
        model: "heuristic",
        signal: fallback,
      });
    }

    const prompt = [
      "Eres un analista cuant para un bot de trading spot.",
      "Debes decidir acción para el par WRBTC/DoC en Rootstock.",
      "Reglas:",
      "- BUY_WRBTC significa ejecutar swap DoC -> WRBTC.",
      "- SELL_WRBTC significa ejecutar swap WRBTC -> DoC.",
      "- HOLD significa no ejecutar.",
      `- Risk mode: ${riskMode}.`,
      forceTrade
        ? "- Modo forzado ACTIVO: no puedes responder HOLD, debes elegir BUY_WRBTC o SELL_WRBTC."
        : "- Modo forzado INACTIVO: puedes usar HOLD si no hay ventaja estadística.",
      "Responde SOLO JSON válido con schema:",
      '{"action":"BUY_WRBTC|SELL_WRBTC|HOLD","confidence":0-100,"reason":"max 180 chars"}',
      `Par: ${body.pair ?? "WRBTC/DoC"}. Horizonte: ${body.horizon ?? "30D"}.`,
      `OHLC (array): ${JSON.stringify(points)}`,
    ].join("\n");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const details = await geminiResponse.text();
      return NextResponse.json(
        { error: `Gemini request failed (${geminiResponse.status})`, details: details.slice(0, 400) },
        { status: 502 }
      );
    }

    const result = (await geminiResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseGeminiJson(text);
    const fallback = fallbackSignal(points, forceTrade, riskMode);
    const signal =
      !parsed || (forceTrade && parsed.action === "HOLD")
        ? fallback
        : parsed;

    return NextResponse.json({
      source: "gemini",
      model,
      signal,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gemini route failed",
      },
      { status: 500 }
    );
  }
}
