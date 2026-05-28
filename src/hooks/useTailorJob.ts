import { useCallback, useRef, useState } from "react";
import { resumeApi, type TailorRunRecord } from "@/api/resume";
import { subscribeTailorJob } from "@/services/resumeSocket";

const STAGE_STEP: Record<string, number> = {
  parsing: 0,
  cover_letter: 2,
  optimizing: 3,
  compiling: 4,
  scoring: 5,
  saving: 5,
  complete: 5,
};

const DEFAULT_STEPS = [
  "Reading your resume…",
  "Analyzing job requirements…",
  "Matching keywords & skill gaps…",
  "Applying XYZ bullet formulas…",
  "Scoring against ATS check…",
  "Compiling tailored PDF…",
];

export function useTailorJob() {
  const [processing, setProcessing] = useState(false);
  const [pct, setPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepMessage, setStepMessage] = useState("");
  const cleanupRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setProcessing(false);
  }, []);

  const run = useCallback(
    async (params: {
      file?: File | null;
      jd: string;
      mode?: "enhance" | "rewrite";
      resumeId?: string;
      generateCoverLetter?: boolean;
      companyName?: string;
      jobTitle?: string;
    }): Promise<TailorRunRecord> => {
      cleanupRef.current?.();
      setProcessing(true);
      setPct(5);
      setStepIdx(0);
      setStepMessage("Scheduling tailoring job in queue…");

      const { jobId } = await resumeApi.startTailorAlignJob(params);

      return new Promise((resolve, reject) => {
        cleanupRef.current = subscribeTailorJob(jobId, {
          onProgress: (data) => {
            if (data.progress !== undefined) setPct(Number(data.progress));
            if (data.message) setStepMessage(String(data.message));
            if (data.stage && STAGE_STEP[data.stage] !== undefined) {
              setStepIdx(STAGE_STEP[data.stage]);
            }
          },
          onComplete: (res) => {
            const record = res?.data as TailorRunRecord | undefined;
            if (!record) {
              reject(new Error("Tailoring completed but response was empty."));
              return;
            }
            setPct(100);
            setStepIdx(5);
            setStepMessage("Complete! Loading your results…");
            setTimeout(() => {
              setProcessing(false);
              resolve(record);
            }, 500);
          },
          onError: (err) => {
            setProcessing(false);
            reject(
              new Error(
                err?.message ||
                  err?.error ||
                  err?.details ||
                  "Tailoring failed.",
              ),
            );
          },
          onCancelled: () => {
            setProcessing(false);
            reject(new Error("Tailoring task was cancelled."));
          },
        });
      });
    },
    [],
  );

  return {
    processing,
    pct,
    stepIdx,
    stepMessage,
    steps: DEFAULT_STEPS,
    run,
    stop,
  };
}
