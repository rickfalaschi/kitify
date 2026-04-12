"use client";

import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";

type Address = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
};

export function AddressesView({
  addresses,
  createAddress,
  deleteAddress,
}: {
  addresses: Address[];
  createAddress: (formData: FormData) => Promise<void>;
  deleteAddress: (formData: FormData) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
          <p className="text-gray-500">Manage your company addresses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-medium h-9 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Address
        </button>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Address</h3>
            <form
              action={async (formData) => {
                try {
                  await createAddress(formData);
                  toast.success("Address created successfully.");
                  setShowForm(false);
                } catch {
                  toast.error("Failed to create address.");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="label" className="text-sm font-medium text-gray-700">
                  Name / Label
                </label>
                <input
                  id="label"
                  name="label"
                  placeholder="e.g. Head Office"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="addressLine1" className="text-sm font-medium text-gray-700">
                  Address line 1
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  placeholder="e.g. 10 Downing Street"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="addressLine2" className="text-sm font-medium text-gray-700">
                  Address line 2 <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="e.g. Floor 3, Suite B"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    placeholder="e.g. London"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="county" className="text-sm font-medium text-gray-700">
                    County <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="county"
                    name="county"
                    placeholder="e.g. Greater London"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="postcode" className="text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <input
                  id="postcode"
                  name="postcode"
                  placeholder="e.g. SW1A 2AA"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="country" className="text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  defaultValue="United Kingdom"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium h-9 px-4 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton>Save</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No addresses registered yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 pb-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {addr.label}
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-3">
                <div className="text-sm text-gray-700 space-y-1">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>
                    {addr.city}
                    {addr.county && `, ${addr.county}`}
                  </p>
                  <p>{addr.postcode}</p>
                  <p>{addr.country}</p>
                </div>
                <form onSubmit={(e) => { if (!confirm("Are you sure you want to delete this address?")) e.preventDefault(); }} action={async (formData) => {
                  try {
                    await deleteAddress(formData);
                    toast.success("Address deleted.");
                  } catch {
                    toast.error("Failed to delete address.");
                  }
                }}>
                  <input type="hidden" name="addressId" value={addr.id} />
                  <SubmitButton variant="secondary" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
