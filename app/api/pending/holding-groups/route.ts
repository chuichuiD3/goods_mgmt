import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HoldingOrderStatus } from "@prisma/client";

function computeDeadline(purchaseDate: Date, durationDays: number | null): Date | null {
  if (!durationDays || !Number.isFinite(durationDays) || durationDays <= 0) return null;
  const ms = durationDays * 24 * 60 * 60 * 1000;
  return new Date(purchaseDate.getTime() + ms);
}

export async function GET() {
  const groups = await prisma.holdingOrderGroup.findMany({
    orderBy: { updatedAt: "desc" },
    include: { items: { orderBy: { id: "asc" } } },
  });
  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.sellerName) {
    return NextResponse.json({ error: "sellerName is required" }, { status: 400 });
  }

  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();
  const durationDays =
    body.durationDays === undefined || body.durationDays === null || body.durationDays === ""
      ? null
      : Number(body.durationDays);
  const deadline = computeDeadline(purchaseDate, durationDays);

  const status: HoldingOrderStatus =
    body.status && Object.values(HoldingOrderStatus).includes(body.status)
      ? body.status
      : "holding";

  const created = await prisma.holdingOrderGroup.create({
    data: {
      sellerName: body.sellerName,
      platform: body.platform ?? null,
      purchaseDate,
      durationDays: durationDays === null ? null : Math.trunc(durationDays),
      deadline,
      shippingThreshold:
        body.shippingThreshold === undefined || body.shippingThreshold === null || body.shippingThreshold === ""
          ? null
          : Number(body.shippingThreshold),
      status,
      note: body.note ?? null,
    },
    include: { items: true },
  });

  return NextResponse.json(created, { status: 201 });
}

