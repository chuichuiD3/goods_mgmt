import { useState, FormEvent } from 'react';

export type AuctionFormValues = {
  itemName: string;
  series?: string;
  character?: string;
  category?: string;
  platform?: string;
  auctionUrl?: string;
  currentPrice?: number;
  imageUrl?: string | null;
  myMaxBid?: number;
  auctionEndTime?: string;
  status?: string;
  notes?: string;
};

type AuctionFormProps = {
  initialValues?: AuctionFormValues;
  onSubmit: (values: AuctionFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export function AuctionForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save auction',
}: AuctionFormProps) {
  const [values, setValues] = useState<AuctionFormValues>({
    itemName: initialValues?.itemName ?? '',
    series: initialValues?.series ?? '',
    character: initialValues?.character ?? '',
    category: initialValues?.category ?? '',
    platform: initialValues?.platform ?? '',
    auctionUrl: initialValues?.auctionUrl ?? '',
    currentPrice: initialValues?.currentPrice,
    imageUrl: initialValues?.imageUrl ?? null,
    myMaxBid: initialValues?.myMaxBid,
    auctionEndTime: initialValues?.auctionEndTime,
    status: initialValues?.status ?? 'WATCHING',
    notes: initialValues?.notes ?? '',
  });

  const handleChange = (field: keyof AuctionFormValues, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      handleChange('imageUrl', null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Item name</label>
        <input
          required
          type="text"
          value={values.itemName}
          onChange={(e) => handleChange('itemName', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Series</label>
          <input
            type="text"
            value={values.series ?? ''}
            onChange={(e) => handleChange('series', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Character</label>
          <input
            type="text"
            value={values.character ?? ''}
            onChange={(e) => handleChange('character', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Category</label>
          <input
            type="text"
            value={values.category ?? ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Platform</label>
          <input
            type="text"
            value={values.platform ?? ''}
            onChange={(e) => handleChange('platform', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Auction URL</label>
        <input
          type="text"
          value={values.auctionUrl ?? ''}
          onChange={(e) => handleChange('auctionUrl', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageFile}
          className="mt-1 text-xs"
        />
        {values.imageUrl && (
          <div>
            <div className="text-xs font-medium text-zinc-500">Preview</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={values.imageUrl}
              alt={values.itemName || 'Auction image'}
              className="mt-1 max-h-40 w-auto rounded border object-contain"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Current price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.currentPrice ?? ''}
            onChange={(e) =>
              handleChange(
                'currentPrice',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">My max bid</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.myMaxBid ?? ''}
            onChange={(e) =>
              handleChange(
                'myMaxBid',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">End time</label>
          <input
            type="datetime-local"
            value={values.auctionEndTime ?? ''}
            onChange={(e) =>
              handleChange('auctionEndTime', e.target.value || undefined)
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Status</label>
        <select
          value={values.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="WATCHING">Watching</option>
          <option value="BIDDING">Bidding</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          value={values.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}

