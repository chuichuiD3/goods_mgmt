import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

