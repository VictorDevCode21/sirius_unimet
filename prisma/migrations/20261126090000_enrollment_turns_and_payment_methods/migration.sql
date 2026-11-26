-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAGO_MOVIL', 'BANK_TRANSFER_VES', 'IMMEDIATE_DEBIT', 'ONLINE_CARD', 'ZELLE', 'BINANCE_PAY', 'US_BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentCurrency" AS ENUM ('VES', 'USD', 'USDT');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "enrolledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SimulatedPayment" ADD COLUMN     "currency" "PaymentCurrency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "details" JSONB,
ADD COLUMN     "exchangeRate" DECIMAL(14,4),
ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'ONLINE_CARD',
ADD COLUMN     "paidAmount" DECIMAL(14,2),
ADD COLUMN     "payerReference" TEXT;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "enrollmentStartsAt" DATE;

-- CreateIndex
CREATE UNIQUE INDEX "SimulatedPayment_method_payerReference_key" ON "SimulatedPayment"("method", "payerReference");


-- Enrollments confirmed before this change were enrolled when they were confirmed.
UPDATE "Enrollment" SET "enrolledAt" = "updatedAt" WHERE "status" = 'CONFIRMED';
