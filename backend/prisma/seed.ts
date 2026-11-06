import { PrismaClient, AccountStatus, MembershipRole, TransactionStatus, EntryType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ATLAS PAY Database Seeding...');

  // 1. Clean existing records in correct foreign-key order
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // 2. Create Organizations
  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Corp Global',
      slug: 'acme-corp',
      status: AccountStatus.ACTIVE,
    },
  });

  const paytrackOrg = await prisma.organization.create({
    data: {
      name: 'PayTrack Financials',
      slug: 'paytrack-fin',
      status: AccountStatus.ACTIVE,
    },
  });

  console.log(`🏢 Created organizations: ${acmeOrg.name}, ${paytrackOrg.name}`);

  // 3. Create Users with encrypted passwords
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      status: AccountStatus.ACTIVE,
    },
  });

  const makerUser = await prisma.user.create({
    data: {
      email: 'maker@acme.com',
      passwordHash,
      firstName: 'Tariq',
      lastName: 'Mansour',
      status: AccountStatus.ACTIVE,
    },
  });

  const checkerUser = await prisma.user.create({
    data: {
      email: 'checker@acme.com',
      passwordHash,
      firstName: 'M.',
      lastName: 'Bana',
      status: AccountStatus.ACTIVE,
    },
  });

  console.log('👥 Created Users: admin@acme.com, maker@acme.com, checker@acme.com');

  // 4. Assign Memberships (Segregation of Duties)
  await prisma.membership.createMany({
    data: [
      { organizationId: acmeOrg.id, userId: adminUser.id, role: MembershipRole.ORG_ADMIN },
      { organizationId: acmeOrg.id, userId: makerUser.id, role: MembershipRole.MAKER },
      { organizationId: acmeOrg.id, userId: checkerUser.id, role: MembershipRole.CHECKER },
    ],
  });

  console.log('🔑 Assigned Maker-Checker & Admin memberships.');

  // 5. Create Multi-Currency Wallets with minor-unit balances (Zero floating-point)
  const opsWallet = await prisma.wallet.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Main Operations USD',
      currency: 'USD',
      balance: 10_000_000n, // $100,000.00
      status: AccountStatus.ACTIVE,
    },
  });

  const payoutWallet = await prisma.wallet.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Vendor Payouts USD',
      currency: 'USD',
      balance: 5_000_000n, // $50,000.00
      status: AccountStatus.ACTIVE,
    },
  });

  const aedWallet = await prisma.wallet.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Treasury Vault AED',
      currency: 'AED',
      balance: 21_004_000n, // AED 210,040.00
      status: AccountStatus.ACTIVE,
    },
  });

  const usdcWallet = await prisma.wallet.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Settlement Liquidity USDC',
      currency: 'USD',
      balance: 31_204_000n, // $312,040.00
      status: AccountStatus.ACTIVE,
    },
  });

  console.log('💳 Created wallets for Acme Corp (USD, AED, USDC).');

  // 6. Record Initial Balanced Double-Entry Transaction
  const initialTrx = await prisma.transaction.create({
    data: {
      organizationId: acmeOrg.id,
      idempotencyKey: 'genesis-funding-001',
      type: 'TRANSFER',
      status: TransactionStatus.COMMITTED,
    },
  });

  const transferAmount = 100_000n; // $1,000.00 (in cents)

  await prisma.ledgerEntry.createMany({
    data: [
      {
        organizationId: acmeOrg.id,
        transactionId: initialTrx.id,
        walletId: opsWallet.id,
        type: EntryType.DEBIT,
        amount: transferAmount,
      },
      {
        organizationId: acmeOrg.id,
        transactionId: initialTrx.id,
        walletId: payoutWallet.id,
        type: EntryType.CREDIT,
        amount: transferAmount,
      },
    ],
  });

  console.log('⚖️ Created balanced initial ledger entries (Debit = Credit = 100,000 cents).');
  console.log('✅ ATLAS PAY Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
