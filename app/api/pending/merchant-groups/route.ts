import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  MerchantPreorderGroupStatus,
  MerchantPreorderSubtype,
} from "@prisma/client";

function isSubtype(v: unknown): v is MerchantPreorderSubtype {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderSubtype) as string[]).includes(v)
  );
}

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

  if (!body.sellerName || !body.purchaseDate) {
    return NextResponse.json(
      { error: "sellerName and purchaseDate are required" },
      { status: 400 }
    );
  }

  const subtype: MerchantPreorderSubtype = isSubtype(body.subtype)
    ? body.subtype
    : "full_payment_presale";

  const status: MerchantPreorderGroupStatus = isGroupStatus(body.status)
    ? body.status
    : "open";

  const created = await prisma.merchantPreorderGroup.create({
    data: {
      sellerName: body.sellerName,
      platform: body.platform ?? null,
      purchaseDate: new Date(body.purchaseDate),
      subtype,
      amountPaid:
        body.amountPaid === undefined || body.amountPaid === null
          ? null
          : Number(body.amountPaid),
      depositPaidAt: body.depositPaidAt ? new Date(body.depositPaidAt) : null,
      depositAmount:
        body.depositAmount === undefined || body.depositAmount === null
          ? null
          : Number(body.depositAmount),
      finalPaid: body.finalPaid ?? false,
      finalPaidAt: body.finalPaidAt ? new Date(body.finalPaidAt) : null,
      finalAmount:
        body.finalAmount === undefined || body.finalAmount === null
          ? null
          : Number(body.finalAmount),
      owned: body.owned ?? false,
      status,
      notes: body.notes ?? null,
    },
    include: { items: { orderBy: { id: "asc" } } },
  });

  return NextResponse.json(created, { status: 201 });
}

