import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const auction = await prisma.auction.findUnique({ where: { id } });

  if (!auction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(auction);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);
  const body = await request.json();

  const auction = await prisma.auction.update({
    where: { id },
    data: {
      itemName: body.itemName,
      series: body.series ?? null,
      character: body.character ?? null,
      category: body.category ?? null,
      platform: body.platform ?? null,
      auctionUrl: body.auctionUrl ?? null,
      currentPrice: body.currentPrice ?? null,
      myMaxBid: body.myMaxBid ?? null,
      auctionEndTime: body.auctionEndTime ? new Date(body.auctionEndTime) : null,
      status: body.status ?? 'WATCHING',
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(auction);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);

  await prisma.auction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

