"use client";

import { useEffect, useState } from "react";
import { AuctionForm, type AuctionFormValues } from "@/components/AuctionForm";
import { ItemForm, type ItemFormValues } from "@/components/ItemForm";

type Auction = {
  id: number;
  itemName: string;
  series: string | null;
  character: string | null;
  category: string | null;
  platform: string | null;
  auctionUrl: string | null;
  currentPrice: number | null;
  myMaxBid: number | null;
  auctionEndTime: string | null;
  imageUrl: string | null;
  status: string;
  notes: string | null;
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
    (async () => {
      await loadAuctions();
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const formatBeijing = (iso: string | null): string => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

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
              series: editingAuction.series ?? "",
              character: editingAuction.character ?? "",
              category: editingAuction.category ?? "",
              platform: editingAuction.platform ?? "",
              auctionUrl: editingAuction.auctionUrl ?? "",
              currentPrice: editingAuction.currentPrice ?? undefined,
              myMaxBid: editingAuction.myMaxBid ?? undefined,
              auctionEndTime: editingAuction.auctionEndTime ?? undefined,
              imageUrl: editingAuction.imageUrl ?? null,
              status: editingAuction.status,
              notes: editingAuction.notes ?? "",
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                className="flex flex-col overflow-hidden rounded-xl border bg-white text-sm shadow-sm"
              >
                <div className="relative h-40 w-full bg-zinc-100">
                  {auction.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={auction.imageUrl}
                      alt={auction.itemName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {auction.platform ?? "Unknown platform"}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-semibold text-zinc-900">
                      {auction.itemName}
                    </div>
                    {auction.auctionUrl ? (
                      <a
                        href={auction.auctionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block break-all text-[11px] text-blue-600 underline"
                      >
                        {auction.auctionUrl}
                      </a>
                    ) : (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        No source URL
                      </div>
                    )}
                  </div>

                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <div className="text-xs text-zinc-500">Current price</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {auction.currentPrice !== null
                        ? auction.currentPrice.toLocaleString()
                        : "—"}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-2 py-1.5">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                        Ends (Beijing)
                      </span>
                      <span className="text-xs text-zinc-900">
                        {formatBeijing(auction.auctionEndTime)}
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white">
                      {formatCountdown(auction.auctionEndTime)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                      {auction.status}
                    </span>
                    <div className="flex flex-wrap gap-1 text-[11px]">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

