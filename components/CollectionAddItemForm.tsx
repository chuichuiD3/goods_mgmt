"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

export type CollectionAddItemSubmitPayload = {
  itemName: string;
  platform: string | null;
  price: number;
  status: string;
  orderDate: string | null;
  notes: string | null;
  imageDataUrl: string | null;
};

type CollectionAddItemFormProps = {
  onSubmit: (payload: CollectionAddItemSubmitPayload) => Promise<void> | void;
  submitLabel?: string;
};

export function CollectionAddItemForm({
  onSubmit,
  submitLabel = "Add item",
}: CollectionAddItemFormProps) {
  const [itemName, setItemName] = useState("");
  const [platform, setPlatform] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [status, setStatus] = useState("OWNED");
  const [orderDate, setOrderDate] = useState("");
  const [notes, setNotes] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (itemName.trim() === "") return;

    const price = priceInput.trim() === "" ? 0 : Number(priceInput);
    if (!Number.isFinite(price) || price < 0) return;

    await onSubmit({
      itemName: itemName.trim(),
      platform: platform.trim() === "" ? null : platform.trim(),
      price,
      status,
      orderDate: orderDate.trim() === "" ? null : orderDate.trim(),
      notes: notes.trim() === "" ? null : notes.trim(),
      imageDataUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Item name</label>
        <input
          required
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Platform</label>
        <input
          type="text"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Price</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="PENDING_PAYMENT">Pending payment</option>
          <option value="OWNED">Owned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Order date</label>
        <input
          type="date"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageFile}
          className="mt-1 text-xs"
        />
        {imageDataUrl && (
          <div>
            <div className="text-xs font-medium text-zinc-500">Preview</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={itemName || "Item image"}
              className="mt-1 max-h-40 w-auto rounded border object-contain"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
