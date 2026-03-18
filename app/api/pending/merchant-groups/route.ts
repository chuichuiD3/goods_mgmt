import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MerchantPreorderGroupStatus } from "@prisma/client";

function isGroupStatus(v: unknown): v is MerchantPreorderGroupStatus {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderGroupStatus) as string[]).includes(v)
  );
}

export async function GET() {
  const groups = await prisma.merchantPreorderGroup.findMany({
    orderBy: { updatedAt: "desc" },
    include: { items: { orderBy: { id: "asc" } } },
  });
  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.sellerName) {
    return NextResponse.json(
      { error: "sellerName is required" },
      { status: 400 }
    );
  }

  const status: MerchantPreorderGroupStatus = isGroupStatus(body.status)
    ? body.status
    : "open";

  const created = await prisma.merchantPreorderGroup.create({
    data: {
      sellerName: body.sellerName,
      platform: body.platform ?? null,
      status,
      notes: body.notes ?? null,
    },
    include: { items: { orderBy: { id: "asc" } } },
  });

  return NextResponse.json(created, { status: 201 });
}

