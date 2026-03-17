import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { makeThumbnailDataUrl } from '@/lib/imageThumb';

export async function GET() {
  const auctions = await prisma.auction.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      itemName: true,
      platform: true,
      auctionUrl: true,
      currentPrice: true,
      auctionEndTime: true,
      imageThumbUrl: true,
      status: true,
    },
  });
  return NextResponse.json(auctions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const imageUrl: string | null =
    typeof body.imageUrl === 'string' && body.imageUrl.trim() === ''
      ? null
      : (body.imageUrl ?? null);
  const imageThumbUrl = await makeThumbnailDataUrl(imageUrl);

  const auction = await prisma.auction.create({
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
      imageUrl,
      imageThumbUrl,
      status: body.status ?? 'WATCHING',
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(auction, { status: 201 });
}

