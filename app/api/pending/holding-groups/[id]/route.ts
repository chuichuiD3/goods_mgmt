import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HoldingOrderStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function computeDeadline(purchaseDate: Date, durationDays: number | null): Date | null {
  if (!durationDays || !Number.isFinite(durationDays) || durationDays <= 0) return null;
  const ms = durationDays * 24 * 60 * 60 * 1000;
  return new Date(purchaseDate.getTime() + ms);
}

function isHoldingStatus(v: unknown): v is HoldingOrderStatus {
  return typeof v === "string" && (Object.values(HoldingOrderStatus) as string[]).includes(v);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const body = await request.json();

  const existing = await prisma.holdingOrderGroup.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate;
  const durationDaysRaw =
    body.durationDays === undefined ? existing.durationDays : (body.durationDays === null || body.durationDays === "" ? null : Number(body.durationDays));
  const durationDays = durationDaysRaw === null ? null : Math.trunc(durationDaysRaw);
  const deadline = computeDeadline(purchaseDate, durationDays);

  const updated = await prisma.holdingOrderGroup.update({
    where: { id },
    data: {
      sellerName: body.sellerName ?? undefined,
      platform: body.platform ?? undefined,
      purchaseDate,
      durationDays,
      deadline,
      shippingThreshold:
        body.shippingThreshold === undefined
          ? undefined
          : body.shippingThreshold === null || body.shippingThreshold === ""
            ? null
            : Number(body.shippingThreshold),
      status: isHoldingStatus(body.status) ? body.status : undefined,
      note: body.note ?? undefined,
    },
    include: { items: { orderBy: { id: "asc" } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  await prisma.holdingOrderGroup.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

