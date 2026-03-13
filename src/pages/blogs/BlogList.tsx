import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Clock, ArrowRight, Tag, Bookmark, Search, X } from "lucide-react";
import { getBlogs, getTopics, type Blog, type Topic } from "@/api/blogs";

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
            style={{ height: "min(90vh, 680px)" }}
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
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                            {blog.topic || "Featured"}
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight max-w-4xl mb-6">
                        {blog.title}
                    </h1>

                    {blog.excerpt && (
                        <p className="text-white/65 text-lg max-w-2xl leading-relaxed mb-10">
                            {blog.excerpt}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-5">
                        <Link
                            to={`/blogs/${blog.slug}`}
                            className="group inline-flex items-center gap-3 bg-white text-black font-bold px-7 py-3.5 rounded-full hover:bg-primary hover:text-white transition-all duration-300 hover:gap-4"
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
function BlogCard({ blog, big = false, index = 0 }: { blog: Blog; big?: boolean; index?: number }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-3xl cursor-pointer ${big ? "row-span-2" : ""}`}
            style={{ minHeight: big ? 520 : 360 }}
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
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                {blog.topic}
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <h3
                        className={`font-black text-white leading-tight transition-all duration-400 ${big ? "text-2xl md:text-3xl" : "text-xl"}`}
                        style={{ transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
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
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState("All");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const [blogsData, topicsData] = await Promise.allSettled([getBlogs(), getTopics()]);
                setBlogs(blogsData.status === "fulfilled" ? blogsData.value || [] : []);
                setTopics(topicsData.status === "fulfilled" ? topicsData.value || [] : []);
            } catch (err: any) {
                setError(err?.message || "Failed to load");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const heroBlog = useMemo(() => blogs[0] || null, [blogs]);

    const filteredBlogs = useMemo(() => {
        let list = blogs.slice(1);
        if (selectedTopic !== "All") list = list.filter((b) => b.topic === selectedTopic);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (b) =>
                    b.title.toLowerCase().includes(q) ||
                    (b.excerpt || "").toLowerCase().includes(q) ||
                    (b.topic || "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [blogs, selectedTopic, searchQuery]);

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
            ) : (
                <div
                    className="flex flex-col items-center justify-center text-center"
                    style={{ minHeight: 400, background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)" }}
                >
                    <h1 className="text-5xl font-black text-white mb-4">beseekr blog</h1>
                    <p className="text-white/40 text-lg max-w-md">No articles published yet. Stay tuned!</p>
                </div>
            )}

            {/* ── TOPIC FILTER ───────────────────────────────── */}
            {topics.length > 0 && (
                <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/5">
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
                ) : filteredBlogs.length === 0 ? (
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
                            <span className="text-white/20 text-sm">{filteredBlogs.length} articles</span>
                        </div>

                        {/* Wix masonry-style grid */}
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={selectedTopic + searchQuery}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-auto"
                            >
                                {filteredBlogs.map((blog, i) => (
                                    <BlogCard
                                        key={blog.id}
                                        blog={blog}
                                        big={i === 0 && filteredBlogs.length > 2}
                                        index={i}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}
            </main>
        </div>
    );
}
