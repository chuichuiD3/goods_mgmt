import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { makeThumbnailDataUrl } from '@/lib/imageThumb';

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

  const updateData: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(body, 'itemName')) updateData.itemName = body.itemName;
  if (Object.prototype.hasOwnProperty.call(body, 'series')) updateData.series = body.series ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'character')) updateData.character = body.character ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'category')) updateData.category = body.category ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'platform')) updateData.platform = body.platform ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'auctionUrl')) updateData.auctionUrl = body.auctionUrl ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'currentPrice')) updateData.currentPrice = body.currentPrice ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'myMaxBid')) updateData.myMaxBid = body.myMaxBid ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'auctionEndTime')) {
    updateData.auctionEndTime = body.auctionEndTime ? new Date(body.auctionEndTime) : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) updateData.status = body.status ?? 'WATCHING';
  if (Object.prototype.hasOwnProperty.call(body, 'notes')) updateData.notes = body.notes ?? null;

  // Only update images when explicitly provided; avoids accidental wipes on status-only updates.
  if (Object.prototype.hasOwnProperty.call(body, 'imageUrl')) {
    const imageUrl: string | null =
      body.imageUrl === null
        ? null
        : typeof body.imageUrl === 'string' && body.imageUrl.trim() === ''
          ? null
          : body.imageUrl;
    updateData.imageUrl = imageUrl;
    updateData.imageThumbUrl = await makeThumbnailDataUrl(imageUrl);
  }

  const auction = await prisma.auction.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(auction);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idString } = await context.params;
  const id = Number(idString);

  await prisma.auction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

