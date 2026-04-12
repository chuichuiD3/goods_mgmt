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
  const [activeTab, setActiveTab] = useState<"MANUAL" | "URL">("MANUAL");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [auctionDraftTitle, setAuctionDraftTitle] = useState<string>("");
  const [auctionDraftPlatform, setAuctionDraftPlatform] = useState<string>("");
  const [auctionDraftSourceUrl, setAuctionDraftSourceUrl] = useState<string>("");
  const [auctionDraftEndIso, setAuctionDraftEndIso] = useState<string>("");
  const [auctionDraftImage, setAuctionDraftImage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setResult(null);

    try {
      const res = await fetch("/api/import-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: url }),
      });
      const data: ImportResponse = await res.json();
      setResult(data);
      setAuctionDraftTitle(data.parsed.rawTitle ?? "");
      setAuctionDraftPlatform(data.parsed.platform ?? "");
      setAuctionDraftSourceUrl(data.parsed.sourceUrl ?? url);
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
    try {
      await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: auctionDraftTitle || "(Untitled)",
          platform: auctionDraftPlatform || null,
          auctionUrl: auctionDraftSourceUrl || null,
          currentPrice: null,
          auctionEndTime:
            auctionDraftEndIso.trim() !== ""
              ? new Date(auctionDraftEndIso).toISOString()
              : null,
          imageUrl: auctionDraftImage ?? null,
        }),
      });
      setMessage("Saved successfully.");
      setAuctionDraftTitle("");
      setAuctionDraftPlatform("");
      setAuctionDraftSourceUrl("");
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
    try {
      await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: auctionDraftTitle || parsed.rawTitle || "(Untitled)",
          platform: auctionDraftPlatform || parsed.platform || null,
          auctionUrl: auctionDraftSourceUrl || parsed.sourceUrl,
          currentPrice: parsed.listedPrice ?? null,
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
    <div className="space-y-3">
      {/* Tab strip */}
      <div className="flex items-center gap-2 border-b pb-2 text-xs font-medium">
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === "MANUAL"
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
          onClick={() => setActiveTab("MANUAL")}
        >
          Manual entry
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 ${
            activeTab === "URL"
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
          onClick={() => {
            setActiveTab("URL");
            setMessage(null);
          }}
        >
          Import from URL
        </button>
      </div>

      {activeTab === "MANUAL" && (
        <ImportDraftCard
          sourceUrl={auctionDraftSourceUrl}
          platform={auctionDraftPlatform}
          title={auctionDraftTitle}
          imageUrl={auctionDraftImage}
          auctionEndAt={auctionDraftEndIso || null}
          onChangeImage={setAuctionDraftImage}
          onChangeTitle={setAuctionDraftTitle}
          onChangePlatform={setAuctionDraftPlatform}
          onChangeSourceUrl={setAuctionDraftSourceUrl}
          onChangeAuctionEndAt={setAuctionDraftEndIso}
          onSaveAsAuction={saveManualAuction}
          onSaveAsCollection={noop}
          onSaveAsWishlist={noop}
          auctionImportOnly
        />
      )}

      {activeTab === "URL" && (
        <div className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Importing…" : "Import"}
            </button>
          </form>

          {result && (
            <ImportDraftCard
              sourceUrl={auctionDraftSourceUrl || result.parsed.sourceUrl}
              platform={auctionDraftPlatform || result.parsed.platform}
              title={auctionDraftTitle || result.parsed.rawTitle}
              imageUrl={auctionDraftImage}
              auctionEndAt={auctionDraftEndIso || result.parsed.auctionEndAt}
              onChangeImage={setAuctionDraftImage}
              onChangeTitle={setAuctionDraftTitle}
              onChangePlatform={setAuctionDraftPlatform}
              onChangeSourceUrl={setAuctionDraftSourceUrl}
              onChangeAuctionEndAt={setAuctionDraftEndIso}
              onSaveAsAuction={saveImportedAsAuction}
              onSaveAsCollection={noop}
              onSaveAsWishlist={noop}
              auctionImportOnly
            />
          )}
        </div>
      )}

      {message && (
        <div className="text-xs text-zinc-600">{message}</div>
      )}
    </div>
  );
}
