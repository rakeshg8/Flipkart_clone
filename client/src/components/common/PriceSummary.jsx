const PriceSummary = ({ subtotal = 0, discount = 0, total = 0, onPlaceOrder, loading }) => {
  return (
    <div className="fk-card sticky top-24 p-4">
      <h3 className="border-b pb-3 text-sm font-semibold text-slate-600">PRICE DETAILS</h3>
      <div className="space-y-2 py-3 text-sm">
        <div className="flex justify-between">
          <span>Price</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span className="text-green-700">-₹{discount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Charges</span>
          <span className="text-green-700">FREE</span>
        </div>
      </div>
      <div className="flex justify-between border-y py-3 text-base font-semibold">
        <span>Total Amount</span>
        <span>₹{total.toLocaleString("en-IN")}</span>
      </div>
      {onPlaceOrder && (
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={loading}
          className="mt-4 w-full rounded bg-fkOrange py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Placing..." : "PLACE ORDER"}
        </button>
      )}
      <p className="mt-3 text-xs text-green-700">You will save ₹{discount.toLocaleString("en-IN")} on this order</p>
    </div>
  );
};

export default PriceSummary;
