import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { makeThumbnailDataUrl } from '@/lib/imageThumb';

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      itemName: true,
      series: true,
      character: true,
      category: true,
      platform: true,
      price: true,
      quantity: true,
      totalAmount: true,
      status: true,
      imageThumbUrl: true,
    },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();

  const price = Number(body.price ?? 0);
  const quantity = Number(body.quantity ?? 1);
  const totalAmount = body.totalAmount ?? price * quantity;
  const imageUrl: string | null =
    typeof body.imageUrl === 'string' && body.imageUrl.trim() === ''
      ? null
      : (body.imageUrl ?? null);
  const imageThumbUrl = await makeThumbnailDataUrl(imageUrl);

  const item = await prisma.item.create({
    data: {
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
      imageUrl,
      imageThumbUrl,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

