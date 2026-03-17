import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const THUMB_MAX_PX = 160;
const THUMB_JPEG_QUALITY = 70;

function makeThumbFromDataUrl(imageUrl) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(imageUrl);
  if (!match) return null;
  const b64 = match[2];
  const input = Buffer.from(b64, "base64");
  return sharp(input)
    .resize({
      width: THUMB_MAX_PX,
      height: THUMB_MAX_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_JPEG_QUALITY, mozjpeg: true })
    .toBuffer()
    .then((buf) => `data:image/jpeg;base64,${buf.toString("base64")}`);
}

async function main() {
  const prisma = new PrismaClient();
  const batchSize = Number(process.env.BATCH_SIZE ?? 50);

  try {
    const where = {
      imageThumbUrl: null,
      AND: [{ imageUrl: { not: null } }, { NOT: { imageUrl: "" } }],
    };

    const totalCandidates = await prisma.item.count({ where });
    console.log(
      JSON.stringify(
        { totalCandidates, batchSize, thumbMaxPx: THUMB_MAX_PX },
        null,
        2
      )
    );

    let processed = 0;
    while (true) {
      const batch = await prisma.item.findMany({
        where,
        select: { id: true, imageUrl: true },
        take: batchSize,
        orderBy: { id: "asc" },
      });

      if (batch.length === 0) break;

      for (const item of batch) {
        const imageUrl = item.imageUrl || "";
        let thumb = null;
        if (imageUrl.startsWith("data:")) {
          try {
            thumb = await makeThumbFromDataUrl(imageUrl);
          } catch {
            thumb = null;
          }
        } else if (/^https?:\/\//.test(imageUrl)) {
          // Temporary compatibility: reuse remote URL as thumbnail URL.
          thumb = imageUrl;
        }

        await prisma.item.update({
          where: { id: item.id },
          data: { imageThumbUrl: thumb },
        });

        processed += 1;
        if (processed % 25 === 0) {
          console.log(JSON.stringify({ processed }, null, 2));
        }
      }
    }

    console.log(JSON.stringify({ done: true, processed }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

