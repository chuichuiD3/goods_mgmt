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

  const imageUrl = preorder.imageUrl ?? null;
  const imageThumbUrl = await makeThumbnailDataUrl(imageUrl);

  // Conservative conflict handling: only flip preorder status after item creation succeeds.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.item.create({
      data: {
        itemName: preorder.name,
        platform: preorder.platform ?? null,
        shop: preorder.sellerName,
        price: Number(preorder.amountPaid ?? 0),
        quantity: 1,
        totalAmount: Number(preorder.amountPaid ?? 0),
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
      data: { status: "received" },
    });
  });

  return NextResponse.json(updated);
}

