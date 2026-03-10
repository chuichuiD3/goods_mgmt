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

  const [manualDestination, setManualDestination] = useState<
    "auction" | "collection" | "wishlist"
  >("collection");
  const [manualTitle, setManualTitle] = useState("");
  const [manualPlatform, setManualPlatform] = useState("");
  const [manualSourceUrl, setManualSourceUrl] = useState("");
  const [manualPrice, setManualPrice] = useState<string>("");
  const [manualImage, setManualImage] = useState<string | null>(null);

  // Canonical auction draft used by URL-parsed flow (and aligned to manual core fields)
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
    } catch (error) {
      console.error(error);
      setMessage("Manual auction save failed. Please try again.");
    }
  };

  const saveAs = async (target: "auction" | "wishlist" | "item") => {
    if (!result) return;
    const { parsed } = result;

    const common = {
      itemName: parsed.rawTitle ?? "",
    };

    try {
      if (target === "auction") {
        const priceNumber =
          auctionDraftPrice.trim() === "" ? null : Number(auctionDraftPrice);
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
      } else if (target === "wishlist") {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            expectedPrice: parsed.listedPrice ?? undefined,
            sourcePlatform: parsed.platform ?? "",
            sourceUrl: parsed.sourceUrl,
            imageUrl: auctionDraftImage ?? parsed.rawImage ?? null,
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
            imageUrl: auctionDraftImage ?? parsed.rawImage ?? "",
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

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const priceNumber =
      manualPrice.trim() === "" ? null : Number(manualPrice.trim());

    const common = {
      itemName: manualTitle || "(Untitled)",
    };

    try {
      if (manualDestination === "wishlist") {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            expectedPrice: priceNumber ?? undefined,
            sourcePlatform: manualPlatform || null,
            sourceUrl: manualSourceUrl || null,
            imageUrl: manualImage ?? null,
          }),
        });
      } else {
        await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...common,
            price: priceNumber ?? 0,
            quantity: 1,
            currency: "JPY",
            totalAmount: priceNumber ?? 0,
            platform: manualPlatform || null,
            status: "OWNED",
            imageUrl: manualImage ?? null,
            sourceType: "DIRECT_PURCHASE",
          }),
        });
      }

      setMessage("Saved successfully.");
      setManualTitle("");
      setManualPlatform("");
      setManualSourceUrl("");
      setManualPrice("");
      setManualAuctionEnd("");
      setManualImage(null);
    } catch (error) {
      console.error(error);
      setMessage("Manual save failed. Please try again.");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold">Import</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Manual entry */}
        <section className="space-y-3 rounded border bg-white p-4 text-sm">
          <h2 className="text-sm font-semibold">Manual entry</h2>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Destination</label>
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="collection"
                    checked={manualDestination === "collection"}
                    onChange={() => setManualDestination("collection")}
                  />
                  Collection
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="auction"
                    checked={manualDestination === "auction"}
                    onChange={() => setManualDestination("auction")}
                  />
                  Auction
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="wishlist"
                    checked={manualDestination === "wishlist"}
                    onChange={() => setManualDestination("wishlist")}
                  />
                  Wishlist
                </label>
              </div>
            </div>

            {manualDestination !== "auction" && (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Platform</label>
                    <input
                      type="text"
                      value={manualPlatform}
                      onChange={(e) => setManualPlatform(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                      placeholder="e.g. Mercari, Xianyu"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Source URL
                    </label>
                    <input
                      type="url"
                      value={manualSourceUrl}
                      onChange={(e) => setManualSourceUrl(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                      placeholder="Optional link to listing"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setManualImage(null);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setManualImage(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="mt-1 text-xs"
                  />
                  {manualImage && (
                    <div>
                      <div className="text-xs font-medium text-zinc-500">
                        Preview
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={manualImage}
                        alt="Manual uploaded"
                        className="mt-1 max-h-40 w-auto rounded border object-contain"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Save
                </button>
              </>
            )}

            {manualDestination === "auction" && (
              <div className="space-y-3 rounded border bg-white p-3 text-sm">
                <p className="text-xs text-zinc-600">
                  Use the same auction fields as URL import.
                </p>
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
                  onSaveAsCollection={() => {}}
                  onSaveAsWishlist={() => {}}
                />
              </div>
            )}
          </form>
        </section>

        {/* URL import */}
        <section className="space-y-3 rounded border bg-white p-4 text-sm">
          <h2 className="text-sm font-semibold">Import from URL</h2>
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
                onSaveAsAuction={() => saveAs("auction")}
                onSaveAsCollection={() => saveAs("item")}
                onSaveAsWishlist={() => saveAs("wishlist")}
              />
            </div>
          )}
        </section>
      </div>

      {message && (
        <div className="mt-4 text-xs text-zinc-600">{message}</div>
      )}
    </main>
  );
}
