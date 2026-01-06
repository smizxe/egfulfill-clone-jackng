"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Divider, Breadcrumb, Radio, message, Tooltip } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

interface ProductDetailProps {
    product: any;
}

// Simple color mapping helper for demo
const getColorStyle = (colorName: string) => {
    const c = colorName.toLowerCase().replace(/[^a-z]/g, '');
    const map: Record<string, string> = {
        white: '#ffffff',
        black: '#000000',
        navy: '#000080',
        red: '#ff0000',
        blue: '#0000ff',
        royal: '#4169e1',
        green: '#008000',
        forest: '#228b22',
        maroon: '#800000',
        purple: '#800080',
        grey: '#808080',
        sportgrey: '#a9a9a9',
        darkheather: '#4a4a4a',
        sand: '#f4a460',
        lightpink: '#ffb6c1'
    };

    // Gradient effect if we want to be fancy, or just solid color
    // Let's use a subtle gradient to look "premium"
    const base = map[c] || '#cccccc';
    if (c === 'white') return { background: '#ffffff', border: '1px solid #e0e0e0' };
    return { background: `linear-gradient(135deg, ${base} 0%, ${adjustColor(base, 40)} 100%)` };
};

// Helper to lighten/darken for gradient
const adjustColor = (color: string, amount: number) => {
    return color; // Simplified for now, real implementation would handle hex math
}

export default function ProductDetail({ product }: ProductDetailProps) {
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState<string>('');

    // Safety fix for images
    let images: string[] = [];
    try {
        if (typeof product.images === 'string') {
            images = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
            images = product.images;
        } else {
            images = [];
        }
    } catch (e) { images = []; }

    useEffect(() => {
        if (images.length > 0) setActiveImage(images[0]);
    }, [images]);

    // Data Processing
    const uniqueColors = useMemo(() => {
        const colors = new Set<string>();
        product.variants?.forEach((v: any) => { if (v.color) colors.add(v.color) });
        return Array.from(colors);
    }, [product]);

    const uniqueSizes = useMemo(() => {
        const sizes = new Set<string>();
        product.variants?.forEach((v: any) => { if (v.size) sizes.add(v.size) });
        return Array.from(sizes);
    }, [product]);

    // Derived State
    const currentVariant = useMemo(() => {
        if (!product.variants) return null;
        return product.variants.find((v: any) =>
            (selectedColor ? v.color === selectedColor : true) &&
            (selectedSize ? v.size === selectedSize : true)
        );
    }, [product, selectedColor, selectedSize]);

    // Price Display
    const displayPrice = currentVariant ? currentVariant.basePrice : product.basePrice || product.price || 0;

    // Auto-select first options if available and not selected
    useEffect(() => {
        if (!selectedColor && uniqueColors.length > 0) setSelectedColor(uniqueColors[0]);
        if (!selectedSize && uniqueSizes.length > 0) setSelectedSize(uniqueSizes[0]);
    }, [uniqueColors, uniqueSizes]);





    return (
        <div className="p-6 max-w-[1400px] mx-auto bg-gray-50 min-h-screen">
            <div className="mb-6">
                <Link href="/dashboard/catalog" className="text-gray-500 hover:text-blue-600 flex items-center gap-2 transition-colors">
                    <ArrowLeftOutlined /> Back to Catalogs
                </Link>
            </div>

            <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
                <Row gutter={[48, 40]}>
                    {/* Left Column: Images */}
                    <Col xs={24} md={12} lg={10}>
                        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white flex items-center justify-center p-8 mb-4 relative aspect-square group">
                            <img
                                src={activeImage || '/placeholder.png'}
                                alt={product.name}
                                className="object-contain max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`
                                            w-20 h-20 border-2 rounded-lg p-1 cursor-pointer transition-all flex-shrink-0
                                            ${activeImage === img ? 'border-blue-500 shadow-md transform -translate-y-1' : 'border-gray-200 hover:border-blue-300'}
                                        `}
                                    >
                                        <img src={img} className="w-full h-full object-contain rounded-md" alt={`Thumbnail ${idx}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Col>

                    {/* Right Column: Details */}
                    <Col xs={24} md={12} lg={14}>
                        <div className="flex flex-col h-full">
                            <div>
                                <Tag color="blue" className="mb-2 uppercase tracking-wide text-xs font-bold border-0 bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                                    {product.category || 'Apparel'}
                                </Tag>
                                <Title level={1} className="!mb-2 !mt-0 text-gray-800 tracking-tight" style={{ fontSize: '2.5rem' }}>
                                    {product.name}
                                </Title>
                                <div className="flex items-center gap-4 mb-6">
                                    <Paragraph className="!mb-0 text-gray-400 font-mono text-sm uppercase">SKU: {product.sku}</Paragraph>
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    <RateDisplay />
                                </div>

                                <div className="mb-8">
                                    <Text className="text-4xl font-bold text-gray-900 font-sans">
                                        ${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
                                    </Text>
                                    {/* Optional: Add compare at price if available */}
                                </div>
                            </div>

                            <Divider className="my-6 border-gray-100" />

                            {/* Variants Selection */}
                            <div className="space-y-8">
                                {/* Color Selector */}
                                {uniqueColors.length > 0 && (
                                    <div>
                                        <Text className="block text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                            Selected Color: <span className="text-gray-900">{selectedColor}</span>
                                        </Text>
                                        <div className="flex flex-wrap gap-3">
                                            {uniqueColors.map((color) => {
                                                const isActive = selectedColor === color;
                                                const style = getColorStyle(color);
                                                return (
                                                    <Tooltip title={color} key={color}>
                                                        <div
                                                            onClick={() => setSelectedColor(color)}
                                                            className={`
                                                                w-10 h-10 rounded-full cursor-pointer shadow-sm transition-all duration-200 relative
                                                                ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 hover:shadow-md'}
                                                            `}
                                                            style={style}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                                                                    <CheckOutlined style={{
                                                                        filter: style.background === '#ffffff' ? 'invert(1)' : 'none'
                                                                    }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Tooltip>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selector */}
                                {uniqueSizes.length > 0 && (
                                    <div>
                                        <Text className="block text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                            Selected Size: <span className="text-gray-900">{selectedSize}</span>
                                        </Text>
                                        <div className="flex flex-wrap gap-3">
                                            {uniqueSizes.sort(sortSizes).map((size) => {
                                                const isActive = selectedSize === size;
                                                return (
                                                    <button
                                                        key={size}
                                                        onClick={() => setSelectedSize(size)}
                                                        className={`
                                                            min-w-[50px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                                                            ${isActive
                                                                ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                                            }
                                                        `}
                                                    >
                                                        {size}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>



                            <div className="mt-6 space-y-2">
                                <Text strong className="block text-sm text-gray-900">Description</Text>
                                <Paragraph className="text-gray-500 leading-relaxed max-w-prose">
                                    {product.description || 'Premium quality product designed for comfort and style. Featuring durable materials and modern fit.'}
                                </Paragraph>
                            </div>

                            {/* Shipping Rates & Fees */}
                            {(product.shippingRates || product.extraFees) && (
                                <div className="mt-8 space-y-6">
                                    {/* Shipping Rates Table */}
                                    {(() => {
                                        let rates = [];
                                        try { rates = JSON.parse(product.shippingRates || '[]'); } catch (e) { }
                                        if (rates.length > 0) {
                                            return (
                                                <div>
                                                    <Title level={4} className="mb-3 text-gray-800">Shipping Rates</Title>
                                                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Fees</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {rates.map((rate: any, idx: number) => (
                                                                    <tr key={idx}>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">{rate.operator}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">{rate.quantity}</td>
                                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${rate.shippingFee}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Extra Fees Table */}
                                    {(() => {
                                        let fees = [];
                                        try { fees = JSON.parse(product.extraFees || '[]'); } catch (e) { }
                                        if (fees.length > 0) {
                                            return (
                                                <div>
                                                    <Title level={4} className="mb-3 text-gray-800">Extra Fees</Title>
                                                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surcharge</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {fees.map((fee: any, idx: number) => (
                                                                    <tr key={idx}>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">{fee.position}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                {fee.type}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${fee.surcharge}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}

// Dummy Rate component for visuals
const RateDisplay = () => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="text-yellow-400 text-sm">★</div>)}
        <span className="text-xs text-gray-400 ml-1">(4.8)</span>
    </div>
);

// Size Sorter Helper
const sortSizes = (a: string, b: string) => {
    const order = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl'];
    const iA = order.indexOf(a.toLowerCase());
    const iB = order.indexOf(b.toLowerCase());
    if (iA !== -1 && iB !== -1) return iA - iB;
    return a.localeCompare(b);
};
