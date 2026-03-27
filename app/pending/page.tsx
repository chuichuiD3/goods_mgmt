"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { formatPriceAmount } from "@/lib/formatPriceAmount";

type MerchantPreorderSubtype = "full_payment_presale" | "deposit_presale";
type MerchantPreorderGroupStatus = "open" | "received" | "cancelled";

type HoldingOrderStatus = "holding" | "ready_to_ship" | "shipped" | "received";
type HoldingOrderTimeMode = "duration" | "fixed_date" | "none";

type MerchantPreorderLineItem = {
  id: number;
  groupId: number;
  title: string;
  imageUrl: string | null;
  quantity: number;
  notes: string | null;
  subtype: MerchantPreorderSubtype;
  amountPaidTotal: number | null;
  depositPaidAt: string | null;
  depositAmount: number | null;
  finalPaid: boolean;
  finalPaidAt: string | null;
  finalAmount: number | null;
  owned: boolean;
  expectedReleaseWindow: string | null;
  received: boolean;
};

type MerchantPreorderGroup = {
  id: number;
  sellerName: string;
  platform: string | null;
  status: MerchantPreorderGroupStatus;
  notes: string | null;
  items: MerchantPreorderLineItem[];
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

  const [merchant, setMerchant] = useState<MerchantPreorderGroup[]>([]);
  const [merchantLoading, setMerchantLoading] = useState(false);
  const [expandedMerchantGroupId, setExpandedMerchantGroupId] = useState<
    number | null
  >(null);
  const [editingMerchantGroupId, setEditingMerchantGroupId] = useState<number | null>(
    null
  );

  const [holding, setHolding] = useState<HoldingOrderGroup[]>([]);
  const [holdingLoading, setHoldingLoading] = useState(false);
  const [expandedHoldingGroupId, setExpandedHoldingGroupId] = useState<
    number | null
  >(null);

  // Merchant group (shared) form
  const [mSeller, setMSeller] = useState("");
  const [mPlatform, setMPlatform] = useState("");
  const [mGroupStatus, setMGroupStatus] =
    useState<MerchantPreorderGroupStatus>("open");
  const [mGroupNotes, setMGroupNotes] = useState<string>("");

  // Merchant add line to expanded group
  const [newLineTitle, setNewLineTitle] = useState("");
  const [newLineImageDataUrl, setNewLineImageDataUrl] = useState<string | null>(
    null
  );
  const [newLineNotes, setNewLineNotes] = useState<string>("");
  const [newLineSubtype, setNewLineSubtype] = useState<MerchantPreorderSubtype>(
    "full_payment_presale"
  );
  const [newLineAmountPaidTotal, setNewLineAmountPaidTotal] = useState<string>("");
  const [newLineDepositPaidAt, setNewLineDepositPaidAt] = useState<string>("");
  const [newLineDepositAmount, setNewLineDepositAmount] = useState<string>("");
  const [newLineFinalPaid, setNewLineFinalPaid] = useState<boolean>(false);
  const [newLineFinalPaidAt, setNewLineFinalPaidAt] = useState<string>("");
  const [newLineFinalAmount, setNewLineFinalAmount] = useState<string>("");
  const [newLineOwned, setNewLineOwned] = useState<boolean>(false);
  const [newLineExpectedReleaseWindow, setNewLineExpectedReleaseWindow] = useState<string>("");

  // Merchant line item edit (single line at a time)
  const [editingMerchantLineId, setEditingMerchantLineId] = useState<number | null>(
    null
  );
  const [eLineTitle, setELineTitle] = useState("");
  const [eLineImageDataUrl, setELineImageDataUrl] = useState<string | null>(
    null
  );
  const [eLineNotes, setELineNotes] = useState<string>("");
  const [eLineSubtype, setELineSubtype] = useState<MerchantPreorderSubtype>(
    "full_payment_presale"
  );
  const [eLineAmountPaidTotal, setELineAmountPaidTotal] = useState<string>("");
  const [eLineDepositPaidAt, setELineDepositPaidAt] = useState<string>("");
  const [eLineDepositAmount, setELineDepositAmount] = useState<string>("");
  const [eLineFinalPaid, setELineFinalPaid] = useState<boolean>(false);
  const [eLineFinalPaidAt, setELineFinalPaidAt] = useState<string>("");
  const [eLineFinalAmount, setELineFinalAmount] = useState<string>("");
  const [eLineOwned, setELineOwned] = useState<boolean>(false);
  const [eLineExpectedReleaseWindow, setELineExpectedReleaseWindow] = useState<string>("");

  // Holding group create/edit form
  const [editingHoldingGroupId, setEditingHoldingGroupId] = useState<number | null>(
    null
  );
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
  const [editingHoldingItemId, setEditingHoldingItemId] = useState<number | null>(
    null
  );
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
    const res = await fetch("/api/pending/merchant-groups");
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
    const totalGroups = merchant.length;
    const totalItems = merchant.reduce((sum, g) => sum + g.items.length, 0);
    const activeItems = merchant.reduce(
      (sum, g) => sum + g.items.filter((it) => !it.received).length,
      0
    );
    return { totalGroups, totalItems, activeItems };
  }, [merchant]);

  const holdingCounts = useMemo(() => {
    const total = holding.length;
    const active = holding.filter((g) => g.status !== "received").length;
    return { total, active };
  }, [holding]);

  const createMerchantGroup = async () => {
    if (mSeller.trim() === "") {
      alert("Seller is required.");
      return;
    }

    const groupRes = await fetch("/api/pending/merchant-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerName: mSeller,
        platform: mPlatform.trim() === "" ? null : mPlatform.trim(),
        status: mGroupStatus,
        notes: mGroupNotes.trim() === "" ? null : mGroupNotes.trim(),
      }),
    });

    if (!groupRes.ok) {
      const err = await groupRes.json().catch(() => ({}));
      alert(err.error ?? "Failed to create merchant order.");
      return;
    }

    const createdGroup = (await groupRes.json()) as MerchantPreorderGroup;

    setMSeller("");
    setMPlatform("");
    setMGroupStatus("open");
    setMGroupNotes("");
    setExpandedMerchantGroupId(createdGroup.id);
    await loadMerchant();
  };

  const cancelEditMerchantGroup = () => {
    setEditingMerchantGroupId(null);
    setMSeller("");
    setMPlatform("");
    setMGroupStatus("open");
    setMGroupNotes("");
  };

  const startEditMerchantGroup = (g: MerchantPreorderGroup) => {
    setEditingMerchantGroupId(g.id);
    setMSeller(g.sellerName);
    setMPlatform(g.platform ?? "");
    setMGroupStatus(g.status);
    setMGroupNotes(g.notes ?? "");
  };

  const saveMerchantGroup = async () => {
    if (!editingMerchantGroupId) return;
    if (mSeller.trim() === "") {
      alert("Seller is required.");
      return;
    }

    const res = await fetch(`/api/pending/merchant-groups/${editingMerchantGroupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerName: mSeller,
        platform: mPlatform.trim() === "" ? null : mPlatform.trim(),
        status: mGroupStatus,
        notes: mGroupNotes.trim() === "" ? null : mGroupNotes.trim(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Failed to save merchant order.");
      return;
    }

    cancelEditMerchantGroup();
    await loadMerchant();
  };

  const updateMerchantGroupStatus = async (id: number, status: MerchantPreorderGroupStatus) => {
    await fetch(`/api/pending/merchant-groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadMerchant();
  };

  const deleteMerchantGroup = async (id: number) => {
    if (!confirm("Delete this merchant order group?")) return;
    await fetch(`/api/pending/merchant-groups/${id}`, { method: "DELETE" });
    if (expandedMerchantGroupId === id) setExpandedMerchantGroupId(null);
    await loadMerchant();
  };

  const markMerchantLineReceived = async (id: number) => {
    const res = await fetch(`/api/pending/merchant-line-items/${id}/mark-received`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Failed to mark received");
      return;
    }
    await loadMerchant();
  };

  const addLineItemToExpandedGroup = async () => {
    if (!expandedMerchantGroupId) return;
    if (newLineTitle.trim() === "") {
      alert("Line item title is required.");
      return;
    }

    const res = await fetch("/api/pending/merchant-line-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: expandedMerchantGroupId,
        title: newLineTitle,
        imageUrl: newLineImageDataUrl,
        notes: newLineNotes.trim() === "" ? null : newLineNotes.trim(),
        subtype: newLineSubtype,
        amountPaidTotal:
          newLineAmountPaidTotal.trim() === ""
            ? null
            : Number(newLineAmountPaidTotal),
        depositPaidAt:
          newLineDepositPaidAt.trim() === ""
            ? null
            : fromDateInputValue(newLineDepositPaidAt),
        depositAmount:
          newLineDepositAmount.trim() === "" ? null : Number(newLineDepositAmount),
        finalPaid: newLineFinalPaid,
        finalPaidAt:
          newLineFinalPaidAt.trim() === ""
            ? null
            : fromDateInputValue(newLineFinalPaidAt),
        finalAmount:
          newLineFinalAmount.trim() === "" ? null : Number(newLineFinalAmount),
        owned: newLineOwned,
        expectedReleaseWindow:
          newLineExpectedReleaseWindow.trim() === ""
            ? null
            : newLineExpectedReleaseWindow.trim(),
        // expectedShipAt intentionally omitted (MVP)
      }),
    });

    if (!res.ok) {
      alert("Failed to add line item.");
      return;
    }

    setNewLineTitle("");
    setNewLineImageDataUrl(null);
    setNewLineNotes("");
    setNewLineSubtype("full_payment_presale");
    setNewLineAmountPaidTotal("");
    setNewLineDepositPaidAt("");
    setNewLineDepositAmount("");
    setNewLineFinalPaid(false);
    setNewLineFinalPaidAt("");
    setNewLineFinalAmount("");
    setNewLineOwned(false);
    setNewLineExpectedReleaseWindow("");
    await loadMerchant();
  };

  const handleNewLineImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNewLineImageDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewLineImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleELineImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setELineImageDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setELineImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const startEditMerchantLine = (it: MerchantPreorderLineItem) => {
    setEditingMerchantLineId(it.id);
    setELineTitle(it.title);
    setELineImageDataUrl(it.imageUrl ?? null);
    setELineNotes(it.notes ?? "");
    setELineSubtype(it.subtype);
    setELineAmountPaidTotal(it.amountPaidTotal != null ? String(it.amountPaidTotal) : "");
    setELineDepositPaidAt(toDateInputValue(it.depositPaidAt));
    setELineDepositAmount(it.depositAmount != null ? String(it.depositAmount) : "");
    setELineFinalPaid(Boolean(it.finalPaid));
    setELineFinalPaidAt(toDateInputValue(it.finalPaidAt));
    setELineFinalAmount(it.finalAmount != null ? String(it.finalAmount) : "");
    setELineOwned(Boolean(it.owned));
    setELineExpectedReleaseWindow(it.expectedReleaseWindow ?? "");
  };

  const cancelEditMerchantLine = () => {
    setEditingMerchantLineId(null);
    setELineTitle("");
    setELineImageDataUrl(null);
    setELineNotes("");
    setELineSubtype("full_payment_presale");
    setELineAmountPaidTotal("");
    setELineDepositPaidAt("");
    setELineDepositAmount("");
    setELineFinalPaid(false);
    setELineFinalPaidAt("");
    setELineFinalAmount("");
    setELineOwned(false);
    setELineExpectedReleaseWindow("");
  };

  const saveMerchantLine = async (id: number) => {
    const res = await fetch(`/api/pending/merchant-line-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eLineTitle,
        imageUrl: eLineImageDataUrl,
        notes: eLineNotes.trim() === "" ? null : eLineNotes.trim(),
        subtype: eLineSubtype,
        amountPaidTotal:
          eLineAmountPaidTotal.trim() === "" ? null : Number(eLineAmountPaidTotal),
        depositPaidAt:
          eLineDepositPaidAt.trim() === "" ? null : fromDateInputValue(eLineDepositPaidAt),
        depositAmount:
          eLineDepositAmount.trim() === "" ? null : Number(eLineDepositAmount),
        finalPaid: eLineFinalPaid,
        finalPaidAt:
          eLineFinalPaidAt.trim() === "" ? null : fromDateInputValue(eLineFinalPaidAt),
        finalAmount:
          eLineFinalAmount.trim() === "" ? null : Number(eLineFinalAmount),
        owned: eLineOwned,
        expectedReleaseWindow:
          eLineExpectedReleaseWindow.trim() === ""
            ? null
            : eLineExpectedReleaseWindow.trim(),
        // expectedShipAt intentionally omitted (MVP)
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Failed to save line item.");
      return;
    }
    cancelEditMerchantLine();
    await loadMerchant();
  };

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
            Merchant Preorders ({merchantCounts.activeItems}/{merchantCounts.totalItems})
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
              <div className="mb-2 text-sm font-semibold">
                {editingMerchantGroupId ? "Edit merchant order" : "Create merchant order"}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <label className="block text-xs font-medium text-zinc-600">
                    Group status
                  </label>
                  <select
                    value={mGroupStatus}
                    onChange={(e) =>
                      setMGroupStatus(e.target.value as MerchantPreorderGroupStatus)
                    }
                    className="w-full rounded border px-2 py-1 text-sm"
                  >
                    <option value="open">open</option>
                    <option value="received">received</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600">
                    Group notes (optional)
                  </label>
                  <input
                    value={mGroupNotes}
                    onChange={(e) => setMGroupNotes(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                </div>
              </div>
              {!editingMerchantGroupId ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Create the order first, then expand it below to add line items.
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={editingMerchantGroupId ? saveMerchantGroup : createMerchantGroup}
                  disabled={mSeller.trim() === ""}
                  className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {editingMerchantGroupId ? "Save changes" : "Create"}
                </button>
                {editingMerchantGroupId ? (
                  <button
                    type="button"
                    onClick={cancelEditMerchantGroup}
                    className="rounded border px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>

            {merchantLoading ? (
              <div className="mt-3 text-xs text-zinc-500">Loading…</div>
            ) : merchant.length === 0 ? (
              <div className="mt-3 text-xs text-zinc-500">No merchant orders.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {merchant.map((g) => {
                  const expanded = expandedMerchantGroupId === g.id;
                  const openCount = g.items.filter((it) => !it.received).length;

                  return (
                    <div key={g.id} className="rounded border bg-white p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {g.sellerName}
                            {g.platform ? ` · ${g.platform}` : ""}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            {g.items.length} item{g.items.length === 1 ? "" : "s"}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            Open: {openCount}/{g.items.length}
                          </div>
                          {g.notes ? (
                            <div className="mt-1 text-xs text-zinc-600 line-clamp-2">
                              {g.notes}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="rounded border px-2 py-1 text-xs"
                            value={g.status}
                            onChange={(e) =>
                              updateMerchantGroupStatus(
                                g.id,
                                e.target.value as MerchantPreorderGroupStatus
                              )
                            }
                          >
                            <option value="open">open</option>
                            <option value="received">received</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => startEditMerchantGroup(g)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => {
                              setExpandedMerchantGroupId(expanded ? null : g.id);
                              setNewLineTitle("");
                              setNewLineImageDataUrl(null);
                              setNewLineNotes("");
                              setNewLineSubtype("full_payment_presale");
                              setNewLineAmountPaidTotal("");
                              setNewLineDepositPaidAt("");
                              setNewLineDepositAmount("");
                              setNewLineFinalPaid(false);
                              setNewLineFinalPaidAt("");
                              setNewLineFinalAmount("");
                              setNewLineOwned(false);
                              setNewLineExpectedReleaseWindow("");
                            }}
                          >
                            {expanded ? "Hide" : "View"}
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                            onClick={() => deleteMerchantGroup(g.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="mt-3 border-t pt-3">
                          <div className="mb-2 text-xs font-medium text-zinc-600">
                            Line items
                          </div>

                          {g.items.length === 0 ? (
                            <div className="text-xs text-zinc-500">No line items yet.</div>
                          ) : (
                            <div className="space-y-2">
                              {g.items.map((it) => (
                                <div
                                  key={it.id}
                                  className="flex items-start justify-between gap-2 rounded border bg-white p-2 text-xs"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="h-10 w-10 overflow-hidden rounded border bg-zinc-100">
                                      {it.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={it.imageUrl}
                                          alt={it.title}
                                          loading="lazy"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                                          —
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      {editingMerchantLineId === it.id ? (
                                        <div className="space-y-2">
                                          <input
                                            value={eLineTitle}
                                            onChange={(e) => setELineTitle(e.target.value)}
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            placeholder="Title"
                                          />
                                          <select
                                            value={eLineSubtype}
                                            onChange={(e) =>
                                              setELineSubtype(
                                                e.target.value as MerchantPreorderSubtype
                                              )
                                            }
                                            className="w-full rounded border px-2 py-1 text-sm"
                                          >
                                            <option value="full_payment_presale">
                                              Full payment presale
                                            </option>
                                            <option value="deposit_presale">Deposit presale</option>
                                          </select>

                                          {eLineSubtype === "full_payment_presale" ? (
                                            <input
                                              type="number"
                                              value={eLineAmountPaidTotal}
                                              onChange={(e) => setELineAmountPaidTotal(e.target.value)}
                                              className="w-full rounded border px-2 py-1 text-sm"
                                              placeholder="Amount paid total (optional)"
                                            />
                                          ) : (
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                              <input
                                                type="date"
                                                value={eLineDepositPaidAt}
                                                onChange={(e) => setELineDepositPaidAt(e.target.value)}
                                                className="w-full rounded border px-2 py-1 text-sm"
                                              />
                                              <input
                                                type="number"
                                                value={eLineDepositAmount}
                                                onChange={(e) =>
                                                  setELineDepositAmount(e.target.value)
                                                }
                                                className="w-full rounded border px-2 py-1 text-sm"
                                                placeholder="Deposit amount (optional)"
                                              />
                                              <label className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                                                <input
                                                  type="checkbox"
                                                  checked={eLineFinalPaid}
                                                  onChange={(e) =>
                                                    setELineFinalPaid(e.target.checked)
                                                  }
                                                />
                                                Final paid
                                              </label>
                                              <input
                                                type="date"
                                                value={eLineFinalPaidAt}
                                                onChange={(e) => setELineFinalPaidAt(e.target.value)}
                                                className="w-full rounded border px-2 py-1 text-sm"
                                                disabled={!eLineFinalPaid}
                                              />
                                              <input
                                                type="number"
                                                value={eLineFinalAmount}
                                                onChange={(e) => setELineFinalAmount(e.target.value)}
                                                className="w-full rounded border px-2 py-1 text-sm"
                                                placeholder="Final amount (optional)"
                                                disabled={!eLineFinalPaid}
                                              />
                                              <label className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                                                <input
                                                  type="checkbox"
                                                  checked={eLineOwned}
                                                  onChange={(e) =>
                                                    setELineOwned(e.target.checked)
                                                  }
                                                />
                                                Owned
                                              </label>
                                            </div>
                                          )}

                                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <input
                                              value={eLineExpectedReleaseWindow}
                                              onChange={(e) =>
                                                setELineExpectedReleaseWindow(e.target.value)
                                              }
                                              className="w-full rounded border px-2 py-1 text-sm"
                                              placeholder="Expected release window (e.g. 2026-07 to 2026-08)"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-xs font-medium text-zinc-600">
                                              Image (optional)
                                            </label>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={handleELineImageFile}
                                              className="text-xs"
                                            />
                                            {eLineImageDataUrl ? (
                                              <div>
                                                <div className="text-[11px] font-medium text-zinc-500">
                                                  Preview
                                                </div>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={eLineImageDataUrl}
                                                  alt=""
                                                  className="mt-1 max-h-32 w-auto rounded border object-contain"
                                                />
                                                <button
                                                  type="button"
                                                  className="mt-1 text-[11px] text-zinc-600 underline"
                                                  onClick={() => setELineImageDataUrl(null)}
                                                >
                                                  Remove image
                                                </button>
                                              </div>
                                            ) : null}
                                          </div>
                                          <input
                                            value={eLineNotes}
                                            onChange={(e) => setELineNotes(e.target.value)}
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            placeholder="Notes (optional)"
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                                              onClick={() => saveMerchantLine(it.id)}
                                            >
                                              Save
                                            </button>
                                            <button
                                              className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                                              onClick={cancelEditMerchantLine}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="font-medium text-zinc-900">
                                            {it.title}
                                          </div>
                                          <div className="mt-0.5 text-[11px] text-zinc-600">
                                            {it.subtype === "deposit_presale"
                                              ? `Deposit · Owned: ${it.owned ? "Yes" : "No"}`
                                              : `Full payment`}
                                            {it.expectedReleaseWindow
                                              ? ` · Release: ${it.expectedReleaseWindow}`
                                              : ""}
                                          </div>
                                          {it.notes ? (
                                            <div className="text-zinc-600 line-clamp-2">
                                              {it.notes}
                                            </div>
                                          ) : null}
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                      {it.received ? "received" : "waiting"}
                                    </span>
                                    {editingMerchantLineId !== it.id ? (
                                      <button
                                        type="button"
                                        className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
                                        onClick={() => startEditMerchantLine(it)}
                                      >
                                        Edit
                                      </button>
                                    ) : null}
                                    {!it.received ? (
                                      <button
                                        type="button"
                                        className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
                                        onClick={() => markMerchantLineReceived(it.id)}
                                      >
                                        Mark received → Collection
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 rounded border bg-zinc-50 p-2">
                            <div className="mb-2 text-xs font-medium text-zinc-600">
                              Add line item
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <input
                                value={newLineTitle}
                                onChange={(e) => setNewLineTitle(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                                placeholder="Title"
                              />
                              <select
                                value={newLineSubtype}
                                onChange={(e) =>
                                  setNewLineSubtype(e.target.value as MerchantPreorderSubtype)
                                }
                                className="w-full rounded border px-2 py-1 text-sm"
                              >
                                <option value="full_payment_presale">Full payment presale</option>
                                <option value="deposit_presale">Deposit presale</option>
                              </select>
                            </div>
                            {newLineSubtype === "full_payment_presale" ? (
                              <div className="mt-2">
                                <input
                                  type="number"
                                  value={newLineAmountPaidTotal}
                                  onChange={(e) => setNewLineAmountPaidTotal(e.target.value)}
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  placeholder="Amount paid total (optional)"
                                />
                              </div>
                            ) : (
                              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                  type="date"
                                  value={newLineDepositPaidAt}
                                  onChange={(e) => setNewLineDepositPaidAt(e.target.value)}
                                  className="w-full rounded border px-2 py-1 text-sm"
                                />
                                <input
                                  type="number"
                                  value={newLineDepositAmount}
                                  onChange={(e) => setNewLineDepositAmount(e.target.value)}
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  placeholder="Deposit amount (optional)"
                                />
                                <label className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={newLineFinalPaid}
                                    onChange={(e) => setNewLineFinalPaid(e.target.checked)}
                                  />
                                  Final paid
                                </label>
                                <input
                                  type="date"
                                  value={newLineFinalPaidAt}
                                  onChange={(e) => setNewLineFinalPaidAt(e.target.value)}
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  disabled={!newLineFinalPaid}
                                />
                                <input
                                  type="number"
                                  value={newLineFinalAmount}
                                  onChange={(e) => setNewLineFinalAmount(e.target.value)}
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  placeholder="Final amount (optional)"
                                  disabled={!newLineFinalPaid}
                                />
                                <label className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={newLineOwned}
                                    onChange={(e) => setNewLineOwned(e.target.checked)}
                                  />
                                  Owned
                                </label>
                              </div>
                            )}
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                value={newLineExpectedReleaseWindow}
                                onChange={(e) =>
                                  setNewLineExpectedReleaseWindow(e.target.value)
                                }
                                className="w-full rounded border px-2 py-1 text-sm"
                                placeholder="Expected release window (e.g. 2026-07, 2026-07 to 2026-08)"
                              />
                            </div>
                            <div className="mt-2 space-y-1">
                              <label className="block text-xs font-medium text-zinc-600">
                                Image (optional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleNewLineImageFile}
                                className="text-xs"
                              />
                              {newLineImageDataUrl ? (
                                <div>
                                  <div className="text-[11px] font-medium text-zinc-500">
                                    Preview
                                  </div>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={newLineImageDataUrl}
                                    alt=""
                                    className="mt-1 max-h-32 w-auto rounded border object-contain"
                                  />
                                  <button
                                    type="button"
                                    className="mt-1 text-[11px] text-zinc-600 underline"
                                    onClick={() => setNewLineImageDataUrl(null)}
                                  >
                                    Remove image
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <div className="mt-2">
                              <input
                                value={newLineNotes}
                                onChange={(e) => setNewLineNotes(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                                placeholder="Notes (optional)"
                              />
                            </div>
                            <button
                              type="button"
                              className="mt-2 rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                              disabled={newLineTitle.trim() === ""}
                              onClick={addLineItemToExpandedGroup}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ) : null}
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
                {editingHoldingGroupId ? "Edit holding group" : "Create holding group"}
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
                  onClick={createHoldingGroup}
                  disabled={gSeller.trim() === ""}
                  className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {editingHoldingGroupId ? "Save changes" : "Create group"}
                </button>
                {editingHoldingGroupId && (
                  <button
                    type="button"
                    onClick={cancelEditHoldingGroup}
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
                                {g.computedDeadline
                                  ? toDateInputValue(g.computedDeadline)
                                  : "—"}{" "}
                                ·{" "}
                                <span className={soon ? "font-semibold text-red-600" : ""}>
                                  {cd}
                                </span>
                              </>
                            ) : (
                              <>
                                Deadline:{" "}
                                {g.computedDeadline
                                  ? toDateInputValue(g.computedDeadline)
                                  : "—"}{" "}
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
                            onClick={() =>
                              setExpandedHoldingGroupId(expanded ? null : g.id)
                            }
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
                                    {editingHoldingItemId === it.id ? (
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
                                          {formatPriceAmount(it.price)} × {it.quantity}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {editingHoldingItemId === it.id ? (
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
                                          {formatPriceAmount(it.price * it.quantity)}
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
                            <div className="mb-2 text-xs font-medium text-zinc-600">Add item</div>
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
                              className="mt-2 rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                              disabled={iName.trim() === ""}
                              onClick={() => addHoldingItemToGroup(g.id)}
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

