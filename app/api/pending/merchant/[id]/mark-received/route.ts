import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeThumbnailDataUrl } from "@/lib/imageThumb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);

  const preorder = await prisma.merchantPreorderItem.findUnique({ where: { id } });
  if (!preorder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (preorder.subtype === "deposit_presale" && !preorder.owned) {
    return NextResponse.json(
      { error: "Deposit presale must be marked owned before moving to Collection." },
      { status: 400 }
    );
  }

  const imageUrl = preorder.imageUrl ?? null;
  const imageThumbUrl = await makeThumbnailDataUrl(imageUrl);

  // Conservative conflict handling: only flip preorder status after item creation succeeds.
  const updated = await prisma.$transaction(async (tx) => {
    const quantity = Math.max(1, Number(preorder.quantity ?? 1));
    const shouldCopyMoney = preorder.subtype === "full_payment_presale";
    const totalAmount = shouldCopyMoney ? Number(preorder.amountPaid ?? 0) : 0;
    const unitPrice = quantity > 0 ? totalAmount / quantity : totalAmount;

    await tx.item.create({
      data: {
        itemName: preorder.name,
        platform: preorder.platform ?? null,
        shop: preorder.sellerName,
        price: unitPrice,
        quantity,
        totalAmount,
        currency: "JPY",
        status: "OWNED",
        orderDate: preorder.purchaseDate,
        sourceType: "DIRECT_PURCHASE",
        imageUrl,
        imageThumbUrl,
        notes: preorder.note ?? null,
      },
    });

    return await tx.merchantPreorderItem.update({
      where: { id },
      data: { status: "received", owned: true },
    });
  });

  return NextResponse.json(updated);
}

