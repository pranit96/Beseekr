import React, { useEffect, useState, useMemo, useRef } from "react";
import { useBlogTopics, useInfiniteBlogs } from "@/hooks/use-api-queries";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Clock, ArrowRight, Tag, Bookmark, Search, X } from "lucide-react";
import { type Blog, type Topic } from "@/api/blogs";

/* ─── helpers ─────────────────────────────────────────────── */
function fmt(d?: string) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FALLBACK =
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2670&auto=format&fit=crop";

/* ─── hero parallax ───────────────────────────────────────── */
function HeroSection({ blog }: { blog: Blog }) {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <motion.section
            ref={ref}
            className="relative overflow-hidden"
            style={{ height: "min(100svh, 800px)" }}
        >
            {/* Parallax image */}
            <motion.div className="absolute inset-0 z-0" style={{ y }}>
                <img
                    src={blog.image_url_full || blog.image_url || FALLBACK}
                    alt={blog.image_alt || blog.title}
                    className="w-full h-full object-cover scale-110"
                />
            </motion.div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

            {/* Content */}
            <motion.div
                style={{ opacity }}
                className="relative z-20 h-full flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-8 pb-14 md:pb-20"
            >
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Label */}
                    <div className="flex items-center gap-3 mb-5">
                        <span className="h-px w-8 bg-white/40" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {blog.topic || "Featured"}
                        </span>
                    </div>

                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight max-w-6xl mb-6 break-words"
                        style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}
                    >
                        {blog.title}
                    </h1>

                    {blog.excerpt && (
                        <p className="text-white/65 text-lg max-w-2xl leading-[1.7] mb-10" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                            {blog.excerpt}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-5">
                        <Link
                            to={`/blogs/${blog.slug}`}
                            className="group flex sm:inline-flex justify-center items-center gap-3 bg-white text-black font-bold px-7 py-3.5 rounded-full hover:bg-primary hover:text-white transition-all duration-300 hover:gap-4 w-full sm:w-auto text-center"
                        >
                            Read article
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Link>
                        <div className="flex items-center gap-5 text-white/55 text-sm">
                            {blog.read_time && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> {blog.read_time}
                                </span>
                            )}
                            {blog.publish_date && <span>{fmt(blog.publish_date)}</span>}
                            {blog.author && <span>by {blog.author}</span>}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.section>
    );
}

/* ─── blog card ───────────────────────────────────────────── */
function BlogCard({ blog, index = 0 }: { blog: Blog; index?: number }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl cursor-pointer w-full"
            style={{ minHeight: 400 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Link to={`/blogs/${blog.slug}`} className="block w-full h-full absolute inset-0">
                {/* Image */}
                <img
                    src={blog.image_url || FALLBACK}
                    alt={blog.image_alt || blog.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out"
                    style={{ transform: hovered ? "scale(1.08)" : "scale(1.0)" }}
                />

                {/* Gradient */}
                <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                        background: hovered
                            ? "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%)"
                            : "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.0) 100%)",
                    }}
                />

                {/* Bookmark icon */}
                <motion.div
                    animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-5 right-5 bg-white/10 backdrop-blur-md text-white p-2 rounded-xl"
                >
                    <Bookmark className="w-4 h-4" />
                </motion.div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                    {/* Topic */}
                    {blog.topic && (
                        <div className="flex items-center gap-2 mb-3">
                            <Tag className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                {blog.topic}
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <h3
                        className="font-bold text-white leading-[1.15] transition-all duration-400 text-xl md:text-2xl"
                        style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)", fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        {blog.title}
                    </h3>

                    {/* Excerpt */}
                    <AnimatePresence>
                        {hovered && blog.excerpt && (
                            <motion.p
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="text-white/70 text-sm leading-relaxed line-clamp-3 overflow-hidden"
                            >
                                {blog.excerpt}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Meta */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 text-white/50 text-xs font-medium">
                            {blog.read_time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {blog.read_time}
                                </span>
                            )}
                            {(blog.publish_date || blog.created_at) && (
                                <span>{fmt(blog.publish_date || blog.created_at)}</span>
                            )}
                        </div>
                        <motion.span
                            animate={{ x: hovered ? 0 : 6, opacity: hovered ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-1 text-white text-xs font-bold"
                        >
                            Read <ArrowRight className="w-3 h-3" />
                        </motion.span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

/* ─── main page ───────────────────────────────────────────── */
export default function BlogList() {
    const [selectedTopic, setSelectedTopic] = useState("All");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const LIMIT = 12;

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Query for Topics
    const { data: topics = [] } = useBlogTopics();

    // Infinite Query for Blogs
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error: queryError
    } = useInfiniteBlogs(selectedTopic === "All" ? undefined : selectedTopic, debouncedSearch, LIMIT);

    const blogs = useMemo(() => data ? data.pages.flatMap((page) => page.data) : [], [data]);
    const loading = status === "pending";
    const loadingMore = isFetchingNextPage;
    const error = queryError ? queryError.message : null;
    const hasMore = !!hasNextPage;

    // Hero shows on "All" tab with no search when articles exist
    const showHero = useMemo(() => blogs.length > 0 && selectedTopic === "All" && !debouncedSearch, [blogs.length, selectedTopic, debouncedSearch]);
    const heroBlog = useMemo(() => showHero ? blogs[0] : null, [showHero, blogs]);
    // Always show all articles in the grid, even if one is featured in the hero
    const gridBlogs = useMemo(() => {
        return blogs;
    }, [blogs]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                        <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin" />
                    </div>
                    <p className="text-white/40 text-sm tracking-widest uppercase font-medium">Loading</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
                <p className="text-white/30 text-6xl mb-4">:(</p>
                <h2 className="text-white text-2xl font-bold mb-2">Something went wrong</h2>
                <p className="text-white/50">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* ── NAVBAR ─────────────────────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50 mix-blend-normal">
                <div className="mx-auto max-w-7xl px-4 sm:px-8 py-5 flex items-center justify-between">
                    <Link to="/blogs" className="font-black text-xl tracking-tighter text-white">
                        beseekr<span className="text-primary">.</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <AnimatePresence>
                            {searchOpen && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 280, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                >
                                    <input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search articles…"
                                        className="w-full bg-white/10 backdrop-blur-lg text-white text-sm px-4 py-2 rounded-full border border-white/20 placeholder:text-white/40 outline-none focus:border-white/50 transition-colors"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={() => { setSearchOpen((s) => !s); if (searchOpen) setSearchQuery(""); }}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
                        >
                            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                        </button>
                        <a
                            href="/"
                            className="hidden sm:inline-flex text-sm font-semibold text-white/50 hover:text-white transition-colors"
                        >
                            ← App
                        </a>
                    </div>
                </div>
            </header>

            {/* ── HERO ───────────────────────────────────────── */}
            {heroBlog ? (
                <HeroSection blog={heroBlog} />
            ) : blogs.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center text-center"
                    style={{ minHeight: 400, paddingTop: 80, background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)" }}
                >
                    <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>beseekr blog</h1>
                    <p className="text-white/40 text-lg max-w-md" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>No articles published yet. Stay tuned!</p>
                </div>
            ) : null}

            {/* ── TOPIC FILTER ───────────────────────────────── */}
            {topics.length > 0 && (
                <div className={`relative z-40 bg-black/80 backdrop-blur-2xl border-b border-white/5 ${!heroBlog && blogs.length > 0 ? "pt-[80px]" : ""}`}>
                    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-4 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-2 w-max">
                            {["All", ...topics.map((t) => t.topic)].map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setSelectedTopic(topic)}
                                    className={`
                    relative px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex-shrink-0
                    ${selectedTopic === topic
                                            ? "bg-white text-black"
                                            : "text-white/40 hover:text-white hover:bg-white/10"
                                        }
                  `}
                                >
                                    {topic}
                                    {topic !== "All" && (
                                        <span className="ml-1.5 text-xs opacity-50">
                                            {topics.find((t) => t.topic === topic)?.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── GRID ───────────────────────────────────────── */}
            <main className="mx-auto max-w-7xl px-4 sm:px-8 py-16 pb-28">
                {blogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="text-8xl mb-6">📝</div>
                        <h2 className="text-3xl font-black text-white mb-3">No articles yet</h2>
                        <p className="text-white/40 text-lg">Check back soon for fresh content.</p>
                    </div>
                ) : gridBlogs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <p className="text-white/30 text-5xl mb-4">🔍</p>
                        <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
                        <p className="text-white/40">Try a different topic or search term</p>
                    </motion.div>
                ) : (
                    <>
                        <div className="flex items-baseline justify-between mb-10">
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">
                                {selectedTopic === "All" ? "Latest" : selectedTopic}
                            </h2>
                            <span className="text-white/20 text-sm">{gridBlogs.length} {gridBlogs.length === 1 ? 'article' : 'articles'}</span>
                        </div>

                        {/* Standard grid */}
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={selectedTopic + debouncedSearch + "grid"}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {gridBlogs.map((blog, i) => (
                                    <BlogCard
                                        key={blog.id}
                                        blog={blog}
                                        index={i % LIMIT}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="mt-14 flex justify-center">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={loadingMore}
                                    className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load more articles"
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
