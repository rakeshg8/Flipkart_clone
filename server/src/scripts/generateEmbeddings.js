import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 200;

const buildProductText = (product) => {
  const specs = JSON.stringify(product.specifications || {});
  return `${product.name} by ${product.brand}. Price: INR ${product.price}. ${product.description}. Specs: ${specs}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const embedTexts = async (texts) => {
  const response = await fetch("https://api.cohere.ai/v2/embed", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.cohereApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      texts,
      model: "embed-english-v3.0",
      input_type: "search_document",
      embedding_types: ["float"]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cohere API error: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const vectors = payload?.embeddings?.float;
  if (!Array.isArray(vectors) || vectors.length !== texts.length) {
    throw new Error("Invalid embeddings response from Cohere");
  }

  return vectors;
};

const run = async () => {
  if (!env.cohereApiKey) {
    throw new Error("Missing COHERE_API_KEY in environment");
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name, description, brand, price, specifications")
    .order("id", { ascending: true });

  if (error) throw error;

  const rows = products || [];
  if (!rows.length) {
    console.log("No products found to embed.");
    return;
  }

  let processed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildProductText);
    const vectors = await embedTexts(texts);

    const upsertRows = batch.map((product, idx) => ({
      id: product.id,
      embedding: vectors[idx],
      embedded_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabaseAdmin
      .from("product_embeddings")
      .upsert(upsertRows, { onConflict: "id" });

    if (upsertError) throw upsertError;

    for (const product of batch) {
      processed += 1;
      console.log(`Embedded product ${processed}/${rows.length}: ${product.name}`);
    }

    if (i + BATCH_SIZE < rows.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("Embedding generation complete.");
};

run().catch((error) => {
  console.error("Embedding script failed:", error.message);
  process.exit(1);
});
