// Floating AI Tutor Chat - Always accessible chat button for CAT prep assistance
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Lightbulb,
  BookOpen,
  Calculator,
  ChevronDown,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { catApi } from "@/api/cat";
import type { AskDoubtPayload, AskDoubtResponse } from "@/types/cat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  examples?: { problem: string; solution: string }[];
  tips?: string[];
  relatedConcepts?: string[];
  formulas?: string[];
}

const SUBJECT_OPTIONS = [
  { value: "quant", label: "Quantitative", icon: Calculator },
  { value: "varc", label: "Verbal", icon: BookOpen },
  { value: "dilr", label: "DILR", icon: Lightbulb },
] as const;

export default function FloatingAITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<
    "quant" | "varc" | "dilr"
  >("quant");
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch usage limits
  const { data: limits } = useQuery({
    queryKey: ["tutor-limit"],
    queryFn: () => catApi.getTutorLimit(),
    staleTime: 60 * 1000,
    enabled: isOpen,
  });

  // Ask doubt mutation
  const askDoubtMutation = useMutation({
    mutationFn: (payload: AskDoubtPayload) => catApi.askDoubt(payload),
    onSuccess: (response: AskDoubtResponse) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        examples: response.examples,
        tips: response.tips,
        relatedConcepts: response.related_concepts,
        formulas: response.formula_used,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      queryClient.invalidateQueries({ queryKey: ["tutor-limit"] });
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || askDoubtMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Get context from previous messages if this is a follow-up
    const previousMessages = messages.slice(-4);
    const context =
      previousMessages.length > 0
        ? previousMessages.map((m) => `${m.role}: ${m.content}`).join("\n")
        : undefined;

    askDoubtMutation.mutate({
      question: input.trim(),
      subject_code: selectedSubject,
      context,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const remainingQuestions = limits ? limits.remaining : null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full",
              "bg-gradient-to-r from-violet-500 to-purple-600",
              "text-white shadow-lg shadow-violet-500/30",
              "flex items-center justify-center",
              "hover:shadow-xl hover:shadow-violet-500/40 transition-shadow",
            )}
          >
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-[400px] h-[600px] max-h-[80vh]",
              "bg-background/95 backdrop-blur-xl",
              "border border-border/50 rounded-2xl",
              "shadow-2xl shadow-black/20",
              "flex flex-col overflow-hidden",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Tutor</h3>
                  <p className="text-xs text-muted-foreground">
                    Ask me anything about CAT!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {remainingQuestions !== null && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        {remainingQuestions} left
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Daily questions remaining</TooltipContent>
                  </Tooltip>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={clearChat}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Subject Selector */}
            <div className="px-4 py-2 border-b border-border/50">
              <button
                onClick={() => setShowSubjectSelector(!showSubjectSelector)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Subject:</span>
                <Badge variant="secondary" className="font-normal">
                  {
                    SUBJECT_OPTIONS.find((s) => s.value === selectedSubject)
                      ?.label
                  }
                </Badge>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showSubjectSelector && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence>
                {showSubjectSelector && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex gap-2 mt-2 overflow-hidden"
                  >
                    {SUBJECT_OPTIONS.map((subject) => {
                      const Icon = subject.icon;
                      return (
                        <button
                          key={subject.value}
                          onClick={() => {
                            setSelectedSubject(subject.value);
                            setShowSubjectSelector(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                            selectedSubject === subject.value
                              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                              : "bg-muted/50 hover:bg-muted",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {subject.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h4 className="font-medium mb-2">How can I help you?</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Ask me about concepts, solve doubts, or get explanations for
                    any CAT topic.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Explain permutations vs combinations",
                      "How to solve RC passages faster?",
                      "Time & Work shortcuts",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="text-xs px-3 py-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "flex-row-reverse",
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          message.role === "assistant"
                            ? "bg-gradient-to-r from-violet-500 to-purple-600"
                            : "bg-muted",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4 text-white" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 shadow-md",
                          message.role === "assistant"
                            ? "bg-muted/50 rounded-tl-sm"
                            : "bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-foreground rounded-tr-sm",
                        )}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded-lg">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="mb-2 last:mb-0" {...props} />
                              ),
                              h1: ({ node, ...props }) => (
                                <h1
                                  className="text-lg font-bold mb-2 mt-4"
                                  {...props}
                                />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2
                                  className="text-base font-bold mb-2 mt-3"
                                  {...props}
                                />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3
                                  className="text-sm font-bold mb-1 mt-2"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc list-inside mb-2"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal list-inside mb-2"
                                  {...props}
                                />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="mb-0.5" {...props} />
                              ),
                              code: ({ node, ...props }) => (
                                <code
                                  className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Tips */}
                        {message.tips && message.tips.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium text-violet-400 mb-2 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" /> Tips
                            </p>
                            <ul className="text-xs space-y-1 text-muted-foreground list-none">
                              {message.tips.slice(0, 3).map((tip, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-violet-500">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Formulas */}
                        {message.formulas && message.formulas.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1">
                              <Calculator className="h-3 w-3" /> Formulas
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.formulas.map((formula, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs font-mono bg-background/50"
                                >
                                  {formula}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {askDoubtMutation.isPending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50 bg-muted/30">
              {remainingQuestions !== null && remainingQuestions <= 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>Daily limit reached. Resets at midnight.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    className="flex-1 bg-background/80"
                    disabled={askDoubtMutation.isPending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || askDoubtMutation.isPending}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  >
                    {askDoubtMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
