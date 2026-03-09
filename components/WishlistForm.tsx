import { useState, FormEvent } from 'react';

export type WishlistFormValues = {
  itemName: string;
  series?: string;
  character?: string;
  category?: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  expectedPrice?: number;
  priority?: string;
  notes?: string;
};

type WishlistFormProps = {
  initialValues?: WishlistFormValues;
  onSubmit: (values: WishlistFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export function WishlistForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save wishlist item',
}: WishlistFormProps) {
  const [values, setValues] = useState<WishlistFormValues>({
    itemName: initialValues?.itemName ?? '',
    series: initialValues?.series ?? '',
    character: initialValues?.character ?? '',
    category: initialValues?.category ?? '',
    sourcePlatform: initialValues?.sourcePlatform ?? '',
    sourceUrl: initialValues?.sourceUrl ?? '',
    expectedPrice: initialValues?.expectedPrice,
    priority: initialValues?.priority ?? 'MEDIUM',
    notes: initialValues?.notes ?? '',
  });

  const handleChange = (field: keyof WishlistFormValues, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
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
          <label className="block text-sm font-medium">Source platform</label>
          <input
            type="text"
            value={values.sourcePlatform ?? ''}
            onChange={(e) => handleChange('sourcePlatform', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Source URL</label>
        <input
          type="text"
          value={values.sourceUrl ?? ''}
          onChange={(e) => handleChange('sourceUrl', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Expected price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.expectedPrice ?? ''}
            onChange={(e) =>
              handleChange(
                'expectedPrice',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Priority</label>
          <select
            value={values.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
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

