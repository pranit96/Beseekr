import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  isRecording: boolean;
  stream?: MediaStream | null;
  className?: string;
  duration?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  stream,
  className,
  duration = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / (bufferLength / 1.5)) * 1.8;
        let x = 4;

        for (let i = 0; i < bufferLength; i += 2) {
          const rawHeight = (dataArray[i] / 255) * canvas.height;
          // Minimum bar height so it looks alive
          const barHeight = Math.max(rawHeight, 4);

          // Dynamic gradient based on loudness
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
          gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.7)");
          gradient.addColorStop(1, "rgba(236, 72, 153, 0.9)");

          ctx.fillStyle = gradient;
          const y = (canvas.height - barHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth - 3, barHeight, 3);
          ctx.fill();

          x += barWidth;
        }
      };

      draw();
    } catch (err) {
      console.warn("[AudioWaveform] Web Audio API visualizer fallback:", err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, stream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted/30 border border-border/40 backdrop-blur-md shadow-inner",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-mono font-medium text-rose-500">
          REC {formatDuration(duration)}
        </span>
      </div>

      <div className="flex-1 h-8 flex items-center justify-center">
        {stream ? (
          <canvas
            ref={canvasRef}
            width={240}
            height={32}
            className="w-full h-8"
          />
        ) : (
          <div className="flex items-center gap-1 h-6">
            {[40, 70, 95, 60, 85, 45, 90, 75, 55, 65, 80, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 90}ms`,
                  animationDuration: "800ms",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
