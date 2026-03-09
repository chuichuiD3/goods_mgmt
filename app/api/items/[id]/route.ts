import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  const item = await prisma.item.update({
    where: { id },
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
      imageUrl: body.imageUrl ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  await prisma.item.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

