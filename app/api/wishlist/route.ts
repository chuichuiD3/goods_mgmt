import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.wishlistItem.findMany({
    orderBy: { addedAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();

  const item = await prisma.wishlistItem.create({
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

  return NextResponse.json(item, { status: 201 });
}

