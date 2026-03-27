import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeThumbnailDataUrl } from "@/lib/imageThumb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);

  const group = await prisma.holdingOrderGroup.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });

  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Conservative: create all collection items first; only then flip group status.
  // Use a transaction so failure does not partially create items or flip status.
  const updated = await prisma.$transaction(async (tx) => {
    for (const it of group.items) {
      const imageUrl = it.imageUrl ?? null;
      const imageThumbUrl = await makeThumbnailDataUrl(imageUrl);
      const quantity = Number(it.quantity ?? 1);
      const price = Number(it.price ?? 0);
      const totalAmount = price * quantity;

      await tx.item.create({
        data: {
          itemName: it.name,
          platform: group.platform ?? null,
          shop: group.sellerName,
          price,
          quantity,
          totalAmount,
          currency: "CNY",
          status: "OWNED",
          orderDate: group.purchaseDate,
          sourceType: "DIRECT_PURCHASE",
          imageUrl,
          imageThumbUrl,
          notes: group.note ?? null,
        },
      });
    }

    return await tx.holdingOrderGroup.update({
      where: { id },
      data: { status: "received" },
      include: { items: { orderBy: { id: "asc" } } },
    });
  });

  return NextResponse.json(updated);
}

