"use client";

import { useTransition } from "react";
import { toast } from "sonner";

export function CancelOrderButton({
  orderId,
  cancelAction,
  label = "Cancel Order",
  confirmText = "Are you sure you want to cancel this order? This action cannot be undone.",
}: {
  orderId: string;
  cancelAction: (formData: FormData) => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        const formData = new FormData();
        formData.set("orderId", orderId);
        startTransition(async () => {
          try {
            await cancelAction(formData);
            toast.success("Order cancelled.");
          } catch (err) {
            const message =
              err instanceof Error && err.message
                ? err.message
                : "Could not cancel the order.";
            toast.error(message);
          }
        });
      }}
      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 text-sm font-medium h-9 px-4 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {isPending ? "Cancelling..." : label}
    </button>
  );
}
