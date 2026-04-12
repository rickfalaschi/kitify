"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!,
);

function CheckoutForm({
  orderId,
  total,
}: {
  orderId: string;
  total: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError("");
    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/orders/${orderId}/pay`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-10 px-6 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {processing ? "Processing..." : `Pay £${total}`}
      </button>
    </form>
  );
}

export function PaymentForm({
  clientSecret,
  orderId,
  total,
}: {
  clientSecret: string;
  orderId: string;
  total: string;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#111827",
            borderRadius: "8px",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          },
        },
      }}
    >
      <CheckoutForm orderId={orderId} total={total} />
    </Elements>
  );
}
