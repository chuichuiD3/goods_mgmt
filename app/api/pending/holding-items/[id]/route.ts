import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const body = await request.json();

  const updated = await prisma.holdingOrderItem.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      price: body.price === undefined ? undefined : Number(body.price),
      quantity: body.quantity === undefined ? undefined : Number(body.quantity),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  await prisma.holdingOrderItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

