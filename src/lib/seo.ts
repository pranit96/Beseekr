// SEO utility for updating page meta tags dynamically
// This is a lightweight alternative to react-helmet for SPAs

interface SEOOptions {
    title: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product';
    twitterCard?: 'summary' | 'summary_large_image';
    noindex?: boolean;
}

const BASE_URL = 'https://beseekr.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'beseekr';

/**
 * Update page meta tags for SEO
 * Call this in useEffect on page components
 */
export function updateSEO(options: SEOOptions): () => void {
    const {
        title,
        description,
        keywords,
        canonical,
        ogTitle,
        ogDescription,
        ogImage = DEFAULT_OG_IMAGE,
        ogType = 'website',
        twitterCard = 'summary_large_image',
        noindex = false,
    } = options;

    // Store original title to restore on unmount
    const originalTitle = document.title;

    // Update page title
    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    // Helper to update or create meta tag
    const setMetaTag = (name: string, content: string, property?: boolean) => {
        const attr = property ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attr, name);
            document.head.appendChild(meta);
        }

        meta.content = content;
    };

    // Update meta description
    if (description) {
        setMetaTag('description', description);
    }

    // Update keywords
    if (keywords) {
        setMetaTag('keywords', keywords);
    }

    // Update robots
    if (noindex) {
        setMetaTag('robots', 'noindex, nofollow');
    } else {
        setMetaTag('robots', 'index, follow');
    }

    // Update canonical URL
    if (canonical) {
        let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        link.href = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;
    }

    // Update Open Graph tags
    setMetaTag('og:title', ogTitle || title, true);
    setMetaTag('og:description', ogDescription || description || '', true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', SITE_NAME, true);
    if (canonical) {
        setMetaTag('og:url', canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`, true);
    }

    // Update Twitter tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', ogTitle || title);
    setMetaTag('twitter:description', ogDescription || description || '');
    setMetaTag('twitter:image', ogImage);

    // Return cleanup function
    return () => {
        document.title = originalTitle;
    };
}

/**
 * Pre-configured SEO settings for common pages
 */
export const PAGE_SEO = {
    problems: {
        title: 'Discover Startup Problems Worth Solving',
        description: 'Browse validated business problems discovered from Reddit, forums & communities. Find real pain points people are willing to pay to solve.',
        keywords: 'startup problems, business ideas, validated problems, market research, pain points, SaaS ideas',
        canonical: '/dashboard/problems',
    },
    pricing: {
        title: 'Pricing Plans - Affordable Market Research',
        description: 'Choose the perfect plan to discover validated startup problems. Free tier available. Premium plans from ₹299/month.',
        keywords: 'pricing, plans, subscription, market research pricing, startup tools',
        canonical: '/dashboard/pricing',
    },
    validate: {
        title: 'AI-Powered Idea Validation & Market Research',
        description: 'Validate your startup idea with AI-powered market research. Get comprehensive reports on market demand, competition, and pricing.',
        keywords: 'idea validation, market research, startup validation, AI research, competitive analysis',
        canonical: '/dashboard/validate',
    },
    search: {
        title: 'Search Startup Problems & Ideas',
        description: 'Search through thousands of validated startup problems. Find the perfect business idea matching your interests and skills.',
        keywords: 'search problems, find ideas, startup search, business opportunities',
        canonical: '/dashboard/search',
    },
    watchlist: {
        title: 'Your Saved Problems - Watchlist',
        description: 'Your curated list of saved startup problems. Track and monitor problems you want to explore further.',
        canonical: '/dashboard/watchlist',
        noindex: true, // User-specific content
    },
    contact: {
        title: 'Contact Us - Get in Touch',
        description: 'Have questions about beseekr? Contact our team. We typically respond within 24-48 hours.',
        keywords: 'contact, support, help, questions',
        canonical: '/contact',
    },
    privacy: {
        title: 'Privacy Policy',
        description: 'Learn how beseekr collects, uses, and protects your personal information. Your privacy matters to us.',
        canonical: '/privacy',
    },
    auth: {
        title: 'Sign In or Create Account',
        description: 'Sign in to beseekr to access premium features, save problems to your watchlist, and get AI-powered validation reports.',
        canonical: '/auth',
    },
};

export default updateSEO;
