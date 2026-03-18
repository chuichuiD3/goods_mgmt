import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const legacy = await prisma.merchantPreorderItem.findMany({
    orderBy: { id: "asc" },
  });

  if (legacy.length === 0) {
    console.log("No legacy MerchantPreorderItem rows found. Nothing to do.");
    return;
  }

  let createdGroups = 0;
  let createdLines = 0;
  let skipped = 0;

  for (const row of legacy) {
    // Idempotency: if we already created a group for this legacy row, skip.
    // We use a deterministic marker in the group notes.
    const marker = `legacyMerchantPreorderItemId:${row.id}`;
    const exists = await prisma.merchantPreorderGroup.findFirst({
      where: { notes: { contains: marker } },
      select: { id: true },
    });
    if (exists) {
      skipped += 1;
      continue;
    }

    const group = await prisma.merchantPreorderGroup.create({
      data: {
        sellerName: row.sellerName,
        platform: row.platform,
        purchaseDate: row.purchaseDate,
        subtype: row.subtype,
        amountPaid: row.amountPaid,
        depositPaidAt: row.depositPaidAt,
        depositAmount: row.depositAmount,
        finalPaid: row.finalPaid,
        finalPaidAt: row.finalPaidAt,
        finalAmount: row.finalAmount,
        owned: row.owned,
        status: row.status === "received" ? "received" : "open",
        notes: [row.note, marker].filter(Boolean).join("\n\n") || marker,
      },
    });
    createdGroups += 1;

    const line = await prisma.merchantPreorderLineItem.create({
      data: {
        groupId: group.id,
        title: row.name,
        imageUrl: row.imageUrl,
        quantity: row.quantity ?? 1,
        notes: null,
        received: row.status === "received" || row.owned === true,
      },
    });
    createdLines += 1;

    // If we marked the line received, align group status too.
    if (line.received) {
      await prisma.merchantPreorderGroup.update({
        where: { id: group.id },
        data: { status: "received" },
      });
    }
  }

  console.log(
    JSON.stringify(
      { legacyRows: legacy.length, createdGroups, createdLines, skipped },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

