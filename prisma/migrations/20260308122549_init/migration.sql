-- CreateTable
CREATE TABLE "Auction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemName" TEXT NOT NULL,
    "series" TEXT,
    "character" TEXT,
    "category" TEXT,
    "platform" TEXT,
    "auctionUrl" TEXT,
    "currentPrice" REAL,
    "myMaxBid" REAL,
    "auctionEndTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'WATCHING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemName" TEXT NOT NULL,
    "series" TEXT,
    "character" TEXT,
    "category" TEXT,
    "sourcePlatform" TEXT,
    "sourceUrl" TEXT,
    "expectedPrice" REAL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemName" TEXT NOT NULL,
    "series" TEXT,
    "character" TEXT,
    "category" TEXT,
    "platform" TEXT,
    "shop" TEXT,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "orderDate" DATETIME,
    "paymentDeadline" DATETIME,
    "paidAt" DATETIME,
    "isPresale" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'DIRECT_PURCHASE',
    "sourceOrderId" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceUrl" TEXT NOT NULL,
    "platform" TEXT,
    "rawTitle" TEXT,
    "rawPrice" TEXT,
    "rawImage" TEXT,
    "detectedType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "parseStatus" TEXT NOT NULL DEFAULT 'PARTIAL',
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
