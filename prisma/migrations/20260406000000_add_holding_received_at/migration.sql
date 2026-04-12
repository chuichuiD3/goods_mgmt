-- AlterTable: add receivedAt timestamp to HoldingOrderGroup
-- Records the exact moment a group's status was set to 'received'.
-- NULL means the group has not been marked received yet.
ALTER TABLE "HoldingOrderGroup" ADD COLUMN "receivedAt" TIMESTAMP(3);
