"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Modal } from "@/components/Modal";
import { formatPriceAmount } from "@/lib/formatPriceAmount";
import { HoldingItemRow } from "./HoldingItemRow";

type HoldingOrderStatus = "holding" | "ready_to_ship" | "shipped" | "received";
type HoldingOrderTimeMode = "duration" | "fixed_date" | "none";

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
  receivedAt: string | null;
  items: HoldingOrderItem[];
};

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
  return new Date(`${date}T12:00:00`).toISOString();
}

export default function HoldingPage() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [holding, setHolding] = useState<HoldingOrderGroup[]>([]);
  const [holdingLoading, setHoldingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"HOLDING" | "RECEIVED">("HOLDING");
  const [expandedHoldingGroupId, setExpandedHoldingGroupId] = useState<number | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Holding group create/edit form
  const [editingHoldingGroupId, setEditingHoldingGroupId] = useState<number | null>(null);
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
  const [editingHoldingItemId, setEditingHoldingItemId] = useState<number | null>(null);
  const [eName, setEName] = useState("");
  const [ePrice, setEPrice] = useState<string>("");
  const [eQty, setEQty] = useState<string>("1");
  const [eImageUrl, setEImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadHolding = async () => {
    setHoldingLoading(true);
    const res = await fetch("/api/pending/holding-groups");
    const data = await res.json();
    setHolding(data);
    setHoldingLoading(false);
  };

  useEffect(() => {
    loadHolding();
  }, []);

  const holdingCounts = useMemo(() => {
    const active = holding.filter((g) => g.status !== "received").length;
    const received = holding.filter((g) => g.status === "received").length;
    return { active, received };
  }, [holding]);

  const toRender = useMemo(() => {
    if (activeTab === "HOLDING") return holding.filter((g) => g.status !== "received");
    return holding.filter((g) => g.status === "received");
  }, [holding, activeTab]);

  const groupTotals = useMemo(() => {
    const totals = new Map<number, number>();
    holding.forEach((g) => {
      const total = g.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      totals.set(g.id, total);
    });
    return totals;
  }, [holding]);

  const createHoldingGroup = async () => {
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

    if (editingHoldingGroupId) {
      await fetch(`/api/pending/holding-groups/${editingHoldingGroupId}`, {
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

    setEditingHoldingGroupId(null);
    setShowGroupModal(false);
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

  const cancelEditHoldingGroup = () => {
    setEditingHoldingGroupId(null);
    setShowGroupModal(false);
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

  const startEditHoldingGroup = (g: HoldingOrderGroup) => {
    setEditingHoldingGroupId(g.id);
    setShowGroupModal(true);
    setGSeller(g.sellerName);
    setGPlatform(g.platform ?? "");
    setGPurchaseDate(toDateInputValue(g.purchaseDate));
    setGTimeMode(g.timeMode);
    setGDurationPreset(g.durationDays ? String(g.durationDays) : "90");
    setGDurationCustom("");
    setGFixedDate(toDateInputValue(g.deadline));
    setGShippingThreshold(g.shippingThreshold != null ? String(g.shippingThreshold) : "");
    setGNote(g.note ?? "");
    setGStatus(g.status);
  };

  const deleteHoldingGroup = async (id: number) => {
    if (!confirm("Delete this holding group?")) return;
    await fetch(`/api/pending/holding-groups/${id}`, { method: "DELETE" });
    if (expandedHoldingGroupId === id) setExpandedHoldingGroupId(null);
    await loadHolding();
  };

  const updateHoldingGroupStatus = async (id: number, status: HoldingOrderStatus) => {
    if (status === "received") {
      const res = await fetch(`/api/pending/holding-groups/${id}/mark-received`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to mark received");
      }
      await loadHolding();
      return;
    }

    await fetch(`/api/pending/holding-groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadHolding();
  };

  const addHoldingItemToGroup = async (groupId: number) => {
    await fetch("/api/pending/holding-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        name: iName,
        price: iPrice.trim() === "" ? 0 : Number(iPrice),
        quantity: iQty.trim() === "" ? 1 : Number(iQty),
        imageUrl: iImageUrl,
      }),
    });
    setIName("");
    setIPrice("");
    setIQty("1");
    setIImageUrl(null);
    setShowAddItemModal(false);
    await loadHolding();
  };

  const startEditHoldingItem = (it: HoldingOrderItem) => {
    setEditingHoldingItemId(it.id);
    setEName(it.name);
    setEPrice(String(it.price));
    setEQty(String(it.quantity));
    setEImageUrl(null);
  };

  const cancelEditHoldingItem = () => {
    setEditingHoldingItemId(null);
    setEName("");
    setEPrice("");
    setEQty("1");
    setEImageUrl(null);
  };

  const handleEImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setEImageUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setEImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
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
    if (editingHoldingItemId === id) cancelEditHoldingItem();
    await loadHolding();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Holding</h1>
        <button
          type="button"
          onClick={() => setShowGroupModal(true)}
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New group
        </button>
      </div>

      {showAddItemModal && expandedHoldingGroupId !== null ? (
        <Modal title="Add item" onClose={() => setShowAddItemModal(false)}>
          <div className="space-y-3">
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
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-600">Image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) { setIImageUrl(null); return; }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") setIImageUrl(reader.result);
                  };
                  reader.readAsDataURL(file);
                }}
                className="mt-1 text-xs"
              />
              {iImageUrl && (
                <div>
                  <div className="text-xs font-medium text-zinc-500">Preview</div>
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
              className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              disabled={iName.trim() === ""}
              onClick={() => addHoldingItemToGroup(expandedHoldingGroupId)}
            >
              Add
            </button>
          </div>
        </Modal>
      ) : null}

      {showGroupModal && (
        <Modal
          title={editingHoldingGroupId ? "Edit holding group" : "New holding group"}
          onClose={cancelEditHoldingGroup}
        >
          <div className="space-y-3">
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={createHoldingGroup}
                disabled={gSeller.trim() === ""}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {editingHoldingGroupId ? "Save changes" : "Create group"}
              </button>
              <button
                type="button"
                onClick={cancelEditHoldingGroup}
                className="rounded border px-4 py-2 text-sm font-medium hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

        <div className="rounded border bg-white p-4">
          {/* Tab strip */}
          <div className="flex items-center gap-2 border-b pb-2 text-xs font-medium">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                activeTab === "HOLDING"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
              onClick={() => {
                setActiveTab("HOLDING");
                setExpandedHoldingGroupId(null);
                setShowAddItemModal(false);
              }}
            >
              Holding ({holdingCounts.active})
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                activeTab === "RECEIVED"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
              onClick={() => {
                setActiveTab("RECEIVED");
                setExpandedHoldingGroupId(null);
                setShowAddItemModal(false);
              }}
            >
              Received ({holdingCounts.received})
            </button>
          </div>

          {holdingLoading ? (
            <div className="mt-3 text-xs text-zinc-500">Loading…</div>
          ) : toRender.length === 0 ? (
            <div className="mt-3 text-xs text-zinc-500">
              {activeTab === "HOLDING" ? "No active holding groups." : "No received groups yet."}
            </div>
          ) : (
          <div className="mt-3 space-y-3">
            {toRender.map((g) => {
              const total = groupTotals.get(g.id) ?? 0;
              const expanded = expandedHoldingGroupId === g.id;
              const count = g.items.length;
              const cd = countdown(g.computedDeadline, now);
              const soon =
                g.computedDeadline &&
                (() => {
                  const t = new Date(g.computedDeadline).getTime();
                  return (
                    !Number.isNaN(t) &&
                    t - now.getTime() <= 5 * 24 * 60 * 60 * 1000
                  );
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
                        {formatPriceAmount(total)}
                        {g.shippingThreshold != null
                          ? ` / Threshold ${formatPriceAmount(g.shippingThreshold)}`
                          : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-600">
                        {g.timeMode === "none" ? null : g.timeMode === "duration" ? (
                          <>
                            Holding: {g.durationDays ?? "—"} days · Deadline:{" "}
                            {g.computedDeadline ? toDateInputValue(g.computedDeadline) : "—"}{" "}
                            ·{" "}
                            <span className={soon ? "font-semibold text-red-600" : ""}>
                              {cd}
                            </span>
                          </>
                        ) : (
                          <>
                            Deadline:{" "}
                            {g.computedDeadline ? toDateInputValue(g.computedDeadline) : "—"}{" "}
                            ·{" "}
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
                          updateHoldingGroupStatus(g.id, e.target.value as HoldingOrderStatus)
                        }
                      >
                        <option value="holding">holding</option>
                        <option value="ready_to_ship">ready_to_ship</option>
                        <option value="shipped">shipped</option>
                        <option value="received">received</option>
                      </select>
                      <button
                        className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                        onClick={() => startEditHoldingGroup(g)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                        onClick={() => {
                          setExpandedHoldingGroupId(expanded ? null : g.id);
                          setShowAddItemModal(false);
                        }}
                      >
                        {expanded ? "Hide" : "View"}
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                        onClick={() => deleteHoldingGroup(g.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 border-t pt-3">
                      <div className="mb-2 text-xs font-medium text-zinc-600">Items</div>

                      {g.items.length === 0 ? (
                        <div className="text-xs text-zinc-500">No items yet.</div>
                      ) : (
                        <div className="space-y-2">
                          {g.items.map((it) => (
                            <HoldingItemRow
                              key={it.id}
                              it={it}
                              isEditing={editingHoldingItemId === it.id}
                              eName={eName}
                              ePrice={ePrice}
                              eQty={eQty}
                              eImageUrl={eImageUrl}
                              onStartEdit={() => startEditHoldingItem(it)}
                              onCancelEdit={cancelEditHoldingItem}
                              onSave={() => saveHoldingItem(it)}
                              onDelete={() => deleteHoldingItem(it.id)}
                              setEName={setEName}
                              setEPrice={setEPrice}
                              setEQty={setEQty}
                              onEImageChange={handleEImageFile}
                            />
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setShowAddItemModal(true)}
                          className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-zinc-100"
                        >
                          + Add item
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
    </div>
  );
}
