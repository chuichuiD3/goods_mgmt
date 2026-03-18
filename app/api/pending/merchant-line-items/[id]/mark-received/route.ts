import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeThumbnailDataUrl } from "@/lib/imageThumb";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const line = await prisma.merchantPreorderLineItem.findUnique({
    where: { id },
    include: { group: true },
  });

  if (!line) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (line.received) {
    return NextResponse.json({ error: "Already received" }, { status: 400 });
  }

  if (line.group.subtype === "deposit_presale" && !line.group.owned) {
    return NextResponse.json(
      { error: "Deposit presale must be owned=true before receiving" },
      { status: 400 }
    );
  }

  const thumb =
    line.imageUrl && line.imageUrl.trim() !== ""
      ? await makeThumbnailDataUrl(line.imageUrl)
      : null;

  // Conservative mapping:
  // - Deposit presale: keep unit price 0 (payment facts stay on Pending side).
  // - Full payment: if group.amountPaid exists, distribute by total quantity across the order.
  //   Otherwise fall back to 0.
  let unitPrice = 0;
  if (line.group.subtype === "full_payment_presale" && line.group.amountPaid) {
    const totalQty = await prisma.merchantPreorderLineItem.aggregate({
      where: { groupId: line.groupId },
      _sum: { quantity: true },
    });
    const denom = Math.max(1, totalQty._sum.quantity ?? 1);
    unitPrice = line.group.amountPaid / denom;
  }

  const qty = line.quantity ?? 1;
  const total = unitPrice * qty;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          itemName: line.title,
          platform: line.group.platform,
          shop: line.group.sellerName,
          price: unitPrice,
          quantity: qty,
          totalAmount: total,
          currency: "JPY",
          status: "OWNED",
          orderDate: line.group.purchaseDate,
          sourceType: "MERCHANT_PREORDER",
          sourceOrderId: `merchantLine:${line.id}`,
          imageUrl: line.imageUrl,
          imageThumbUrl: thumb,
          notes: [line.group.notes, line.notes].filter(Boolean).join("\n\n") || null,
        },
      });

      await tx.merchantPreorderLineItem.update({
        where: { id: line.id },
        data: { received: true },
      });

      // If all line items are received, mark the group received too.
      const remaining = await tx.merchantPreorderLineItem.count({
        where: { groupId: line.groupId, received: false },
      });
      if (remaining === 0) {
        await tx.merchantPreorderGroup.update({
          where: { id: line.groupId },
          data: { status: "received" },
        });
      }

      return item;
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create Collection item" },
      { status: 500 }
    );
  }
}

