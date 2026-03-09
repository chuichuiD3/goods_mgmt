import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const [pendingItems, ownedItems] = await Promise.all([
    prisma.item.findMany({
      where: { status: 'PENDING_PAYMENT' },
      orderBy: { paymentDeadline: 'asc' },
      take: 5,
    }),
    prisma.item.findMany({
      where: { status: 'OWNED' },
      orderBy: { paidAt: 'desc' },
      take: 3,
    }),
  ]);

  const totalOwned = await prisma.item.aggregate({
    where: { status: 'OWNED' },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  const totalPending = await prisma.item.aggregate({
    where: { status: 'PENDING_PAYMENT' },
    _sum: { totalAmount: true },
  });

  const ownedCount = totalOwned._count._all ?? 0;
  const ownedTotal = totalOwned._sum.totalAmount ?? 0;
  const pendingTotal = totalPending._sum.totalAmount ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Goods management</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/auction" className="hover:underline">
              Auctions
            </Link>
            <Link href="/collection" className="hover:underline">
              Collection
            </Link>
            <Link href="/wishlist" className="hover:underline">
              Wishlist
            </Link>
            <Link href="/import" className="hover:underline">
              Import
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">Owned items</div>
            <div className="mt-1 text-2xl font-semibold">{ownedCount}</div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">
              Total spend (owned)
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {ownedTotal.toLocaleString()}
            </div>
          </div>
          <div className="rounded border bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">
              Pending payment total
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {pendingTotal.toLocaleString()}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded border bg-white p-4">
            <h2 className="text-sm font-semibold">Pending payments</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Items with status &ldquo;Pending payment&rdquo;.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {pendingItems.length === 0 && (
                <div className="text-xs text-zinc-500">No pending payments.</div>
              )}
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border px-2 py-1"
                >
                  <div>
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-xs text-zinc-500">
                      {item.platform ?? 'Unknown'} ·{' '}
                      {item.paymentDeadline
                        ? new Date(item.paymentDeadline).toLocaleDateString()
                        : 'No deadline'}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {item.totalAmount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border bg-white p-4">
            <h2 className="text-sm font-semibold">Recent items</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Latest owned items you added.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {ownedItems.length === 0 && (
                <div className="text-xs text-zinc-500">No items yet.</div>
              )}
              {ownedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border px-2 py-1"
                >
                  <div>
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-xs text-zinc-500">
                      {item.series ?? ''} {item.character ? `· ${item.character}` : ''}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {item.totalAmount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

