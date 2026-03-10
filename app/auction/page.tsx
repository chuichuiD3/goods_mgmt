"use client";

import { useEffect, useState } from "react";
import { AuctionForm, type AuctionFormValues } from "@/components/AuctionForm";
import { ItemForm, type ItemFormValues } from "@/components/ItemForm";

type Auction = {
  id: number;
  itemName: string;
  platform: string | null;
  auctionUrl: string | null;
  currentPrice: number | null;
  auctionEndTime: string | null;
  imageUrl: string | null;
  status: string;
};

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [creatingItemFromAuction, setCreatingItemFromAuction] =
    useState<Auction | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

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

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = (end: string | null) => {
    if (!end) return "—";
    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) return "—";
    const diffMs = endDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Ended";
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
      </div>

      {editingAuction && (
        <div className="mb-6 rounded border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Edit auction</h2>
          <AuctionForm
            initialValues={{
              itemName: editingAuction.itemName,
              platform: editingAuction.platform ?? "",
              currentPrice: editingAuction.currentPrice ?? undefined,
              auctionEndTime: editingAuction.auctionEndTime ?? undefined,
              status: editingAuction.status,
            }}
            onSubmit={(values) =>
              editingAuction ? handleUpdate(editingAuction.id, values) : undefined
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
                  <th className="border px-2 py-1 text-left">Image</th>
                  <th className="border px-2 py-1 text-left">Title</th>
                  <th className="border px-2 py-1 text-left">Platform</th>
                  <th className="border px-2 py-1 text-left">Source URL</th>
                  <th className="border px-2 py-1 text-left">Price</th>
                  <th className="border px-2 py-1 text-left">Currency</th>
                  <th className="border px-2 py-1 text-left">End time</th>
                  <th className="border px-2 py-1 text-left">Countdown</th>
                  <th className="border px-2 py-1 text-left">Status</th>
                  <th className="border px-2 py-1 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auction) => (
                  <tr key={auction.id}>
                    <td className="border px-2 py-1 align-top">
                      {auction.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={auction.imageUrl}
                          alt={auction.itemName}
                          className="h-12 w-12 rounded border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded border text-[10px] text-zinc-400">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="border px-2 py-1 align-top">
                      <div className="max-w-[180px] break-words">
                        {auction.itemName}
                      </div>
                    </td>
                    <td className="border px-2 py-1">
                      {auction.platform ?? "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {auction.auctionUrl ? (
                        <a
                          href={auction.auctionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-xs text-blue-600 underline"
                        >
                          {auction.auctionUrl}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500">–</span>
                      )}
                    </td>
                    <td className="border px-2 py-1">
                      {auction.currentPrice !== null
                        ? auction.currentPrice.toLocaleString()
                        : "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {auction.currentPrice !== null ? "JPY" : "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {auction.auctionEndTime
                        ? new Date(auction.auctionEndTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {formatCountdown(auction.auctionEndTime)}
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

