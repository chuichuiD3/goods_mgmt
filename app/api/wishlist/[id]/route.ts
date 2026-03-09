import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const item = await prisma.wishlistItem.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  await prisma.wishlistItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

