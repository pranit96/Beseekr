import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JsonImportZone } from "./JsonImportZone";
import { useCreatePlan, useImportPlan } from "@/hooks/use-education";
import { ImportPlanPayload } from "@/types/education";
import { Sparkles, Loader2 } from "lucide-react";

interface CreatePlanFormProps {
  onSuccess: (planId: string) => void;
}

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const createPlanMutation = useCreatePlan();
  const importPlanMutation = useImportPlan();

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [dailyHours, setDailyHours] = useState([2]);
  const [examDate, setExamDate] = useState("");

  const handleGenerate = () => {
    if (!subject) return;

    createPlanMutation.mutate(
      {
        subject,
        title: title || `${subject} Master Plan`,
        daily_study_hours: dailyHours[0],
        exam_date: examDate || undefined,
      },
      {
        onSuccess: (res) => {
          if (res.data?.plan.id) {
            onSuccess(res.data.plan.id);
          }
        },
      },
    );
  };

  const handleImport = (data: ImportPlanPayload) => {
    importPlanMutation.mutate(data, {
      onSuccess: (res) => {
        if (res.data?.plan.id) {
          onSuccess(res.data.plan.id);
        }
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/5 backdrop-blur-xl border border-border/30 rounded-3xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Create Learning Plan
        </CardTitle>
        <CardDescription>
          Let AI generate a structured path for you, or import your own custom
          syllabus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ai">AI Generation</TabsTrigger>
            <TabsTrigger value="import">Import JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">What do you want to learn? *</Label>
              <Input
                id="subject"
                placeholder="e.g., System Design, React, Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Plan Title (Optional)</Label>
              <Input
                id="title"
                placeholder={
                  subject ? `${subject} Master Plan` : "My Learning Plan"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Daily Study Commitment</Label>
                <span className="text-sm font-medium text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">
                  {dailyHours[0]} {dailyHours[0] === 1 ? "hour" : "hours"}
                </span>
              </div>
              <Slider
                value={dailyHours}
                onValueChange={setDailyHours}
                min={0.5}
                max={8}
                step={0.5}
                className="py-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examDate">
                Target Completion Date (Optional)
              </Label>
              <Input
                id="examDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-background/50 text-muted-foreground"
              />
            </div>

            <Button
              className="w-full bg-teal-500 hover:bg-teal-600 text-white mt-4"
              size="lg"
              disabled={!subject || createPlanMutation.isPending}
              onClick={handleGenerate}
            >
              {createPlanMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="import">
            <JsonImportZone onValidImport={handleImport} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
