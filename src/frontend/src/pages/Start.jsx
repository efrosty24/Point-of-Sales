import { useState, useEffect, useRef } from "react";
import "./Start.css";
import api from "../utils/api.js";

function Start() {
    const [hovered, setHovered] = useState("customer");
    const [saleEvents, setSaleEvents] = useState([]);
    const [discountedProducts, setDiscountedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isSlideAnimating, setIsSlideAnimating] = useState(false);
    const [maxDiscount, setMaxDiscount] = useState(0);
    const productsRef = useRef(null);

    useEffect(() => {
        fetchSaleData();
    }, []);

    const fetchSaleData = async () => {
        try {
            const res = await api('/user/start/active');
            const data = res.data;
            const products = data.discountedProducts || [];
            const events = data.saleEvents || [];

            setSaleEvents(events);
            setDiscountedProducts(products);

            
            const maxDiscountValue = products.reduce((max, product) => {
                if (product.DiscountType === 'percentage') {
                    return Math.max(max, parseFloat(product.DiscountValue));
                }
                return max;
            }, 0);
            setMaxDiscount(maxDiscountValue);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching sale data:', error);
            setLoading(false);
        }
    };

    
    const generateHeroSlides = () => {
        const slides = [];

        
        slides.push({
            id: 'grocery-general',
            category: "FRESH DAILY",
            title: "Premium Groceries Delivered",
            subtitle: "Farm-fresh produce, quality meats, and everyday essentials at your doorstep",
            cta: "Start Shopping",
            bgGradient: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
            overlay: "rgba(0, 0, 0, 0.3)",
            features: [
                { icon: "leaf", text: "Fresh Daily" },
                { icon: "truck", text: "Fast Delivery" },
                { icon: "quality", text: "Top Quality" }
            ],
            decorativeElements: true,
            eventId: "all"
        });

        
        if (maxDiscount >= 20) {
            slides.push({
                id: 'mega-deals',
                category: "LIMITED TIME",
                title: `Save Up To ${Math.round(maxDiscount)}% Off`,
                subtitle: `${discountedProducts.length} incredible deals on premium products. Don't miss out!`,
                cta: "See All Deals",
                bgGradient: "linear-gradient(135deg, #dc2626 0%, #f59e0b 50%, #fbbf24 100%)",
                overlay: "rgba(0, 0, 0, 0.25)",
                features: [
                    { icon: "percent", text: `Up to ${Math.round(maxDiscount)}% Off` },
                    { icon: "clock", text: "Limited Time" },
                    { icon: "star", text: `${discountedProducts.length}+ Items` }
                ],
                decorativeElements: true,
                eventId: "all"
            });
        }

        
        saleEvents.forEach((event, index) => {
            const eventProducts = discountedProducts.filter(p => p.SaleEventID === event.SaleEventID);

            if (eventProducts.length > 0) {
                
                const percentageDiscounts = eventProducts.filter(p => p.DiscountType === 'percentage');
                const avgDiscount = percentageDiscounts.length > 0
                    ? percentageDiscounts.reduce((sum, product) => sum + parseFloat(product.DiscountValue), 0) / percentageDiscounts.length
                    : 0;

                
                const startDate = new Date(event.StartDate);
                const endDate = new Date(event.EndDate);
                const now = new Date();
                const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

                
                const gradients = [
                    "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)", 
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)", 
                    "linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f472b6 100%)", 
                    "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)", 
                ];

                slides.push({
                    id: `event-${event.SaleEventID}`,
                    category: daysLeft > 0 ? `${daysLeft} DAYS LEFT` : "ENDING SOON",
                    title: event.Name,
                    subtitle: event.Description || `Special deals on ${eventProducts.length} premium products. Limited time only!`,
                    cta: "View Event Deals",
                    bgGradient: gradients[index % gradients.length],
                    overlay: "rgba(0, 0, 0, 0.3)",
                    features: [
                        { icon: "star", text: `${eventProducts.length} Products` },
                        { icon: "percent", text: avgDiscount > 0 ? `Avg ${Math.round(avgDiscount)}% Off` : "Special Deals" },
                        { icon: "clock", text: daysLeft > 0 ? `${daysLeft} Days` : "Last Chance" }
                    ],
                    decorativeElements: true,
                    eventId: event.SaleEventID.toString()
                });
            }
        });

        
        const bogoProducts = discountedProducts.filter(p => p.DiscountType === 'bogo');
        if (bogoProducts.length > 0) {
            slides.push({
                id: 'bogo-deals',
                category: "BUY ONE GET ONE",
                title: "BOGO Bonanza",
                subtitle: `${bogoProducts.length} amazing buy-one-get-one-free deals on your favorites`,
                cta: "Look at BOGO's",
                bgGradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)",
                overlay: "rgba(0, 0, 0, 0.3)",
                features: [
                    { icon: "star", text: "2 for Price of 1" },
                    { icon: "guarantee", text: `${bogoProducts.length} Items` },
                    { icon: "heart", text: "Customer Favorites" }
                ],
                decorativeElements: true,
                eventId: "all"
            });
        }

        return slides;
    };

    const heroSlides = generateHeroSlides();

    
    useEffect(() => {
        if (heroSlides.length > 0) {
            const slideInterval = setInterval(() => {
                if (!isSlideAnimating) {
                    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
                }
            }, 6000);

            return () => clearInterval(slideInterval);
        }
    }, [heroSlides.length, isSlideAnimating]);

    const handleEventClick = (eventId) => {
        setActiveCategory(eventId);
        if (productsRef.current) {
            productsRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const handleSlideClick = (eventId) => {
        setActiveCategory(eventId);
        if (productsRef.current) {
            productsRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    const getFeatureIcon = (iconName) => {
        const icons = {
            leaf: <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C12.8 22 13.5 21.4 13.5 20.6V19.5C13.5 18.7 12.8 18 12 18C8.7 18 6 15.3 6 12C6 8.7 8.7 6 12 6C15.3 6 18 8.7 18 12V13.5C18 14.3 17.3 15 16.5 15C15.7 15 15 14.3 15 13.5V12C15 10.3 13.7 9 12 9C10.3 9 9 10.3 9 12C9 13.7 10.3 15 12 15C12.8 15 13.5 14.6 14 14C14.3 14.6 15 15 15.7 15C17 15 18 14 18 12.7V12C18 6.5 13.5 2 12 2Z" fill="currentColor"/></svg>,
            truck: <svg viewBox="0 0 24 24" fill="none"><path d="M13 16H21V6C21 4.9 20.1 4 19 4H13V16ZM3 9H11V16H3V9ZM7 18C7 19.1 7.9 20 9 20C10.1 20 11 19.1 11 18H13C13 19.1 13.9 20 15 20C16.1 20 17 19.1 17 18H21V18C21 16.9 20.1 16 19 16H13H11H3C1.9 16 1 16.9 1 18V20H3V18Z" fill="currentColor"/></svg>,
            guarantee: <svg viewBox="0 0 24 24" fill="none"><path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="currentColor"/></svg>,
            percent: <svg viewBox="0 0 24 24" fill="none"><path d="M7.5 4C5.57 4 4 5.57 4 7.5C4 9.43 5.57 11 7.5 11C9.43 11 11 9.43 11 7.5C11 5.57 9.43 4 7.5 4ZM16.5 13C14.57 13 13 14.57 13 16.5C13 18.43 14.57 20 16.5 20C18.43 20 20 18.43 20 16.5C20 14.57 18.43 13 16.5 13ZM19.07 4.93L4.93 19.07L6.34 20.48L20.48 6.34L19.07 4.93Z" fill="currentColor"/></svg>,
            clock: <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM16.2 16.2L11 13V7H12.5V12.2L17 14.9L16.2 16.2Z" fill="currentColor"/></svg>,
            star: <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>,
            quality: <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2ZM12 20C8.13 20 5 16.87 5 13H7C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13H19C19 16.87 15.87 20 12 20Z" fill="currentColor"/></svg>,
            heart: <svg viewBox="0 0 24 24" fill="none"><path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor"/></svg>
        };
        return icons[iconName] || icons.star;
    };

    const calculateDiscountedPrice = (product) => {
        const originalPrice = parseFloat(product.Price);
        const discountValue = parseFloat(product.DiscountValue);
        if (product.DiscountType === 'percentage') {
            return (originalPrice * (1 - discountValue / 100)).toFixed(2);
        } else if (product.DiscountType === 'fixed') {
            return (originalPrice - discountValue).toFixed(2);
        } else if (product.DiscountType === 'bogo') {
            return originalPrice.toFixed(2);
        }
        return originalPrice.toFixed(2);
    };

    const getDiscountLabel = (product) => {
        const discountValue = parseFloat(product.DiscountValue);
        if (product.DiscountType === 'percentage') {
            return `${discountValue}%`;
        } else if (product.DiscountType === 'fixed') {
            return `$${discountValue}`;
        } else if (product.DiscountType === 'bogo') {
            return 'BOGO';
        }
        return '';
    };

    const getSavingsAmount = (product) => {
        const originalPrice = parseFloat(product.Price);
        const discountedPrice = parseFloat(calculateDiscountedPrice(product));
        if (product.DiscountType === 'bogo') {
            return 'Buy 1 Get 1';
        }
        const savings = (originalPrice - discountedPrice).toFixed(2);
        const savingsPercent = ((savings / originalPrice) * 100).toFixed(0);
        return `Save ${savingsPercent}%`;
    };

    const filteredProducts = activeCategory === "all"
        ? discountedProducts
        : discountedProducts.filter(p => p.SaleEventID.toString() === activeCategory);

    return (
        <div className="grocery-app">
            <div className="animated-bg">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <header className="glass-nav">
                <div className="nav-content">
                    <div className="logo-section">
                        <span className="logo-text">Grocery7</span>
                    </div>
                    <nav className="nav-links">
                        <a href="#deals" className="nav-link">Deals</a>
                        <a href="#events" className="nav-link">Events</a>
                        <a href="#contact" className="nav-link">Contact</a>
                    </nav>
                </div>
            </header>

            {}
            {!loading && heroSlides.length > 0 && (
                <section className="hero-slideshow-premium"
                         onMouseEnter={() => setIsSlideAnimating(true)}
                         onMouseLeave={() => setIsSlideAnimating(false)}
                >
                    <div className="slideshow-wrapper">
                        {heroSlides.map((slide, index) => (
                            <div
                                key={slide.id}
                                className={`hero-slide-premium ${index === currentSlide ? 'active' : ''} ${index === currentSlide - 1 || (currentSlide === 0 && index === heroSlides.length - 1) ? 'prev' : ''} ${index === currentSlide + 1 || (currentSlide === heroSlides.length - 1 && index === 0) ? 'next' : ''}`}
                                style={{ background: slide.bgGradient }}
                            >
                                <div className="slide-overlay" style={{ background: slide.overlay }}></div>

                                <div className="bg-pattern-container">
                                    <div className="pattern-circle pattern-1"></div>
                                    <div className="pattern-circle pattern-2"></div>
                                    <div className="pattern-circle pattern-3"></div>
                                    <div className="pattern-dots-overlay"></div>
                                </div>

                                <div className="hero-content-premium">
                                    <div className="content-wrapper">
                                        <div className="category-badge">
                                            <span className="badge-dot"></span>
                                            {slide.category}
                                        </div>

                                        <h1 className="hero-title-premium">
                                            {slide.title}
                                        </h1>

                                        <p className="hero-subtitle-premium">
                                            {slide.subtitle}
                                        </p>

                                        <div className="features-grid">
                                            {slide.features.map((feature, idx) => (
                                                <div key={idx} className="feature-item-hero">
                                                    <div className="feature-icon-wrapper">
                                                        {getFeatureIcon(feature.icon)}
                                                    </div>
                                                    <span>{feature.text}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button className="hero-cta-premium" onClick={() => handleSlideClick(slide.eventId)}>
                                            <span>{slide.cta}</span>
                                            <svg className="cta-arrow-premium" viewBox="0 0 24 24" fill="none">
                                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {slide.decorativeElements && (
                                    <div className="floating-elements">
                                        <div className="float-elem float-1">
                                            <svg viewBox="0 0 24 24" fill="white">
                                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                                            </svg>
                                        </div>
                                        <div className="float-elem float-2">
                                            <svg viewBox="0 0 24 24" fill="white">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                            </svg>
                                        </div>
                                        <div className="float-elem float-3">
                                            <svg viewBox="0 0 24 24" fill="white">
                                                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"/>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button className="slide-nav prev-slide" onClick={prevSlide} aria-label="Previous slide">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <button className="slide-nav next-slide" onClick={nextSlide} aria-label="Next slide">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>

                    <div className="slide-indicators-premium">
                        {heroSlides.map((slide, index) => (
                            <button
                                key={index}
                                className={`indicator-premium ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            >
                                <span className="indicator-progress"></span>
                            </button>
                        ))}
                    </div>

                    <div className="slide-counter">
                        <span className="current-slide">{String(currentSlide + 1).padStart(2, '0')}</span>
                        <span className="slide-divider">/</span>
                        <span className="total-slides">{String(heroSlides.length).padStart(2, '0')}</span>
                    </div>
                </section>
            )}

            {}
            <section className="login-section">
                <div className="login-container">
                    <div className="login-header">
                        <h1 className="welcome-title">Welcome Back</h1>
                        <p className="welcome-subtitle">Login to begin a smooth and effortless shopping journey.</p>
                    </div>

                    <div className="split-screen-login">
                        <div
                            className={`login-side customer-side ${hovered === "customer" ? "active" : ""} ${hovered === "employee" ? "inactive" : ""}`}
                            onMouseEnter={() => setHovered("customer")}
                            onMouseLeave={() => setHovered("customer")}
                            onClick={() => (window.location.href = "/custLogin")}
                        >
                            <div className="side-background">
                                <div className="pattern-dots"></div>
                            </div>
                            <div className="side-content">
                                <div className="icon-container">
                                    <svg className="login-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21M16.5 7.5C16.5 9.98528 14.4853 12 12 12C9.51472 12 7.5 9.98528 7.5 7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="text-content">
                                    <h2 className="side-title">Shop With Us</h2>
                                    <p className="side-description">Discover fresh products and unbeatable deals at your fingertips</p>
                                    <div className="features-list">
                                        <div className="feature-item">
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>Fresh Groceries</span>
                                        </div>
                                        <div className="feature-item">
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>Daily deals</span>
                                        </div>
                                        <div className="feature-item">
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>Quick checkout</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="enter-button">
                                    <span>Start Shopping</span>
                                    <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="center-divider">
                            <div className="divider-line"></div>
                            <div className="divider-circle">
                                <span className="divider-text">OR</span>
                            </div>
                        </div>

                        <div
                            className={`login-side employee-side ${hovered === "employee" ? "active" : ""} ${hovered === "customer" ? "inactive" : ""}`}
                            onMouseEnter={() => setHovered("employee")}
                            onMouseLeave={() => setHovered("customer")}
                            onClick={() => (window.location.href = "/empLogin")}
                        >
                            <div className="side-background">
                                <div className="pattern-dots"></div>
                            </div>
                            <div className="side-content">
                                <div className="icon-container">
                                    <svg className="login-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 7H21M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M3 7L5 5M21 7L19 5M9 11H15M8 3H16M10 15H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <div className="text-content">
                                    <h2 className="side-title">Team Access</h2>
                                    <p className="side-description">Manage operations and serve customers efficiently</p>
                                    <div className="features-list">
                                        <div className="feature-item">
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>POS system</span>
                                        </div>
                                        <div className="feature-item">
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>Inventory tools</span>
                                        </div>
                                        <div className="feature-item">
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>Sales analytics</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="enter-button">
                                    <span>Team Sign In</span>
                                    <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {}
            <section className="stats-banner">
                <div className="stats-container">
                    <div className="stat-card glass-card">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="stat-number">{discountedProducts.length}+</div>
                        <div className="stat-label">Active Deals</div>
                    </div>
                    <div className="stat-card glass-card">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M18 8H19C20.1046 8 21 8.89543 21 10V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V10C3 8.89543 3.89543 8 5 8H6M8 12H16M10 8V4M14 8V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="stat-number">{saleEvents.length}</div>
                        <div className="stat-label">Sale Events</div>
                    </div>
                    <div className="stat-card glass-card">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="stat-number">{maxDiscount > 0 ? Math.round(maxDiscount) : 60}%</div>
                        <div className="stat-label">Max Savings</div>
                    </div>
                </div>
            </section>

            {}
            {!loading && (
                <section className="events-section" id="events">
                    <div className="section-header">
                        <h2 className="modern-title">
                            <span className="title-accent">Active</span> Promotions
                        </h2>
                        <p className="section-description">Scroll to explore limited time offers</p>
                    </div>

                    <div className="events-scroll-container">
                        <div className="events-horizontal-grid">
                            <div
                                className={`event-card-horizontal ${activeCategory === "all" ? 'active-event' : ''}`}
                                onClick={() => handleEventClick("all")}
                            >
                                <div className="event-icon-wrapper">
                                    <svg className="event-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M1 10H23M1 14H23" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <div className="event-info">
                                    <h3>All Deals</h3>
                                    <p className="event-count">{discountedProducts.length} items on sale</p>
                                </div>
                                <svg className="arrow-right" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>

                            {saleEvents.map((event) => (
                                <div
                                    key={event.SaleEventID}
                                    className={`event-card-horizontal ${activeCategory === event.SaleEventID.toString() ? 'active-event' : ''}`}
                                    onClick={() => handleEventClick(event.SaleEventID.toString())}
                                >
                                    <div className="event-icon-wrapper">
                                        <svg className="event-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 8V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V8M3 10C3 8.89543 3.89543 8 5 8H19C20.1046 8 21 8.89543 21 10V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="event-info">
                                        <h3>{event.Name}</h3>
                                        <p className="event-dates-compact">
                                            {new Date(event.StartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.EndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <svg className="arrow-right" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {}
            {loading ? (
                <section className="loading-section">
                    <div className="modern-loader">
                        <div className="loader-ring"></div>
                        <div className="loader-text">Loading deals...</div>
                    </div>
                </section>
            ) : (
                <section className="products-section-modern" id="deals" ref={productsRef}>
                    <div className="products-header">
                        <h3 className="products-title">
                            {activeCategory === "all"
                                ? "All Discounted Products"
                                : saleEvents.find(e => e.SaleEventID.toString() === activeCategory)?.Name || "Products"}
                        </h3>
                        <span className="products-count">{filteredProducts.length} items</span>
                    </div>

                    <div className="products-grid-ultra">
                        {filteredProducts.map((product) => (
                            <div key={product.ProductID} className="product-card-ultra">
                                <div className={`discount-badge-ultra ${product.DiscountType}`}>
                                    {getDiscountLabel(product)}
                                </div>
                                <div className="product-img-wrapper">
                                    {product.ImgPath && (
                                        <img
                                            src={product.ImgPath}
                                            alt={product.Name}
                                            className="product-image"
                                            onError={(e) => {
                                                const placeholder = e.target.parentElement.querySelector('.product-placeholder-ultra');
                                                if (placeholder) placeholder.style.display = 'flex';
                                            }}
                                        />
                                    )}

                                    <div className="product-placeholder-ultra" style={{ display: product.ImgPath ? 'none' : 'flex' }}>
                                        <svg className="placeholder-svg" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.1 15.9 4.5 17 5.4 17H17M17 17C15.9 17 15 17.9 15 19C15 20.1 15.9 21 17 21C18.1 21 19 20.1 19 19C19 17.9 18.1 17 17 17ZM9 19C9 20.1 8.1 21 7 21C5.9 21 5 20.1 5 19C5 17.9 5.9 17 7 17C8.1 17 9 17.9 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>

                                <div className="product-details-ultra">
                                    {product.Brand && <span className="brand-tag-ultra">{product.Brand}</span>}
                                    <h4 className="product-name-ultra">{product.Name}</h4>
                                    <p className="product-quantity-ultra">{product.QuantityValue} {product.QuantityUnit}</p>
                                    <div className="price-container-ultra">
                                        {product.DiscountType !== 'bogo' ? (
                                            <>
                                                <span className="price-original-ultra">${product.Price}</span>
                                                <span className="price-sale-ultra">${calculateDiscountedPrice(product)}</span>
                                            </>
                                        ) : (
                                            <span className="price-sale-ultra">${product.Price}</span>
                                        )}
                                    </div>
                                    <div className="savings-badge-ultra">
                                        {getSavingsAmount(product)}
                                    </div>
                                    <div className="stock-status-ultra">
                                        <span className={`stock-dot-ultra ${product.Stock > 0 ? 'in-stock' : 'out'}`}></span>
                                        <span>{product.Stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <footer className="modern-footer" id="contact">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Store Hours</h4>
                        <p>Mon-Sat: 7AM - 10PM</p>
                        <p>Sunday: 8AM - 9PM</p>
                    </div>
                    <div className="footer-section">
                        <h4>Location</h4>
                        <p>123 Main Street</p>
                        <p>Houston, TX 77004</p>
                    </div>
                    <div className="footer-section">
                        <h4>Contact</h4>
                        <p>(713) 555-0100</p>
                        <p>info@Grocery7.com</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Start;
