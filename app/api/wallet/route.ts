import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seller: { include: { wallet: true } } }
    });

    if (!user || !user.seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    const sellerId = user.seller.id;

    // Fetch Balance
    const wallet = await prisma.wallet.findUnique({ where: { sellerId } });
    const balance = wallet ? wallet.balance : 0;

    // Fetch Ledger (Confirmed/History)
    const ledger = await prisma.walletLedger.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Fetch Pending Requests
    const pending = await prisma.topupRequest.findMany({
      where: { sellerId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });

    // Normalize transactions for frontend
    const transactions = [
      ...pending.map(p => ({
        id: p.id,
        type: 'TOP_UP_REQUEST',
        amount: p.amount,
        status: 'PENDING',
        createdAt: p.createdAt,
        note: p.transferContent
      })),
      ...ledger.map(l => ({
        id: l.id,
        type: l.type, // CREDIT, DEBIT
        amount: l.amount,
        status: 'COMPLETED',
        createdAt: l.createdAt,
        note: l.note
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      balance,
      transactions,
      email: user.email
    });

  } catch (error) {
    console.error('Wallet API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { amount, transferContent, evidenceUrl } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true }
    });

    if (!user || !user.seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Fetch Rate
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'VND_USD_RATE' } });
    const rate = setting ? parseFloat(setting.value) : 25000;
    const amountVnd = parseFloat(amount);
    const amountUsd = amountVnd / rate;

    // Create Topup Request
    const topup = await prisma.topupRequest.create({
      data: {
        sellerId: user.seller.id,
        amount: amountVnd,
        currency: 'VND',
        exchangeRate: rate,
        amountReceived: amountUsd,
        transferContent: transferContent || `Topup from ${user.email}`,
        status: 'PENDING',
        evidenceUrl: evidenceUrl || null,
      }
    });

    return NextResponse.json(topup);

  } catch (error) {
    console.error('Topup Request Error:', error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}
