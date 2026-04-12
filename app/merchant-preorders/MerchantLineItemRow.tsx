"use client";

import { type ChangeEvent } from "react";

type MerchantPreorderSubtype = "full_payment_presale" | "deposit_presale";

type MerchantPreorderLineItem = {
  id: number;
  groupId: number;
  title: string;
  imageUrl: string | null;
  quantity: number;
  notes: string | null;
  subtype: MerchantPreorderSubtype;
  amountPaidTotal: number | null;
  depositPaidAt: string | null;
  depositAmount: number | null;
  finalPaid: boolean;
  finalPaidAt: string | null;
  finalAmount: number | null;
  owned: boolean;
  expectedReleaseWindow: string | null;
  received: boolean;
};

type MerchantLineItemRowProps = {
  it: MerchantPreorderLineItem;
  isEditing: boolean;
  eLineTitle: string;
  eLineSubtype: MerchantPreorderSubtype;
  eLineAmountPaidTotal: string;
  eLineDepositPaidAt: string;
  eLineDepositAmount: string;
  eLineFinalPaid: boolean;
  eLineFinalPaidAt: string;
  eLineFinalAmount: string;
  eLineOwned: boolean;
  eLineExpectedReleaseWindow: string;
  eLineImageDataUrl: string | null;
  eLineNotes: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onMarkReceived: () => void;
  setELineTitle: (v: string) => void;
  setELineSubtype: (v: MerchantPreorderSubtype) => void;
  setELineAmountPaidTotal: (v: string) => void;
  setELineDepositPaidAt: (v: string) => void;
  setELineDepositAmount: (v: string) => void;
  setELineFinalPaid: (v: boolean) => void;
  setELineFinalPaidAt: (v: string) => void;
  setELineFinalAmount: (v: string) => void;
  setELineOwned: (v: boolean) => void;
  setELineExpectedReleaseWindow: (v: string) => void;
  setELineNotes: (v: string) => void;
  handleELineImageFile: (e: ChangeEvent<HTMLInputElement>) => void;
  clearELineImage: () => void;
};

export function MerchantLineItemRow({
  it,
  isEditing,
  eLineTitle,
  eLineSubtype,
  eLineAmountPaidTotal,
  eLineDepositPaidAt,
  eLineDepositAmount,
  eLineFinalPaid,
  eLineFinalPaidAt,
  eLineFinalAmount,
  eLineOwned,
  eLineExpectedReleaseWindow,
  eLineImageDataUrl,
  eLineNotes,
  onStartEdit,
  onCancelEdit,
  onSave,
  onMarkReceived,
  setELineTitle,
  setELineSubtype,
  setELineAmountPaidTotal,
  setELineDepositPaidAt,
  setELineDepositAmount,
  setELineFinalPaid,
  setELineFinalPaidAt,
  setELineFinalAmount,
  setELineOwned,
  setELineExpectedReleaseWindow,
  setELineNotes,
  handleELineImageFile,
  clearELineImage,
}: MerchantLineItemRowProps) {
  return (
    <div className={`rounded border bg-white p-2 text-xs ${isEditing ? "flex flex-col gap-2" : "flex items-start justify-between gap-2"}`}>
      <div className="flex items-start gap-2">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-zinc-100">
          {it.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={it.imageUrl}
              alt={it.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={eLineTitle}
                onChange={(e) => setELineTitle(e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Title"
              />
              <select
                value={eLineSubtype}
                onChange={(e) =>
                  setELineSubtype(e.target.value as MerchantPreorderSubtype)
                }
                className="w-full rounded border px-2 py-1 text-sm"
              >
                <option value="full_payment_presale">Full payment presale</option>
                <option value="deposit_presale">Deposit presale</option>
              </select>
              {eLineSubtype === "full_payment_presale" ? (
                <input
                  type="number"
                  value={eLineAmountPaidTotal}
                  onChange={(e) => setELineAmountPaidTotal(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="Amount paid total (optional)"
                />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={eLineDepositPaidAt}
                    onChange={(e) => setELineDepositPaidAt(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    value={eLineDepositAmount}
                    onChange={(e) => setELineDepositAmount(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Deposit amount (optional)"
                  />
                  <label className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={eLineFinalPaid}
                      onChange={(e) => setELineFinalPaid(e.target.checked)}
                    />
                    Final paid
                  </label>
                  <input
                    type="date"
                    value={eLineFinalPaidAt}
                    onChange={(e) => setELineFinalPaidAt(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    disabled={!eLineFinalPaid}
                  />
                  <input
                    type="number"
                    value={eLineFinalAmount}
                    onChange={(e) => setELineFinalAmount(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Final amount (optional)"
                    disabled={!eLineFinalPaid}
                  />
                  <label className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={eLineOwned}
                      onChange={(e) => setELineOwned(e.target.checked)}
                    />
                    Owned
                  </label>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={eLineExpectedReleaseWindow}
                  onChange={(e) => setELineExpectedReleaseWindow(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm"
                  placeholder="Expected release window (e.g. 2026-07 to 2026-08)"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600">
                  Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleELineImageFile}
                  className="text-xs"
                />
                {eLineImageDataUrl ? (
                  <div>
                    <div className="text-[11px] font-medium text-zinc-500">Preview</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={eLineImageDataUrl}
                      alt=""
                      className="mt-1 max-h-32 w-auto rounded border object-contain"
                    />
                    <button
                      type="button"
                      className="mt-1 text-[11px] text-zinc-600 underline"
                      onClick={clearELineImage}
                    >
                      Remove image
                    </button>
                  </div>
                ) : null}
              </div>
              <input
                value={eLineNotes}
                onChange={(e) => setELineNotes(e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Notes (optional)"
              />
              <div className="flex gap-2">
                <button
                  className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                  onClick={onSave}
                >
                  Save
                </button>
                <button
                  className="rounded border px-2 py-1 text-xs hover:bg-zinc-100"
                  onClick={onCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="font-medium text-zinc-900">{it.title}</div>
              <div className="mt-0.5 text-[11px] text-zinc-600">
                {it.subtype === "deposit_presale"
                  ? `Deposit · Owned: ${it.owned ? "Yes" : "No"}`
                  : `Full payment`}
                {it.expectedReleaseWindow
                  ? ` · Release: ${it.expectedReleaseWindow}`
                  : ""}
              </div>
              {it.notes ? (
                <div className="text-zinc-600 line-clamp-2">{it.notes}</div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
          {it.received ? "received" : "waiting"}
        </span>
        {!isEditing ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
            onClick={onStartEdit}
          >
            Edit
          </button>
        ) : null}
        {!it.received ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-[11px] hover:bg-zinc-100"
            onClick={onMarkReceived}
          >
            Mark received → Collection
          </button>
        ) : null}
      </div>
    </div>
  );
}
