import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { parsePagination } from "../utils/pagination.js";
import { sendOrderStatusEmail } from "../utils/mailer.js";
import {
  adminCreateProductSchema,
  adminOrderStatusSchema,
  adminUpdateProductSchema,
  idParamSchema,
  parseOrThrow
} from "../utils/validators.js";

const router = Router();

router.get("/dashboard", async (req, res, next) => {
  try {
    const [usersResult, ordersResult, productsResult] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("total", { count: "exact" }),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true })
    ]);

    const totalUsers = usersResult.count || 0;
    const totalOrders = ordersResult.count || 0;
    const totalProducts = productsResult.count || 0;
    const revenue = (ordersResult.data || []).reduce((sum, order) => sum + Number(order.total || 0), 0);

    res.json({
      data: {
        totalUsers,
        totalOrders,
        totalProducts,
        revenue
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const { from, to, page, limit } = parsePagination(req.query);

    let query = supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (q) {
      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, meta: { page, limit, total: count || 0 } });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const { status } = req.query;
    const { from, to, page, limit } = parsePagination(req.query);

    let query = supabaseAdmin
      .from("orders")
      .select("*, users(email, full_name), addresses(city, state)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, meta: { page, limit, total: count || 0 } });
  } catch (error) {
    next(error);
  }
});

router.put("/orders/:id/status", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { status } = parseOrThrow(adminOrderStatusSchema, req.body);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    if (["delivered", "cancelled"].includes(status)) {
      const { data: orderWithUser } = await supabaseAdmin
        .from("orders")
        .select("id, status, users(email)")
        .eq("id", id)
        .single();

      sendOrderStatusEmail({
        to: orderWithUser?.users?.email,
        orderId: orderWithUser?.id,
        status: orderWithUser?.status
      }).catch((mailError) => {
        console.error("Order status email failed", mailError?.message || mailError);
      });
    }

    res.json({ message: "Order status updated", data });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const payload = parseOrThrow(adminCreateProductSchema, req.body);
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Product created", data });
  } catch (error) {
    next(error);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const payload = parseOrThrow(adminUpdateProductSchema, req.body);

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    res.json({ message: "Product updated", data });
  } catch (error) {
    next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
