type DetectedType = 'AUCTION' | 'WISHLIST' | 'PURCHASE' | 'UNKNOWN';
type ParseStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';
type Destination = 'AUCTION' | 'COLLECTION';

export type ImportParseResult = {
  // basic fields
  sourceUrl: string;
  platform: string | null;
  rawTitle: string | null;
  rawPrice: string | null;
  rawImage: string | null;
  detectedType: DetectedType;
  parseStatus: ParseStatus;
  // structured fields
  listedPrice: number | null;
  currency: 'JPY' | 'USD' | 'UNKNOWN';
  auctionEndAt: string | null; // ISO string if detected
  // signals
  hasAuctionSignals: boolean;
  hasSoldSignals: boolean;
  // recommendation
  recommendedDestination: Destination;
};

function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1] ?? null;
}

function extractTitle(html: string): string | null {
  const ogTitle = extractMetaContent(html, 'og:title');
  if (ogTitle) return ogTitle;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() ?? null;
}

function extractImage(html: string): string | null {
  const ogImage = extractMetaContent(html, 'og:image');
  return ogImage ?? null;
}

function extractPrice(html: string): string | null {
  // Try common meta tag first
  const metaPrice =
    extractMetaContent(html, 'product:price:amount') ??
    extractMetaContent(html, 'og:price:amount');
  if (metaPrice) return metaPrice;

  // Fallback: look for simple currency + number patterns
  const currencyPatterns = [
    /¥\s?([\d,]+(?:\.\d+)?)/,
    /\$\s?([\d,]+(?:\.\d+)?)/,
  ];

  for (const pattern of currencyPatterns) {
    const match = html.match(pattern);
    if (match?.[0]) {
      return match[0];
    }
  }

  return null;
}

function normalizePrice(rawPrice: string | null): {
  listedPrice: number | null;
  currency: 'JPY' | 'USD' | 'UNKNOWN';
} {
  if (!rawPrice) {
    return { listedPrice: null, currency: 'UNKNOWN' };
  }

  const hasYen = /¥|JPY/i.test(rawPrice);
  const hasUsd = /\$|USD/i.test(rawPrice);

  const cleaned = rawPrice.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const numeric = cleaned ? Number(cleaned) : NaN;

  return {
    listedPrice: Number.isFinite(numeric) ? numeric : null,
    currency: hasYen ? 'JPY' : hasUsd ? 'USD' : 'UNKNOWN',
  };
}

function detectAuctionEnd(html: string): string | null {
  // Very light heuristic: look for patterns like "ends on", "ends in", or "auction ends"
  const lower = html.toLowerCase();
  if (lower.includes('auction ends') || lower.includes('ends in') || lower.includes('ends on')) {
    // We don't reliably parse the actual timestamp yet; just treat this as a signal.
    return new Date().toISOString();
  }
  return null;
}

function detectAuctionSignals(html: string, auctionEndAt: string | null): boolean {
  const lower = html.toLowerCase();
  if (auctionEndAt) return true;
  if (lower.includes('bid') || lower.includes('bids') || lower.includes('current bid')) return true;
  if (lower.includes('auction')) return true;
  if (lower.includes('time left')) return true;
  return false;
}

function detectSoldSignals(html: string): boolean {
  const lower = html.toLowerCase();
  if (lower.includes('sold')) return true;
  if (lower.includes('purchased') || lower.includes('purchase complete')) return true;
  if (lower.includes('order confirmed') || lower.includes('order completed')) return true;
  if (lower.includes('won auction') || lower.includes('you won')) return true;
  return false;
}

function detectTypeFromHint(hintType?: string | null): DetectedType {
  if (!hintType) return 'UNKNOWN';
  const upper = hintType.toUpperCase();
  if (upper === 'AUCTION') return 'AUCTION';
  if (upper === 'WISHLIST') return 'WISHLIST';
  if (upper === 'PURCHASE') return 'PURCHASE';
  return 'UNKNOWN';
}

export function parseImport(params: {
  sourceUrl: string;
  html: string;
  hintType?: string | null;
}): ImportParseResult {
  const { sourceUrl, html, hintType } = params;

  let platform: string | null = null;
  try {
    const url = new URL(sourceUrl);
    platform = url.hostname;
  } catch {
    platform = null;
  }

  const rawTitle = extractTitle(html);
  const rawImage = extractImage(html);
  const rawPrice = extractPrice(html);
  const detectedType = detectTypeFromHint(hintType);

  const { listedPrice, currency } = normalizePrice(rawPrice);
  const auctionEndAt = detectAuctionEnd(html);
  const hasAuctionSignals = detectAuctionSignals(html, auctionEndAt);
  const hasSoldSignals = detectSoldSignals(html);

  let recommendedDestination: Destination;
  if (hasAuctionSignals) {
    recommendedDestination = 'AUCTION';
  } else if (hasSoldSignals) {
    recommendedDestination = 'COLLECTION';
  } else {
    recommendedDestination = 'COLLECTION';
  }

  const hasAnyField = !!(rawTitle || rawImage || rawPrice);
  const parseStatus: ParseStatus = hasAnyField ? 'PARTIAL' : 'FAILED';

  return {
    sourceUrl,
    platform,
    rawTitle,
    rawPrice,
    rawImage,
    detectedType,
    parseStatus,
    listedPrice,
    currency,
    auctionEndAt,
    hasAuctionSignals,
    hasSoldSignals,
    recommendedDestination,
  };
}

