import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const id = Number(params.id);
  const draft = await prisma.importDraft.findUnique({ where: { id } });

  if (!draft) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(draft);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const id = Number(params.id);

  await prisma.importDraft.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

