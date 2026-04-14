import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { parseOrThrow, wishlistToggleSchema } from "../utils/validators.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("wishlist")
      .select("id, created_at, products(*)")
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
    const { product_id } = parseOrThrow(wishlistToggleSchema, req.body);

    const { data: existing } = await supabaseAdmin
      .from("wishlist")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("product_id", product_id)
      .single();

    if (existing?.id) {
      const { error } = await supabaseAdmin.from("wishlist").delete().eq("id", existing.id);
      if (error) throw error;
      return res.json({ message: "Removed from wishlist", inWishlist: false });
    }

    const { error } = await supabaseAdmin
      .from("wishlist")
      .insert({ user_id: req.user.id, product_id });

    if (error) throw error;
    res.status(201).json({ message: "Added to wishlist", inWishlist: true });
  } catch (error) {
    next(error);
  }
});

export default router;
