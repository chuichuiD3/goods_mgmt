import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HoldingOrderStatus, HoldingOrderTimeMode } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function computeFromDuration(purchaseDate: Date, durationDays: number): Date {
  const ms = durationDays * 24 * 60 * 60 * 1000;
  return new Date(purchaseDate.getTime() + ms);
}

function isHoldingStatus(v: unknown): v is HoldingOrderStatus {
  return typeof v === "string" && (Object.values(HoldingOrderStatus) as string[]).includes(v);
}

function isTimeMode(v: unknown): v is HoldingOrderTimeMode {
  return (
    typeof v === "string" &&
    (Object.values(HoldingOrderTimeMode) as string[]).includes(v)
  );
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

  const timeMode: HoldingOrderTimeMode = isTimeMode(body.timeMode)
    ? body.timeMode
    : existing.timeMode;

  const durationDaysRaw =
    body.durationDays === undefined
      ? existing.durationDays
      : body.durationDays === null || body.durationDays === ""
        ? null
        : Number(body.durationDays);
  const durationDays = durationDaysRaw === null ? null : Math.trunc(durationDaysRaw);

  const deadlineRaw =
    body.deadline === undefined
      ? existing.deadline
      : body.deadline === null || body.deadline === ""
        ? null
        : new Date(body.deadline);

  const deadline = deadlineRaw ?? null;

  let computedDeadline: Date | null = null;
  if (timeMode === "duration" && durationDays && durationDays > 0) {
    computedDeadline = computeFromDuration(purchaseDate, durationDays);
  } else if (timeMode === "fixed_date" && deadline) {
    computedDeadline = deadline;
  }

  const newStatus: HoldingOrderStatus | undefined = isHoldingStatus(body.status)
    ? body.status
    : undefined;

  // Stamp receivedAt only on the first transition into "received";
  // clear it if the status is explicitly moved away from "received".
  let receivedAtUpdate: Date | null | undefined = undefined;
  if (newStatus === "received" && existing.status !== "received") {
    receivedAtUpdate = new Date();
  } else if (newStatus !== undefined && newStatus !== "received" && existing.status === "received") {
    receivedAtUpdate = null;
  }

  const updated = await prisma.holdingOrderGroup.update({
    where: { id },
    data: {
      sellerName: body.sellerName ?? undefined,
      platform: body.platform ?? undefined,
      purchaseDate,
      timeMode,
      durationDays: timeMode === "duration" ? durationDays : null,
      deadline: timeMode === "fixed_date" ? deadline : null,
      computedDeadline,
      shippingThreshold:
        body.shippingThreshold === undefined
          ? undefined
          : body.shippingThreshold === null || body.shippingThreshold === ""
            ? null
            : Number(body.shippingThreshold),
      status: newStatus,
      note: body.note ?? undefined,
      ...(receivedAtUpdate !== undefined ? { receivedAt: receivedAtUpdate } : {}),
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

