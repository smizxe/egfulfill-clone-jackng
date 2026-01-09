"use client";

import React, { useState, useEffect } from 'react';
import {
    Menu, Sun, Moon, ArrowRight, PlayCircle, ShieldCheck,
    DollarSign, Box, XCircle, AlertTriangle, CheckCircle2,
    TrendingDown, FileSpreadsheet, Wallet, ScanLine, Layers,
    Globe2, BarChart3, QrCode, Plug, Code, Truck, Star,
    Twitter, Linkedin, Instagram, Music2, Check, UserPlus, LogIn, Home
} from 'lucide-react';

interface HomePageProps {
    isLoggedIn?: boolean;
}

export default function HomePage({ isLoggedIn }: HomePageProps) {
    const [theme, setTheme] = useState('light');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        // Initial Theme Logic - default to 'light' per HTML behavior unless specified
        if (typeof window !== 'undefined') {
            // Clear both body and documentElement to prevent system preference leaks or stale classes
            document.body.classList.remove('dark', 'gradient-theme');
            document.documentElement.classList.remove('dark', 'gradient-theme');
            setTheme('light');
        }
    }, []);

    const toggleTheme = (newTheme: string) => {
        setTheme(newTheme);
        // Clear both
        document.body.classList.remove('dark', 'gradient-theme');
        document.documentElement.classList.remove('dark', 'gradient-theme');

        if (newTheme === 'dark') {
            document.body.classList.add('dark');
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'gradient') {
            document.body.classList.add('gradient-theme');
            document.documentElement.classList.add('gradient-theme');
        }
        // light is default (no class)
    };

    // Navbar Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            const nav = document.getElementById('navbar');
            if (nav) {
                if (window.scrollY > 10) {
                    nav.classList.add('shadow-md');
                    nav.classList.add('!bg-[var(--bg-body)]');
                } else {
                    nav.classList.remove('shadow-md');
                    nav.classList.remove('!bg-[var(--bg-body)]');
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Typewriter Effect
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    const words = ["POD", "Dropshipping", "POD & Dropshipping"];

    useEffect(() => {
        const handleType = () => {
            const i = loopNum % words.length;
            const fullText = words[i];

            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            );

            setTypingSpeed(isDeleting ? 30 : 150);

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 1500); // Pause at end
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="antialiased selection:bg-brand-500 selection:text-white overflow-x-hidden relative">

            {/* Theme Toggles (Fixed Bottom Right) */}
            <div className="fixed bottom-6 right-6 z-50 flex gap-2 p-2 rounded-full glass-panel shadow-lg">
                <button onClick={() => toggleTheme('light')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="Light Mode">
                    <Sun className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                <button onClick={() => toggleTheme('dark')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" title="Dark Mode">
                    <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-grid z-0"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-[100] border-b border-white/10 glass-panel transition-all duration-300" id="navbar">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold tracking-tight shadow-md group-hover:scale-105 transition-transform">
                            e
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-[var(--text-main)] group-hover:text-brand-600 transition-colors">emfulfill</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-muted)]">
                        <a href="#solutions" className="hover:text-[var(--text-main)] transition-colors">Solutions</a>
                        <a href="#workflow" className="hover:text-[var(--text-main)] transition-colors">Workflow</a>
                        <a href="#features" className="hover:text-[var(--text-main)] transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-[var(--text-main)] transition-colors">Pricing</a>
                    </div>

                    {/* CTAs */}
                    <div className="hidden md:flex items-center gap-4">
                        {isLoggedIn ? (
                            <a href="/dashboard" className="bg-[var(--text-main)] text-[var(--bg-body)] px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/20 flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Go to Dashboard
                            </a>
                        ) : (
                            <>
                                <a href="/login" className="text-sm font-medium text-[var(--text-main)] hover:text-brand-600 transition-colors">Login</a>
                                <a href="/register" className="bg-[var(--text-main)] text-[var(--bg-body)] px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/20 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Register
                                </a>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-[var(--text-main)]" onClick={toggleMobileMenu}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <div id="mobile-menu" className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:hidden absolute top-16 left-0 w-full glass-panel border-b border-gray-200 dark:border-gray-800 p-6 flex-col gap-4 shadow-xl`}>
                    <a href="#solutions" className="block text-sm font-medium text-[var(--text-main)] py-2">Solutions</a>
                    <a href="#workflow" className="block text-sm font-medium text-[var(--text-main)] py-2">Workflow</a>
                    <a href="#features" className="block text-sm font-medium text-[var(--text-main)] py-2">Features</a>
                    <a href="#pricing" className="block text-sm font-medium text-[var(--text-main)] py-2">Pricing</a>
                    <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
                    {isLoggedIn ? (
                        <a href="/dashboard" className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" />
                            Go to Dashboard
                        </a>
                    ) : (
                        <>
                            <a href="/login" className="block text-sm font-medium text-[var(--text-main)] py-2">Login</a>
                            <a href="/register" className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Register
                            </a>
                        </>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 pt-24 md:pt-32">

                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 pb-24 lg:pb-32">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Copy */}
                        <div className="reveal active flex flex-col items-start text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-medium mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                                </span>
                                Accepting New Sellers for Q4
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 text-[var(--text-main)]">
                                Professional Fulfillment for <br />
                                <span className="text-gradient h-20 inline-block min-h-[1.2em]">
                                    {text}
                                    <span className="animate-blink border-r-2 border-brand-500 ml-1"></span>
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-8 leading-relaxed max-w-lg">
                                Focus on selling. We handle production, inventory, and US/Canada shipping with full transparency and real-time tracking.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                {isLoggedIn ? (
                                    <a href="/dashboard" className="bg-[var(--text-main)] text-[var(--bg-body)] px-8 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2">
                                        <Home className="w-4 h-4" />
                                        Go to Dashboard
                                    </a>
                                ) : (
                                    <>
                                        <a href="/register" className="bg-[var(--text-main)] text-[var(--bg-body)] px-8 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2">
                                            Register
                                            <UserPlus className="w-4 h-4" />
                                        </a>
                                        <a href="/login" className="px-8 py-3.5 rounded-full text-sm font-medium text-[var(--text-main)] border border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                                            <LogIn className="w-4 h-4" />
                                            Login
                                        </a>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>No long-term contracts. Built to scale with your business.</span>
                            </div>
                        </div>

                        {/* Visual / Mockup */}
                        <div className="reveal delay-200 relative">
                            {/* Dashboard Mockup Container */}
                            <div className="relative w-full aspect-[4/3] glass-panel rounded-2xl shadow-2xl overflow-hidden border border-[var(--card-border)] group">
                                {/* Top Bar */}
                                <div className="h-10 border-b border-[var(--card-border)] bg-gray-50/50 dark:bg-white/5 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>

                                {/* Main Content of Mockup */}
                                <div className="p-6 flex gap-6 h-full bg-[var(--card-bg)]">
                                    {/* Sidebar */}
                                    <div className="w-16 hidden sm:flex flex-col gap-4 border-r border-[var(--card-border)] pr-4">
                                        <div className="w-8 h-8 rounded bg-brand-100 dark:bg-brand-900/50 mb-4"></div>
                                        <div className="w-full h-2 rounded bg-gray-100 dark:bg-gray-800"></div>
                                        <div className="w-full h-2 rounded bg-gray-100 dark:bg-gray-800"></div>
                                        <div className="w-full h-2 rounded bg-gray-100 dark:bg-gray-800"></div>
                                    </div>

                                    {/* Main Area */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                            <div className="h-8 w-24 bg-brand-500 rounded text-white text-[10px] flex items-center justify-center">Export CSV</div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="h-32 w-full bg-gradient-to-t from-brand-50 to-transparent dark:from-brand-900/20 rounded-lg border border-brand-100 dark:border-brand-900/50 relative mb-4 overflow-hidden">
                                            <svg className="absolute bottom-0 left-0 w-full h-full text-brand-500" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                <path d="M0,40 Q20,30 40,35 T80,10 T100,20 V40 H0 Z" fill="currentColor" opacity="0.1"></path>
                                                <path d="M0,40 Q20,30 40,35 T80,10 T100,20" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
                                            </svg>
                                        </div>

                                        {/* Rows */}
                                        <div className="space-y-3">
                                            <div className="h-10 w-full bg-gray-50 dark:bg-white/5 rounded flex items-center px-3 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
                                                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                </div>
                                                <div className="w-12 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] flex items-center justify-center">Shipped</div>
                                            </div>
                                            <div className="h-10 w-full bg-gray-50 dark:bg-white/5 rounded flex items-center px-3 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
                                                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                </div>
                                                <div className="w-12 h-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[10px] flex items-center justify-center">Process</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Feature Cards */}
                            <div className="absolute -top-6 -right-6 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl border border-[var(--card-border)] flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--text-muted)]">Cost Saving</div>
                                    <div className="text-sm font-semibold text-[var(--text-main)]">Wallet Control</div>
                                </div>
                            </div>

                            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl border border-[var(--card-border)] flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                    <Box className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--text-muted)]">Real-Time</div>
                                    <div className="text-sm font-semibold text-[var(--text-main)]">Smart Inventory</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Strip */}
                <section className="border-y border-[var(--card-border)] bg-[var(--bg-body)]/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 py-10 text-center">
                        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-8">Trusted by sellers across major platforms</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xl font-bold tracking-tight font-sans text-[var(--text-main)]">shopify</span>
                            <span className="text-xl font-bold tracking-tight font-serif italic text-[var(--text-main)]">Etsy</span>
                            <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">WooCommerce</span>
                            <span className="text-xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-1"><Music2 className="w-5 h-5" /> TikTok Shop</span>
                            <span className="text-xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-1">amazon</span>
                        </div>
                    </div>
                </section>

                {/* Problem / Solution */}
                <section id="solutions" className="py-24 max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 reveal">
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-main)] mb-4">
                            Fulfillment is more than shipping<br className="hidden md:block" />
                            <span className="text-[var(--text-muted)]">it&apos;s an operational system.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="reveal p-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-lg transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-4">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">The Problem</h3>
                            <p className="text-[var(--text-muted)] text-sm mb-6">Manual order handling and slow production cycles.</p>
                            <div className="h-px bg-[var(--card-border)] w-full mb-6"></div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--text-main)]">The Solution</h4>
                                    <p className="text-[var(--text-muted)] text-sm">Automated job-based workflow from order to shipment.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="reveal delay-100 p-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-lg transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">The Problem</h3>
                            <p className="text-[var(--text-muted)] text-sm mb-6">Production errors and missing file confusion.</p>
                            <div className="h-px bg-[var(--card-border)] w-full mb-6"></div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--text-main)]">The Solution</h4>
                                    <p className="text-[var(--text-muted)] text-sm">QR-based production system with zero guesswork.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="reveal delay-200 p-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-lg transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mb-4">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">The Problem</h3>
                            <p className="text-[var(--text-muted)] text-sm mb-6">Unclear costs and difficult profit tracking.</p>
                            <div className="h-px bg-[var(--card-border)] w-full mb-6"></div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--text-main)]">The Solution</h4>
                                    <p className="text-[var(--text-muted)] text-sm">Transparent wallet, cost, and revenue reporting.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Features Grid */}
                <section id="features" className="py-24 bg-brand-50/50 dark:bg-zinc-900/30 border-y border-[var(--card-border)]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-16 md:w-2/3 reveal">
                            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-main)] mb-4">Everything you need to run<br />fulfillment at scale</h2>
                            <p className="text-[var(--text-muted)]">Powerful tools designed for high-volume sellers and precise inventory control.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Feature Items */}
                            <div className="reveal group p-6 bg-[var(--bg-body)] rounded-xl border border-[var(--card-border)] hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Excel Order Import</h3>
                                <p className="text-sm text-[var(--text-muted)]">Bulk upload thousands of orders in seconds with auto-validation.</p>
                            </div>

                            <div className="reveal delay-100 group p-6 bg-[var(--bg-body)] rounded-xl border border-[var(--card-border)] hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Prepaid Wallet Control</h3>
                                <p className="text-sm text-[var(--text-muted)]">Manage costs instantly. No surprise charges at the end of the month.</p>
                            </div>

                            <div className="reveal delay-200 group p-6 bg-[var(--bg-body)] rounded-xl border border-[var(--card-border)] hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <ScanLine className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">QR Production Tracking</h3>
                                <p className="text-sm text-[var(--text-muted)]">Stick, scan, and update. Eliminate errors on the factory floor.</p>
                            </div>

                            <div className="reveal delay-300 group p-6 bg-[var(--bg-body)] rounded-xl border border-[var(--card-border)] hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Smart Inventory</h3>
                                <p className="text-sm text-[var(--text-muted)]">Real-time stock syncing across all your integrated stores.</p>
                            </div>

                            <div className="reveal delay-400 group p-6 bg-[var(--bg-body)] rounded-xl border border-[var(--card-border)] hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Globe2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">US &amp; Canada Shipping</h3>
                                <p className="text-sm text-[var(--text-muted)]">Fast, reliable carriers integrated directly into the dashboard.</p>
                            </div>

                            <div className="reveal delay-500 group p-6 bg-[var(--bg-body)] rounded-xl border border-[var(--card-border)] hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300">
                                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Real-Time Reporting</h3>
                                <p className="text-sm text-[var(--text-muted)]">Visualize your fulfillment velocity and profit margins.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* QR Sticker Highlight */}
                {/* STRICT REPLICATION: 
                    HTML Line 477: <div class="bg-[var(--card-main)] dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 rounded-3xl border border-[var(--card-border)] overflow-hidden">
                    HTML Line 506: <div class="bg-zinc-100 dark:bg-black/50 p-10 lg:p-16 flex items-center justify-center relative overflow-hidden">
                    HTML Line 510: <div class="relative w-80 h-48 bg-white text-black rounded-lg shadow-2xl p-4 flex flex-col justify-between transform rotate-1 hover:rotate-0 transition-transform duration-500 reveal delay-200">
                */}
                <section className="py-24 max-w-7xl mx-auto px-6">
                    <div className="bg-[var(--card-main)] dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 rounded-3xl border border-[var(--card-border)] overflow-hidden">
                        <div className="grid lg:grid-cols-2">
                            <div className="p-10 lg:p-16 flex flex-col justify-center reveal">
                                <div className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium text-sm mb-4">
                                    <QrCode className="w-4 h-4" />
                                    Precision Production
                                </div>
                                <h2 className="text-3xl md:text-4xl font-semibold text-[var(--text-main)] mb-6 tracking-tight">Dual QR Code Stickers for Error-Free Production</h2>
                                <p className="text-[var(--text-muted)] mb-8 text-lg">Reduce production mistakes, speed up workflows, and maintain full operational visibility with our proprietary dual-scan system.</p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                                        <div>
                                            <h4 className="font-semibold text-[var(--text-main)]">QR File Access</h4>
                                            <p className="text-sm text-[var(--text-muted)]">Scan to instantly open embroidery or design files for the machine.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/50 text-accent-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                                        <div>
                                            <h4 className="font-semibold text-[var(--text-main)]">QR Status Update</h4>
                                            <p className="text-sm text-[var(--text-muted)]">Scan twice to update job status (In Process → Completed).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Side */}
                            <div className="bg-zinc-100 dark:bg-black/50 p-10 lg:p-16 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-grid opacity-50"></div>

                                {/* Sticker Mockup - EXACTLY as HTML: bg-white text-black */}
                                <div className="relative w-80 h-48 bg-white text-black rounded-lg shadow-2xl p-4 flex flex-col justify-between transform rotate-1 hover:rotate-0 transition-transform duration-500 reveal delay-200">
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Order ID</div>
                                            <div className="text-xl font-mono font-bold">#9821-XP</div>
                                        </div>
                                        <div className="text-xs font-bold bg-black text-white px-2 py-1 rounded">PRIORITY</div>
                                    </div>

                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <div className="text-[10px] text-gray-400 mb-1">DESIGN FILE</div>
                                            {/* CSS QR Code Simulation */}
                                            <div className="w-16 h-16 bg-white border border-gray-200 p-1">
                                                <div className="w-full h-full bg-black qr-pattern opacity-90"></div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] text-gray-400 mb-1">STATUS UPDATE</div>
                                            <div className="w-16 h-16 bg-white border border-gray-200 p-1">
                                                <div className="w-full h-full bg-black qr-pattern opacity-90"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-[9px] text-gray-300 text-center mt-2 tracking-widest">
                                        emfulfill FULFILLMENT SYSTEM
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Workflow Timeline */}
                <section id="workflow" className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-y border-[var(--card-border)]">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16 reveal">
                            <h2 className="text-3xl font-semibold text-[var(--text-main)] mb-4">A simple, scalable workflow</h2>
                            <p className="text-[var(--text-muted)]">From dashboard to doorstep in 6 automated steps.</p>
                        </div>

                        <div className="relative">
                            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-[var(--card-border)] -translate-y-1/2 z-0"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
                                <div className="reveal relative flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border-2 border-brand-500 text-brand-600 flex items-center justify-center font-bold mb-4 shadow-sm z-10 group-hover:scale-110 transition-transform">1</div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">Wallet Top-up</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-2 px-2">Secure prepaid funding.</p>
                                </div>

                                <div className="reveal delay-100 relative flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border-2 border-[var(--card-border)] text-[var(--text-muted)] flex items-center justify-center font-bold mb-4 shadow-sm z-10 group-hover:border-brand-500 group-hover:text-brand-600 transition-colors">2</div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">Import Orders</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-2 px-2">Excel or API sync.</p>
                                </div>

                                <div className="reveal delay-200 relative flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border-2 border-[var(--card-border)] text-[var(--text-muted)] flex items-center justify-center font-bold mb-4 shadow-sm z-10 group-hover:border-brand-500 group-hover:text-brand-600 transition-colors">3</div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">Processing</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-2 px-2">System creates jobs.</p>
                                </div>

                                <div className="reveal delay-300 relative flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border-2 border-[var(--card-border)] text-[var(--text-muted)] flex items-center justify-center font-bold mb-4 shadow-sm z-10 group-hover:border-brand-500 group-hover:text-brand-600 transition-colors">4</div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">QR Printing</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-2 px-2">Dual stickers generated.</p>
                                </div>

                                <div className="reveal delay-400 relative flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border-2 border-[var(--card-border)] text-[var(--text-muted)] flex items-center justify-center font-bold mb-4 shadow-sm z-10 group-hover:border-brand-500 group-hover:text-brand-600 transition-colors">5</div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">Production</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-2 px-2">Scan &amp; Create.</p>
                                </div>

                                <div className="reveal delay-500 relative flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-body)] border-2 border-emerald-500 text-emerald-600 flex items-center justify-center font-bold mb-4 shadow-sm z-10 group-hover:scale-110 transition-transform"><Check className="w-5 h-5" /></div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">Shipping</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-2 px-2">Tracking sent instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integrations & Pricing Teaser */}
                <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="reveal p-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Built for Integrations</h3>
                                <p className="text-indigo-100 mb-6 max-w-sm">Connect your store or use our robust API for custom solutions.</p>
                                <div className="flex gap-4 mb-8">
                                    <div className="bg-white/20 backdrop-blur rounded p-2"><Plug className="w-6 h-6" /></div>
                                    <div className="bg-white/20 backdrop-blur rounded p-2"><Code className="w-6 h-6" /></div>
                                    <div className="bg-white/20 backdrop-blur rounded p-2"><Truck className="w-6 h-6" /></div>
                                </div>
                                <p className="text-xs text-indigo-200 opacity-80">API-based integrations can be enabled in phases as your business scales.</p>
                            </div>
                        </div>

                        <div className="reveal delay-100 p-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col justify-center text-center">
                            <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2">Flexible Pricing</h3>
                            <p className="text-[var(--text-muted)] mb-8">We don&apos;t charge monthly subscription fees. Pricing is based purely on order volume and product type.</p>
                            <button className="mx-auto px-6 py-3 rounded-full border border-[var(--card-border)] text-[var(--text-main)] hover:border-brand-500 hover:text-brand-600 transition-colors font-medium text-sm">
                                Get a Custom Quote
                            </button>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-16 bg-[var(--bg-body)]">
                    <div className="max-w-3xl mx-auto px-6 text-center reveal">
                        <div className="mb-6 flex justify-center text-yellow-400 gap-1">
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-medium text-[var(--text-main)] mb-6">&quot;This system streamlined our production and reduced errors dramatically. Scaling from 20 to 200 orders per day became manageable.&quot;</h3>
                        <p className="text-sm font-semibold text-[var(--text-muted)]">— Director of Operations, Apparel Co.</p>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-6">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-[var(--text-main)] text-[var(--bg-body)] px-6 py-16 md:py-20 text-center relative overflow-hidden reveal">
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-500 rounded-full blur-3xl"></div>
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Ready to streamline your<br />fulfillment operations?</h2>
                            <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto">Join the new standard in dropshipping and POD logistics today.</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {isLoggedIn ? (
                                    <a href="/dashboard" className="px-8 py-3.5 rounded-full bg-[var(--bg-body)] text-[var(--text-main)] font-semibold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                        <Home className="w-4 h-4" />
                                        Go to Dashboard
                                    </a>
                                ) : (
                                    <a href="/register" className="px-8 py-3.5 rounded-full bg-[var(--bg-body)] text-[var(--text-main)] font-semibold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                        Register
                                        <UserPlus className="w-4 h-4" />
                                    </a>
                                )}
                                <button className="px-8 py-3.5 rounded-full border border-[var(--bg-body)]/30 hover:bg-[var(--bg-body)]/10 transition-colors text-sm font-medium">
                                    Get a Quote
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--card-border)] bg-[var(--bg-body)] pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-[var(--text-main)] rounded flex items-center justify-center text-[var(--bg-body)] font-bold text-xs">e</div>
                                <span className="font-semibold text-[var(--text-main)]">emfulfill</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] max-w-xs">
                                Advanced fulfillment technology for the modern e-commerce entrepreneur.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-[var(--text-main)] mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li><a href="#" className="hover:text-[var(--text-main)]">Solutions</a></li>
                                <li><a href="#" className="hover:text-[var(--text-main)]">How it Works</a></li>
                                <li><a href="#" className="hover:text-[var(--text-main)]">Pricing</a></li>
                                <li><a href="#" className="hover:text-[var(--text-main)]">Integrations</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-[var(--text-main)] mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                                <li><a href="#" className="hover:text-[var(--text-main)]">Contact</a></li>
                                <li><a href="#" className="hover:text-[var(--text-main)]">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-[var(--text-main)]">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[var(--card-border)] flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-[var(--text-muted)]">
                            © 2023 emfulfill Fulfillment. All rights reserved.
                        </div>
                        <div className="flex gap-4">
                            <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><Twitter className="w-4 h-4" /></a>
                            <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><Linkedin className="w-4 h-4" /></a>
                            <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><Instagram className="w-4 h-4" /></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
