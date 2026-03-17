import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { makeThumbnailDataUrl } from '@/lib/imageThumb';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const body = await request.json();

  const price = Number(body.price ?? 0);
  const quantity = Number(body.quantity ?? 1);
  const totalAmount = body.totalAmount ?? price * quantity;

  const updateData: Record<string, unknown> = {
    itemName: body.itemName,
    series: body.series ?? null,
    character: body.character ?? null,
    category: body.category ?? null,
    platform: body.platform ?? null,
    shop: body.shop ?? null,
    price,
    quantity,
    totalAmount,
    currency: body.currency ?? 'JPY',
    status: body.status ?? 'PENDING_PAYMENT',
    orderDate: body.orderDate ? new Date(body.orderDate) : null,
    paymentDeadline: body.paymentDeadline ? new Date(body.paymentDeadline) : null,
    paidAt: body.paidAt ? new Date(body.paidAt) : null,
    isPresale: body.isPresale ?? false,
    sourceType: body.sourceType ?? 'DIRECT_PURCHASE',
    sourceOrderId: body.sourceOrderId ?? null,
    notes: body.notes ?? null,
  };

  // Important: Collection edit currently doesn't preload `imageUrl` (list API is thumbnail-only).
  // To avoid accidentally wiping images/thumbnails, treat empty string/undefined as "no change".
  if (Object.prototype.hasOwnProperty.call(body, 'imageUrl')) {
    if (body.imageUrl === null) {
      updateData.imageUrl = null;
      updateData.imageThumbUrl = null;
    } else if (typeof body.imageUrl === 'string' && body.imageUrl.trim() !== '') {
      const imageUrl: string = body.imageUrl;
      updateData.imageUrl = imageUrl;
      updateData.imageThumbUrl = await makeThumbnailDataUrl(imageUrl);
    }
  }

  const item = await prisma.item.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  await prisma.item.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

