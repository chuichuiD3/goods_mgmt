"use client";

type ImportDraftCardProps = {
  sourceUrl: string;
  platform: string | null;
  title: string | null;
  imageUrl: string | null;
  listedPrice: number | null;
  currency: string;
  auctionEndAt: string | null;
  recommendedDestination: "AUCTION" | "COLLECTION";
  onChangeImage: (imageDataUrl: string | null) => void;
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
  currency,
  auctionEndAt,
  recommendedDestination,
  onChangeImage,
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
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-500">Source URL</div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-blue-600 underline"
        >
          {sourceUrl}
        </a>
        {platform && (
          <div className="text-xs text-zinc-500">Platform: {platform}</div>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium">Title</label>
          <div className="mt-1 rounded border px-2 py-1 text-sm">
            {title ?? "(Untitled)"}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium">Price</label>
          <div className="mt-1 rounded border px-2 py-1 text-sm">
            {listedPrice !== null
              ? `${listedPrice.toLocaleString()} ${currency}`
              : "Not detected"}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium">Auction end time</label>
          <div className="mt-1 rounded border px-2 py-1 text-sm">
            {formatBeijing(auctionEndAt)}
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

