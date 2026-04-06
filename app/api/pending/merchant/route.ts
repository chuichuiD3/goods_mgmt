/**
 * @deprecated Legacy flat merchant preorder API (single `MerchantPreorderItem` per row).
 * The app UI uses `merchant-groups` + `merchant-line-items` instead. Do not add new features
 * here; new work should target `/api/pending/merchant-groups` and `/api/pending/merchant-line-items`.
 * Kept for backward compatibility / external callers until removed.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MerchantPreorderStatus, MerchantPreorderSubtype } from "@prisma/client";

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

  const subtype: MerchantPreorderSubtype =
    body.subtype && Object.values(MerchantPreorderSubtype).includes(body.subtype)
      ? body.subtype
      : "full_payment_presale";

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
      subtype,
      quantity:
        body.quantity === undefined || body.quantity === null
          ? 1
          : Math.max(1, Number(body.quantity)),
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
      note: body.note ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

