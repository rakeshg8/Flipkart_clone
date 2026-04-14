import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/http";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  mrp: "",
  stock: "",
  category_id: "",
  brand: "",
  rating: "4.0",
  review_count: "0",
  images: "",
  specifications: "{}"
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [p, c] = await Promise.all([api.get("/admin/products"), api.get("/categories")]);
    setProducts(p.data.data || []);
    setCategories(c.data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const title = useMemo(() => (editing ? "Edit Product" : "Add Product"), [editing]);

  const toPayload = () => ({
    ...form,
    price: Number(form.price),
    mrp: Number(form.mrp),
    stock: Number(form.stock),
    category_id: Number(form.category_id),
    rating: Number(form.rating),
    review_count: Number(form.review_count),
    images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
    specifications: JSON.parse(form.specifications || "{}")
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      ...product,
      images: (product.images || []).join(", "),
      specifications: JSON.stringify(product.specifications || {}, null, 2)
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const payload = toPayload();
      if (editing) {
        await api.put(`/admin/products/${editing.id}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }
      toast.success(editing ? "Product updated" : "Product created");
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error.message || "Failed to save product");
    }
  };

  const removeProduct = async (id) => {
    await api.delete(`/admin/products/${id}`);
    toast.success("Product deleted");
    await load();
  };

  return (
    <div className="fk-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">Products</h1>
        <button type="button" onClick={openCreate} className="rounded bg-fkBlue px-3 py-2 text-sm font-semibold text-white">
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Brand</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2">{product.brand}</td>
                <td className="px-3 py-2">₹{Number(product.price).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{product.stock}</td>
                <td className="space-x-2 px-3 py-2">
                  <button type="button" onClick={() => openEdit(product)} className="text-xs font-semibold text-fkBlue">
                    Edit
                  </button>
                  <button type="button" onClick={() => removeProduct(product.id)} className="text-xs font-semibold text-rose-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded bg-white p-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="Brand" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="MRP" value={form.mrp} onChange={(e) => setForm((p) => ({ ...p, mrp: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
              <input placeholder="Stock" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
              <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="rounded border px-3 py-2 text-sm">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input placeholder="Rating" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} className="rounded border px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-2 w-full rounded border px-3 py-2 text-sm" rows={3} />
            <textarea placeholder="Images (comma-separated URLs)" value={form.images} onChange={(e) => setForm((p) => ({ ...p, images: e.target.value }))} className="mt-2 w-full rounded border px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Specifications JSON" value={form.specifications} onChange={(e) => setForm((p) => ({ ...p, specifications: e.target.value }))} className="mt-2 w-full rounded border px-3 py-2 text-sm font-mono" rows={4} />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="button" onClick={submit} className="rounded bg-fkBlue px-4 py-2 text-sm font-semibold text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
