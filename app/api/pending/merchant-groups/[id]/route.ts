import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MerchantPreorderGroupStatus } from "@prisma/client";

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

