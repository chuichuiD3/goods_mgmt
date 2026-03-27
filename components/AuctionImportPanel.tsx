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

type AuctionImportPanelProps = {
  onAuctionSaved?: () => void | Promise<void>;
};

export function AuctionImportPanel({ onAuctionSaved }: AuctionImportPanelProps) {
  const [url, setUrl] = useState("");
  const [hintType, setHintType] = useState<string>("UNKNOWN");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [auctionDraftTitle, setAuctionDraftTitle] = useState<string>("");
  const [auctionDraftPlatform, setAuctionDraftPlatform] = useState<string>("");
  const [auctionDraftSourceUrl, setAuctionDraftSourceUrl] =
    useState<string>("");
  const [auctionDraftPrice, setAuctionDraftPrice] = useState<string>("");
  const [auctionDraftEndIso, setAuctionDraftEndIso] = useState<string>("");
  const [auctionDraftImage, setAuctionDraftImage] = useState<string | null>(
    null
  );

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
      setAuctionDraftTitle(data.parsed.rawTitle ?? "");
      setAuctionDraftPlatform(data.parsed.platform ?? "");
      setAuctionDraftSourceUrl(data.parsed.sourceUrl ?? url);
      setAuctionDraftPrice(
        data.parsed.listedPrice !== null ? String(data.parsed.listedPrice) : ""
      );
      setAuctionDraftEndIso(data.parsed.auctionEndAt ?? "");
      setAuctionDraftImage(data.parsed.rawImage ?? null);
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

  const saveManualAuction = async () => {
    setMessage(null);
    const priceNumber =
      auctionDraftPrice.trim() === "" ? null : Number(auctionDraftPrice.trim());

    const body = {
      itemName: auctionDraftTitle || "(Untitled)",
      platform: auctionDraftPlatform || null,
      auctionUrl: auctionDraftSourceUrl || null,
      currentPrice: Number.isFinite(priceNumber as number)
        ? priceNumber
        : null,
      auctionEndTime:
        auctionDraftEndIso.trim() !== ""
          ? new Date(auctionDraftEndIso).toISOString()
          : null,
      imageUrl: auctionDraftImage ?? null,
    };

    try {
      await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMessage("Saved successfully.");
      setAuctionDraftTitle("");
      setAuctionDraftPlatform("");
      setAuctionDraftSourceUrl("");
      setAuctionDraftPrice("");
      setAuctionDraftEndIso("");
      setAuctionDraftImage(null);
      await onAuctionSaved?.();
    } catch (error) {
      console.error(error);
      setMessage("Manual auction save failed. Please try again.");
    }
  };

  const saveImportedAsAuction = async () => {
    if (!result) return;
    const { parsed } = result;
    const common = { itemName: parsed.rawTitle ?? "" };
    const priceNumber =
      auctionDraftPrice.trim() === "" ? null : Number(auctionDraftPrice);

    try {
      await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: auctionDraftTitle || common.itemName,
          platform: auctionDraftPlatform || parsed.platform || null,
          auctionUrl: auctionDraftSourceUrl || parsed.sourceUrl,
          currentPrice: Number.isFinite(priceNumber as number)
            ? priceNumber
            : null,
          auctionEndTime: auctionDraftEndIso || parsed.auctionEndAt,
          imageUrl: auctionDraftImage ?? parsed.rawImage ?? null,
        }),
      });
      await deleteDraft();
      setMessage("Saved successfully.");
      await onAuctionSaved?.();
    } catch (error) {
      console.error(error);
      setMessage("Save failed. Please try again.");
    }
  };

  const noop = () => {};

  return (
    <section className="mb-6 space-y-4">
      <h2 className="text-sm font-semibold">Import auction</h2>
      <p className="text-xs text-zinc-500">
        Parse a listing URL or enter auction details manually. Saves to your
        auction list.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded border bg-white p-4 text-sm">
          <h3 className="text-sm font-semibold">Manual entry</h3>
          <div className="space-y-3 rounded border bg-zinc-50 p-3 text-sm">
            <ImportDraftCard
              sourceUrl={auctionDraftSourceUrl}
              platform={auctionDraftPlatform}
              title={auctionDraftTitle}
              imageUrl={auctionDraftImage}
              listedPrice={
                auctionDraftPrice.trim() !== ""
                  ? Number(auctionDraftPrice)
                  : null
              }
              auctionEndAt={auctionDraftEndIso || null}
              recommendedDestination="AUCTION"
              onChangeImage={setAuctionDraftImage}
              onChangeTitle={setAuctionDraftTitle}
              onChangePlatform={setAuctionDraftPlatform}
              onChangeSourceUrl={setAuctionDraftSourceUrl}
              onChangePrice={setAuctionDraftPrice}
              onChangeAuctionEndAt={setAuctionDraftEndIso}
              onSaveAsAuction={saveManualAuction}
              onSaveAsCollection={noop}
              onSaveAsWishlist={noop}
              auctionImportOnly
            />
          </div>
        </div>

        <div className="space-y-3 rounded border bg-white p-4 text-sm">
          <h3 className="text-sm font-semibold">Import from URL</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
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

          {result && (
            <div className="mt-4">
              <ImportDraftCard
                sourceUrl={auctionDraftSourceUrl || result.parsed.sourceUrl}
                platform={auctionDraftPlatform || result.parsed.platform}
                title={auctionDraftTitle || result.parsed.rawTitle}
                imageUrl={auctionDraftImage}
                listedPrice={
                  auctionDraftPrice.trim() !== ""
                    ? Number(auctionDraftPrice)
                    : result.parsed.listedPrice
                }
                auctionEndAt={auctionDraftEndIso || result.parsed.auctionEndAt}
                recommendedDestination={result.parsed.recommendedDestination}
                onChangeImage={setAuctionDraftImage}
                onChangeTitle={setAuctionDraftTitle}
                onChangePlatform={setAuctionDraftPlatform}
                onChangeSourceUrl={setAuctionDraftSourceUrl}
                onChangePrice={setAuctionDraftPrice}
                onChangeAuctionEndAt={setAuctionDraftEndIso}
                onSaveAsAuction={saveImportedAsAuction}
                onSaveAsCollection={noop}
                onSaveAsWishlist={noop}
                auctionImportOnly
              />
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="text-xs text-zinc-600">{message}</div>
      )}
    </section>
  );
}
