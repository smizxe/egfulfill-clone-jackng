"use client"
import React from 'react';
import { Card, Row, Col, Typography, Button, Tag, Divider, Breadcrumb } from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

interface ProductDetailProps {
    product: any;
}

export default function ProductDetail({ product }: ProductDetailProps) {
    let images: string[] = [];
    try {
        images = typeof product.images === 'string'
            ? JSON.parse(product.images)
            : product.images;
    } catch (e) { images = []; }

    const mainImage = (images && images.length > 0) ? images[0] : '/placeholder.png';

    return (
        <div className="p-4">
            <div className="mb-4">
                <Link href="/dashboard/catalog" className="text-gray-500 hover:text-blue-600">
                    <ArrowLeftOutlined /> Back to Catalog
                </Link>
            </div>

            <Card className="shadow-sm">
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={10}>
                        <div className="border rounded-lg overflow-hidden bg-white flex items-center justify-center p-4">
                            <img
                                src={mainImage}
                                alt={product.name}
                                style={{ maxWidth: '100%', maxHeight: '500px' }}
                            />
                        </div>
                        <div className="flex mt-4 gap-2 overflow-x-auto">
                            {images.map((img, idx) => (
                                <div key={idx} className="w-20 h-20 border cursor-pointer hover:border-blue-500 rounded p-1">
                                    <img src={img} className="w-full h-full object-contain" alt={`Thumbnail ${idx}`} />
                                </div>
                            ))}
                        </div>
                    </Col>
                    <Col xs={24} md={14}>
                        <Title level={2}>{product.name}</Title>
                        <div className="mb-4">
                            <Tag color="blue">{product.category || 'General'}</Tag>
                            <Text type="secondary">SKU: {product.sku || 'N/A'}</Text>
                        </div>

                        <Title level={3} className="text-green-600 !mt-0">
                            ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                        </Title>

                        <Divider />

                        <Paragraph>
                            {product.description || 'No description available for this product.'}
                        </Paragraph>

                        <div className="mb-6">
                            <Text strong>Availability: </Text>
                            <Text type="success">In Stock ({product.stock} units)</Text>
                        </div>

                        <div className="flex gap-4">
                            <Button type="primary" size="large" icon={<ShoppingCartOutlined />}>
                                Add to Cart
                            </Button>
                            <Button size="large">Buy Now</Button>
                        </div>

                        <Divider />

                        <div className="text-gray-500 text-sm">
                            <p>Estimated Delivery: 5-12 Days</p>
                            <p>Shipping: Free Worldwide</p>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}
