import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseImport } from '@/lib/importParser';

export async function GET() {
  const drafts = await prisma.importDraft.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(drafts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const sourceUrl: string | undefined = body.sourceUrl;
  const hintType: string | undefined = body.hintType;

  if (!sourceUrl) {
    return NextResponse.json(
      { error: 'sourceUrl is required' },
      { status: 400 }
    );
  }

  let html = '';

  try {
    const res = await fetch(sourceUrl);
    html = await res.text();
  } catch (error) {
    // If fetching fails, still create a draft with FAILED status
    const draft = await prisma.importDraft.create({
      data: {
        sourceUrl,
        platform: null,
        rawTitle: null,
        rawPrice: null,
        rawImage: null,
        detectedType: 'UNKNOWN',
        parseStatus: 'FAILED',
        rawPayload: String(error),
      },
    });
    return NextResponse.json(draft, { status: 201 });
  }

  const result = parseImport({ sourceUrl, html, hintType });

  const draft = await prisma.importDraft.create({
    data: {
      sourceUrl,
      platform: result.platform,
      rawTitle: result.rawTitle,
      rawPrice: result.rawPrice,
      rawImage: result.rawImage,
      detectedType: result.detectedType,
      parseStatus: result.parseStatus,
      rawPayload: undefined,
    },
  });

  return NextResponse.json(draft, { status: 201 });
}

