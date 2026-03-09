"use client";

import { useEffect, useState } from "react";
import {
  WishlistForm,
  type WishlistFormValues,
} from "@/components/WishlistForm";
import { ItemForm, type ItemFormValues } from "@/components/ItemForm";

type WishlistItem = {
  id: number;
  itemName: string;
  character: string | null;
  expectedPrice: number | null;
  addedAt: string;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [movingToItem, setMovingToItem] = useState<WishlistItem | null>(null);

  const loadItems = async () => {
    setLoading(true);
    const res = await fetch("/api/wishlist");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const handleCreate = async (values: WishlistFormValues) => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingItem(null);
    await loadItems();
  };

  const handleUpdate = async (id: number, values: WishlistFormValues) => {
    await fetch(`/api/wishlist/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingItem(null);
    await loadItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this wishlist item?")) return;
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    await loadItems();
  };

  const createItemFromWishlist = async (values: ItemFormValues) => {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        sourceType: "DIRECT_PURCHASE",
      }),
    });
    if (movingToItem) {
      await fetch(`/api/wishlist/${movingToItem.id}`, {
        method: "DELETE",
      });
    }
    setMovingToItem(null);
    await loadItems();
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Wishlist</h1>
          <button
            onClick={() => setEditingItem({} as WishlistItem)}
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add wishlist item
          </button>
        </div>

        {editingItem && (
          <div className="mb-6 rounded border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">
              {editingItem.id ? "Edit wishlist item" : "New wishlist item"}
            </h2>
            <WishlistForm
              initialValues={
                editingItem.id
                  ? {
                      itemName: editingItem.itemName,
                      character: editingItem.character ?? "",
                      expectedPrice: editingItem.expectedPrice ?? undefined,
                    }
                  : undefined
              }
              onSubmit={(values) =>
                editingItem.id
                  ? handleUpdate(editingItem.id, values)
                  : handleCreate(values)
              }
            />
          </div>
        )}

        {movingToItem && (
          <div className="mb-6 rounded border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">
              Move wishlist item to collection
            </h2>
            <ItemForm
              initialValues={{
                itemName: movingToItem.itemName,
                character: movingToItem.character ?? "",
                price: movingToItem.expectedPrice ?? undefined,
                status: "PENDING_PAYMENT",
                sourceType: "DIRECT_PURCHASE",
              }}
              onSubmit={createItemFromWishlist}
              submitLabel="Create item and remove from wishlist"
            />
          </div>
        )}

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Wishlist items</h2>
          {loading ? (
            <div className="text-xs text-zinc-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-zinc-500">No wishlist items yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-zinc-100 text-xs">
                  <tr>
                    <th className="border px-2 py-1 text-left">Item</th>
                    <th className="border px-2 py-1 text-left">Character</th>
                    <th className="border px-2 py-1 text-left">Expected price</th>
                    <th className="border px-2 py-1 text-left">Added at</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border px-2 py-1">{item.itemName}</td>
                      <td className="border px-2 py-1">
                        {item.character ?? "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {item.expectedPrice ?? "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {new Date(item.addedAt).toLocaleDateString()}
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
                          <button
                            onClick={() => setMovingToItem(item)}
                            className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                          >
                            Move to item
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

