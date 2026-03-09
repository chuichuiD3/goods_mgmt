import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const id = Number(params.id);
  const auction = await prisma.auction.findUnique({ where: { id } });

  if (!auction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(auction);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const id = Number(params.id);
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  const id = Number(params.id);

  await prisma.auction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

