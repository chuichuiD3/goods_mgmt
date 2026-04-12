"use client";

import { useEffect, useState } from "react";
import {
  CollectionAddItemForm,
  type CollectionAddItemSubmitPayload,
} from "@/components/CollectionAddItemForm";
import { ItemForm, type ItemFormValues } from "@/components/ItemForm";
import { Modal } from "@/components/Modal";
import { formatPriceAmount } from "@/lib/formatPriceAmount";

type Item = {
  id: number;
  itemName: string;
  series: string | null;
  character: string | null;
  category: string | null;
  platform: string | null;
  price: number;
  quantity: number;
  totalAmount: number;
  status: string;
  imageThumbUrl?: string | null;
};

export default function CollectionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const loadItems = async () => {
    setLoading(true);
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await loadItems();
    })();
  }, []);

  const handleCreateCollectionItem = async (
    payload: CollectionAddItemSubmitPayload
  ) => {
    const quantity = 1;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: payload.itemName,
        platform: payload.platform,
        price: payload.price,
        quantity,
        totalAmount: payload.price * quantity,
        status: payload.status,
        orderDate: payload.orderDate ?? undefined,
        notes: payload.notes,
        imageUrl: payload.imageDataUrl,
      }),
    });
    setEditingItem(null);
    await loadItems();
  };

  const modalTitle = editingItem?.id ? "Edit item" : "New item";

  const handleUpdate = async (id: number, values: ItemFormValues) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingItem(null);
    await loadItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    await loadItems();
  };

  const totalCount = items.length;
  const totalSpend = items
    .filter((i) => i.status === "OWNED")
    .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Collection</h1>
          <button
            onClick={() => setEditingItem({} as Item)}
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add item
          </button>
        </div>

        <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs font-medium text-zinc-500">Total items</div>
            <div className="mt-1 text-2xl font-semibold">{totalCount}</div>
          </div>
          <div className="rounded border bg-white p-3 text-sm">
            <div className="text-xs font-medium text-zinc-500">
              Total spend (owned)
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {formatPriceAmount(totalSpend)}
            </div>
          </div>
        </section>

        {editingItem && (
          <Modal title={modalTitle} onClose={() => setEditingItem(null)}>
            {editingItem.id ? (
              <ItemForm
                initialValues={{
                  itemName: editingItem.itemName,
                  series: editingItem.series ?? "",
                  character: editingItem.character ?? "",
                  category: editingItem.category ?? "",
                  platform: editingItem.platform ?? "",
                  price: editingItem.price,
                  quantity: editingItem.quantity,
                  status: editingItem.status,
                }}
                onSubmit={(values) => handleUpdate(editingItem.id!, values)}
              />
            ) : (
              <CollectionAddItemForm onSubmit={handleCreateCollectionItem} />
            )}
          </Modal>
        )}

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">All items</h2>
          {loading ? (
            <div className="text-xs text-zinc-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-zinc-500">No items yet.</div>
          ) : (
            <>
            {/* Mobile card list — hidden on md+ */}
            <div className="space-y-2 md:hidden">
              {items.map((item) => (
                <div key={item.id} className="rounded border bg-white p-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-zinc-100">
                      {item.imageThumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageThumbUrl}
                          alt={item.itemName}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-zinc-900">
                        {item.itemName}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {[item.series, item.character, item.platform]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                          {item.status}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {formatPriceAmount(item.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 border-t pt-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="rounded border px-3 py-1 text-xs hover:bg-zinc-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded border px-3 py-1 text-xs hover:bg-zinc-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table — hidden below md */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-zinc-100 text-xs">
                  <tr>
                    <th className="border px-2 py-1 text-left">Image</th>
                    <th className="border px-2 py-1 text-left">Item</th>
                    <th className="border px-2 py-1 text-left">Series</th>
                    <th className="border px-2 py-1 text-left">Character</th>
                    <th className="border px-2 py-1 text-left">Platform</th>
                    <th className="border px-2 py-1 text-left">Status</th>
                    <th className="border px-2 py-1 text-left">Total</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border px-2 py-1">
                        <div className="h-10 w-10 overflow-hidden rounded border bg-zinc-100">
                          {item.imageThumbUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageThumbUrl}
                              alt={item.itemName}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                              —
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border px-2 py-1">{item.itemName}</td>
                      <td className="border px-2 py-1">
                        {item.series ?? "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {item.character ?? "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {item.platform ?? "-"}
                      </td>
                      <td className="border px-2 py-1">{item.status}</td>
                      <td className="border px-2 py-1">
                        {formatPriceAmount(item.totalAmount)}
                      </td>
                      <td className="border px-2 py-1">
                        <div className="flex flex-wrap gap-1 text-xs">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
    </div>
  );
}

