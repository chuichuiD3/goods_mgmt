import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  MerchantPreorderGroupStatus,
  MerchantPreorderSubtype,
} from "@prisma/client";

function isSubtype(v: unknown): v is MerchantPreorderSubtype {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderSubtype) as string[]).includes(v)
  );
}

function isGroupStatus(v: unknown): v is MerchantPreorderGroupStatus {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderGroupStatus) as string[]).includes(v)
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

  if (body.sellerName !== undefined) data.sellerName = body.sellerName;
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.purchaseDate !== undefined)
    data.purchaseDate = new Date(body.purchaseDate);
  if (body.subtype !== undefined && isSubtype(body.subtype))
    data.subtype = body.subtype;
  if (body.amountPaid !== undefined)
    data.amountPaid =
      body.amountPaid === null || body.amountPaid === ""
        ? null
        : Number(body.amountPaid);

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
  if (body.status !== undefined && isGroupStatus(body.status))
    data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await prisma.merchantPreorderGroup.update({
    where: { id },
    data,
    include: { items: { orderBy: { id: "asc" } } },
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

  await prisma.merchantPreorderGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

