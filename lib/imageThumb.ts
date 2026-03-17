import sharp from "sharp";

const THUMB_MAX_PX = 160;
const THUMB_JPEG_QUALITY = 70;

export function classifyImageUrl(
  imageUrl: string | null | undefined
): "data" | "http" | "other" | "empty" {
  if (!imageUrl) return "empty";
  if (imageUrl.startsWith("data:")) return "data";
  if (/^https?:\/\//.test(imageUrl)) return "http";
  return "other";
}

function parseDataUrlBase64(imageUrl: string): { mime: string; b64: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(imageUrl);
  if (!match) return null;
  return { mime: match[1], b64: match[2] };
}

export async function makeThumbnailDataUrl(
  imageUrl: string | null | undefined
): Promise<string | null> {
  const kind = classifyImageUrl(imageUrl);
  if (kind === "empty") return null;

  // Temporary compatibility: if stored as remote URL, reuse it as a thumbnail URL.
  if (kind === "http") return imageUrl ?? null;

  if (kind !== "data") return null;
  const parsed = parseDataUrlBase64(imageUrl as string);
  if (!parsed) return null;

  const input = Buffer.from(parsed.b64, "base64");
  const output = await sharp(input)
    .resize({
      width: THUMB_MAX_PX,
      height: THUMB_MAX_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: THUMB_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${output.toString("base64")}`;
}

