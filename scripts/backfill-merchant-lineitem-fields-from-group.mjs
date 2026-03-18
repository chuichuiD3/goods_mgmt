import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.merchantPreorderGroup.findMany({
    include: { items: { orderBy: { id: "asc" } } },
    orderBy: { id: "asc" },
  });

  let updatedItems = 0;
  let skippedItems = 0;

  for (const g of groups) {
    if (g.items.length === 0) continue;

    // Minimal, conservative migration:
    // - Copy group subtype + deposit/final/owned facts to ALL items only if the item fields are empty.
    // - Copy amountPaid to amountPaidTotal ONLY when there is exactly 1 item, otherwise leave null.
    const isSingle = g.items.length === 1;

    for (const it of g.items) {
      const needsSubtype = it.subtype !== g.subtype;
      const hasAnyDepositFact =
        it.depositPaidAt != null ||
        it.depositAmount != null ||
        it.finalPaid === true ||
        it.finalPaidAt != null ||
        it.finalAmount != null ||
        it.owned === true;

      const data = {};
      if (needsSubtype) data.subtype = g.subtype;

      if (!hasAnyDepositFact && g.subtype === "deposit_presale") {
        data.depositPaidAt = g.depositPaidAt;
        data.depositAmount = g.depositAmount;
        data.finalPaid = g.finalPaid;
        data.finalPaidAt = g.finalPaidAt;
        data.finalAmount = g.finalAmount;
        data.owned = g.owned;
      }

      if (g.subtype === "full_payment_presale") {
        if (isSingle && it.amountPaidTotal == null && g.amountPaid != null) {
          data.amountPaidTotal = g.amountPaid;
        }
      }

      if (Object.keys(data).length === 0) {
        skippedItems += 1;
        continue;
      }

      await prisma.merchantPreorderLineItem.update({
        where: { id: it.id },
        data,
      });
      updatedItems += 1;
    }
  }

  console.log(JSON.stringify({ groups: groups.length, updatedItems, skippedItems }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

