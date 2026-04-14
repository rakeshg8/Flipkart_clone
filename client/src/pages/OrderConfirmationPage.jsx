import { CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + 5);

  return (
    <div className="container-main py-12">
      <div className="mx-auto max-w-xl fk-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 animate-bounce text-green-600" />
        <h1 className="mt-4 text-2xl font-semibold">Order Confirmed</h1>
        <p className="mt-2 text-sm text-slate-600">Your order #{id} has been placed successfully.</p>
        <p className="mt-2 text-sm text-slate-600">Estimated delivery: {estimated.toDateString()}</p>
        <Link to="/products" className="mt-6 inline-block rounded bg-fkBlue px-5 py-2 text-sm font-semibold text-white">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
