import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { addressCreateSchema, addressUpdateSchema, idParamSchema, parseOrThrow } from "../utils/validators.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("user_id", req.user.id)
      .order("is_default", { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = { ...parseOrThrow(addressCreateSchema, req.body), user_id: req.user.id };

    if (payload.is_default) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from("addresses")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json({ data, message: "Address added" });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const payload = { ...parseOrThrow(addressUpdateSchema, req.body) };

    if (payload.is_default) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", req.user.id);
    }

    const { data, error } = await supabaseAdmin
      .from("addresses")
      .update(payload)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select("*")
      .single();

    if (error) throw error;
    res.json({ data, message: "Address updated" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);

    const { error } = await supabaseAdmin
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ message: "Address deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
