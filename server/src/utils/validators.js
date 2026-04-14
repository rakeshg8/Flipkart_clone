import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const cartAddSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(10).default(1)
});

export const cartUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10)
});

export const wishlistToggleSchema = z.object({
  product_id: z.coerce.number().int().positive()
});

export const placeOrderSchema = z.object({
  address_id: z.coerce.number().int().positive(),
  discount: z.coerce.number().min(0).default(0)
});

export const addressCreateSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(15),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().min(4).max(10),
  is_default: z.boolean().optional().default(false)
});

export const addressUpdateSchema = addressCreateSchema.partial();

export const adminOrderStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"])
});

const productBaseSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().min(5),
  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  category_id: z.coerce.number().int().positive(),
  brand: z.string().trim().min(1),
  rating: z.coerce.number().min(0).max(5).default(0),
  review_count: z.coerce.number().int().min(0).default(0),
  images: z.array(z.string().url()).min(1),
  specifications: z.record(z.any()).default({})
});

export const adminCreateProductSchema = productBaseSchema.refine((data) => data.mrp >= data.price, {
  message: "mrp must be greater than or equal to price",
  path: ["mrp"]
});

export const adminUpdateProductSchema = productBaseSchema.partial().superRefine((data, ctx) => {
  if (data.mrp !== undefined && data.price !== undefined && data.mrp < data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "mrp must be greater than or equal to price",
      path: ["mrp"]
    });
  }
});

export const parseOrThrow = (schema, value) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message || "Invalid request payload");
    error.status = 400;
    throw error;
  }
  return parsed.data;
};
