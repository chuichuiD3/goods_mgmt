import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HoldingOrderStatus, HoldingOrderTimeMode } from "@prisma/client";

function computeFromDuration(purchaseDate: Date, durationDays: number): Date {
  const ms = durationDays * 24 * 60 * 60 * 1000;
  return new Date(purchaseDate.getTime() + ms);
}

function isTimeMode(v: unknown): v is HoldingOrderTimeMode {
  return (
    typeof v === "string" &&
    (Object.values(HoldingOrderTimeMode) as string[]).includes(v)
  );
}

export async function GET() {
  const groups = await prisma.holdingOrderGroup.findMany({
    include: { items: { orderBy: { id: "asc" } } },
  });

  // Sort: non-received groups first (by createdAt desc), received groups last (by receivedAt desc).
  groups.sort((a, b) => {
    const aIsReceived = a.status === "received";
    const bIsReceived = b.status === "received";
    if (aIsReceived !== bIsReceived) return aIsReceived ? 1 : -1;
    if (aIsReceived && bIsReceived) {
      const aTime = a.receivedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.receivedAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.sellerName) {
    return NextResponse.json({ error: "sellerName is required" }, { status: 400 });
  }

  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();
  const timeMode: HoldingOrderTimeMode = isTimeMode(body.timeMode)
    ? body.timeMode
    : "duration";

  const durationDaysRaw =
    body.durationDays === undefined || body.durationDays === null || body.durationDays === ""
      ? null
      : Number(body.durationDays);
  const durationDays = durationDaysRaw === null ? null : Math.trunc(durationDaysRaw);

  const deadline =
    body.deadline === undefined || body.deadline === null || body.deadline === ""
      ? null
      : new Date(body.deadline);

  let computedDeadline: Date | null = null;
  if (timeMode === "duration" && durationDays && durationDays > 0) {
    computedDeadline = computeFromDuration(purchaseDate, durationDays);
  } else if (timeMode === "fixed_date" && deadline) {
    computedDeadline = deadline;
  }

  const status: HoldingOrderStatus =
    body.status && Object.values(HoldingOrderStatus).includes(body.status)
      ? body.status
      : "holding";

  const created = await prisma.holdingOrderGroup.create({
    data: {
      sellerName: body.sellerName,
      platform: body.platform ?? null,
      purchaseDate,
      timeMode,
      durationDays: timeMode === "duration" ? durationDays : null,
      deadline: timeMode === "fixed_date" ? deadline : null,
      computedDeadline,
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

