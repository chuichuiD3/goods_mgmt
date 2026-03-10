"use client";

import { useEffect, useState } from "react";
import { AuctionForm, type AuctionFormValues } from "@/components/AuctionForm";
import { ItemForm, type ItemFormValues } from "@/components/ItemForm";

type Auction = {
  id: number;
  itemName: string;
  platform: string | null;
  currentPrice: number | null;
  auctionEndTime: string | null;
  status: string;
};

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [creatingItemFromAuction, setCreatingItemFromAuction] =
    useState<Auction | null>(null);

  const loadAuctions = async () => {
    setLoading(true);
    const res = await fetch("/api/auctions");
    const data = await res.json();
    setAuctions(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadAuctions();
  }, []);

  const handleCreate = async (values: AuctionFormValues) => {
    await fetch("/api/auctions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingAuction(null);
    await loadAuctions();
  };

  const handleUpdate = async (id: number, values: AuctionFormValues) => {
    await fetch(`/api/auctions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditingAuction(null);
    await loadAuctions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this auction?")) return;
    await fetch(`/api/auctions/${id}`, { method: "DELETE" });
    await loadAuctions();
  };

  const handleConvertToItem = (auction: Auction) => {
    setCreatingItemFromAuction(auction);
  };

  const createItemFromAuction = async (values: ItemFormValues) => {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        sourceType: "AUCTION",
      }),
    });
    if (creatingItemFromAuction) {
      await fetch(`/api/auctions/${creatingItemFromAuction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WON" }),
      });
    }
    setCreatingItemFromAuction(null);
    await loadAuctions();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Auctions</h1>
          <button
            onClick={() => setEditingAuction({} as Auction)}
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add auction
          </button>
        </div>

        {editingAuction && (
          <div className="mb-6 rounded border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">
              {editingAuction.id ? "Edit auction" : "New auction"}
            </h2>
            <AuctionForm
              initialValues={
                editingAuction.id
                  ? {
                      itemName: editingAuction.itemName,
                      platform: editingAuction.platform ?? "",
                      currentPrice: editingAuction.currentPrice ?? undefined,
                      auctionEndTime: editingAuction.auctionEndTime ?? undefined,
                      status: editingAuction.status,
                    }
                  : undefined
              }
              onSubmit={(values) =>
                editingAuction.id
                  ? handleUpdate(editingAuction.id, values)
                  : handleCreate(values)
              }
            />
          </div>
        )}

        {creatingItemFromAuction && (
          <div className="mb-6 rounded border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">
              Convert auction to item
            </h2>
            <ItemForm
              initialValues={{
                itemName: creatingItemFromAuction.itemName,
                platform: creatingItemFromAuction.platform ?? "",
                price: creatingItemFromAuction.currentPrice ?? undefined,
                status: "PENDING_PAYMENT",
                sourceType: "AUCTION",
              }}
              onSubmit={createItemFromAuction}
              submitLabel="Create item from auction"
            />
          </div>
        )}

        <div className="rounded border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">All auctions</h2>
          {loading ? (
            <div className="text-xs text-zinc-500">Loading…</div>
          ) : auctions.length === 0 ? (
            <div className="text-xs text-zinc-500">No auctions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-zinc-100 text-xs">
                  <tr>
                    <th className="border px-2 py-1 text-left">Item</th>
                    <th className="border px-2 py-1 text-left">Platform</th>
                    <th className="border px-2 py-1 text-left">Current price</th>
                    <th className="border px-2 py-1 text-left">End time</th>
                    <th className="border px-2 py-1 text-left">Status</th>
                    <th className="border px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map((auction) => (
                    <tr key={auction.id}>
                      <td className="border px-2 py-1">{auction.itemName}</td>
                      <td className="border px-2 py-1">
                        {auction.platform ?? "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {auction.currentPrice ?? "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {auction.auctionEndTime
                          ? new Date(auction.auctionEndTime).toLocaleString()
                          : "-"}
                      </td>
                      <td className="border px-2 py-1">{auction.status}</td>
                      <td className="border px-2 py-1">
                        <div className="flex flex-wrap gap-1 text-xs">
                          <button
                            onClick={() => setEditingAuction(auction)}
                            className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(auction.id)}
                            className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleConvertToItem(auction)}
                            className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                          >
                            Mark as won → Item
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
    </div>
  );
}

