"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";

interface TacticalClothProps {
  id?: string;
  status?: string;
  moodColor?: string;
  videoSrc?: string;
  onMeshDisturbance?: (energy: number) => void;
}

export interface TacticalClothRef {
  applyForce: (x: number, y: number, radius: number, strength: number) => void;
  pet: () => void;
}

type ClothPoint = {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
};

type ClothConstraint = [ClothPoint, ClothPoint, number];

export const TacticalCloth = forwardRef<TacticalClothRef, TacticalClothProps>(
  (
    {
      id = "042",
      status = "AWAKE",
      moodColor = "#22c55e",
      videoSrc,
      onMeshDisturbance
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const points = useRef<ClothPoint[]>([]);
    const constraints = useRef<ClothConstraint[]>([]);
    const mouse = useRef({ x: 0, y: 0, px: 0, py: 0, down: false });

    useImperativeHandle(ref, () => ({
      applyForce: (x, y, radius, strength) => {
        let affected = 0;
        points.current.forEach((point) => {
          const dx = point.x - x;
          const dy = point.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            point.px = point.x - strength * (Math.random() - 0.5);
            point.py = point.y - strength;
            affected += 1;
          }
        });
        onMeshDisturbance?.(affected);
      },
      pet: () => {
        points.current.forEach((point) => {
          if (!point.pinned) {
            point.py -= 8;
            point.px += (Math.random() - 0.5) * 8;
          }
        });
        onMeshDisturbance?.(points.current.length * 0.18);
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        return;
      }

      const width = 194;
      const height = 228;
      canvas.width = width;
      canvas.height = height;

      const video = videoRef.current;
      video?.play().catch(() => undefined);

      const spacing = 7;
      const rows = 25;
      const cols = 22;
      const stiffness = 0.9;
      const gravity = 0.12;
      const friction = 0.99;

      const nextPoints: ClothPoint[] = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          nextPoints.push({
            x: col * spacing + (width - cols * spacing) / 2,
            y: row * spacing + 20,
            px: col * spacing + (width - cols * spacing) / 2,
            py: row * spacing + 20,
            pinned: row === 0
          });
        }
      }

      const nextConstraints: ClothConstraint[] = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const index = row * cols + col;
          if (col < cols - 1) {
            nextConstraints.push([nextPoints[index], nextPoints[index + 1], spacing]);
          }
          if (row < rows - 1) {
            nextConstraints.push([nextPoints[index], nextPoints[index + cols], spacing]);
          }
        }
      }

      points.current = nextPoints;
      constraints.current = nextConstraints;

      let animationFrameId = 0;

      const update = () => {
        points.current.forEach((point) => {
          if (!point.pinned) {
            const vx = (point.x - point.px) * friction;
            const vy = (point.y - point.py) * friction;
            point.px = point.x;
            point.py = point.y;
            point.x += vx;
            point.y += vy + gravity;
          }

          if (mouse.current.down) {
            const dx = point.x - mouse.current.x;
            const dy = point.y - mouse.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
              point.px = point.x - (mouse.current.x - mouse.current.px);
              point.py = point.y - (mouse.current.y - mouse.current.py);
            }
          }
        });

        for (let step = 0; step < 5; step += 1) {
          constraints.current.forEach(([p1, p2, targetDist]) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.0001);
            const diff = (targetDist - dist) / dist;
            const offsetX = dx * diff * 0.5 * stiffness;
            const offsetY = dy * diff * 0.5 * stiffness;

            if (!p1.pinned) {
              p1.x -= offsetX;
              p1.y -= offsetY;
            }
            if (!p2.pinned) {
              p2.x += offsetX;
              p2.y += offsetY;
            }
          });
        }
      };

      const draw = () => {
        ctx.clearRect(0, 0, width, height);

        if (video && video.readyState >= 2) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.filter = "grayscale(1) contrast(1.45) saturate(0.7)";
          ctx.drawImage(video, 0, 0, width, height);
          ctx.restore();
        }

        ctx.beginPath();
        ctx.strokeStyle = "rgba(34, 197, 94, 0.22)";
        ctx.lineWidth = 0.55;
        constraints.current.forEach(([a, b]) => {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        });
        ctx.stroke();

        ctx.fillStyle = "rgba(0, 255, 0, 0.03)";
        for (let scanline = 0; scanline < height; scanline += 4) {
          ctx.fillRect(0, scanline, width, 1);
        }

        ctx.fillStyle = "rgba(126, 245, 205, 0.10)";
        points.current.forEach((point, index) => {
          if (index % 9 === 0) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      };

      const loop = () => {
        update();
        draw();
        animationFrameId = window.requestAnimationFrame(loop);
      };

      loop();

      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    }, [onMeshDisturbance, videoSrc]);

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      mouse.current.px = mouse.current.x;
      mouse.current.py = mouse.current.y;
      mouse.current.x = clientX - rect.left;
      mouse.current.y = clientY - rect.top;
    };

    return (
      <div className="main flex flex-col items-center bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-fit group">
        <div className="face-col space-y-4">
          <div className="face-frame relative overflow-hidden rounded-lg border border-green-500/20 bg-green-950/5">
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              className="hidden-video"
            />
            <canvas
              ref={canvasRef}
              id="htc-video-canvas"
              className="relative z-10 cursor-crosshair touch-none"
              onPointerDown={(event) => {
                mouse.current.down = true;
                updatePointer(event.clientX, event.clientY);
              }}
              onPointerMove={(event) => {
                updatePointer(event.clientX, event.clientY);
              }}
              onPointerUp={() => {
                mouse.current.down = false;
              }}
              onPointerLeave={() => {
                mouse.current.down = false;
              }}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-green-500/10 to-transparent opacity-50 z-20" />
          </div>

          <div className="id-strip flex justify-between items-center font-mono text-[10px] tracking-tighter text-white/40 border-t border-white/5 pt-3">
            <span className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: moodColor, boxShadow: `0 0 8px ${moodColor}` }}
              />
              ID / {id}
            </span>
            <span className="uppercase tracking-widest text-green-500/60">
              STATUS / {status}
            </span>
          </div>

          <div className="mood flex items-center gap-3 font-mono text-[9px] text-white/20 uppercase tracking-[0.2em]">
            <span>Mood_Engine</span>
            <span
              className="mood-dot w-2 h-2 rounded-full"
              style={{ backgroundColor: moodColor, boxShadow: `0 0 8px ${moodColor}` }}
            />
            <span className="text-white/40">Mask Repair Mesh</span>
          </div>
        </div>
      </div>
    );
  }
);

TacticalCloth.displayName = "TacticalCloth";
