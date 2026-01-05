import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProductList from './ProductList';

export default async function CatalogPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { variants: true }
    });

    return (
        <ProductList products={products} />
    );
}
