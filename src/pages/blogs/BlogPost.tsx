import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, Tag, Share2, BookOpen } from "lucide-react";
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

    const tags: string[] = Array.isArray(blog.tags) ? blog.tags as string[] : [];

    return (
        <div className="min-h-screen bg-black text-white">
            <ReadingProgress />

            {/* ── TOPBAR ─────────────────────────────────────── */}
            <header className="fixed top-0.5 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/5">
                <div className="mx-auto max-w-4xl px-4 sm:px-8 py-4 flex items-center justify-between">
                    <Link
                        to="/blogs"
                        className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        All articles
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={share}
                            className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/10"
                        >
                            <Share2 className="w-4 h-4" />
                            {copied ? "Copied!" : "Share"}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── HERO IMAGE ─────────────────────────────────── */}
            {(blog.image_url_full || blog.image_url) && (
                <div className="relative w-full" style={{ height: "min(55vh, 520px)", marginTop: 0 }}>
                    <img
                        src={blog.image_url_full || blog.image_url || ""}
                        alt={blog.image_alt || blog.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
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
            <main
                className="mx-auto max-w-[1000px] px-4 sm:px-8 pb-32"
                style={{ marginTop: (blog.image_url_full || blog.image_url) ? "-4rem" : "7rem" }}
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-12"
                >
                    {/* Topic + Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {blog.topic && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary">
                                <Tag className="w-3 h-3" /> {blog.topic}
                            </span>
                        )}
                        {tags.map((tag) => (
                            <span key={tag} className="text-xs text-white/30 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="text-6xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight mb-8">
                        {blog.title}
                    </h1>

                    {/* Excerpt */}
                    {blog.excerpt && (
                        <p className="text-xl text-white/50 leading-relaxed mb-8 border-l-2 border-primary/50 pl-5">
                            {blog.excerpt}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-white/30 border-t border-b border-white/5 py-5">
                        {blog.author && (
                            <span className="font-bold text-white/70">{blog.author}</span>
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

                {/* Body */}
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="
            prose prose-invert prose-lg max-w-none

            /* Headings */
            prose-headings:font-black prose-headings:tracking-tight
            prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-14 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4

            /* Body text */
            prose-p:text-white/75 prose-p:leading-[1.8] prose-p:text-lg

            /* Links */
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline

            /* Emphasis */
            prose-strong:text-white prose-strong:font-bold
            prose-em:text-white/60

            /* Lists */
            prose-li:text-white/75 prose-li:leading-[1.7] prose-li:mb-1
            prose-ul:my-6 prose-ol:my-6

            /* Code */
            prose-code:bg-white/5 prose-code:text-primary prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:p-6

            /* Blockquote */
            prose-blockquote:border-l-primary prose-blockquote:bg-white/3 prose-blockquote:rounded-r-2xl prose-blockquote:py-1 prose-blockquote:not-italic
            prose-blockquote:text-white/60

            /* Images */
            prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-10

            /* HR */
            prose-hr:border-white/10 prose-hr:my-12

            /* Tables */
            prose-table:text-sm
            prose-th:text-white/80 prose-th:font-bold prose-th:border-white/10
            prose-td:text-white/60 prose-td:border-white/5
          "
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {blog.body || "*No content available.*"}
                    </ReactMarkdown>
                </motion.article>

                {/* Footer CTA */}
                <div className="mt-24 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
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
            </main>
        </div>
    );
}
