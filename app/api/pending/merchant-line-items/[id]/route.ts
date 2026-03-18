import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MerchantPreorderSubtype } from "@prisma/client";

function isSubtype(v: unknown): v is MerchantPreorderSubtype {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderSubtype) as string[]).includes(v)
  );
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.quantity !== undefined)
    data.quantity =
      body.quantity === null || body.quantity === "" ? 1 : Number(body.quantity);
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.received !== undefined) data.received = Boolean(body.received);
  if (body.subtype !== undefined && isSubtype(body.subtype)) data.subtype = body.subtype;
  if (body.amountPaidTotal !== undefined)
    data.amountPaidTotal =
      body.amountPaidTotal === null || body.amountPaidTotal === ""
        ? null
        : Number(body.amountPaidTotal);
  if (body.currency !== undefined) data.currency = body.currency ?? "JPY";
  if (body.depositPaidAt !== undefined)
    data.depositPaidAt = body.depositPaidAt ? new Date(body.depositPaidAt) : null;
  if (body.depositAmount !== undefined)
    data.depositAmount =
      body.depositAmount === null || body.depositAmount === ""
        ? null
        : Number(body.depositAmount);
  if (body.finalPaid !== undefined) data.finalPaid = Boolean(body.finalPaid);
  if (body.finalPaidAt !== undefined)
    data.finalPaidAt = body.finalPaidAt ? new Date(body.finalPaidAt) : null;
  if (body.finalAmount !== undefined)
    data.finalAmount =
      body.finalAmount === null || body.finalAmount === ""
        ? null
        : Number(body.finalAmount);
  if (body.owned !== undefined) data.owned = Boolean(body.owned);
  if (body.expectedReleaseAt !== undefined)
    data.expectedReleaseAt = body.expectedReleaseAt
      ? new Date(body.expectedReleaseAt)
      : null;
  if (body.expectedShipAt !== undefined)
    data.expectedShipAt = body.expectedShipAt ? new Date(body.expectedShipAt) : null;

  const updated = await prisma.merchantPreorderLineItem.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.merchantPreorderLineItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

