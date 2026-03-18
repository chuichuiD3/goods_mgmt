import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatYmdUTC(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  const items = await prisma.merchantPreorderLineItem.findMany({
    where: {
      expectedReleaseWindow: null,
      expectedReleaseAt: { not: null },
    },
    select: { id: true, expectedReleaseAt: true },
    orderBy: { id: "asc" },
  });

  let updated = 0;
  for (const it of items) {
    if (!it.expectedReleaseAt) continue;
    await prisma.merchantPreorderLineItem.update({
      where: { id: it.id },
      data: { expectedReleaseWindow: formatYmdUTC(it.expectedReleaseAt) },
    });
    updated += 1;
  }

  console.log(JSON.stringify({ candidates: items.length, updated }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

