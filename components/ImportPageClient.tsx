"use client";

import { useState } from "react";
import { ImportDraftCard } from "@/components/ImportDraftCard";

type Draft = {
  id: number;
  sourceUrl: string;
  platform: string | null;
  rawTitle: string | null;
  rawPrice: string | null;
  rawImage: string | null;
  detectedType: string;
  parseStatus: string;
};

export function ImportPageClient() {
  const [url, setUrl] = useState("");
  const [hintType, setHintType] = useState<string>("UNKNOWN");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setDraft(null);

    try {
      const res = await fetch("/api/import-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: url,
          hintType: hintType === "UNKNOWN" ? undefined : hintType,
        }),
      });
      const data = await res.json();
      setDraft(data);
    } catch (error) {
      console.error(error);
      setMessage("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async () => {
    if (!draft) return;
    await fetch(`/api/import-drafts/${draft.id}`, { method: "DELETE" });
    setDraft(null);
  };

  const saveAs = async (target: "auction" | "wishlist" | "item") => {
    if (!draft) return;

    const common = {
      itemName: draft.rawTitle ?? "",
    };

    try {
      if (target === "auction") {
        await fetch("/api/auctions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            platform: draft.platform ?? "",
          }),
        });
      } else if (target === "wishlist") {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            expectedPrice: draft.rawPrice ? Number(draft.rawPrice) : undefined,
          }),
        });
      } else {
        await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            price: draft.rawPrice ? Number(draft.rawPrice) : undefined,
            imageUrl: draft.rawImage ?? "",
            status: "PENDING_PAYMENT",
          }),
        });
      }
      await deleteDraft();
      setMessage("Saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Save failed. Please try again.");
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold">Import</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-6 space-y-3 rounded border bg-white p-4 text-sm"
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium">Source URL</label>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
            placeholder="Paste product or auction URL"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Type hint</label>
          <select
            value={hintType}
            onChange={(e) => setHintType(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="UNKNOWN">Let app guess</option>
            <option value="AUCTION">Auction</option>
            <option value="WISHLIST">Wishlist</option>
            <option value="PURCHASE">Purchase</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </form>

      {message && (
        <div className="mb-4 text-xs text-zinc-600">{message}</div>
      )}

      {draft && (
        <ImportDraftCard
          draft={draft}
          onChange={(updates) =>
            setDraft((prev) => (prev ? { ...prev, ...updates } : prev))
          }
          onSaveAsAuction={() => saveAs("auction")}
          onSaveAsWishlist={() => saveAs("wishlist")}
          onSaveAsItem={() => saveAs("item")}
        />
      )}
    </main>
  );
}
