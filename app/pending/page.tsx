"use client";

import { useEffect, useMemo, useState } from "react";

type MerchantPreorderStatus =
  | "ordered"
  | "pending_final_payment"
  | "fully_paid"
  | "received";

type HoldingOrderStatus = "holding" | "ready_to_ship" | "shipped" | "received";
type HoldingOrderTimeMode = "duration" | "fixed_date" | "none";

type MerchantPreorderItem = {
  id: number;
  name: string;
  imageUrl: string | null;
  sellerName: string;
  platform: string | null;
  purchaseDate: string;
  amountPaid: number | null;
  status: MerchantPreorderStatus;
  note: string | null;
};

type HoldingOrderItem = {
  id: number;
  groupId: number;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

type HoldingOrderGroup = {
  id: number;
  sellerName: string;
  platform: string | null;
  purchaseDate: string;
  timeMode: HoldingOrderTimeMode;
  durationDays: number | null;
  deadline: string | null;
  computedDeadline: string | null;
  shippingThreshold: number | null;
  status: HoldingOrderStatus;
  note: string | null;
  items: HoldingOrderItem[];
};

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return 0;
  const diffMs = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

function countdown(deadlineIso: string | null, now: Date): string {
  if (!deadlineIso) return "—";
  const d = new Date(deadlineIso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const totalMin = Math.floor(diff / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDateInputValue(date: string): string {
  // Interpret as local date at noon to avoid timezone shifting across days.
  return new Date(`${date}T12:00:00`).toISOString();
}

export default function PendingPage() {
  const [activeTab, setActiveTab] = useState<"MERCHANT" | "HOLDING">("MERCHANT");
  const [now, setNow] = useState<Date>(() => new Date());

  const [merchant, setMerchant] = useState<MerchantPreorderItem[]>([]);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [merchantEditingId, setMerchantEditingId] = useState<number | null>(null);

  const [holding, setHolding] = useState<HoldingOrderGroup[]>([]);
  const [holdingLoading, setHoldingLoading] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  // Merchant create form
  const [mName, setMName] = useState("");
  const [mSeller, setMSeller] = useState("");
  const [mPlatform, setMPlatform] = useState("");
  const [mPurchaseDate, setMPurchaseDate] = useState<string>(() =>
    toDateInputValue(new Date().toISOString())
  );
  const [mAmountPaid, setMAmountPaid] = useState<string>("");
  const [mStatus, setMStatus] = useState<MerchantPreorderStatus>("ordered");
  const [mImageUrl, setMImageUrl] = useState<string>("");
  const [mNote, setMNote] = useState<string>("");

  // Holding group create form
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [gSeller, setGSeller] = useState("");
  const [gPlatform, setGPlatform] = useState("");
  const [gPurchaseDate, setGPurchaseDate] = useState<string>(() =>
    toDateInputValue(new Date().toISOString())
  );
  const [gTimeMode, setGTimeMode] = useState<HoldingOrderTimeMode>("duration");
  const [gDurationPreset, setGDurationPreset] = useState<string>("90");
  const [gDurationCustom, setGDurationCustom] = useState<string>("");
  const [gFixedDate, setGFixedDate] = useState<string>("");
  const [gShippingThreshold, setGShippingThreshold] = useState<string>("");
  const [gNote, setGNote] = useState<string>("");
  const [gStatus, setGStatus] = useState<HoldingOrderStatus>("holding");

  // Holding item create form (per expanded group)
  const [iName, setIName] = useState("");
  const [iPrice, setIPrice] = useState<string>("");
  const [iQty, setIQty] = useState<string>("1");
  const [iImageUrl, setIImageUrl] = useState<string | null>(null);

  // Holding item edit form (single item at a time)
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [ePrice, setEPrice] = useState<string>("");
  const [eQty, setEQty] = useState<string>("1");
  const [eImageUrl, setEImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadMerchant = async () => {
    setMerchantLoading(true);
    const res = await fetch("/api/pending/merchant");
    const data = await res.json();
    setMerchant(data);
    setMerchantLoading(false);
  };

  const loadHolding = async () => {
    setHoldingLoading(true);
    const res = await fetch("/api/pending/holding-groups");
    const data = await res.json();
    setHolding(data);
    setHoldingLoading(false);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadMerchant(), loadHolding()]);
    })();
  }, []);

  const merchantCounts = useMemo(() => {
    const total = merchant.length;
    const active = merchant.filter((m) => m.status !== "received").length;
    return { total, active };
  }, [merchant]);

  const holdingCounts = useMemo(() => {
    const total = holding.length;
    const active = holding.filter((g) => g.status !== "received").length;
    return { total, active };
  }, [holding]);

  const createMerchant = async () => {
    await fetch("/api/pending/merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: mName,
        sellerName: mSeller,
        platform: mPlatform.trim() === "" ? null : mPlatform.trim(),
        purchaseDate: fromDateInputValue(mPurchaseDate),
        amountPaid: mAmountPaid.trim() === "" ? null : Number(mAmountPaid),
        status: mStatus,
        imageUrl: mImageUrl.trim() === "" ? null : mImageUrl.trim(),
        note: mNote.trim() === "" ? null : mNote.trim(),
      }),
    });
    setMName("");
    setMSeller("");
    setMPlatform("");
    setMAmountPaid("");
    setMStatus("ordered");
    setMImageUrl("");
    setMNote("");
    await loadMerchant();
  };

  const saveMerchant = async (item: MerchantPreorderItem) => {
    await fetch(`/api/pending/merchant/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setMerchantEditingId(null);
    await loadMerchant();
  };

  const deleteMerchant = async (id: number) => {
    if (!confirm("Delete this preorder?")) return;
    await fetch(`/api/pending/merchant/${id}`, { method: "DELETE" });
    await loadMerchant();
  };

  const markMerchantReceived = async (id: number) => {
    await fetch(`/api/pending/merchant/${id}/mark-received`, { method: "POST" });
    await loadMerchant();
  };

  const createGroup = async () => {
    const durationDays =
      gTimeMode !== "duration"
        ? null
        : gDurationPreset === "custom"
          ? gDurationCustom.trim() === ""
            ? null
            : Number(gDurationCustom)
          : Number(gDurationPreset);

    const deadlineIso =
      gTimeMode !== "fixed_date"
        ? null
        : gFixedDate.trim() === ""
          ? null
          : fromDateInputValue(gFixedDate);

    const body = {
      sellerName: gSeller,
      platform: gPlatform.trim() === "" ? null : gPlatform.trim(),
      purchaseDate: fromDateInputValue(gPurchaseDate),
      timeMode: gTimeMode,
      durationDays,
      deadline: deadlineIso,
      shippingThreshold:
        gShippingThreshold.trim() === "" ? null : Number(gShippingThreshold),
      note: gNote.trim() === "" ? null : gNote.trim(),
      status: gStatus,
    };

    if (editingGroupId) {
      await fetch(`/api/pending/holding-groups/${editingGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/pending/holding-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setEditingGroupId(null);
    setGSeller("");
    setGPlatform("");
    setGPurchaseDate(toDateInputValue(new Date().toISOString()));
    setGTimeMode("duration");
    setGDurationPreset("90");
    setGDurationCustom("");
    setGFixedDate("");
    setGShippingThreshold("");
    setGNote("");
    setGStatus("holding");
    await loadHolding();
  };

  const startEditGroup = (g: HoldingOrderGroup) => {
    setEditingGroupId(g.id);
    setGSeller(g.sellerName);
    setGPlatform(g.platform ?? "");
    setGPurchaseDate(toDateInputValue(g.purchaseDate) || toDateInputValue(new Date().toISOString()));
    setGTimeMode(g.timeMode);
    setGShippingThreshold(g.shippingThreshold != null ? String(g.shippingThreshold) : "");
    setGNote(g.note ?? "");
    setGStatus(g.status);

    if (g.timeMode === "duration") {
      const d = g.durationDays ?? 90;
      if (d === 30 || d === 90 || d === 180) {
        setGDurationPreset(String(d));
        setGDurationCustom("");
      } else {
        setGDurationPreset("custom");
        setGDurationCustom(String(d));
      }
      setGFixedDate("");
    } else if (g.timeMode === "fixed_date") {
      setGFixedDate(toDateInputValue(g.deadline ?? g.computedDeadline));
      setGDurationPreset("90");
      setGDurationCustom("");
    } else {
      setGDurationPreset("90");
      setGDurationCustom("");
      setGFixedDate("");
    }
  };

  const cancelEditGroup = () => {
    setEditingGroupId(null);
    setGSeller("");
    setGPlatform("");
    setGPurchaseDate(toDateInputValue(new Date().toISOString()));
    setGTimeMode("duration");
    setGDurationPreset("90");
    setGDurationCustom("");
    setGFixedDate("");
    setGShippingThreshold("");
    setGNote("");
    setGStatus("holding");
  };

  const updateGroupStatus = async (groupId: number, status: HoldingOrderStatus) => {
    await fetch(`/api/pending/holding-groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadHolding();
  };

  const deleteGroup = async (groupId: number) => {
    if (!confirm("Delete this group (and its items)?")) return;
    await fetch(`/api/pending/holding-groups/${groupId}`, { method: "DELETE" });
    if (expandedGroupId === groupId) setExpandedGroupId(null);
    await loadHolding();
  };

  const addItemToGroup = async (groupId: number) => {
    await fetch("/api/pending/holding-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        name: iName,
        price: iPrice.trim() === "" ? 0 : Number(iPrice),
        quantity: iQty.trim() === "" ? 1 : Number(iQty),
        imageUrl: iImageUrl ?? null,
      }),
    });
    setIName("");
    setIPrice("");
    setIQty("1");
    setIImageUrl(null);
    await loadHolding();
  };

  const startEditHoldingItem = (it: HoldingOrderItem) => {
    setEditingItemId(it.id);
    setEName(it.name);
    setEPrice(String(it.price));
    setEQty(String(it.quantity));
    setEImageUrl(null); // only set when user picks a new image
  };

  const cancelEditHoldingItem = () => {
    setEditingItemId(null);
    setEName("");
    setEPrice("");
    setEQty("1");
    setEImageUrl(null);
  };

  const saveHoldingItem = async (it: HoldingOrderItem) => {
    const body: Record<string, unknown> = {
      name: eName,
      price: ePrice.trim() === "" ? 0 : Number(ePrice),
      quantity: eQty.trim() === "" ? 1 : Number(eQty),
    };

    // Safe behavior: only replace image if a new one is provided.
    if (eImageUrl) body.imageUrl = eImageUrl;

    await fetch(`/api/pending/holding-items/${it.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    cancelEditHoldingItem();
    await loadHolding();
  };

  const deleteHoldingItem = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/pending/holding-items/${id}`, { method: "DELETE" });
    if (editingItemId === id) cancelEditHoldingItem();
    await loadHolding();
  };

  const groupTotals = useMemo(() => {
    const totals = new Map<number, number>();
    holding.forEach((g) => {
      const total = g.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      totals.set(g.id, total);
    });
    return totals;
  }, [holding]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Pending</h1>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="flex items-center gap-2 border-b pb-2 text-xs font-medium">
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              activeTab === "MERCHANT"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
            onClick={() => setActiveTab("MERCHANT")}
          >
            Merchant Preorders ({merchantCounts.active}/{merchantCounts.total})
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              activeTab === "HOLDING"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
            onClick={() => setActiveTab("HOLDING")}
          >
            Holding Orders ({holdingCounts.active}/{holdingCounts.total})
          </button>
        </div>

        {activeTab === "MERCHANT" ? (
          <div className="mt-4">
            <div className="rounded border bg-white p-3 text-sm">
              <div className="mb-2 text-sm font-semibold">Add merchant preorder</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Name</label>
                  <input
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Seller</label>
                  <input
                    value={mSeller}
                    onChange={(e) => setMSeller(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Shop / seller"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Platform</label>
                  <input
                    value={mPlatform}
                    onChange={(e) => setMPlatform(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Purchase date</label>
                  <input
                    type="date"
                    value={mPurchaseDate}
                    onChange={(e) => setMPurchaseDate(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Amount paid</label>
                  <input
                    type="number"
                    value={mAmountPaid}
                    onChange={(e) => setMAmountPaid(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Status</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as MerchantPreorderStatus)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  >
                    <option value="ordered">ordered</option>
                    <option value="pending_final_payment">pending_final_payment</option>
                    <option value="fully_paid">fully_paid</option>
                    <option value="received">received</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600">Image URL (optional)</label>
                  <input
                    value={mImageUrl}
                    onChange={(e) => setMImageUrl(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="data:... or https://..."
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600">Note (optional)</label>
                  <input
                    value={mNote}
                    onChange={(e) => setMNote(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={createMerchant}
                disabled={mName.trim() === "" || mSeller.trim() === "" || mPurchaseDate.trim() === ""}
                className="mt-3 rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                Create
              </button>
            </div>

            {merchantLoading ? (
              <div className="mt-3 text-xs text-zinc-500">Loading…</div>
            ) : merchant.length === 0 ? (
              <div className="mt-3 text-xs text-zinc-500">No merchant preorders.</div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {merchant.map((m) => {
                  const waitingDays = daysBetween(m.purchaseDate, now);
                  const isEditing = merchantEditingId === m.id;
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col overflow-hidden rounded-xl border bg-white text-sm shadow-sm"
                    >
                      <div className="relative h-40 w-full bg-zinc-100">
                        {m.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.imageUrl}
                            alt={m.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        {isEditing ? (
                          <>
                            <input
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={m.name}
                              onChange={(e) =>
                                setMerchant((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id ? { ...x, name: e.target.value } : x
                                  )
                                )
                              }
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className="w-full rounded border px-2 py-1 text-sm"
                                value={m.sellerName}
                                onChange={(e) =>
                                  setMerchant((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id ? { ...x, sellerName: e.target.value } : x
                                    )
                                  )
                                }
                                placeholder="Seller"
                              />
                              <input
                                className="w-full rounded border px-2 py-1 text-sm"
                                value={m.platform ?? ""}
                                onChange={(e) =>
                                  setMerchant((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? { ...x, platform: e.target.value }
                                        : x
                                    )
                                  )
                                }
                                placeholder="Platform"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                className="w-full rounded border px-2 py-1 text-sm"
                                value={toDateInputValue(m.purchaseDate)}
                                onChange={(e) =>
                                  setMerchant((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? { ...x, purchaseDate: fromDateInputValue(e.target.value) }
                                        : x
                                    )
                                  )
                                }
                              />
                              <input
                                type="number"
                                className="w-full rounded border px-2 py-1 text-sm"
                                value={m.amountPaid ?? ""}
                                onChange={(e) =>
                                  setMerchant((prev) =>
                                    prev.map((x) =>
                                      x.id === m.id
                                        ? {
                                            ...x,
                                            amountPaid:
                                              e.target.value.trim() === ""
                                                ? null
                                                : Number(e.target.value),
                                          }
                                        : x
                                    )
                                  )
                                }
                                placeholder="Amount paid"
                              />
                            </div>
                            <select
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={m.status}
                              onChange={(e) =>
                                setMerchant((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id
                                      ? { ...x, status: e.target.value as MerchantPreorderStatus }
                                      : x
                                  )
                                )
                              }
                            >
                              <option value="ordered">ordered</option>
                              <option value="pending_final_payment">pending_final_payment</option>
                              <option value="fully_paid">fully_paid</option>
                              <option value="received">received</option>
                            </select>
                            <input
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={m.imageUrl ?? ""}
                              onChange={(e) =>
                                setMerchant((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id ? { ...x, imageUrl: e.target.value } : x
                                  )
                                )
                              }
                              placeholder="Image URL"
                            />
                            <input
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={m.note ?? ""}
                              onChange={(e) =>
                                setMerchant((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id ? { ...x, note: e.target.value } : x
                                  )
                                )
                              }
                              placeholder="Note"
                            />
                            <div className="flex gap-2">
                              <button
                                className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                                onClick={() => saveMerchant(m)}
                              >
                                Save
                              </button>
                              <button
                                className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                                onClick={() => setMerchantEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="line-clamp-2 text-sm font-semibold text-zinc-900">
                                {m.name}
                              </div>
                              <div className="mt-0.5 text-xs text-zinc-600">
                                {m.sellerName}
                                {m.platform ? ` · ${m.platform}` : ""}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500">
                                Purchase: {toDateInputValue(m.purchaseDate) || "—"}
                              </span>
                              <span className="text-zinc-700">
                                Waiting {waitingDays} days
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                {m.status}
                              </span>
                              <div className="flex flex-wrap gap-1 text-[11px]">
                                <button
                                  className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                                  onClick={() => setMerchantEditingId(m.id)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                                  onClick={() => deleteMerchant(m.id)}
                                >
                                  Delete
                                </button>
                                <button
                                  className="rounded border px-2 py-0.5 hover:bg-zinc-100"
                                  onClick={() => markMerchantReceived(m.id)}
                                >
                                  Mark received → Collection
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className="rounded border bg-white p-3 text-sm">
              <div className="mb-2 text-sm font-semibold">
                {editingGroupId ? "Edit holding group" : "Create holding group"}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Seller</label>
                  <input
                    value={gSeller}
                    onChange={(e) => setGSeller(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Seller / streamer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Platform</label>
                  <input
                    value={gPlatform}
                    onChange={(e) => setGPlatform(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Purchase date</label>
                  <input
                    type="date"
                    value={gPurchaseDate}
                    onChange={(e) => setGPurchaseDate(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Time mode</label>
                  <select
                    value={gTimeMode}
                    onChange={(e) => setGTimeMode(e.target.value as HoldingOrderTimeMode)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  >
                    <option value="duration">Duration-based</option>
                    <option value="fixed_date">Fixed date</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {gTimeMode === "duration" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600">Duration</label>
                    <select
                      value={gDurationPreset}
                      onChange={(e) => setGDurationPreset(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                    >
                      <option value="30">1 month (30 days)</option>
                      <option value="90">3 months (90 days)</option>
                      <option value="180">6 months (180 days)</option>
                      <option value="custom">Custom days</option>
                    </select>
                  </div>
                )}

                {gTimeMode === "duration" && gDurationPreset === "custom" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600">Custom days</label>
                    <input
                      type="number"
                      min={1}
                      value={gDurationCustom}
                      onChange={(e) => setGDurationCustom(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                      placeholder="e.g. 120"
                    />
                  </div>
                )}

                {gTimeMode === "fixed_date" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-600">Deadline date</label>
                    <input
                      type="date"
                      value={gFixedDate}
                      onChange={(e) => setGFixedDate(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Shipping threshold</label>
                  <input
                    type="number"
                    value={gShippingThreshold}
                    onChange={(e) => setGShippingThreshold(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-600">Status</label>
                  <select
                    value={gStatus}
                    onChange={(e) => setGStatus(e.target.value as HoldingOrderStatus)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  >
                    <option value="holding">holding</option>
                    <option value="ready_to_ship">ready_to_ship</option>
                    <option value="shipped">shipped</option>
                    <option value="received">received</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600">Note</label>
                  <input
                    value={gNote}
                    onChange={(e) => setGNote(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={createGroup}
                  disabled={gSeller.trim() === ""}
                  className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {editingGroupId ? "Save changes" : "Create group"}
                </button>
                {editingGroupId && (
                  <button
                    type="button"
                    onClick={cancelEditGroup}
                    className="rounded border px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {holdingLoading ? (
              <div className="mt-3 text-xs text-zinc-500">Loading…</div>
            ) : holding.length === 0 ? (
              <div className="mt-3 text-xs text-zinc-500">No holding groups.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {holding.map((g) => {
                  const total = groupTotals.get(g.id) ?? 0;
                  const isExpanded = expandedGroupId === g.id;
                  const count = g.items.length;
                  const cd = countdown(g.computedDeadline, now);
                  const soon =
                    g.computedDeadline &&
                    (() => {
                      const t = new Date(g.computedDeadline).getTime();
                      return !Number.isNaN(t) && t - now.getTime() <= 5 * 24 * 60 * 60 * 1000;
                    })();

                  return (
                    <div key={g.id} className="rounded border bg-white p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {g.sellerName}
                            {g.platform ? ` · ${g.platform}` : ""}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            {count} item{count === 1 ? "" : "s"} · Total{" "}
                            {total.toLocaleString()}
                            {g.shippingThreshold != null
                              ? ` / Threshold ${g.shippingThreshold.toLocaleString()}`
                              : ""}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            {g.timeMode === "none" ? null : g.timeMode === "duration" ? (
                              <>
                                Holding: {g.durationDays ?? "—"} days · Deadline:{" "}
                                {g.computedDeadline ? toDateInputValue(g.computedDeadline) : "—"} ·{" "}
                                <span className={soon ? "font-semibold text-red-600" : ""}>
                                  {cd}
                                </span>
                              </>
                            ) : (
                              <>
                                Deadline:{" "}
                                {g.computedDeadline ? toDateInputValue(g.computedDeadline) : "—"} ·{" "}
                                <span className={soon ? "font-semibold text-red-600" : ""}>
                                  {cd}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded border px-2 py-1 text-xs"
                            value={g.status}
                            onChange={(e) =>
                              updateGroupStatus(g.id, e.target.value as HoldingOrderStatus)
                            }
                          >
                            <option value="holding">holding</option>
                            <option value="ready_to_ship">ready_to_ship</option>
                            <option value="shipped">shipped</option>
                            <option value="received">received</option>
                          </select>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => startEditGroup(g)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() =>
                              setExpandedGroupId(isExpanded ? null : g.id)
                            }
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => deleteGroup(g.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 border-t pt-3">
                          <div className="mb-2 text-xs font-medium text-zinc-600">
                            Items
                          </div>

                          {g.items.length === 0 ? (
                            <div className="text-xs text-zinc-500">No items yet.</div>
                          ) : (
                            <div className="space-y-2">
                              {g.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="flex items-center justify-between gap-2 rounded border bg-white p-2 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-10 w-10 overflow-hidden rounded border bg-zinc-100">
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
                                    {editingItemId === it.id ? (
                                      <div className="space-y-1">
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
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) {
                                                setEImageUrl(null);
                                                return;
                                              }
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                if (typeof reader.result === "string") {
                                                  setEImageUrl(reader.result);
                                                }
                                              };
                                              reader.readAsDataURL(file);
                                            }}
                                            className="mt-1 text-[11px]"
                                          />
                                          {eImageUrl && (
                                            <div className="text-[11px] text-zinc-500">
                                              New image selected
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="font-medium text-zinc-900">{it.name}</div>
                                        <div className="text-zinc-600">
                                          {it.price.toLocaleString()} × {it.quantity}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {editingItemId === it.id ? (
                                      <>
                                        <button
                                          className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
                                          onClick={() => saveHoldingItem(it)}
                                        >
                                          Save
                                        </button>
                                        <button
                                          className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
                                          onClick={cancelEditHoldingItem}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-zinc-900">
                                          {(it.price * it.quantity).toLocaleString()}
                                        </div>
                                        <button
                                          className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
                                          onClick={() => startEditHoldingItem(it)}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
                                          onClick={() => deleteHoldingItem(it.id)}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 rounded border bg-zinc-50 p-2">
                            <div className="mb-2 text-xs font-medium text-zinc-600">
                              Add item
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                value={iName}
                                onChange={(e) => setIName(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                                placeholder="Name"
                              />
                              <input
                                type="number"
                                value={iPrice}
                                onChange={(e) => setIPrice(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                                placeholder="Price"
                              />
                              <input
                                type="number"
                                min={1}
                                value={iQty}
                                onChange={(e) => setIQty(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                                placeholder="Qty"
                              />
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="text-xs font-medium text-zinc-600">Image</div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) {
                                    setIImageUrl(null);
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === "string") {
                                      setIImageUrl(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }}
                                className="mt-1 text-xs"
                              />
                              {iImageUrl && (
                                <div>
                                  <div className="text-xs font-medium text-zinc-500">
                                    Preview
                                  </div>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={iImageUrl}
                                    alt="Holding item preview"
                                    className="mt-1 max-h-40 w-auto rounded border object-contain"
                                  />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="mt-2 rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                              disabled={iName.trim() === ""}
                              onClick={() => addItemToGroup(g.id)}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

