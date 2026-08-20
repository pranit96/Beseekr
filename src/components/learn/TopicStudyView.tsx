import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Layers, Terminal, CheckSquare } from "lucide-react";
import { PlanTopic } from "@/types/education";
import { LearnTab } from "./LearnTab";
import { FlashcardsTab } from "./FlashcardsTab";
import { HandsOnTab } from "./HandsOnTab";
import { QuizTab } from "./QuizTab";
import { 
  useGeneratePrep, 
  useGenerateHandsOn, 
  useReviewFlashcard,
  useGenerateExam,
  useSubmitExam,
  useExam,
  useUpdateTopicStatus
} from "@/hooks/use-education";

interface TopicStudyViewProps {
  planId: string;
  topic: PlanTopic | null;
  onBack: () => void;
}

export function TopicStudyView({ planId, topic, onBack }: TopicStudyViewProps) {
  const generatePrepMutation = useGeneratePrep(planId);
  const generateHandsOnMutation = useGenerateHandsOn(planId);
  const reviewFlashcardMutation = useReviewFlashcard(planId);
  const generateExamMutation = useGenerateExam();
  
  // Find if there's an exam for this topic (assuming we store the exam ID somewhere or query it)
  // For simplicity, we assume we fetch the latest exam for this plan/topic
  // In a real app, you might want to fetch exams filtered by topic ID
  // Here we just use a placeholder mechanism or require the exam to be created first
  const [examId, setExamId] = React.useState<string | undefined>();
  const { data: examRes, isLoading: isExamLoading } = useExam(examId);
  const submitExamMutation = useSubmitExam(examId || "");
  const updateStatusMutation = useUpdateTopicStatus(planId);

  // Determine submission logic
  // A robust implementation would query submissions for this exam
  // Here we just use a basic state for the demo
  const [submission, setSubmission] = React.useState<any>(null);

  if (!topic) return null;

  const handleGeneratePrep = () => {
    generatePrepMutation.mutate(topic.id);
  };

  const handleGenerateHandsOn = () => {
    generateHandsOnMutation.mutate(topic.id);
  };

  const handleGenerateQuiz = () => {
    generateExamMutation.mutate({
      plan_id: planId,
      title: `${topic.topic_name} Quiz`,
      subject: topic.topic_name,
      type: "topic_test",
      topics: [topic.topic_name],
      question_count: 5
    }, {
      onSuccess: (res) => {
        if (res.data) setExamId(res.data.id);
      }
    });
  };

  const handleMarkComplete = () => {
    updateStatusMutation.mutate({ topicId: topic.id, status: "completed" });
    onBack();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{topic.topic_name}</h1>
            <p className="text-muted-foreground line-clamp-1 max-w-2xl text-sm mt-1">{topic.description}</p>
          </div>
        </div>
        
        {topic.status !== "completed" && (
          <Button 
            variant="outline" 
            className="border-teal-500/50 text-teal-500 hover:bg-teal-500/10"
            onClick={handleMarkComplete}
            disabled={updateStatusMutation.isPending}
          >
            Mark Complete
          </Button>
        )}
      </div>

      <Tabs defaultValue="learn" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8 bg-card/10 border border-border/30 p-1 rounded-2xl h-14">
          <TabsTrigger value="learn" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <BookOpen className="w-4 h-4 mr-2 hidden sm:block" /> Learn
          </TabsTrigger>
          <TabsTrigger value="cards" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <Layers className="w-4 h-4 mr-2 hidden sm:block" /> Cards
          </TabsTrigger>
          <TabsTrigger value="build" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <Terminal className="w-4 h-4 mr-2 hidden sm:block" /> Build
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-xl h-full data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
            <CheckSquare className="w-4 h-4 mr-2 hidden sm:block" /> Quiz
          </TabsTrigger>
        </TabsList>
        
        <div className="min-h-[500px]">
          <TabsContent value="learn" className="mt-0 outline-none">
            <LearnTab 
              content={topic.prep_summary} 
              isLoading={generatePrepMutation.isPending} 
              onGenerate={handleGeneratePrep} 
            />
          </TabsContent>
          
          <TabsContent value="cards" className="mt-0 outline-none">
            <FlashcardsTab 
              flashcards={topic.flashcards} 
              onRate={(index, rating) => reviewFlashcardMutation.mutate({ topicId: topic.id, questionIndex: index, rating })}
            />
          </TabsContent>
          
          <TabsContent value="build" className="mt-0 outline-none">
            <HandsOnTab 
              exercises={topic.hands_on_exercises}
              isLoading={generateHandsOnMutation.isPending}
              onGenerate={handleGenerateHandsOn}
            />
          </TabsContent>
          
          <TabsContent value="quiz" className="mt-0 outline-none">
            <QuizTab 
              exam={examRes?.data || null}
              submission={submission}
              isLoading={isExamLoading}
              isGenerating={generateExamMutation.isPending}
              isSubmitting={submitExamMutation.isPending}
              onGenerate={handleGenerateQuiz}
              onSubmit={(answers) => {
                submitExamMutation.mutate(answers, {
                  onSuccess: (res) => {
                    if (res.data) setSubmission(res.data);
                  }
                });
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
