import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.groupId || !body.name) {
    return NextResponse.json({ error: "groupId and name are required" }, { status: 400 });
  }

  const groupId = Number(body.groupId);
  const created = await prisma.holdingOrderItem.create({
    data: {
      groupId,
      name: body.name,
      imageUrl: body.imageUrl ?? null,
      price: Number(body.price ?? 0),
      quantity: Number(body.quantity ?? 1),
    },
  });

  return NextResponse.json(created, { status: 201 });
}

