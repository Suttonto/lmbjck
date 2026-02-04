import { useRef, useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LogPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: "log" | "golden" | "bomb";
  sliced: boolean;
  sliceAngle?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface SliceTrail {
  id: number;
  points: { x: number; y: number; time: number }[];
}

export function Game({ onGameEnd }: { onGameEnd: (score: number, logs: number, combo: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [logsSliced, setLogsSliced] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const logsRef = useRef<LogPiece[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const sliceTrailRef = useRef<SliceTrail | null>(null);
  const isSlicingRef = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number>();
  const spawnTimerRef = useRef<number>();
  const idCounterRef = useRef(0);
  const comboTimerRef = useRef<number>();
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const logsSlicedRef = useRef(0);
  const livesRef = useRef(3);

  const saveScore = useMutation(api.scores.saveScore);

  const spawnLog = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const side = Math.random() < 0.5 ? "left" : "right";
    const x = side === "left" ? -50 : canvas.width + 50;
    const targetX = canvas.width * (0.2 + Math.random() * 0.6);
    const y = canvas.height + 50;

    const angle = Math.atan2(-canvas.height * 0.7, targetX - x);
    const speed = 12 + Math.random() * 6;

    const rand = Math.random();
    let type: "log" | "golden" | "bomb" = "log";
    if (rand < 0.08) type = "bomb";
    else if (rand < 0.15) type = "golden";

    const log: LogPiece = {
      id: idCounterRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      type,
      sliced: false,
    };

    logsRef.current.push(log);
  }, []);

  const createParticles = useCallback((x: number, y: number, type: "log" | "golden" | "bomb") => {
    const colors = type === "bomb"
      ? ["#ff4444", "#ff6666", "#ffaa00", "#ff0000"]
      : type === "golden"
      ? ["#ffd700", "#ffec8b", "#daa520", "#f0e68c"]
      : ["#8b4513", "#a0522d", "#cd853f", "#d2691e", "#deb887"];

    for (let i = 0; i < (type === "bomb" ? 30 : 15); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesRef.current.push({
        id: idCounterRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 8,
      });
    }
  }, []);

  const checkSlice = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const logs = logsRef.current;

    for (const log of logs) {
      if (log.sliced) continue;

      const dx = log.x - x1;
      const dy = log.y - y1;
      const lineLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      if (lineLen === 0) continue;

      const t = Math.max(0, Math.min(1, ((log.x - x1) * (x2 - x1) + (log.y - y1) * (y2 - y1)) / (lineLen * lineLen)));
      const closestX = x1 + t * (x2 - x1);
      const closestY = y1 + t * (y2 - y1);

      const distance = Math.sqrt((log.x - closestX) ** 2 + (log.y - closestY) ** 2);
      const hitRadius = log.type === "bomb" ? 35 : 45;

      if (distance < hitRadius) {
        log.sliced = true;
        log.sliceAngle = Math.atan2(y2 - y1, x2 - x1);
        createParticles(log.x, log.y, log.type);

        if (log.type === "bomb") {
          livesRef.current = Math.max(0, livesRef.current - 1);
          setLives(livesRef.current);
          comboRef.current = 0;
          setCombo(0);
          if (livesRef.current <= 0) {
            setGameOver(true);
            onGameEnd(scoreRef.current, logsSlicedRef.current, maxComboRef.current);
          }
        } else {
          const points = log.type === "golden" ? 50 : 10;
          const comboBonus = Math.floor(comboRef.current / 3) * 5;
          scoreRef.current += points + comboBonus;
          setScore(scoreRef.current);

          comboRef.current += 1;
          setCombo(comboRef.current);

          if (comboRef.current > maxComboRef.current) {
            maxComboRef.current = comboRef.current;
            setMaxCombo(maxComboRef.current);
          }

          logsSlicedRef.current += 1;
          setLogsSliced(logsSlicedRef.current);

          if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
          comboTimerRef.current = window.setTimeout(() => {
            comboRef.current = 0;
            setCombo(0);
          }, 1500);
        }
      }
    }
  }, [createParticles, onGameEnd]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver || !gameStarted) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    isSlicingRef.current = true;
    lastMousePos.current = { x, y };
    sliceTrailRef.current = {
      id: idCounterRef.current++,
      points: [{ x, y, time: Date.now() }],
    };

    canvas.setPointerCapture(e.pointerId);
  }, [gameOver, gameStarted]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isSlicingRef.current || gameOver || !gameStarted) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (lastMousePos.current) {
      checkSlice(lastMousePos.current.x, lastMousePos.current.y, x, y);
    }

    lastMousePos.current = { x, y };

    if (sliceTrailRef.current) {
      sliceTrailRef.current.points.push({ x, y, time: Date.now() });
      if (sliceTrailRef.current.points.length > 20) {
        sliceTrailRef.current.points.shift();
      }
    }
  }, [checkSlice, gameOver, gameStarted]);

  const handlePointerUp = useCallback(() => {
    isSlicingRef.current = false;
    lastMousePos.current = null;
    sliceTrailRef.current = null;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || gameOver) return;

    // Clear
    ctx.fillStyle = "#1a0f0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw wood grain background
    ctx.strokeStyle = "rgba(139, 69, 19, 0.1)";
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.02) * 10);
      for (let x = 0; x < canvas.width; x += 10) {
        ctx.lineTo(x, i + Math.sin((i + x) * 0.02) * 10);
      }
      ctx.stroke();
    }

    // Update and draw logs
    const gravity = 0.35;
    logsRef.current = logsRef.current.filter((log) => {
      log.vy += gravity;
      log.x += log.vx;
      log.y += log.vy;
      log.rotation += log.rotationSpeed;

      // Check if log fell without being sliced
      if (!log.sliced && log.y > canvas.height + 100 && log.type !== "bomb") {
        livesRef.current = Math.max(0, livesRef.current - 1);
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          setGameOver(true);
          onGameEnd(scoreRef.current, logsSlicedRef.current, maxComboRef.current);
        }
        return false;
      }

      // Remove if off screen
      if (log.y > canvas.height + 200 || log.x < -200 || log.x > canvas.width + 200) {
        return false;
      }

      // Draw log
      ctx.save();
      ctx.translate(log.x, log.y);
      ctx.rotate(log.rotation);

      if (log.sliced) {
        // Draw sliced halves
        const sliceAngle = log.sliceAngle || 0;
        ctx.rotate(sliceAngle);

        // First half
        ctx.save();
        ctx.translate(-10, -5);
        ctx.rotate(-0.2);
        drawLogPiece(ctx, log.type, true);
        ctx.restore();

        // Second half
        ctx.save();
        ctx.translate(10, 5);
        ctx.rotate(0.2);
        drawLogPiece(ctx, log.type, true);
        ctx.restore();
      } else {
        drawLogPiece(ctx, log.type, false);
      }

      ctx.restore();
      return true;
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.vy += 0.2;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;

      if (p.life <= 0) return false;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      return true;
    });

    // Draw slice trail
    if (sliceTrailRef.current && sliceTrailRef.current.points.length > 1) {
      const now = Date.now();
      const points = sliceTrailRef.current.points.filter((p) => now - p.time < 150);

      if (points.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 1; i < points.length; i++) {
          const age = (now - points[i].time) / 150;
          const alpha = 1 - age;
          const width = (1 - age) * 12;

          ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();

          // Inner glow
          ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.8})`;
          ctx.lineWidth = width * 0.4;
          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameOver, onGameEnd]);

  function drawLogPiece(ctx: CanvasRenderingContext2D, type: "log" | "golden" | "bomb", isHalf: boolean) {
    const width = isHalf ? 30 : 60;
    const height = isHalf ? 40 : 80;

    if (type === "bomb") {
      // Draw bomb
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      gradient.addColorStop(0, "#444");
      gradient.addColorStop(0.7, "#222");
      gradient.addColorStop(1, "#000");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      // Skull warning
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("☠", 0, 0);

      // Fuse
      ctx.strokeStyle = "#8b4513";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, -25);
      ctx.quadraticCurveTo(25, -35, 20, -45);
      ctx.stroke();

      // Spark
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.arc(20, -45, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw log
      const baseColor = type === "golden" ? "#daa520" : "#8b4513";
      const lightColor = type === "golden" ? "#ffd700" : "#a0522d";
      const darkColor = type === "golden" ? "#b8860b" : "#5d3a1a";

      // Log body
      const gradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
      gradient.addColorStop(0, darkColor);
      gradient.addColorStop(0.3, lightColor);
      gradient.addColorStop(0.7, lightColor);
      gradient.addColorStop(1, darkColor);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(-width/2, -height/2, width, height, 8);
      ctx.fill();

      // Wood grain lines
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1;
      for (let i = -height/2 + 10; i < height/2; i += 8) {
        ctx.beginPath();
        ctx.moveTo(-width/2 + 5, i);
        ctx.lineTo(width/2 - 5, i + Math.sin(i) * 2);
        ctx.stroke();
      }

      // End grain circle
      if (!isHalf) {
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.ellipse(0, -height/2 + 5, width/2 - 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rings
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 1;
        for (let r = 5; r < width/2 - 5; r += 6) {
          ctx.beginPath();
          ctx.ellipse(0, -height/2 + 5, r, r * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Golden sparkle
      if (type === "golden") {
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(-width/4, -height/4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameStarted) {
      setGameStarted(true);
    }
  }, [countdown, gameStarted]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    animationRef.current = requestAnimationFrame(gameLoop);

    // Spawn logs
    const spawnInterval = setInterval(() => {
      const numLogs = Math.random() < 0.3 ? 2 : 1;
      for (let i = 0; i < numLogs; i++) {
        setTimeout(() => spawnLog(), i * 200);
      }
    }, 1200);

    spawnTimerRef.current = spawnInterval as unknown as number;

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [gameStarted, gameOver, gameLoop, spawnLog]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = Math.min(800, container.clientWidth);
      canvas.height = Math.min(600, window.innerHeight * 0.6);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* HUD */}
      <div className="w-full max-w-[800px] flex justify-between items-center px-4 py-2 mb-2 bg-gradient-to-r from-amber-900/80 via-amber-800/80 to-amber-900/80 rounded-lg border-2 border-amber-600">
        <div className="flex items-center gap-2">
          <span className="text-amber-200 font-bold text-sm md:text-base">LIVES:</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className={`text-xl md:text-2xl ${i < lives ? "text-red-500" : "text-gray-600"}`}>
                🪓
              </span>
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-amber-100 font-black text-xl md:text-3xl tracking-wider">{score}</div>
          {combo > 1 && (
            <div className="text-orange-400 font-bold text-xs md:text-sm animate-pulse">
              {combo}x COMBO!
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-amber-200 text-xs md:text-sm">LOGS: {logsSliced}</div>
          <div className="text-amber-300 text-xs md:text-sm">BEST: {maxCombo}x</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative w-full flex justify-center">
        <canvas
          ref={canvasRef}
          className="border-4 border-amber-700 rounded-lg cursor-crosshair touch-none shadow-2xl shadow-amber-900/50"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="text-amber-400 font-black text-8xl animate-bounce drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
              {countdown}
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
            <div className="text-center p-6">
              <div className="text-red-500 font-black text-4xl md:text-6xl mb-4 animate-pulse">
                GAME OVER
              </div>
              <div className="text-amber-200 text-xl md:text-2xl mb-2">Final Score: {score}</div>
              <div className="text-amber-300 text-base md:text-lg">Logs Sliced: {logsSliced}</div>
              <div className="text-amber-300 text-base md:text-lg mb-4">Max Combo: {maxCombo}x</div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {gameStarted && !gameOver && (
        <div className="mt-3 text-amber-400/70 text-xs md:text-sm text-center">
          Swipe to slice logs! Avoid bombs ☠️ | Golden logs = 50pts
        </div>
      )}
    </div>
  );
}
