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

function stripHtmlTags(html: string): string {
  // Replace tags with spaces so text from different cells still separates
  return html.replace(/<[^>]*>/g, ' ');
}

function toHalfWidth(input: string): string {
  // Convert full-width digits and colon to ASCII, keep other chars
  return input.replace(/[０-９：]/g, (ch) => {
    const code = ch.charCodeAt(0);
    // full-width ０-９
    if (code >= 0xff10 && code <= 0xff19) {
      return String.fromCharCode(code - 0xff10 + 0x30);
    }
    // full-width colon
    if (ch === '：') return ':';
    return ch;
  });
}

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

function parseJapaneseDateTime(
  yearStr: string,
  monthStr: string,
  dayStr: string,
  hourStr: string,
  minuteStr: string
): string | null {
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) {
    return null;
  }

  // Interpret as local time (likely JST on Neon side); ISO is fine for our use.
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return date.toISOString();
}

function detectYahooAuctionEnd(html: string): string | null {
  const text = stripHtmlTags(html);

  // Primary source: 終了日時
  const primaryPattern =
    /終了日時[^0-9]*?(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*?(\d{1,2})時(\d{1,2})分/;
  const primaryMatch = text.match(primaryPattern);
  if (primaryMatch) {
    const iso = parseJapaneseDateTime(
      primaryMatch[1],
      primaryMatch[2],
      primaryMatch[3],
      primaryMatch[4],
      primaryMatch[5]
    );
    if (iso) {
      console.log('detectYahooAuctionEnd: parsed 終了日時', primaryMatch[0], '->', iso);
      return iso;
    }
    console.log(
      'detectYahooAuctionEnd: found 終了日時 but failed to parse',
      primaryMatch[0]
    );
  }

  // Fallback: 終了予定
  const fallbackPattern =
    /終了予定[^0-9]*?(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*?(\d{1,2})時(\d{1,2})分/;
  const fallbackMatch = text.match(fallbackPattern);
  if (fallbackMatch) {
    const iso = parseJapaneseDateTime(
      fallbackMatch[1],
      fallbackMatch[2],
      fallbackMatch[3],
      fallbackMatch[4],
      fallbackMatch[5]
    );
    if (iso) {
      console.log('detectYahooAuctionEnd: parsed 終了予定', fallbackMatch[0], '->', iso);
      return iso;
    }
    console.log(
      'detectYahooAuctionEnd: found 終了予定 but failed to parse',
      fallbackMatch[0]
    );
  }

  console.log('detectYahooAuctionEnd: 終了日時/終了予定 not found');
  return null;
}

function detectMercariAuctionEnd(html: string): string | null {
  // 1) Normalize to plain, half‑width text
  const text = toHalfWidth(stripHtmlTags(html));

  // 2) Find the primary label
  const label = '終了予定時刻';
  const labelIndex = text.indexOf(label);
  if (labelIndex === -1) {
    console.log('detectMercariAuctionEnd: label 終了予定時刻 not found');
    return null;
  }

  // 3) Take a window of text after the label (tolerant of spaces/newlines)
  const windowSize = 120;
  const start = labelIndex;
  const end = Math.min(text.length, labelIndex + label.length + windowSize);
  const snippet = text.slice(start, end);

  console.log('detectMercariAuctionEnd: snippet around label =', JSON.stringify(snippet));

  // 4) Match datetime within the snippet: "2026年3月10日 11:17" or "3月10日 11:17"
  const dtPattern =
    /((\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日\s*(\d{1,2})[:時](\d{1,2})/;
  const m = snippet.match(dtPattern);

  if (!m) {
    console.log('detectMercariAuctionEnd: found label but no adjacent datetime');
    return null;
  }

  const year = m[2] ?? String(new Date().getFullYear());
  const month = m[3];
  const day = m[4];
  const hour = m[5];
  const minute = m[6];

  const iso = parseJapaneseDateTime(year, month, day, hour, minute);
  if (!iso) {
    console.log('detectMercariAuctionEnd: found datetime but parse failed', m[0]);
    return null;
  }

  console.log('detectMercariAuctionEnd: parsed 終了予定時刻', m[0], '->', iso);
  return iso;
}

function detectAuctionEnd(sourceUrl: string, html: string): string | null {
  const host = (() => {
    try {
      return new URL(sourceUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();

  if (host.includes('auctions.yahoo.co.jp')) {
    const yahoo = detectYahooAuctionEnd(html);
    if (yahoo) return yahoo;
  } else if (host.includes('mercari')) {
    const mercari = detectMercariAuctionEnd(html);
    if (mercari) return mercari;
  }

  // Generic heuristic fallback (English sites)
  const lower = html.toLowerCase();
  if (lower.includes('auction ends') || lower.includes('ends in') || lower.includes('ends on')) {
    return new Date().toISOString();
  }
  return null;
}

function detectAuctionLike(sourceUrl: string, html: string, auctionEndAt: string | null): boolean {
  const host = (() => {
    try {
      return new URL(sourceUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();
  const text = stripHtmlTags(html);
  const lower = text.toLowerCase();

  // If we already parsed an end time, it's clearly an auction
  if (auctionEndAt) return true;

  // Yahoo Auctions: look for Japanese auction-related labels
  if (host.includes('auctions.yahoo.co.jp')) {
    if (
      text.includes('オークションID') ||
      text.includes('終了日時') ||
      text.includes('終了予定') ||
      text.includes('開始日時')
    ) {
      return true;
    }
  }

  // Mercari auction-like listings: Japanese labels
  if (host.includes('mercari')) {
    if (
      text.includes('オークション商品') ||
      text.includes('終了予定時刻') ||
      text.includes('残り時間') ||
      text.includes('入札する') ||
      text.includes('入札')
    ) {
      return true;
    }
  }

  // Generic English auction signals as fallback
  if (
    lower.includes('bid') ||
    lower.includes('bids') ||
    lower.includes('current bid') ||
    lower.includes('time left') ||
    lower.includes('auction')
  ) {
    return true;
  }

  return false;
}

// detectSoldSignals remains unchanged

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
  const auctionEndAt = detectAuctionEnd(sourceUrl, html);
  const hasAuctionSignals = detectAuctionLike(sourceUrl, html, auctionEndAt);
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

