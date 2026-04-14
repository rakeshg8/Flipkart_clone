import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

const router = Router();

const SUPPORT_SYSTEM_PROMPT =
  "You are a helpful Flipkart customer support assistant. Help with order tracking, returns, product queries, and shopping advice.";

router.post("/", async (req, res, next) => {
  try {
    if (!env.anthropicApiKey) {
      return res.status(500).json({ message: "Anthropic API key is not configured" });
    }

    const { messages = [] } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages array is required" });
    }

    const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      system: SUPPORT_SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }))
    });

    const text = response.content?.find((c) => c.type === "text")?.text || "Sorry, I could not generate a response.";
    res.json({ data: { message: text } });
  } catch (error) {
    next(error);
  }
});

export default router;
