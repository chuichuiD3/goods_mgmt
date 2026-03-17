import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  // Create a Collection Item using existing Items API schema/logic (thumbnail generation happens there).
  await prisma.item.create({
    data: {
      itemName: preorder.name,
      platform: preorder.platform ?? null,
      shop: preorder.sellerName,
      price: Number(preorder.amountPaid ?? 0),
      quantity: 1,
      totalAmount: Number(preorder.amountPaid ?? 0),
      currency: "JPY",
      status: "PENDING_PAYMENT",
      orderDate: preorder.purchaseDate,
      sourceType: "DIRECT_PURCHASE",
      imageUrl: preorder.imageUrl ?? null,
      notes: preorder.note ?? null,
    },
  });

  const updated = await prisma.merchantPreorderItem.update({
    where: { id },
    data: { status: "received" },
  });

  return NextResponse.json(updated);
}

