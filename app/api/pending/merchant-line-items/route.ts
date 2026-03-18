import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.groupId || !body.title) {
    return NextResponse.json(
      { error: "groupId and title are required" },
      { status: 400 }
    );
  }

  const created = await prisma.merchantPreorderLineItem.create({
    data: {
      groupId: Number(body.groupId),
      title: body.title,
      imageUrl: body.imageUrl ?? null,
      quantity:
        body.quantity === undefined || body.quantity === null
          ? 1
          : Number(body.quantity),
      notes: body.notes ?? null,
      received: body.received ?? false,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

