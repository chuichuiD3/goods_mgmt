import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  MerchantPreorderStatus,
  MerchantPreorderSubtype,
} from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isMerchantStatus(v: unknown): v is MerchantPreorderStatus {
  return typeof v === "string" && (Object.values(MerchantPreorderStatus) as string[]).includes(v);
}

function isSubtype(v: unknown): v is MerchantPreorderSubtype {
  return (
    typeof v === "string" &&
    (Object.values(MerchantPreorderSubtype) as string[]).includes(v)
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const body = await request.json();

  const updated = await prisma.merchantPreorderItem.update({
    where: { id },
    data: {
      name: body.name,
      imageUrl: body.imageUrl ?? null,
      sellerName: body.sellerName,
      platform: body.platform ?? null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      amountPaid:
        body.amountPaid === undefined || body.amountPaid === null
          ? null
          : Number(body.amountPaid),
      subtype: isSubtype(body.subtype) ? body.subtype : undefined,
      quantity:
        body.quantity === undefined || body.quantity === null
          ? undefined
          : Math.max(1, Number(body.quantity)),
      depositPaidAt:
        body.depositPaidAt === undefined
          ? undefined
          : body.depositPaidAt
            ? new Date(body.depositPaidAt)
            : null,
      depositAmount:
        body.depositAmount === undefined || body.depositAmount === null
          ? body.depositAmount === undefined
            ? undefined
            : null
          : Number(body.depositAmount),
      finalPaid:
        body.finalPaid === undefined ? undefined : Boolean(body.finalPaid),
      finalPaidAt:
        body.finalPaidAt === undefined
          ? undefined
          : body.finalPaidAt
            ? new Date(body.finalPaidAt)
            : null,
      finalAmount:
        body.finalAmount === undefined || body.finalAmount === null
          ? body.finalAmount === undefined
            ? undefined
            : null
          : Number(body.finalAmount),
      owned: body.owned === undefined ? undefined : Boolean(body.owned),
      status: isMerchantStatus(body.status) ? body.status : undefined,
      note: body.note ?? null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  await prisma.merchantPreorderItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

