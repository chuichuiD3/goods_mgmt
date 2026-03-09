import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const id = Number(params.id);
  const item = await prisma.wishlistItem.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const id = Number(params.id);
  const body = await request.json();

  const item = await prisma.wishlistItem.update({
    where: { id },
    data: {
      itemName: body.itemName,
      series: body.series ?? null,
      character: body.character ?? null,
      category: body.category ?? null,
      sourcePlatform: body.sourcePlatform ?? null,
      sourceUrl: body.sourceUrl ?? null,
      expectedPrice: body.expectedPrice ?? null,
      priority: body.priority ?? 'MEDIUM',
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const id = Number(params.id);
  await prisma.wishlistItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

