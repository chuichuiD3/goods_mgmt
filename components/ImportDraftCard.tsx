"use client";

type ImportDraftCardProps = {
  draft: {
    id: number;
    sourceUrl: string;
    platform: string | null;
    rawTitle: string | null;
    rawPrice: string | null;
    rawImage: string | null;
    detectedType: string;
    parseStatus: string;
  };
  onChange: (updates: {
    rawTitle?: string;
    rawPrice?: string;
    rawImage?: string;
    detectedType?: string;
  }) => void;
  onSaveAsAuction: () => void;
  onSaveAsWishlist: () => void;
  onSaveAsItem: () => void;
};

export function ImportDraftCard({
  draft,
  onChange,
  onSaveAsAuction,
  onSaveAsWishlist,
  onSaveAsItem,
}: ImportDraftCardProps) {
  return (
    <div className="space-y-3 rounded border bg-white p-4 text-sm shadow-sm">
      <div className="space-y-1">
        <div className="text-xs font-medium text-zinc-500">Source URL</div>
        <a
          href={draft.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-blue-600 underline"
        >
          {draft.sourceUrl}
        </a>
        {draft.platform && (
          <div className="text-xs text-zinc-500">Platform: {draft.platform}</div>
        )}
        <div className="text-xs text-zinc-500">
          Parse status: {draft.parseStatus}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium">Title</label>
          <input
            type="text"
            value={draft.rawTitle ?? ''}
            onChange={(e) => onChange({ rawTitle: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Price</label>
          <input
            type="text"
            value={draft.rawPrice ?? ''}
            onChange={(e) => onChange({ rawPrice: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Image URL</label>
          <input
            type="text"
            value={draft.rawImage ?? ''}
            onChange={(e) => onChange({ rawImage: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Detected type</label>
          <select
            value={draft.detectedType}
            onChange={(e) => onChange({ detectedType: e.target.value })}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          >
            <option value="UNKNOWN">Unknown</option>
            <option value="AUCTION">Auction</option>
            <option value="WISHLIST">Wishlist</option>
            <option value="PURCHASE">Purchase</option>
          </select>
        </div>
      </div>

      {draft.rawImage && (
        <div>
          <div className="text-xs font-medium text-zinc-500">Preview</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={draft.rawImage}
            alt={draft.rawTitle ?? 'Imported image'}
            className="mt-1 max-h-40 w-auto rounded border object-contain"
          />
        </div>
      )}

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
          onClick={onSaveAsWishlist}
          className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100"
        >
          Save as Wishlist
        </button>
        <button
          type="button"
          onClick={onSaveAsItem}
          className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100"
        >
          Save as Item
        </button>
      </div>
    </div>
  );
}

