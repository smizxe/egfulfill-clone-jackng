import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // Fetch formatted transactions from WalletLedger
        const ledgerEntries = await prisma.walletLedger.findMany({
            include: { seller: true },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Fetch PENDING Topup Requests
        const pendingRequests = await prisma.topupRequest.findMany({
            where: { status: 'PENDING' },
            include: { seller: { include: { users: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // Map pending requests to same Transaction interface
        const pendingFormatted = pendingRequests.map(req => ({
            id: req.id,
            type: 'TOP_UP_REQUEST',
            amount: req.amount,
            status: 'PENDING',
            createdAt: req.createdAt,
            user: {
                email: req.seller.users[0]?.email || req.seller.contactEmail || req.seller.name,
                name: req.seller.name
            },
            isRequest: true,
            currency: req.currency,
            exchangeRate: req.exchangeRate,
            amountReceived: req.amountReceived
        }));

        // Map ledger to match frontend Transaction interface
        const ledgerFormatted = ledgerEntries.map(entry => ({
            id: entry.id,
            type: entry.refType === 'TOPUP' ? 'ADMIN_TOP_UP' : entry.type,
            amount: entry.amount,
            status: 'COMPLETED',
            createdAt: entry.createdAt,
            user: {
                email: entry.seller.contactEmail || entry.seller.name,
                name: entry.seller.name
            },
            isRequest: false
        }));

        const transactions = [...pendingFormatted, ...ledgerFormatted];

        // Fetch users (Sellers) with Wallet info
        const sellers = await prisma.seller.findMany({
            include: {
                wallet: true,
                users: { select: { email: true }, take: 1 }
            }
        });

        // Map to match frontend User interface
        const users = sellers.map(seller => ({
            id: seller.id,
            email: seller.users[0]?.email || seller.contactEmail || seller.code,
            name: seller.name,
            balance: seller.wallet?.balance || 0
        }));

        return NextResponse.json({ transactions, users });
    } catch (error) {
        console.error('Wallet API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin wallet data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { userId, amount, type, action, topupRequestId } = body;

    // ACTION: CONFIRM PENDING REQUEST
    if (action === 'confirm_request') {
        if (!topupRequestId) return NextResponse.json({ error: 'Missing Request ID' }, { status: 400 });

        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Get the Request
                const req = await tx.topupRequest.findUnique({ where: { id: topupRequestId } });
                if (!req) throw new Error('Request not found');
                if (req.status !== 'PENDING') throw new Error('Request already processed');

                // 2. Update Request Status
                await tx.topupRequest.update({
                    where: { id: topupRequestId },
                    data: { status: 'CONFIRMED', confirmedAt: new Date() }
                });

                // 3. Update Wallet Balance
                const sellerId = req.sellerId;
                const creditAmount = req.amountReceived ?? req.amount;

                let wallet = await tx.wallet.findUnique({ where: { sellerId } });
                if (!wallet) {
                    wallet = await tx.wallet.create({ data: { sellerId, balance: 0 } });
                }

                await tx.wallet.update({
                    where: { sellerId },
                    data: { balance: { increment: creditAmount } }
                });

                // 4. Create Ledger Entry
                const ledger = await tx.walletLedger.create({
                    data: {
                        sellerId,
                        type: 'CREDIT',
                        amount: creditAmount,
                        currency: 'USD',
                        refType: 'TOPUP',
                        refId: req.id,
                        note: req.transferContent,
                        createdBy: 'ADMIN'
                    }
                });

                return ledger;
            });
            return NextResponse.json(result);
        } catch (error: any) {
            console.error('Confirm Request Error:', error);
            return NextResponse.json({ error: error.message || 'Confirmation failed' }, { status: 500 });
        }
    }

    // ACTION: MANUAL ADMIN TOP UP (Existing logic)
    if (!userId || !amount) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update/Create Wallet
            // Check if wallet exists
            let wallet = await tx.wallet.findUnique({ where: { sellerId: userId } });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { sellerId: userId, balance: 0 }
                });
            }

            await tx.wallet.update({
                where: { sellerId: userId },
                data: {
                    balance: { increment: parseFloat(amount) }
                }
            });

            // 2. Create Ledger Entry
            const ledger = await tx.walletLedger.create({
                data: {
                    sellerId: userId,
                    type: 'CREDIT',
                    amount: parseFloat(amount),
                    currency: 'USD',
                    refType: 'TOPUP', // System Topup
                    note: `Admin Manual Topup: ${type || 'Standard'}`,
                    createdBy: 'ADMIN'
                }
            });

            return ledger;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Topup Error:', error);
        return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
    }
}
