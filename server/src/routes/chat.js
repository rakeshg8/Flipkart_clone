import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const bodySchema = z.object({
  message: z.string().trim().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1)
      })
    )
    .optional()
    .default([])
});

const cohereEmbed = async (text, inputType) => {
  const response = await fetch("https://api.cohere.ai/v2/embed", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.cohereApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      texts: [text],
      model: "embed-english-v3.0",
      input_type: inputType,
      embedding_types: ["float"]
    })
  });

  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(`Cohere embed failed: ${response.status} ${textBody}`);
  }

  const payload = await response.json();
  const vector = payload?.embeddings?.float?.[0];
  if (!Array.isArray(vector) || vector.length !== 1024) {
    throw new Error("Invalid embedding returned by Cohere");
  }

  return vector;
};

const buildSystemPrompt = (context) =>
  `You are a helpful Flipkart customer support assistant.
Answer questions about products, orders, returns, and shopping.
Keep responses concise and friendly.
If the user asks about products, use ONLY this product context to answer:
${context || "No relevant products found."}
If no relevant products found, say so honestly and suggest they browse the catalog.`;

const completeWithOpenRouter = async ({ origin, messages }) => {
  const modelCandidates = [env.openrouterModel, ...env.openrouterFallbackModels].filter(Boolean);
  const uniqueModels = [...new Set(modelCandidates)];
  let lastError = null;

  for (const model of uniqueModels) {
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "Flipkart Clone"
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (openRouterResponse.ok) {
      const completion = await openRouterResponse.json();
      const reply = completion?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return { reply, model };
      }

      lastError = new Error(`OpenRouter returned empty response for model ${model}`);
      continue;
    }

    const errorText = await openRouterResponse.text();
    lastError = new Error(`OpenRouter failed for model ${model}: ${openRouterResponse.status} ${errorText}`);
  }

  throw lastError || new Error("OpenRouter failed for all configured models");
};

router.post("/", async (req, res, next) => {
  try {
    if (!env.cohereApiKey || !env.openrouterApiKey) {
      return res.status(200).json({ reply: "I'm having trouble connecting right now. Please try again.", sources: [] });
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid chat payload" });
    }
    const { message, history } = parsed.data;

    const queryEmbedding = await cohereEmbed(message, "search_query");

    const { data: matches, error: matchError } = await supabaseAdmin.rpc("match_products", {
      query_embedding: queryEmbedding,
      match_count: 4
    });
    if (matchError) throw matchError;

    const relevantMatches = (matches || []).filter((m) => Number(m.similarity) > 0.3);

    let products = [];
    if (relevantMatches.length) {
      const ids = relevantMatches.map((m) => m.id);
      const { data: productRows, error: productError } = await supabaseAdmin
        .from("products")
        .select("id, slug, name, brand, price, mrp, description, rating, stock, images")
        .in("id", ids);

      if (productError) throw productError;

      const byId = new Map((productRows || []).map((p) => [p.id, p]));
      products = ids.map((id) => byId.get(id)).filter(Boolean);
    }

    const context = products
      .map(
        (p) =>
          `Product: ${p.name} | Brand: ${p.brand} | Price: INR ${p.price} | MRP: INR ${p.mrp} | Rating: ${p.rating} stars | ${p.stock > 0 ? "In Stock" : "Out of Stock"} | ${p.description}`
      )
      .join("\n\n");

    const origin = env.corsOrigin.split(",").map((v) => v.trim())[0] || "https://localhost";

    const messages = [
      { role: "system", content: buildSystemPrompt(context) },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    const { reply } = await completeWithOpenRouter({ origin, messages });

    res.json({ reply, sources: products });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("/api/chat error", error);
    }
    res.status(200).json({
      reply: "I'm having trouble connecting right now. Please try again.",
      sources: []
    });
  }
});

export default router;
