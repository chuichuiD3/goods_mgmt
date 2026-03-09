import { useState, FormEvent } from 'react';

export type ItemFormValues = {
  itemName: string;
  series?: string;
  character?: string;
  category?: string;
  platform?: string;
  shop?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  status?: string;
  orderDate?: string;
  paymentDeadline?: string;
  paidAt?: string;
  isPresale?: boolean;
  sourceType?: string;
  sourceOrderId?: string;
  imageUrl?: string;
  notes?: string;
};

type ItemFormProps = {
  initialValues?: ItemFormValues;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export function ItemForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save item',
}: ItemFormProps) {
  const [values, setValues] = useState<ItemFormValues>({
    itemName: initialValues?.itemName ?? '',
    series: initialValues?.series ?? '',
    character: initialValues?.character ?? '',
    category: initialValues?.category ?? '',
    platform: initialValues?.platform ?? '',
    shop: initialValues?.shop ?? '',
    price: initialValues?.price ?? undefined,
    quantity: initialValues?.quantity ?? 1,
    currency: initialValues?.currency ?? 'JPY',
    status: initialValues?.status ?? 'PENDING_PAYMENT',
    orderDate: initialValues?.orderDate,
    paymentDeadline: initialValues?.paymentDeadline,
    paidAt: initialValues?.paidAt,
    isPresale: initialValues?.isPresale ?? false,
    sourceType: initialValues?.sourceType ?? 'DIRECT_PURCHASE',
    sourceOrderId: initialValues?.sourceOrderId ?? '',
    imageUrl: initialValues?.imageUrl ?? '',
    notes: initialValues?.notes ?? '',
  });

  const handleChange = (field: keyof ItemFormValues, value: unknown) => {
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
          <label className="block text-sm font-medium">Platform</label>
          <input
            type="text"
            value={values.platform ?? ''}
            onChange={(e) => handleChange('platform', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.price ?? ''}
            onChange={(e) =>
              handleChange('price', e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Quantity</label>
          <input
            type="number"
            min={1}
            value={values.quantity ?? 1}
            onChange={(e) =>
              handleChange('quantity', e.target.value ? Number(e.target.value) : 1)
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Currency</label>
          <input
            type="text"
            value={values.currency ?? 'JPY'}
            onChange={(e) => handleChange('currency', e.target.value)}
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
          <option value="PENDING_PAYMENT">Pending payment</option>
          <option value="OWNED">Owned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Order date</label>
          <input
            type="date"
            value={values.orderDate ?? ''}
            onChange={(e) => handleChange('orderDate', e.target.value || undefined)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Payment deadline</label>
          <input
            type="date"
            value={values.paymentDeadline ?? ''}
            onChange={(e) =>
              handleChange('paymentDeadline', e.target.value || undefined)
            }
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Paid at</label>
          <input
            type="date"
            value={values.paidAt ?? ''}
            onChange={(e) => handleChange('paidAt', e.target.value || undefined)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={values.isPresale ?? false}
            onChange={(e) => handleChange('isPresale', e.target.checked)}
          />
          Presale
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Source type</label>
          <select
            value={values.sourceType}
            onChange={(e) => handleChange('sourceType', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="DIRECT_PURCHASE">Direct purchase</option>
            <option value="AUCTION">Auction</option>
            <option value="PRESALE">Presale</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Source order ID</label>
          <input
            type="text"
            value={values.sourceOrderId ?? ''}
            onChange={(e) => handleChange('sourceOrderId', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Image URL</label>
        <input
          type="text"
          value={values.imageUrl ?? ''}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
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

