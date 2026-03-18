import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MerchantPreorderSubtype } from "@prisma/client";

function isSubtype(v: unknown): v is MerchantPreorderSubtype {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderSubtype) as string[]).includes(v)
  );
}

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
      subtype: isSubtype(body.subtype) ? body.subtype : "full_payment_presale",
      amountPaidTotal:
        body.amountPaidTotal === undefined || body.amountPaidTotal === null
          ? null
          : Number(body.amountPaidTotal),
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
      expectedReleaseAt: body.expectedReleaseAt
        ? new Date(body.expectedReleaseAt)
        : null,
      expectedShipAt: body.expectedShipAt ? new Date(body.expectedShipAt) : null,
      received: body.received ?? false,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

