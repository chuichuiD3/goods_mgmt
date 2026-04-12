"use client";

import { type ChangeEvent } from "react";
import { formatPriceAmount } from "@/lib/formatPriceAmount";

type HoldingOrderItem = {
  id: number;
  groupId: number;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

type HoldingItemRowProps = {
  it: HoldingOrderItem;
  isEditing: boolean;
  eName: string;
  ePrice: string;
  eQty: string;
  eImageUrl: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  setEName: (v: string) => void;
  setEPrice: (v: string) => void;
  setEQty: (v: string) => void;
  onEImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function HoldingItemRow({
  it,
  isEditing,
  eName,
  ePrice,
  eQty,
  eImageUrl,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  setEName,
  setEPrice,
  setEQty,
  onEImageChange,
}: HoldingItemRowProps) {
  return (
    <div className={`rounded border bg-white p-2 text-xs ${isEditing ? "flex flex-col gap-2" : "flex items-center justify-between gap-2"}`}>
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-zinc-100">
          {it.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={it.imageUrl}
              alt={it.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
              —
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="min-w-0 flex-1 space-y-1">
            <input
              value={eName}
              onChange={(e) => setEName(e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs"
              placeholder="Name"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={ePrice}
                onChange={(e) => setEPrice(e.target.value)}
                className="w-24 rounded border px-2 py-1 text-xs"
                placeholder="Price"
              />
              <input
                type="number"
                min={1}
                value={eQty}
                onChange={(e) => setEQty(e.target.value)}
                className="w-16 rounded border px-2 py-1 text-xs"
                placeholder="Qty"
              />
            </div>
            <div className="space-y-1">
              <input
                type="file"
                accept="image/*"
                onChange={onEImageChange}
                className="mt-1 text-[11px]"
              />
              {eImageUrl && (
                <div className="text-[11px] text-zinc-500">New image selected</div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="font-medium text-zinc-900">{it.name}</div>
            <div className="text-zinc-600">
              {formatPriceAmount(it.price)} × {it.quantity}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <button
              className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
              onClick={onSave}
            >
              Save
            </button>
            <button
              className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="text-zinc-900">
              {formatPriceAmount(it.price * it.quantity)}
            </div>
            <button
              className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
              onClick={onStartEdit}
            >
              Edit
            </button>
            <button
              className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
              onClick={onDelete}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
