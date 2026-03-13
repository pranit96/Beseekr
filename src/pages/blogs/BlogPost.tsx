import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Tag, Share2, BookOpen, List, ChevronDown, Mail, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { getBlog, type Blog } from "@/api/blogs";

function fmt(d?: string) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function ReadingProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const scrolled = el.scrollTop;
            const total = el.scrollHeight - el.clientHeight;
            setProgress(total > 0 ? (scrolled / total) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-white/10">
            <motion.div
                className="h-full bg-primary origin-left"
                style={{ scaleX: progress / 100 }}
                transition={{ duration: 0 }}
            />
        </div>
    );
}

/* ─── TOC types & extraction ──────────────────────────────── */
interface TocItem {
    id: string;
    text: string;
    level: number;
}

function extractToc(markdown: string): TocItem[] {
    const lines = markdown.split('\n');
    const items: TocItem[] = [];
    let inCodeBlock = false;
    for (const line of lines) {
        if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
        if (inCodeBlock) continue;
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].replace(/[*_`~\[\]]/g, '').trim();
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            items.push({ id, text, level });
        }
    }
    return items;
}

/* ─── Table of Contents ───────────────────────────────────── */
function TableOfContents({ items }: { items: TocItem[] }) {
    const [activeId, setActiveId] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
        );
        items.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [items]);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setMobileOpen(false);
        }
    };

    if (items.length < 2) return null;

    return (
        <>
            {/* Desktop TOC — sticky sidebar */}
            <nav
                className="hidden xl:block sticky top-24 self-start w-56 flex-shrink-0"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                    <List className="w-3.5 h-3.5" /> Contents
                </p>
                <ul className="space-y-1 border-l border-white/8">
                    {items.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => scrollTo(item.id)}
                                className={`block w-full text-left text-sm leading-snug py-1.5 transition-all duration-200 border-l-2 -ml-px ${item.level === 3 ? 'pl-6' : 'pl-4'
                                    } ${activeId === item.id
                                        ? 'text-primary border-primary font-medium'
                                        : 'text-white/35 border-transparent hover:text-white/60 hover:border-white/20'
                                    }`}
                            >
                                {item.text}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Mobile TOC — collapsible */}
            <div className="xl:hidden mb-8" style={{ maxWidth: 780, margin: '0 auto 2rem', fontFamily: "'DM Sans', sans-serif" }}>
                <button
                    onClick={() => setMobileOpen(o => !o)}
                    className="flex items-center gap-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white/60 hover:text-white/80 hover:bg-white/8 transition-all"
                >
                    <List className="w-4 h-4" />
                    Table of Contents
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden mt-1 bg-white/5 border border-white/10 rounded-xl"
                        >
                            {items.map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollTo(item.id)}
                                        className={`block w-full text-left text-sm py-2.5 px-4 text-white/50 hover:text-white hover:bg-white/5 transition-colors ${item.level === 3 ? 'pl-8' : ''
                                            } ${activeId === item.id ? 'text-primary font-medium' : ''}`}
                                    >
                                        {item.text}
                                    </button>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

/* ─── Author Bio ──────────────────────────────────────────── */
function AuthorBio({ author, publishDate }: { author: string; publishDate?: string }) {
    const initial = author.charAt(0).toUpperCase();
    return (
        <div
            className="flex items-start gap-5 bg-white/[0.03] border border-white/8 rounded-2xl p-6 sm:p-8"
            style={{ maxWidth: 780, margin: '4rem auto', fontFamily: "'DM Sans', sans-serif" }}
        >
            <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{initial}</span>
            </div>
            <div>
                <p className="text-white font-semibold text-lg mb-1">{author}</p>
                <p className="text-white/40 text-sm leading-relaxed">
                    Writer at beseekr · Exploring ideas at the intersection of technology, business, and culture.
                    {publishDate && <> · Published {fmt(publishDate)}</>}
                </p>
            </div>
        </div>
    );
}

/* ─── Newsletter CTA ──────────────────────────────────────── */
function NewsletterCTA() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
            setEmail('');
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-2xl border border-white/8"
            style={{ maxWidth: 780, margin: '3rem auto', fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Subtle gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03]" />
            <div className="relative px-6 sm:px-10 py-10 sm:py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 mb-5">
                    <Mail className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Stay in the loop
                </h3>
                <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                    Get the latest articles, insights, and updates delivered straight to your inbox. No spam, unsubscribe anytime.
                </p>
                {submitted ? (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-primary font-semibold text-sm"
                    >
                        ✓ Thanks! You're on the list.
                    </motion.p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="flex-1 w-full bg-white/5 border border-white/15 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-colors"
                        />
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-primary text-black font-bold px-7 py-3 rounded-full hover:bg-primary/90 transition-colors text-sm flex-shrink-0"
                        >
                            Subscribe
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        getBlog(slug)
            .then((d) => { if (!cancelled) setBlog(d); })
            .catch((err) => { if (!cancelled) setError(err?.message || "Article not found"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [slug]);

    const share = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const tags: string[] = Array.isArray(blog?.tags) ? blog.tags as string[] : [];

    const tocItems = useMemo(
        () => blog?.body ? extractToc(blog.body) : [],
        [blog?.body]
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                    <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center gap-6">
                <p className="text-7xl">🔍</p>
                <h2 className="text-white text-2xl font-black">Article not found</h2>
                <p className="text-white/40">{error}</p>
                <button
                    onClick={() => navigate("/blogs")}
                    className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to blogs
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <ReadingProgress />

            {/* ── TOPBAR ─────────────────────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50">
                <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 py-4 flex items-center justify-between">
                <Link
                to="/blogs"
                className="group flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold"
                >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                All articles
                </Link>

                <div className="flex items-center gap-2">
                <button
                    onClick={share}
                    className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    {copied ? "Copied!" : "Share"}
                </button>
                </div>
            </div>
            </header>

            {/* ── HERO IMAGE ─────────────────────────────────── */}
            {(blog.image_url_full || blog.image_url) && (
                <div className="relative w-full" style={{ height: "min(70vh, 600px)", marginTop: 0 }}>
                    <img
                        src={blog.image_url_full || blog.image_url || ""}
                        alt={blog.image_alt || blog.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />
                    {blog.image_credit && (
                        <a
                            href={blog.image_credit_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-3 right-4 text-white/30 text-xs hover:text-white/60 transition-colors"
                        >
                            © {blog.image_credit}
                        </a>
                    )}
                </div>
            )}

            {/* ── ARTICLE CONTENT ────────────────────────────── */}
            <div
                className="mx-auto px-6 sm:px-10 lg:px-16 pb-16"
                style={{
                    maxWidth: 1200,
                    marginTop: (blog.image_url_full || blog.image_url) ? "-5rem" : "7rem",
                    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif"
                }}
            >
                {/* Header — full-width within container */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-14"
                >
                    {/* Topic + Tags */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {blog.topic && (
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                <Tag className="w-3.5 h-3.5" /> {blog.topic}
                            </span>
                        )}
                        {tags.map((tag) => (
                            <span key={tag} className="text-xs text-white/30 bg-white/5 border border-white/10 px-3 py-1 rounded-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Title — spans full container width */}
                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.1] tracking-tight mb-8"
                        style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}
                    >
                        {blog.title}
                    </h1>

                    {/* Excerpt */}
                    {blog.excerpt && (
                        <p
                            className="text-xl md:text-2xl text-white/50 leading-[1.6] mb-10 border-l-[3px] border-primary/50 pl-7 max-w-4xl"
                            style={{ fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
                        >
                            {blog.excerpt}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-white/35 border-t border-b border-white/8 py-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {blog.author && (
                            <span className="font-semibold text-white/70">{blog.author}</span>
                        )}
                        {blog.publish_date && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {fmt(blog.publish_date)}
                            </span>
                        )}
                        {blog.read_time && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> {blog.read_time}
                            </span>
                        )}
                        {blog.word_count && (
                            <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" /> {blog.word_count.toLocaleString()} words
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Two-column layout: TOC sidebar + article body */}
                <div className="flex gap-12 items-start">
                    {/* Body — centered readable column */}
                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="
                flex-1 min-w-0
                prose prose-invert prose-xl max-w-none

                /* Headings */
                prose-headings:tracking-tight
                prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4

                /* Body text */
                prose-p:text-white/80 prose-p:mb-7

                /* Links */
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline

                /* Emphasis */
                prose-strong:text-white prose-strong:font-semibold
                prose-em:text-white/65

                /* Lists */
                prose-li:text-white/80 prose-li:mb-2
                prose-ul:my-7 prose-ol:my-7

                /* Code */
                prose-code:bg-white/5 prose-code:text-primary prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:p-6

                /* Blockquote */
                prose-blockquote:border-l-primary prose-blockquote:bg-white/3 prose-blockquote:rounded-r-2xl prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:not-italic
                prose-blockquote:text-white/60

                /* Images */
                prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-12

                /* HR */
                prose-hr:border-white/10 prose-hr:my-14

                /* Tables */
                prose-table:text-sm
                prose-th:text-white/80 prose-th:font-bold prose-th:border-white/10
                prose-td:text-white/60 prose-td:border-white/5
              "
                        style={{
                            maxWidth: 780,
                            fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif",
                            fontSize: '1.2rem',
                            lineHeight: 1.9,
                            letterSpacing: '0.01em',
                        }}
                    >

                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                h1: ({ children }) => <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>{children}</h1>,
                                h2: ({ children }) => {
                                    const text = typeof children === 'string' ? children : '';
                                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                    return <h2 id={id} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, scrollMarginTop: '5rem' }}>{children}</h2>;
                                },
                                h3: ({ children }) => {
                                    const text = typeof children === 'string' ? children : '';
                                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                    return <h3 id={id} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, scrollMarginTop: '5rem' }}>{children}</h3>;
                                },
                                h4: ({ children }) => <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>{children}</h4>,
                                blockquote: ({ children }) => <blockquote style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: '1.15rem' }}>{children}</blockquote>,
                                p: ({ children }) => <p style={{ marginBottom: '1.6em' }}>{children}</p>,
                                img: ({ src, alt }) => (
                                    <span style={{ display: 'block', margin: '2.5rem 0', maxWidth: '100%' }}>
                                        <img src={src || ''} alt={alt || ''} style={{ width: '100%', borderRadius: '1rem' }} />
                                    </span>
                                ),
                            }}
                        >
                            {blog.body || "*No content available.*"}
                        </ReactMarkdown>
                    </motion.article>

                    {/* Desktop TOC sidebar */}
                    <TableOfContents items={tocItems} />
                </div>

                {/* ── AUTHOR BIO ───────────────────────────────── */}
                {blog.author && (
                    <AuthorBio author={blog.author} publishDate={blog.publish_date} />
                )}

                {/* ── NEWSLETTER CTA ───────────────────────────── */}
                <NewsletterCTA />

                {/* Footer CTA */}
                <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" style={{ maxWidth: 780, margin: '3rem auto 0' }}>
                    <div>
                        <p className="text-white/20 text-sm mb-1">More articles</p>
                        <Link
                            to="/blogs"
                            className="group flex items-center gap-2 text-white font-bold hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Back to all articles
                        </Link>
                    </div>
                    <button
                        onClick={share}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                        {copied ? "Link copied!" : "Share article"}
                    </button>
                </div>
            </div>
        </div>
    );
}
