import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  Flame,
  Gauge,
  Goal,
  RotateCcw,
  Star,
  Zap,
} from "lucide-react";
import "./styles.css";

type Step = "intro" | "reaction" | "formula" | "graph" | "success" | "crash";
type FormulaSlot = "v" | "t";
type Token = { id: FormulaSlot; label: string; value: string };

type PhysicsData = {
  speedKmh: number;
  speedMs: number;
  reactionTime: number | null;
  reactionDistance: number | null;
  brakeTime: number | null;
  brakeDistance: number | null;
  stopDistance: number | null;
  catDistance: number;
};

const TOKENS: Token[] = [
  { id: "v", label: "v", value: "5 m/s" },
  { id: "t", label: "t", value: "jouw reactietijd" },
];

const INITIAL_PHYSICS: PhysicsData = {
  speedKmh: 18,
  speedMs: 5,
  reactionTime: null,
  reactionDistance: null,
  brakeTime: null,
  brakeDistance: null,
  stopDistance: null,
  catDistance: 14,
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function Navbar({
  step,
  xp,
  streak,
}: {
  step: Step;
  xp: number;
  streak: number;
}) {
  const progress = {
    intro: 8,
    reaction: 25,
    formula: 55,
    graph: 82,
    success: 100,
    crash: 100,
  }[step];

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-slate-950 shadow-glow">
            <Zap size={22} strokeWidth={2.8} />
          </div>
          <div>
            <p className="text-lg font-black tracking-wide text-white">
              KrachtLab
            </p>
            <p className="-mt-1 text-xs font-semibold text-cyan-200">
              4KGT NaSk1
            </p>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-3 sm:flex">
          <span className="text-xs font-bold uppercase text-slate-400">
            Level 1
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-lime-300 to-amber-300"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Stat icon={<Flame size={17} />} value={streak} tone="orange" />
          <Stat icon={<Star size={17} />} value={xp} tone="yellow" />
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon,
  value,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  tone: "orange" | "yellow";
}) {
  const color = tone === "orange" ? "text-orange-300" : "text-yellow-300";
  return (
    <div className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 font-black text-white">
      <span className={color}>{icon}</span>
      {value}
    </div>
  );
}

function SimulationCanvas({
  step,
  physics,
  catVisible,
}: {
  step: Step;
  physics: PhysicsData;
  catVisible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      const width = rect.width;
      const height = rect.height;
      const roadY = height * 0.68;
      const metersToPx = Math.min(36, width / 18);
      const startX = width * 0.16;
      const catX = startX + physics.catDistance * metersToPx;
      const reactionPx = (physics.reactionDistance || 0) * metersToPx;
      const brakePx = (physics.brakeDistance || 0) * metersToPx;

      let bikeX = startX;
      if (step === "reaction") bikeX = startX + ((frame % 180) / 180) * 110;
      if (step === "formula") bikeX = startX + reactionPx;
      if (step === "graph") bikeX = startX + reactionPx + brakePx * 0.35;
      if (step === "success") bikeX = startX + Math.min(reactionPx + brakePx, physics.catDistance * metersToPx - 38);
      if (step === "crash") bikeX = catX - 8;

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(0.52, "#082f49");
      gradient.addColorStop(1, "#111827");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(125, 211, 252, 0.08)";
      for (let i = 0; i < 36; i++) {
        const x = (i * 83 + frame * 0.2) % width;
        const y = 24 + ((i * 47) % (height * 0.48));
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, roadY, width, height - roadY);
      ctx.fillStyle = "#475569";
      ctx.fillRect(0, roadY + 12, width, 6);
      ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
      ctx.setLineDash([20, 16]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, roadY + 45);
      ctx.lineTo(width, roadY + 45);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDistanceMarker(ctx, startX, startX + reactionPx, roadY - 72, "reactieafstand");
      if (physics.brakeDistance) {
        drawDistanceMarker(ctx, startX + reactionPx, startX + reactionPx + brakePx, roadY - 50, "remweg");
      }

      if (catVisible || step === "formula" || step === "graph" || step === "success" || step === "crash") {
        drawCat(ctx, catX, roadY + 6, step === "crash");
      }
      drawCyclist(ctx, bikeX, roadY + 10, frame, step === "success");

      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.fillRect(18, 18, 210, 74);
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "700 14px Inter, system-ui";
      ctx.fillText(`${physics.speedKmh} km/h = ${physics.speedMs} m/s`, 34, 46);
      ctx.fillStyle = "#bae6fd";
      ctx.font = "600 12px Inter, system-ui";
      ctx.fillText(`Kat op ${physics.catDistance} meter`, 34, 70);

      frame += 1;
      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [catVisible, physics, step]);

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-900 shadow-glow">
      <canvas ref={canvasRef} className="h-[330px] w-full" />
    </div>
  );
}

function drawDistanceMarker(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  y: number,
  label: string,
) {
  if (to - from < 18) return;
  ctx.strokeStyle = "rgba(34, 211, 238, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from, y);
  ctx.lineTo(to, y);
  ctx.stroke();
  ctx.fillStyle = "#67e8f9";
  ctx.font = "700 11px Inter, system-ui";
  ctx.fillText(label, from + 6, y - 7);
}

function drawCyclist(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  happy: boolean,
) {
  const wheel = 18;
  const spin = frame * 0.12;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, wheel, 0, Math.PI * 2);
  ctx.arc(x + 58, y, wheel, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 27, y - 34);
  ctx.lineTo(x + 58, y);
  ctx.lineTo(x + 22, y);
  ctx.lineTo(x + 27, y - 34);
  ctx.stroke();

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 28, y - 37);
  ctx.lineTo(x + 32 + Math.sin(spin) * 7, y - 70);
  ctx.lineTo(x + 54, y - 58);
  ctx.stroke();

  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(x + 32, y - 82, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = happy ? "#86efac" : "#38bdf8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 40, y - 62);
  ctx.lineTo(x + 66, y - 45);
  ctx.stroke();
}

function drawCat(ctx: CanvasRenderingContext2D, x: number, y: number, angry: boolean) {
  ctx.fillStyle = angry ? "#fb7185" : "#f8fafc";
  ctx.beginPath();
  ctx.ellipse(x, y - 16, 19, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 17, y - 24, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 11, y - 31);
  ctx.lineTo(x + 15, y - 42);
  ctx.lineTo(x + 20, y - 31);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 31);
  ctx.lineTo(x + 26, y - 40);
  ctx.lineTo(x + 25, y - 29);
  ctx.fill();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 18);
  ctx.quadraticCurveTo(x - 35, y - 42, x - 48, y - 25);
  ctx.stroke();
}

function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <Panel title="Level 1: De Noodstop" icon={<Bike />}>
      <div className="space-y-4">
        <p className="text-slate-300">
          Een fietser rijdt met <b className="text-white">18 km/h</b>. Plots
          steekt er een kat over. Meet je reactietijd, bereken de reactieafstand
          en teken daarna de remfase in het v,t-diagram.
        </p>
        <FormulaLine label="Formules" value="sreactie = v x t   |   sstop = sreactie + srem" />
        <button className="primary-button w-full" onClick={onStart}>
          Start noodstop
        </button>
      </div>
    </Panel>
  );
}

function ReactionStep({
  catVisible,
  onBrake,
  armed,
}: {
  catVisible: boolean;
  onBrake: () => void;
  armed: boolean;
}) {
  return (
    <Panel title="Stap 1: Reactietijd" icon={<Gauge />}>
      <div className="space-y-5">
        <p className="text-slate-300">
          Wacht tot de kat verschijnt en druk dan zo snel mogelijk op de rem.
        </p>
        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-2 text-sm font-bold uppercase text-slate-400">
            Status
          </div>
          <div className="text-2xl font-black text-white">
            {catVisible ? "Kat op de weg!" : "Blijf fietsen..."}
          </div>
        </div>
        <button
          className={`h-24 w-full rounded-lg text-4xl font-black transition ${
            catVisible
              ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,.45)] hover:bg-red-400"
              : "bg-slate-800 text-slate-500"
          }`}
          disabled={!armed}
          onClick={onBrake}
        >
          REM!
        </button>
      </div>
    </Panel>
  );
}

function FormulaStep({
  physics,
  onCorrect,
}: {
  physics: PhysicsData;
  onCorrect: (distance: number) => void;
}) {
  const [slots, setSlots] = useState<Partial<Record<FormulaSlot, Token>>>({});
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const expected = round(physics.speedMs * (physics.reactionTime || 0), 2);

  const dropToken = (slot: FormulaSlot, tokenId: string) => {
    const token = TOKENS.find((item) => item.id === tokenId);
    if (!token) return;
    setSlots((current) => ({ ...current, [slot]: token }));
  };

  const check = () => {
    const numeric = Number(answer.replace(",", "."));
    const formulaOk = slots.v?.id === "v" && slots.t?.id === "t";
    const answerOk = Math.abs(numeric - expected) <= 0.08;
    if (formulaOk && answerOk) {
      setFeedback("Goed. De fietser remt nog niet tijdens deze meters.");
      onCorrect(expected);
    } else {
      setFeedback("Nog niet. Gebruik snelheid x reactietijd en rond op twee decimalen.");
    }
  };

  return (
    <Panel title="Stap 2: Reactieafstand" icon={<Goal />}>
      <div className="space-y-4">
        <FormulaLine
          label="Gegeven"
          value={`v = ${physics.speedMs} m/s, t = ${physics.reactionTime?.toFixed(2)} s`}
        />
        <div className="grid grid-cols-2 gap-2">
          {TOKENS.map((token) => (
            <div
              key={token.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", token.id)}
              className="cursor-grab rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-3 text-center font-black text-cyan-100 active:cursor-grabbing"
            >
              {token.label} <span className="block text-xs font-semibold text-cyan-200">{token.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-950/70 p-3 text-xl font-black text-white">
          <span>s =</span>
          <DropSlot token={slots.v} onDropToken={(id) => dropToken("v", id)} />
          <span>x</span>
          <DropSlot token={slots.t} onDropToken={(id) => dropToken("t", id)} />
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-300">
            Reactieafstand in meter
          </span>
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            inputMode="decimal"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-xl font-black text-white outline-none ring-cyan-300/0 transition focus:ring-4"
            placeholder="bijv. 3,50"
          />
        </label>
        {feedback && <p className="text-sm font-bold text-cyan-100">{feedback}</p>}
        <button className="primary-button w-full" onClick={check}>
          Controleer
        </button>
      </div>
    </Panel>
  );
}

function DropSlot({
  token,
  onDropToken,
}: {
  token?: Token;
  onDropToken: (id: string) => void;
}) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropToken(event.dataTransfer.getData("text/plain"))}
      className="grid h-14 min-w-24 place-items-center rounded-lg border border-dashed border-lime-300/50 bg-lime-300/10 px-4 text-lime-100"
    >
      {token ? token.label : "sleep"}
    </div>
  );
}

function GraphStep({
  physics,
  onFinish,
}: {
  physics: PhysicsData;
  onFinish: (brakeTime: number) => void;
}) {
  const [brakeTime, setBrakeTime] = useState(1.6);
  const brakeDistance = round((physics.speedMs * brakeTime) / 2, 2);
  const total = round((physics.reactionDistance || 0) + brakeDistance, 2);
  const margin = round(physics.catDistance - total, 2);

  return (
    <Panel title="Stap 3: v,t-diagram" icon={<Goal />}>
      <div className="space-y-4">
        <p className="text-slate-300">
          Sleep het rempunt over de tijdas. De driehoek onder de rem-lijn is de
          remweg.
        </p>
        <VelocityGraph
          reactionTime={physics.reactionTime || 0}
          speed={physics.speedMs}
          brakeTime={brakeTime}
          onBrakeTime={setBrakeTime}
        />
        <div className="grid grid-cols-3 gap-2">
          <MiniMetric label="remtijd" value={`${brakeTime.toFixed(1)} s`} />
          <MiniMetric label="remweg" value={`${brakeDistance} m`} />
          <MiniMetric label="marge" value={`${margin} m`} />
        </div>
        <FormulaLine
          label="Stopafstand"
          value={`${physics.reactionDistance} + ${brakeDistance} = ${total} m`}
        />
        <button className="primary-button w-full" onClick={() => onFinish(brakeTime)}>
          Test noodstop
        </button>
      </div>
    </Panel>
  );
}

function VelocityGraph({
  reactionTime,
  speed,
  brakeTime,
  onBrakeTime,
}: {
  reactionTime: number;
  speed: number;
  brakeTime: number;
  onBrakeTime: (time: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 360;
  const height = 210;
  const pad = 34;
  const maxTime = 5;
  const xReaction = pad + (reactionTime / maxTime) * (width - pad * 1.5);
  const xEnd = pad + ((reactionTime + brakeTime) / maxTime) * (width - pad * 1.5);
  const yTop = pad;
  const yZero = height - pad;

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - pad) / (rect.width - pad * 1.5)));
    const totalTime = ratio * maxTime;
    onBrakeTime(round(Math.min(3.4, Math.max(0.6, totalTime - reactionTime)), 1));
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-lg border border-white/10 bg-slate-950"
      onPointerMove={(event) => {
        if (event.buttons === 1) handleMove(event.clientX);
      }}
      onPointerDown={(event) => handleMove(event.clientX)}
    >
      <line x1={pad} y1={yZero} x2={width - 18} y2={yZero} stroke="#64748b" strokeWidth="2" />
      <line x1={pad} y1={18} x2={pad} y2={yZero} stroke="#64748b" strokeWidth="2" />
      <text x="8" y="26" fill="#bae6fd" fontSize="12" fontWeight="700">v</text>
      <text x={width - 20} y={height - 8} fill="#bae6fd" fontSize="12" fontWeight="700">t</text>
      <polygon
        points={`${xReaction},${yTop} ${xEnd},${yZero} ${xReaction},${yZero}`}
        fill="rgba(132, 204, 22, 0.18)"
      />
      <rect
        x={pad}
        y={yTop}
        width={Math.max(0, xReaction - pad)}
        height={yZero - yTop}
        fill="rgba(34, 211, 238, 0.12)"
      />
      <line x1={pad} y1={yTop} x2={xReaction} y2={yTop} stroke="#22d3ee" strokeWidth="5" />
      <line x1={xReaction} y1={yTop} x2={xEnd} y2={yZero} stroke="#bef264" strokeWidth="5" />
      <circle cx={xEnd} cy={yZero} r="11" fill="#bef264" />
      <circle cx={xEnd} cy={yZero} r="5" fill="#0f172a" />
      <text x={pad + 6} y={yTop - 8} fill="#e0f2fe" fontSize="12" fontWeight="800">{speed} m/s</text>
      <text x={xReaction - 28} y={yZero + 22} fill="#67e8f9" fontSize="11" fontWeight="800">reactie</text>
      <text x={xEnd - 12} y={yZero - 16} fill="#ecfccb" fontSize="11" fontWeight="800">sleep</text>
    </svg>
  );
}

function ResultPanel({
  success,
  physics,
  onRetry,
}: {
  success: boolean;
  physics: PhysicsData;
  onRetry: () => void;
}) {
  return (
    <Panel title={success ? "Kat gered" : "Net niet"} icon={<Star />}>
      <div className="space-y-4">
        <div className={`rounded-lg border p-4 ${success ? "border-lime-300/30 bg-lime-300/10" : "border-red-300/30 bg-red-300/10"}`}>
          <div className="text-3xl font-black text-white">
            {success ? "+50 XP" : "Probeer opnieuw"}
          </div>
          <p className="mt-1 text-slate-300">
            Stopafstand: <b className="text-white">{physics.stopDistance} m</b>.
            Afstand tot de kat: <b className="text-white">{physics.catDistance} m</b>.
          </p>
        </div>
        <button className="secondary-button w-full" onClick={onRetry}>
          <RotateCcw size={18} /> Opnieuw oefenen
        </button>
      </div>
    </Panel>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-glow"
    >
      <div className="mb-4 flex items-center gap-2 text-white">
        <span className="text-cyan-300">{icon}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function FormulaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
      <div className="text-xs font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-cyan-100">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/70 p-3 text-center">
      <div className="text-xs font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function Confetti({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: 42 }).map((_, index) => (
            <motion.span
              key={index}
              className="absolute h-3 w-2 rounded-sm"
              style={{
                left: `${(index * 23) % 100}%`,
                background: ["#22d3ee", "#bef264", "#facc15", "#fb7185"][index % 4],
              }}
              initial={{ y: -30, rotate: 0 }}
              animate={{ y: "105vh", rotate: 320 }}
              transition={{ duration: 1.4 + (index % 6) * 0.12, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  const [step, setStep] = useState<Step>("intro");
  const [physics, setPhysics] = useState<PhysicsData>(INITIAL_PHYSICS);
  const [catVisible, setCatVisible] = useState(false);
  const [catAppearedAt, setCatAppearedAt] = useState<number | null>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const armed = step === "reaction" && catVisible;

  useEffect(() => {
    if (step !== "reaction") return;
    setCatVisible(false);
    const delay = 2000 + Math.random() * 2000;
    const timer = window.setTimeout(() => {
      setCatVisible(true);
      setCatAppearedAt(performance.now());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [step]);

  const reactionText = useMemo(() => {
    if (!physics.reactionTime) return "Nog niet gemeten";
    return `${physics.reactionTime.toFixed(2)} s`;
  }, [physics.reactionTime]);

  const handleBrake = () => {
    if (!catAppearedAt) return;
    const time = round((performance.now() - catAppearedAt) / 1000, 2);
    setPhysics((current) => ({ ...current, reactionTime: time }));
    setStep("formula");
  };

  const handleFormulaCorrect = (distance: number) => {
    setPhysics((current) => ({ ...current, reactionDistance: distance }));
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 1500);
    window.setTimeout(() => setStep("graph"), 850);
  };

  const handleFinish = (brakeTime: number) => {
    const brakeDistance = round((physics.speedMs * brakeTime) / 2, 2);
    const stopDistance = round((physics.reactionDistance || 0) + brakeDistance, 2);
    const success = stopDistance <= physics.catDistance;
    setPhysics((current) => ({
      ...current,
      brakeTime,
      brakeDistance,
      stopDistance,
    }));
    if (success) {
      setXp((current) => current + 50);
      setStreak((current) => current + 1);
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 1700);
      setStep("success");
    } else {
      setStreak(0);
      setStep("crash");
    }
  };

  const retry = () => {
    setPhysics(INITIAL_PHYSICS);
    setCatVisible(false);
    setCatAppearedAt(null);
    setStep("reaction");
  };

  return (
    <div className="min-h-screen bg-slate-950 font-display text-slate-100">
      <Navbar step={step} xp={xp} streak={streak} />
      <Confetti show={confetti} />

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1.25fr)_430px]">
        <section className="space-y-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Kracht en beweging
            </p>
            <h1 className="mt-1 text-3xl font-black text-white sm:text-5xl">
              De Noodstop
            </h1>
          </div>
          <SimulationCanvas step={step} physics={physics} catVisible={catVisible} />
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="snelheid" value={`${physics.speedMs} m/s`} />
            <MiniMetric label="reactietijd" value={reactionText} />
            <MiniMetric label="kat" value={`${physics.catDistance} m`} />
          </div>
        </section>

        <aside className="space-y-4">
          <AnimatePresence mode="wait">
            {step === "intro" && <IntroPanel key="intro" onStart={() => setStep("reaction")} />}
            {step === "reaction" && (
              <ReactionStep
                key="reaction"
                catVisible={catVisible}
                armed={armed}
                onBrake={handleBrake}
              />
            )}
            {step === "formula" && <FormulaStep key="formula" physics={physics} onCorrect={handleFormulaCorrect} />}
            {step === "graph" && <GraphStep key="graph" physics={physics} onFinish={handleFinish} />}
            {(step === "success" || step === "crash") && (
              <ResultPanel key="result" success={step === "success"} physics={physics} onRetry={retry} />
            )}
          </AnimatePresence>
        </aside>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
