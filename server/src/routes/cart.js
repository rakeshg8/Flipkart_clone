import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { cartAddSchema, cartUpdateSchema, idParamSchema, parseOrThrow } from "../utils/validators.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .select("id, quantity, created_at, products(*)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { product_id, quantity } = parseOrThrow(cartAddSchema, req.body);

    const { data: existing } = await supabaseAdmin
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", req.user.id)
      .eq("product_id", product_id)
      .single();

    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select("id, quantity")
        .single();

      if (error) throw error;
      return res.status(200).json({ message: "Cart updated", data });
    }

    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .insert({ user_id: req.user.id, product_id, quantity })
      .select("id, quantity")
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Added to cart", data });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { quantity } = parseOrThrow(cartUpdateSchema, req.body);

    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .update({ quantity })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select("id, quantity")
      .single();

    if (error) throw error;
    res.json({ message: "Quantity updated", data });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);

    const { error } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ message: "Item removed" });
  } catch (error) {
    next(error);
  }
});

export default router;
