"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  isActive: boolean;
  label?: string;
}

export function WaveformVisualizer({ isActive, label = "Zeph" }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const bars = 40;
    const barWidth = canvas.width / bars;

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = 0; i < bars; i++) {
        const height = isActive ? Math.random() * 30 + 4 : 2;
        const x = i * barWidth;
        const y = (canvas!.height - height) / 2;

        // Mars gradient: deep red → orange → amber
        const ratio = i / bars;
        const r = Math.round(180 + ratio * 60);
        const g = Math.round(50 + ratio * 100);
        const b = Math.round(10 + ratio * 5);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fillRect(x + 1, y, barWidth - 2, height);
      }
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive]);

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-orange-400/70 text-[10px] uppercase tracking-wider whitespace-nowrap">{label}</span>
      </div>
      <canvas ref={canvasRef} width={300} height={40} className="mx-3 h-10 w-[150px] sm:w-[300px]" />
      <div className="text-orange-400/30 text-[10px] font-mono">AUDIO</div>
    </div>
  );
}
