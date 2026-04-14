import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

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
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1) {
      return res.status(400).json({ message: "Invalid cart payload" });
    }

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
    const id = Number(req.params.id);
    const { quantity } = req.body;

    if (!id || quantity < 1) {
      return res.status(400).json({ message: "Invalid payload" });
    }

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
    const id = Number(req.params.id);

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
