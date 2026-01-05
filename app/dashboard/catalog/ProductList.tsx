"use client"
import React from 'react';
import { Card, Row, Col, Typography, Button, Tag } from 'antd';
import Link from 'next/link';

const { Meta } = Card;

interface ProductListProps {
    products: any[];
}

export default function ProductList({ products }: ProductListProps) {
    // Helper to get price display
    const getPriceDisplay = (product: any) => {
        if (!product.variants || product.variants.length === 0) {
            return <div className="text-gray-400">Contact for Price</div>;
        }

        const prices = product.variants.map((v: any) => v.basePrice).filter((p: any) => typeof p === 'number');

        if (prices.length === 0) return <div className="text-gray-400">N/A</div>;

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        if (minPrice === maxPrice) {
            return `$${minPrice.toFixed(2)}`;
        }
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Catalog</h2>
                {/* <Button type="primary">Sync Data</Button> */}
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p>No products found in local database.</p>
                </div>
            ) : (
                <Row gutter={[16, 16]}>
                    {products.map((product) => {
                        let images: string[] = [];
                        try {
                            images = typeof product.images === 'string'
                                ? JSON.parse(product.images)
                                : product.images;
                        } catch (e) { images = []; }
                        const coverImage = (images && images.length > 0) ? images[0] : '/placeholder.png';

                        return (
                            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={product.id}>
                                <Link href={`/dashboard/products/${product.id}`}>
                                    <Card
                                        hoverable
                                        cover={
                                            <div className="h-48 overflow-hidden flex items-center justify-center bg-white border-b relative">
                                                <img
                                                    alt={product.name}
                                                    src={coverImage}
                                                    style={{ objectFit: 'contain', height: '100%', width: '100%' }}
                                                />
                                                {!product.isActive && (
                                                    <div className="absolute top-2 right-2">
                                                        <Tag color="red">Inactive</Tag>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                        className="h-full"
                                    >
                                        <Meta
                                            title={<div className="truncate" title={product.name}>{product.name}</div>}
                                            description={
                                                <div>
                                                    <div className="font-bold text-lg text-green-600 mt-2">
                                                        {getPriceDisplay(product)}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {product.sku || 'No SKU'}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Link>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
}
