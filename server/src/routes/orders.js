import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { address_id, discount = 0 } = req.body;

    if (!address_id) {
      return res.status(400).json({ message: "address_id is required" });
    }

    const { data, error } = await supabaseAdmin.rpc("place_order_atomic", {
      p_user_id: req.user.id,
      p_address_id: address_id,
      p_discount: Number(discount)
    });

    if (error) throw error;
    res.status(201).json({ message: "Order placed", data });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(quantity, price_at_purchase, products(name, slug, images))")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, addresses(*), order_items(quantity, price_at_purchase, products(*))")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
