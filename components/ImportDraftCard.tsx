"use client";

type ImportDraftCardProps = {
  sourceUrl: string;
  platform: string | null;
  title: string | null;
  imageUrl: string | null;
  listedPrice: number | null;
  auctionEndAt: string | null;
  recommendedDestination: "AUCTION" | "COLLECTION";
  onChangeImage: (imageDataUrl: string | null) => void;
  onChangeTitle: (title: string) => void;
  onChangePlatform: (platform: string) => void;
  onChangeSourceUrl: (sourceUrl: string) => void;
  onChangePrice: (price: string) => void;
  onChangeAuctionEndAt: (auctionEndAt: string) => void;
  onSaveAsAuction: () => void;
  onSaveAsWishlist: () => void;
  onSaveAsCollection: () => void;
};

export function ImportDraftCard({
  sourceUrl,
  platform,
  title,
  imageUrl,
  listedPrice,
  auctionEndAt,
  recommendedDestination,
  onChangeImage,
  onChangeTitle,
  onChangePlatform,
  onChangeSourceUrl,
  onChangePrice,
  onChangeAuctionEndAt,
  onSaveAsAuction,
  onSaveAsWishlist,
  onSaveAsCollection,
}: ImportDraftCardProps) {
  const formatBeijing = (iso: string | null): string => {
    if (!iso) return "Not detected";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Not detected";
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onChangeImage(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChangeImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded border bg-white p-4 text-sm shadow-sm">
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium">Title</label>
          <input
            type="text"
            value={title ?? ""}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            placeholder="(Untitled)"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium">Platform</label>
            <input
              type="text"
              value={platform ?? ""}
              onChange={(e) => onChangePlatform(e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="e.g. Yahoo Auctions, Mercari"
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={listedPrice !== null ? String(listedPrice) : ""}
              onChange={(e) => onChangePrice(e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="Not detected"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium">Source URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => onChangeSourceUrl(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-xs text-blue-600 underline"
            >
              Open source URL
            </a>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium">
            Auction end time (Beijing)
          </label>
          <input
            type="datetime-local"
            value={auctionEndAt ? auctionEndAt : ""}
            onChange={(e) => onChangeAuctionEndAt(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
          <div className="mt-1 text-[11px] text-zinc-500">
            Preview: {formatBeijing(auctionEndAt)}
          </div>
        </div>
        <div>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
            Recommended:{" "}
            {recommendedDestination === "AUCTION" ? "Auction" : "Collection"}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageFile}
          className="mt-1 text-xs"
        />
        {imageUrl && (
          <div>
            <div className="text-xs font-medium text-zinc-500">Preview</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title ?? "Imported image"}
              className="mt-1 max-h-40 w-auto rounded border object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={onSaveAsAuction}
          className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Save as Auction
        </button>
        <button
          type="button"
          onClick={onSaveAsCollection}
          className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100"
        >
          Save to Collection
        </button>
        <button
          type="button"
          onClick={onSaveAsWishlist}
          className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100"
        >
          Save to Wishlist
        </button>
      </div>
    </div>
  );
}

