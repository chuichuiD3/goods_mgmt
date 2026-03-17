import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MerchantPreorderStatus } from "@prisma/client";

export async function GET() {
  const items = await prisma.merchantPreorderItem.findMany({
    orderBy: { purchaseDate: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.sellerName || !body.purchaseDate) {
    return NextResponse.json(
      { error: "name, sellerName, purchaseDate are required" },
      { status: 400 }
    );
  }

  const status: MerchantPreorderStatus =
    body.status && Object.values(MerchantPreorderStatus).includes(body.status)
      ? body.status
      : "ordered";

  const created = await prisma.merchantPreorderItem.create({
    data: {
      name: body.name,
      imageUrl: body.imageUrl ?? null,
      sellerName: body.sellerName,
      platform: body.platform ?? null,
      purchaseDate: new Date(body.purchaseDate),
      amountPaid:
        body.amountPaid === undefined || body.amountPaid === null
          ? null
          : Number(body.amountPaid),
      status,
      note: body.note ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

