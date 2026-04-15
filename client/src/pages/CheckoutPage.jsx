import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/http";
import { useCart } from "../contexts/CartContext";
import PriceSummary from "../components/common/PriceSummary";

const steps = ["Address", "Order Summary", "Payment"];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, fetchCart } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false
  });

  useEffect(() => {
    api.get("/addresses").then((res) => {
      setAddresses(res.data.data || []);
      const defaultAddress = (res.data.data || []).find((a) => a.is_default) || (res.data.data || [])[0];
      setSelectedAddress(defaultAddress?.id || null);
    });
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0), [items]);
  const mrpTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.products.mrp) * item.quantity, 0), [items]);
  const discount = mrpTotal - subtotal;

  const continueToSummary = () => {
    if (!selectedAddress) {
      toast.error("Select an address first");
      return;
    }
    setActiveStep(1);
  };

  const continueToPayment = () => {
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }
    setActiveStep(2);
  };

  const addAddress = async () => {
    const { data } = await api.post("/addresses", form);
    setAddresses((prev) => [data.data, ...prev]);
    setSelectedAddress(data.data.id);
    setForm({ full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", is_default: false });
    toast.success("Address added");
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Select an address first");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/orders", { address_id: selectedAddress, discount });
      await fetchCart();
      navigate(`/order-confirmation/${data.data.order_id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main py-4">
      <div className="mb-4 fk-card p-4">
        <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
          {steps.map((step, idx) => (
            <div key={step} className={`flex-1 rounded px-3 py-2 text-center ${idx <= activeStep ? "bg-fkBlue text-white" : "bg-slate-100"}`}>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {activeStep === 0 && (
            <div className="fk-card p-4">
              <h2 className="text-base font-semibold">Select Delivery Address</h2>
              <div className="mt-3 space-y-2">
                {addresses.map((address) => (
                  <label key={address.id} className="block rounded border p-3 text-sm">
                    <input
                      type="radio"
                      checked={selectedAddress === address.id}
                      onChange={() => setSelectedAddress(address.id)}
                      className="mr-2"
                    />
                    <span className="font-semibold">{address.full_name}</span>, {address.line1}, {address.city} - {address.pincode}
                  </label>
                ))}
              </div>
              <button type="button" onClick={continueToSummary} className="mt-4 rounded bg-fkOrange px-4 py-2 text-sm font-semibold text-white">
                CONTINUE
              </button>

              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold">Add New Address</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {Object.keys(form).map((key) =>
                    key === "is_default" ? null : (
                      <input
                        key={key}
                        placeholder={key.replace("_", " ")}
                        value={form[key]}
                        onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                        className="rounded border px-3 py-2 text-sm"
                      />
                    )
                  )}
                </div>
                <button type="button" onClick={addAddress} className="mt-3 rounded border border-fkBlue px-4 py-2 text-sm font-semibold text-fkBlue">
                  Add Address
                </button>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="fk-card p-4">
              <h2 className="text-base font-semibold">Order Summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between border-b py-2">
                    <span>
                      {item.products.name} x {item.quantity}
                    </span>
                    <span>₹{(Number(item.products.price) * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={continueToPayment} className="mt-4 rounded bg-fkOrange px-4 py-2 text-sm font-semibold text-white">
                CONTINUE
              </button>
            </div>
          )}

          {activeStep === 2 && (
            <div className="fk-card p-4">
              <h2 className="text-base font-semibold">Payment Method</h2>
              <label className="mt-3 flex items-center gap-2 rounded border p-3 text-sm">
                <input type="radio" checked disabled readOnly />
                <span className="font-medium">Cash on Delivery (COD)</span>
              </label>
              <p className="mt-2 text-xs text-slate-500">Online payment coming soon</p>
            </div>
          )}
        </div>

        <PriceSummary
          subtotal={subtotal}
          discount={discount}
          total={subtotal}
          onPlaceOrder={placeOrder}
          loading={loading}
          disabled={activeStep !== 2 || !selectedAddress || !items.length}
          ctaLabel={activeStep === 2 ? "PLACE ORDER" : "Complete steps to place order"}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;
