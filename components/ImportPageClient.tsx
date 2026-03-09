"use client";

import { useState } from "react";
import { ImportDraftCard } from "@/components/ImportDraftCard";

type ImportParsed = {
  sourceUrl: string;
  platform: string | null;
  rawTitle: string | null;
  rawPrice: string | null;
  rawImage: string | null;
  listedPrice: number | null;
  currency: string;
  auctionEndAt: string | null;
  recommendedDestination: "AUCTION" | "COLLECTION";
};

type ImportResponse = {
  draft: {
    id: number;
    sourceUrl: string;
    platform: string | null;
  };
  parsed: ImportParsed;
};

export function ImportPageClient() {
  const [url, setUrl] = useState("");
  const [hintType, setHintType] = useState<string>("UNKNOWN");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setResult(null);

    try {
      const res = await fetch("/api/import-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: url,
          hintType: hintType === "UNKNOWN" ? undefined : hintType,
        }),
      });
      const data: ImportResponse = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setMessage("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async () => {
    if (!result) return;
    await fetch(`/api/import-drafts/${result.draft.id}`, { method: "DELETE" });
    setResult(null);
  };

  const saveAs = async (target: "auction" | "wishlist" | "item") => {
    if (!result) return;
    const { parsed } = result;

    const common = {
      itemName: parsed.rawTitle ?? "",
    };

    try {
      if (target === "auction") {
        await fetch("/api/auctions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            platform: parsed.platform ?? "",
            auctionUrl: parsed.sourceUrl,
            currentPrice: parsed.listedPrice ?? null,
            auctionEndTime: parsed.auctionEndAt,
          }),
        });
      } else if (target === "wishlist") {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            expectedPrice: parsed.listedPrice ?? undefined,
            sourcePlatform: parsed.platform ?? "",
            sourceUrl: parsed.sourceUrl,
          }),
        });
      } else {
        await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            price: parsed.listedPrice ?? 0,
            quantity: 1,
            currency: parsed.currency || "UNKNOWN",
            totalAmount: parsed.listedPrice ?? 0,
            platform: parsed.platform ?? "",
            imageUrl: parsed.rawImage ?? "",
            status: "OWNED",
            sourceType: parsed.recommendedDestination === "AUCTION" ? "AUCTION" : "DIRECT_PURCHASE",
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

      {result && (
        <ImportDraftCard
          sourceUrl={result.parsed.sourceUrl}
          platform={result.parsed.platform}
          title={result.parsed.rawTitle}
          imageUrl={result.parsed.rawImage}
          listedPrice={result.parsed.listedPrice}
          currency={result.parsed.currency}
          auctionEndAt={result.parsed.auctionEndAt}
          recommendedDestination={result.parsed.recommendedDestination}
          onSaveAsAuction={() => saveAs("auction")}
          onSaveAsCollection={() => saveAs("item")}
          onSaveAsWishlist={() => saveAs("wishlist")}
        />
      )}
    </main>
  );
}
