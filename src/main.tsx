import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  ExternalLink,
  Flame,
  Gauge,
  Goal,
  Lightbulb,
  Play,
  RotateCcw,
  Star,
  Zap,
} from "lucide-react";
import "./styles.css";

type Step = "intro" | "reaction" | "formula" | "graph" | "success" | "crash";
type FormulaSlot = "v" | "t";
type Token = { id: FormulaSlot; label: string; value: string };
type FeedbackTone = "info" | "hint" | "wrong" | "right";
type PracticeTask = {
  video: string;
  videoUrl: string;
  videoTitle: string;
  imageUrl?: string;
  title: string;
  skill: string;
  method: string;
  prompt: string;
  hint: string;
  options: string[];
  correctOption: number;
  explanation: string;
  questions: BattleQuestion[];
};
type BattleQuestion = {
  prompt: string;
  options: string[];
  correctOption: number;
  hint: string;
  explanation: string;
};
type ViewMode = "home" | "lesson";

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

const PRACTICE_TASKS: PracticeTask[] = [
  {
    video: "Video 1",
    videoUrl: "https://www.youtube.com/watch?v=_iZ6yn-h_as&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Voortstuwende en tegenwerkende wrijvingskracht",
    title: "Route 1: Arcanine rent",
    skill: "Teken krachtpijlen.",
    method: "Mee = voortstuwend. Tegen = tegenwerkend.",
    prompt: "Arcanine rent door zand tegen storm in. Teken 3 horizontale krachten.",
    hint: "Spierkracht vooruit. Lucht en zand werken tegen.",
    options: [
      "Spierkracht vooruit. Lucht en zand achteruit.",
      "Alle krachten wijzen vooruit.",
      "Luchtweerstand wijst vooruit.",
    ],
    correctOption: 0,
    explanation: "Arcanine beweegt vooruit. Tegenkrachten wijzen terug.",
    questions: [
      {
        prompt: "Welke pijl hoort bij spierkracht?",
        options: ["Vooruit", "Achteruit", "Omlaag"],
        correctOption: 0,
        hint: "Arcanine rent vooruit.",
        explanation: "Spierkracht duwt Arcanine vooruit.",
      },
      {
        prompt: "Welke pijlen werken tegen?",
        options: ["Lucht en zand", "Spierkracht en lucht", "Alleen spierkracht"],
        correctOption: 0,
        hint: "Storm en zand remmen af.",
        explanation: "Luchtweerstand en zand werken achteruit.",
      },
      {
        prompt: "Hoe teken je tegenkracht?",
        options: ["Pijl naar links", "Pijl naar rechts", "Geen pijl"],
        correctOption: 0,
        hint: "Tegen de beweging in.",
        explanation: "Tegenkracht teken je terug.",
      },
    ],
  },
  {
    video: "Video 2",
    videoUrl: "https://www.youtube.com/watch?v=-e3Uv_z32UA&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Snelheidsverandering of richting bij nettokracht",
    title: "Route 2: Team Rocket ballon",
    skill: "Bereken Fnetto.",
    method: "Fnetto = Fvooruit - Ftegen.",
    prompt: "Ballon: 450 N vooruit. Wind: 300 N tegen. Versnelt hij?",
    hint: "450 - 300 = ?",
    options: ["Fnetto = 150 N vooruit", "Fnetto = 0 N", "Fnetto = 750 N tegen"],
    correctOption: 0,
    explanation: "450 N vooruit is groter dan 300 N tegen. De ballon versnelt.",
    questions: [
      {
        prompt: "Welke pijl is vooruit?",
        options: ["450 N", "300 N", "Geen pijl"],
        correctOption: 0,
        hint: "De motor duwt.",
        explanation: "De motor levert 450 N vooruit.",
      },
      {
        prompt: "Wat is Fnetto?",
        options: ["150 N vooruit", "0 N", "750 N"],
        correctOption: 0,
        hint: "450 - 300.",
        explanation: "Fnetto = 150 N vooruit.",
      },
      {
        prompt: "Wat doet de ballon?",
        options: ["Versnelt", "Blijft gelijk", "Vertraagt"],
        correctOption: 0,
        hint: "Vooruit is groter.",
        explanation: "De nettokracht is vooruit. Dus hij versnelt.",
      },
    ],
  },
  {
    video: "Video 3",
    videoUrl: "https://www.youtube.com/watch?v=vAf0b6LCz9o&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Traagheid, effect van massa op versnelling",
    title: "Route 3: Pikachu vs Snorlax",
    skill: "Gebruik traagheid.",
    method: "Meer massa = meer traagheid.",
    prompt: "Pikachu en Snorlax rennen 20 km/h. Wie heeft de langste remweg?",
    hint: "Snorlax heeft veel meer massa.",
    options: ["Snorlax", "Pikachu", "Allebei even lang"],
    correctOption: 0,
    explanation: "Snorlax heeft meer massa. Dus meer traagheid.",
    questions: [
      {
        prompt: "Wie heeft meer massa?",
        options: ["Snorlax", "Pikachu", "Evenveel"],
        correctOption: 0,
        hint: "Kijk naar het grote lijf.",
        explanation: "Snorlax heeft meer massa.",
      },
      {
        prompt: "Wie heeft meer traagheid?",
        options: ["Snorlax", "Pikachu", "Evenveel"],
        correctOption: 0,
        hint: "Meer massa = meer traagheid.",
        explanation: "Snorlax is lastiger te stoppen.",
      },
      {
        prompt: "Wie heeft de langste remweg?",
        options: ["Snorlax", "Pikachu", "Even lang"],
        correctOption: 0,
        hint: "Meer traagheid remt lastiger.",
        explanation: "Snorlax stopt later.",
      },
    ],
  },
  {
    video: "Video 4",
    videoUrl: "https://www.youtube.com/watch?v=Z2MRpyp-ERA&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Kracht, versnelling en massa berekenen",
    title: "Route 4: Machamp duwt",
    skill: "Reken kracht uit.",
    method: "F = m x a.",
    prompt: "Machamp duwt Aggron. m = 360 kg. a = 2 m/s2. Bereken F.",
    hint: "360 x 2. Eenheid: N.",
    options: ["720 N", "180 N", "362 N"],
    correctOption: 0,
    explanation: "F = m x a = 360 x 2 = 720 N.",
    questions: [
      {
        prompt: "Welke formule hoort bij de pijl?",
        options: ["F = m x a", "s = v x t", "W = F x s"],
        correctOption: 0,
        hint: "Het gaat om kracht.",
        explanation: "Voor kracht gebruik je F = m x a.",
      },
      {
        prompt: "Wat vul je in voor m?",
        options: ["360 kg", "2 m/s2", "720 N"],
        correctOption: 0,
        hint: "m betekent massa.",
        explanation: "De massa van Aggron is 360 kg.",
      },
      {
        prompt: "Hoe groot is F?",
        options: ["720 N", "180 N", "362 N"],
        correctOption: 0,
        hint: "360 x 2.",
        explanation: "F = 720 N.",
      },
    ],
  },
  {
    video: "Video 5",
    videoUrl: "https://www.youtube.com/watch?v=Sznu6GltB0A&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Arbeid, kracht en afstand berekenen",
    title: "Route 5: Geodude valt",
    skill: "Leg eindsnelheid uit.",
    method: "Fz omlaag. Flucht omhoog.",
    prompt: "Charizard laat Geodude vallen. Waarom wordt zijn valsnelheid later constant?",
    hint: "Als Fz = Flucht, dan is Fnetto 0 N.",
    options: [
      "Luchtweerstand wordt even groot als zwaartekracht.",
      "Zwaartekracht verdwijnt.",
      "Geodude wordt lichter.",
    ],
    correctOption: 0,
    explanation: "Bij gelijke krachten is Fnetto 0 N. De snelheid blijft gelijk.",
    questions: [
      {
        prompt: "Welke pijl wijst omlaag?",
        options: ["Fz", "Flucht", "Fnetto"],
        correctOption: 0,
        hint: "Zwaartekracht trekt omlaag.",
        explanation: "Fz wijst omlaag.",
      },
      {
        prompt: "Welke pijl wijst omhoog?",
        options: ["Flucht", "Fz", "Massa"],
        correctOption: 0,
        hint: "Lucht duwt tegen de val in.",
        explanation: "Luchtweerstand wijst omhoog.",
      },
      {
        prompt: "Wanneer is snelheid constant?",
        options: ["Fz = Flucht", "Fz is groter", "Flucht is weg"],
        correctOption: 0,
        hint: "Dan is Fnetto 0 N.",
        explanation: "Bij Fnetto 0 N blijft de snelheid gelijk.",
      },
    ],
  },
  {
    video: "Video 6",
    videoUrl: "https://www.youtube.com/watch?v=KJvb8ncJRmM&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Bewegingsenergie en zwaarte-energie berekenen",
    title: "Route 6: Cyclizar remt",
    skill: "Gebruik stopafstand.",
    method: "Stopafstand = reactieafstand + remweg.",
    prompt: "Trainer kijkt op Rotom Phone. Regen op de weg. Psyduck steekt over. Wat wordt groter?",
    hint: "Telefoon: reactieafstand. Regen: remweg.",
    options: [
      "Reactieafstand en remweg",
      "Alleen snelheid",
      "Geen van beide",
    ],
    correctOption: 0,
    explanation: "Afleiding maakt reageren trager. Regen maakt remmen slechter.",
    questions: [
      {
        prompt: "Wat maakt reactieafstand groter?",
        options: ["Rotom Phone", "Regen", "Psyduck"],
        correctOption: 0,
        hint: "De trainer kijkt weg.",
        explanation: "Afleiding maakt reactietijd langer.",
      },
      {
        prompt: "Wat maakt remweg groter?",
        options: ["Regen", "Telefoon", "Helm"],
        correctOption: 0,
        hint: "De weg is glad.",
        explanation: "Regen geeft minder grip.",
      },
      {
        prompt: "Wat is stopafstand?",
        options: ["Reactieafstand + remweg", "Alleen remweg", "Alleen snelheid"],
        correctOption: 0,
        hint: "Twee stukken samen.",
        explanation: "Stopafstand = reactieafstand + remweg.",
      },
    ],
  },
  {
    video: "Video 7",
    videoUrl: "https://www.youtube.com/watch?v=WUsi7haBPDU&list=PLugIniei46MeydpDW0IRXsi5eAOVvlAi9",
    videoTitle: "Veilige verkeerssituatie maken",
    title: "Arena 7: Pokéball deukt",
    skill: "Leg veiligheid uit.",
    method: "Langere remtijd = kleinere kracht.",
    prompt: "Een Pokéball deukt een beetje in bij een klap. Waarom is dat veiliger?",
    hint: "Langere remweg. Kleinere kracht.",
    options: [
      "De klap duurt langer. De kracht wordt kleiner.",
      "De snelheid wordt groter.",
      "De massa verdwijnt.",
    ],
    correctOption: 0,
    explanation: "Langzamer afremmen geeft een kleinere kracht.",
    questions: [
      {
        prompt: "Wat zie je bij de Pokéball?",
        options: ["Hij deukt in", "Hij versnelt", "Hij wordt zwaarder"],
        correctOption: 0,
        hint: "Kijk naar de klap.",
        explanation: "De bal deukt in bij de botsing.",
      },
      {
        prompt: "Wat wordt langer?",
        options: ["Remweg", "Massa", "Snelheid"],
        correctOption: 0,
        hint: "De klap duurt meer afstand.",
        explanation: "Indeuken maakt de remweg langer.",
      },
      {
        prompt: "Wat gebeurt met de kracht?",
        options: ["Kleiner", "Groter", "Verdwijnt"],
        correctOption: 0,
        hint: "Langzamer afremmen helpt.",
        explanation: "Een langere remweg geeft kleinere kracht.",
      },
    ],
  },
];

const GENERAL_QUESTIONS: Record<string, BattleQuestion[]> = {
  "Video 1": [
    {
      prompt: "Een fietser rijdt met constante snelheid. Wat klopt?",
      options: ["Krachten zijn in evenwicht", "Alleen spierkracht werkt", "Er werken geen krachten"],
      correctOption: 0,
      hint: "Constante snelheid betekent: Fnetto = 0 N.",
      explanation: "De voortstuwende kracht is even groot als alle tegenkrachten samen.",
    },
    {
      prompt: "Wat laat de punt van een krachtpijl zien?",
      options: ["Richting", "Massa", "Snelheid"],
      correctOption: 0,
      hint: "Kijk waar de pijl naartoe wijst.",
      explanation: "De punt laat de richting van de kracht zien.",
    },
    {
      prompt: "Welke kracht werkt tegen de beweging in?",
      options: ["Luchtweerstand", "Motorkracht", "Spierkracht vooruit"],
      correctOption: 0,
      hint: "Deze kracht remt af.",
      explanation: "Luchtweerstand werkt tegen de beweging in.",
    },
  ],
  "Video 2": [
    {
      prompt: "Motor: 2500 N. Tegen: 2700 N. Wat gebeurt er?",
      options: ["Hij vertraagt", "Hij versnelt", "Hij rijdt achteruit"],
      correctOption: 0,
      hint: "Tegen is 200 N groter.",
      explanation: "Fnetto is 200 N tegen de beweging in. Dus hij vertraagt.",
    },
    {
      prompt: "Wanneer is de snelheid constant?",
      options: ["Fnetto = 0 N", "Fnetto vooruit", "Fnetto achteruit"],
      correctOption: 0,
      hint: "De krachten heffen elkaar op.",
      explanation: "Bij Fnetto = 0 N verandert de snelheid niet.",
    },
    {
      prompt: "Wanneer versnelt iets?",
      options: ["Kracht vooruit is groter", "Kracht tegen is groter", "Krachten zijn gelijk"],
      correctOption: 0,
      hint: "De nettokracht wijst vooruit.",
      explanation: "Als de kracht vooruit groter is, neemt de snelheid toe.",
    },
  ],
  "Video 3": [
    {
      prompt: "Waarom schiet je naar voren bij hard remmen?",
      options: ["Door traagheid", "Door zwaartekracht", "Door luchtweerstand"],
      correctOption: 0,
      hint: "Je lichaam wil doorgaan.",
      explanation: "Door traagheid wil je lichaam vooruit blijven bewegen.",
    },
    {
      prompt: "Wat geeft meer traagheid?",
      options: ["Meer massa", "Minder massa", "Meer lucht"],
      correctOption: 0,
      hint: "Zware dingen zijn lastiger te stoppen.",
      explanation: "Hoe groter de massa, hoe groter de traagheid.",
    },
    {
      prompt: "Wat kost meer kracht om te versnellen?",
      options: ["Een zwaar voorwerp", "Een licht voorwerp", "Een stil voorwerp zonder massa"],
      correctOption: 0,
      hint: "Meer massa werkt meer tegen.",
      explanation: "Een zwaar voorwerp heeft meer traagheid.",
    },
  ],
  "Video 4": [
    {
      prompt: "Scooter: m = 150 kg. a = 2 m/s2. Hoe groot is F?",
      options: ["300 N", "75 N", "152 N"],
      correctOption: 0,
      hint: "F = m x a.",
      explanation: "F = 150 x 2 = 300 N.",
    },
    {
      prompt: "Welke eenheid hoort bij kracht?",
      options: ["N", "kg", "m/s2"],
      correctOption: 0,
      hint: "Kracht meet je in Newton.",
      explanation: "De eenheid van kracht is Newton: N.",
    },
    {
      prompt: "Welke formule gebruik je voor versnelling?",
      options: ["a = F / m", "a = F x m", "a = m / F"],
      correctOption: 0,
      hint: "Begin met F = m x a.",
      explanation: "Als je a zoekt, deel je F door m.",
    },
  ],
  "Video 5": [
    {
      prompt: "Fz is even groot als Flucht. Wat gebeurt er?",
      options: ["Constante snelheid", "Steeds sneller", "Stil hangen"],
      correctOption: 0,
      hint: "Fnetto = 0 N.",
      explanation: "Bij gelijke krachten blijft de snelheid gelijk.",
    },
    {
      prompt: "Wat gebeurt met luchtweerstand tijdens vallen?",
      options: ["Wordt groter", "Blijft nul", "Werkt omlaag"],
      correctOption: 0,
      hint: "Meer snelheid geeft meer luchtweerstand.",
      explanation: "Luchtweerstand wordt groter als de snelheid groter wordt.",
    },
    {
      prompt: "Wat doet een parachute?",
      options: ["Meer luchtweerstand", "Minder massa", "Meer zwaartekracht"],
      correctOption: 0,
      hint: "Een parachute heeft veel oppervlak.",
      explanation: "Meer oppervlak geeft meer luchtweerstand.",
    },
  ],
  "Video 6": [
    {
      prompt: "Moe en natte weg. Wat wordt langer?",
      options: ["Reactieafstand en remweg", "Alleen reactieafstand", "Alleen remweg"],
      correctOption: 0,
      hint: "Moe reageren. Natte weg remmen.",
      explanation: "Moeheid maakt de reactieafstand langer. Nat wegdek maakt de remweg langer.",
    },
    {
      prompt: "Wat is de formule voor stopafstand?",
      options: ["Reactieafstand + remweg", "Snelheid x massa", "Kracht x afstand"],
      correctOption: 0,
      hint: "Stoppen heeft twee stukken.",
      explanation: "Stopafstand = reactieafstand + remweg.",
    },
    {
      prompt: "Wat is het horizontale stuk in een v,t-diagram?",
      options: ["Reactietijd", "Remweg", "Massa"],
      correctOption: 0,
      hint: "De snelheid blijft eerst gelijk.",
      explanation: "Tijdens de reactietijd rem je nog niet.",
    },
  ],
  "Video 7": [
    {
      prompt: "Waarom heeft een auto een kreukelzone?",
      options: ["Kleinere kracht op je lichaam", "Meer snelheid", "Minder grip"],
      correctOption: 0,
      hint: "De klap duurt langer.",
      explanation: "Een langere remweg geeft een kleinere kracht.",
    },
    {
      prompt: "Wat doet een gordel?",
      options: ["Houdt je tegen", "Maakt de auto sneller", "Maakt je lichter"],
      correctOption: 0,
      hint: "Je lichaam wil door bewegen.",
      explanation: "De gordel houdt je vast en remt je af.",
    },
    {
      prompt: "Welk deel van de auto moet stevig blijven?",
      options: ["Kooiconstructie", "Kreukelzone", "Bumper alleen"],
      correctOption: 0,
      hint: "Dit deel beschermt de inzittenden.",
      explanation: "De kooiconstructie beschermt de mensen in de auto.",
    },
  ],
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function chapterLabel(task: PracticeTask) {
  return task.video.replace("Video", "Stap");
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
    <header className="sticky top-0 z-20 border-b-4 border-slate-900 bg-red-500 shadow-[0_4px_0_#020617]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full border-4 border-slate-950 bg-white text-slate-950">
            <Zap size={22} strokeWidth={2.8} />
          </div>
          <div>
            <p className="text-lg font-black tracking-wide text-white drop-shadow">
              KrachtQuest
            </p>
            <p className="-mt-1 text-xs font-black text-yellow-200">
              Trainer 4KGT
            </p>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-3 sm:flex">
          <span className="text-xs font-bold uppercase text-slate-400">
            Quest
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full border border-slate-950 bg-white/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-lime-300 to-cyan-300"
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
  taskIndex,
  task,
}: {
  step: Step;
  physics: PhysicsData;
  catVisible: boolean;
  taskIndex: number;
  task: PracticeTask;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [task.imageUrl]);

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

      if (taskIndex === 5) {
        drawDistanceMarker(ctx, startX, startX + reactionPx, roadY - 72, "reactie");
        if (physics.brakeDistance) {
          drawDistanceMarker(ctx, startX + reactionPx, startX + reactionPx + brakePx, roadY - 50, "remweg");
        }
      }

      drawRouteScene(ctx, {
        taskIndex,
        frame,
        width,
        height,
        roadY,
        x: bikeX,
        targetX: catX,
        showTarget: catVisible || step === "formula" || step === "graph" || step === "success" || step === "crash",
        danger: step === "crash",
        happy: step === "success",
      });

      const sceneLabel = [
        "Arcanine vs storm",
        "Team Rocket ballon",
        "Pikachu vs Snorlax",
        "Machamp duwt Aggron",
        "Geodude valt",
        "Cyclizar noodstop",
        "Pokéball botsing",
      ][taskIndex];

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      roundRect(ctx, 18, 18, 230, 76, 10);
      ctx.fill();
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#020617";
      ctx.font = "700 14px Inter, system-ui";
      ctx.fillText(sceneLabel, 34, 45);
      ctx.font = "700 12px Inter, system-ui";
      ctx.fillText(taskIndex === 5 ? `${physics.speedKmh} km/h = ${physics.speedMs} m/s` : "Kies de juiste natuurkunde", 34, 70);

      frame += 1;
      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [catVisible, physics, step, taskIndex]);

  if (task.imageUrl && !imageFailed) {
    return (
      <div className="relative h-[330px] overflow-hidden rounded-lg border-4 border-slate-900 bg-white shadow-[6px_6px_0_#020617]">
        <img
          src={task.imageUrl}
          alt={task.title}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-4 top-4 rounded-lg border-4 border-slate-900 bg-white/90 px-4 py-3 text-slate-950">
          <div className="text-sm font-black text-red-600">{chapterLabel(task)}</div>
          <div className="text-lg font-black">{task.title}</div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-3">
          <SceneForce label="spierkracht" tone="good" />
          <SceneForce label="luchtweerstand" tone="bad" />
          <SceneForce label="wrijving zand" tone="bad" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border-4 border-slate-900 bg-white shadow-[6px_6px_0_#020617]">
      <canvas ref={canvasRef} className="h-[330px] w-full" />
    </div>
  );
}

function SceneForce({ label, tone }: { label: string; tone: "good" | "bad" }) {
  return (
    <div
      className={`rounded-lg border-4 border-slate-900 px-3 py-2 text-center text-sm font-black shadow-[3px_3px_0_#020617] ${
        tone === "good" ? "bg-lime-200 text-slate-950" : "bg-red-500 text-white"
      }`}
    >
      {tone === "good" ? "→" : "←"} {label}
    </div>
  );
}

function drawRouteScene(
  ctx: CanvasRenderingContext2D,
  scene: {
    taskIndex: number;
    frame: number;
    width: number;
    height: number;
    roadY: number;
    x: number;
    targetX: number;
    showTarget: boolean;
    danger: boolean;
    happy: boolean;
  },
) {
  const { taskIndex, frame, width, height, roadY, x, targetX, showTarget, danger, happy } = scene;

  if (taskIndex === 0) {
    drawSandStorm(ctx, frame, width, height);
    drawCreature(ctx, x, roadY + 4, "#f97316", "Arcanine", happy);
    drawArrow(ctx, x - 80, roadY - 52, x - 15, roadY - 52, "#22c55e", "spier");
    drawArrow(ctx, x + 120, roadY - 88, x + 58, roadY - 88, "#ef4444", "lucht");
    drawArrow(ctx, x + 100, roadY - 28, x + 48, roadY - 28, "#ef4444", "zand");
    return;
  }

  if (taskIndex === 1) {
    drawBalloon(ctx, x + 40, roadY - 95, frame);
    drawArrow(ctx, x - 60, roadY - 95, x + 10, roadY - 95, "#22c55e", "450 N");
    drawArrow(ctx, x + 170, roadY - 125, x + 105, roadY - 125, "#ef4444", "300 N");
    drawLabel(ctx, "Fnetto?", x + 35, roadY - 30);
    return;
  }

  if (taskIndex === 2) {
    drawCreature(ctx, x - 20, roadY + 4, "#facc15", "Pikachu", false, 0.85);
    drawCreature(ctx, x + 160, roadY + 4, "#94a3b8", "Snorlax", false, 1.35);
    drawLabel(ctx, "6 kg", x - 48, roadY - 72);
    drawLabel(ctx, "460 kg", x + 125, roadY - 105);
    drawCliff(ctx, width - 92, roadY);
    return;
  }

  if (taskIndex === 3) {
    drawCreature(ctx, x - 30, roadY + 4, "#60a5fa", "Machamp", false, 1.05);
    drawCreature(ctx, x + 125, roadY + 4, "#64748b", "Aggron", false, 1.3);
    drawArrow(ctx, x + 25, roadY - 68, x + 100, roadY - 68, "#22c55e", "F = m x a");
    drawLabel(ctx, "360 kg", x + 105, roadY - 110);
    return;
  }

  if (taskIndex === 4) {
    drawCreature(ctx, width * 0.24, roadY - 130, "#ef4444", "Charizard", false, 1.05);
    const fallY = 80 + ((frame * 2) % Math.max(90, height - 150));
    drawRock(ctx, width * 0.62, fallY, "Geodude");
    drawArrow(ctx, width * 0.7, fallY - 28, width * 0.7, fallY + 40, "#ef4444", "Fz");
    drawArrow(ctx, width * 0.54, fallY + 40, width * 0.54, fallY - 28, "#22c55e", "Flucht");
    return;
  }

  if (taskIndex === 5) {
    if (showTarget) drawCreature(ctx, targetX, roadY + 6, "#facc15", "Psyduck", danger, 0.8);
    drawCreature(ctx, x, roadY + 8, "#22c55e", "Cyclizar", happy, 1.05);
    drawLabel(ctx, "Rotom Phone", x - 15, roadY - 100);
    return;
  }

  drawPokeball(ctx, x + 90, roadY - 25, danger);
  drawArrow(ctx, x - 40, roadY - 25, x + 40, roadY - 25, "#ef4444", "klap");
  drawLabel(ctx, "deukt in", x + 65, roadY - 85);
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

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  roundRect(ctx, x, y, Math.max(74, text.length * 8), 26, 8);
  ctx.fill();
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#020617";
  ctx.font = "800 12px Inter, system-ui";
  ctx.fillText(text, x + 9, y + 17);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 14 * Math.cos(angle - 0.5), y2 - 14 * Math.sin(angle - 0.5));
  ctx.lineTo(x2 - 14 * Math.cos(angle + 0.5), y2 - 14 * Math.sin(angle + 0.5));
  ctx.closePath();
  ctx.fill();
  drawLabel(ctx, label, (x1 + x2) / 2 - 22, y1 - 34);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawSandStorm(ctx: CanvasRenderingContext2D, frame: number, width: number, height: number) {
  ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const y = 42 + i * 19;
    const x = (frame * 3 + i * 37) % (width + 80) - 80;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 70, y - 12);
    ctx.stroke();
  }
}

function drawCreature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  name: string,
  alert: boolean,
  scale = 1,
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x + 34 * scale, y - 28 * scale, 42 * scale, 24 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 76 * scale, y - 45 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = alert ? "#ef4444" : "#020617";
  ctx.beginPath();
  ctx.arc(x + 83 * scale, y - 48 * scale, 3.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 5 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 5 * scale, y - 24 * scale);
  ctx.lineTo(x - 18 * scale, y - 45 * scale);
  ctx.stroke();
  drawLabel(ctx, name, x + 6 * scale, y - 96 * scale);
}

function drawBalloon(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  ctx.fillStyle = "#f87171";
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y, 45, 56, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x - 28, y + 62, 56, 30);
  ctx.strokeRect(x - 28, y + 62, 56, 30);
  ctx.strokeStyle = "#020617";
  ctx.beginPath();
  ctx.moveTo(x - 25, y + 42);
  ctx.lineTo(x - 24, y + 62);
  ctx.moveTo(x + 25, y + 42);
  ctx.lineTo(x + 24, y + 62);
  ctx.stroke();
  drawLabel(ctx, "ballon", x - 32, y + 102 + Math.sin(frame * 0.05) * 3);
}

function drawCliff(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#78350f";
  ctx.fillRect(x, y - 18, 90, 120);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(x, y - 24, 90, 12);
  drawLabel(ctx, "afgrond", x - 8, y - 62);
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.fillStyle = "#94a3b8";
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y, 27, 24, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawLabel(ctx, label, x - 36, y - 58);
}

function drawPokeball(ctx: CanvasRenderingContext2D, x: number, y: number, dented: boolean) {
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 5;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(x, y, 45, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = dented ? "#fecaca" : "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 45, 0, Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 45, y);
  ctx.lineTo(x + 45, y);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
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
    <Panel title="Arena: De Noodstop" icon={<Bike />}>
      <div className="space-y-4">
        <p className="font-bold text-slate-700">
          Win 3 korte battles. Fout? Je krijgt een hint.
        </p>
        <QuizPrompt
          question="Route event"
          body="Fietser: 18 km/h. Er steekt iets over. Stop op tijd."
        />
        <FormulaLine label="Formules" value="sreactie = v x t   |   sstop = sreactie + srem" />
        <button className="primary-button w-full" onClick={onStart}>
          Start battle
        </button>
      </div>
    </Panel>
  );
}

function RouteBattlePanel({
  task,
  canGoNext,
  onNext,
}: {
  task: PracticeTask;
  canGoNext: boolean;
  onNext: () => void;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  const questions = useMemo(
    () => [...task.questions, ...(GENERAL_QUESTIONS[task.video] ?? [])],
    [task],
  );
  const question = questions[questionIndex];
  const promptTitle =
    questionIndex < task.questions.length ? "Kijk naar de visual" : "Examen check";
  const isCorrect = selected === question.correctOption;
  const hasAnswered = selected !== null || skipped;
  const isLastQuestion = questionIndex === questions.length - 1;

  const reset = () => {
    setQuestionIndex(0);
    setSelected(null);
    setSkipped(false);
  };

  const nextQuestion = () => {
    setQuestionIndex((current) => Math.min(current + 1, questions.length - 1));
    setSelected(null);
    setSkipped(false);
  };

  return (
    <Panel title={task.title} icon={<Goal />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border-4 border-slate-900 bg-red-500 px-4 py-2 text-white">
          <span className="text-sm font-black">Vraag {questionIndex + 1}</span>
          <span className="text-sm font-black">{questions.length} totaal</span>
        </div>
        <QuizPrompt question={promptTitle} body={question.prompt} />
        <div className="grid gap-2">
          {question.options.map((option, index) => (
            <AnswerButton
              key={option}
              active={selected === index}
              correct={selected === index ? index === question.correctOption : undefined}
              onClick={() => {
                setSkipped(false);
                setSelected(index);
              }}
            >
              {option}
            </AnswerButton>
          ))}
        </div>
        {selected !== null && !isCorrect && !skipped && (
          <FeedbackBox tone="wrong" title="Nog niet">
            {question.hint}
          </FeedbackBox>
        )}
        {isCorrect && !skipped && (
          <FeedbackBox tone="right" title="Goed">
            {question.explanation}
          </FeedbackBox>
        )}
        {skipped && (
          <FeedbackBox tone="info" title="Overgeslagen">
            {question.explanation}
          </FeedbackBox>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {!hasAnswered && (
            <button className="secondary-button w-full" onClick={() => setSkipped(true)}>
              Skip battle
            </button>
          )}
          {hasAnswered && (
            <button className="secondary-button w-full" onClick={reset}>
              Opnieuw
            </button>
          )}
          {hasAnswered && !isLastQuestion && (
            <button className="primary-button w-full" onClick={nextQuestion}>
              Volgende vraag
            </button>
          )}
          {hasAnswered && isLastQuestion && canGoNext && (
            <button className="primary-button w-full" onClick={onNext}>
              Volgende route
            </button>
          )}
        </div>
        <a
          href={task.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="secondary-button w-full"
        >
          <ExternalLink size={16} />
          Bekijk stap
        </a>
      </div>
    </Panel>
  );
}

function ReactionStep({
  catVisible,
  onBrake,
  armed,
  onReady,
}: {
  catVisible: boolean;
  onBrake: () => void;
  armed: boolean;
  onReady: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const correct = selected === "distance";
  const ready = correct || skipped;

  useEffect(() => {
    if (ready) onReady();
  }, [onReady, ready]);

  return (
    <Panel title="Battle 1: Reactietijd" icon={<Gauge />}>
      <div className="space-y-5">
        <QuizPrompt
          question="Wat gebeurt er eerst?"
          body="Kies. Meet daarna je reactietijd."
        />
        <div className="grid gap-2">
          <AnswerButton
            active={selected === "brake"}
            correct={selected === "brake" ? false : undefined}
            onClick={() => setSelected("brake")}
          >
            De fietser staat al stil.
          </AnswerButton>
          <AnswerButton
            active={selected === "distance"}
            correct={selected === "distance" ? true : undefined}
            onClick={() => setSelected("distance")}
          >
            De fietser rijdt nog door met dezelfde snelheid.
          </AnswerButton>
          <AnswerButton
            active={selected === "graph"}
            correct={selected === "graph" ? false : undefined}
            onClick={() => setSelected("graph")}
          >
            De snelheid daalt al naar 0 m/s.
          </AnswerButton>
        </div>
        {selected && !correct && !skipped && (
          <FeedbackBox tone="wrong" title="Nog niet">
            Je remt nog niet. De fiets rijdt door. Gebruik: s = v x t.
          </FeedbackBox>
        )}
        {correct && !skipped && (
          <FeedbackBox tone="right" title="Klopt">
            Wacht tot de kat verschijnt. Druk dan op REM.
          </FeedbackBox>
        )}
        {skipped && (
          <FeedbackBox tone="info" title="Vraag overgeslagen">
            Antwoord: de fietser rijdt nog door. Gebruik: s = v x t.
          </FeedbackBox>
        )}
        <div className="rounded-lg border-4 border-slate-900 bg-white p-4">
          <div className="mb-2 text-sm font-bold uppercase text-slate-400">
            Status
          </div>
          <div className="text-2xl font-black text-slate-950">
            {!ready ? "Kies eerst een antwoord" : catVisible ? "Kat op de weg!" : "Blijf fietsen..."}
          </div>
        </div>
        <button
          className={`h-24 w-full rounded-lg text-4xl font-black transition ${
            catVisible
              ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,.45)] hover:bg-red-400"
              : "border-4 border-slate-900 bg-slate-200 text-slate-500"
          }`}
          disabled={!armed || !ready}
          onClick={onBrake}
        >
          REM!
        </button>
        {!ready && (
          <button className="secondary-button w-full" onClick={() => setSkipped(true)}>
            Skip battle
          </button>
        )}
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
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone;
    title: string;
    body: string;
  } | null>(null);
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
      setFeedback({
        tone: "right",
        title: "Goed",
        body: "Dit is de afstand voor het remmen.",
      });
      onCorrect(expected);
    } else if (!formulaOk) {
      setAttempts((current) => current + 1);
      setFeedback({
        tone: "wrong",
        title: "Kijk naar de formule",
        body: "Hint: gebruik v en t. Dus: s = v x t.",
      });
    } else {
      setAttempts((current) => current + 1);
      setFeedback({
        tone: "wrong",
        title: "Reken nog eens",
        body: `Hint: ${physics.speedMs} x ${physics.reactionTime?.toFixed(2)}.`,
      });
    }
  };

  const skipQuestion = () => {
    setSlots({ v: TOKENS[0], t: TOKENS[1] });
    setAnswer(String(expected).replace(".", ","));
    setFeedback({
      tone: "info",
      title: "Vraag overgeslagen",
      body: `Antwoord: ${physics.speedMs} x ${physics.reactionTime?.toFixed(2)} = ${expected} m.`,
    });
    window.setTimeout(() => onCorrect(expected), 700);
  };

  return (
    <Panel title="Battle 2: Reactieafstand" icon={<Goal />}>
      <div className="space-y-4">
        <QuizPrompt
          question="Hoe ver rolt hij door?"
          body="Sleep v en t. Typ daarna de afstand."
        />
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
              className="cursor-grab rounded-lg border-4 border-slate-900 bg-yellow-100 p-3 text-center font-black text-slate-950 active:cursor-grabbing"
            >
              {token.label} <span className="block text-xs font-bold text-slate-600">{token.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-lg border-4 border-slate-900 bg-white p-3 text-xl font-black text-slate-950">
          <span>s =</span>
          <DropSlot token={slots.v} onDropToken={(id) => dropToken("v", id)} />
          <span>x</span>
          <DropSlot token={slots.t} onDropToken={(id) => dropToken("t", id)} />
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-slate-700">
            Reactieafstand in meter
          </span>
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            inputMode="decimal"
            className="w-full rounded-lg border-4 border-slate-900 bg-white px-4 py-3 text-xl font-black text-slate-950 outline-none ring-red-300/0 transition focus:ring-4"
            placeholder="bijv. 3,50"
          />
        </label>
        {feedback && (
          <FeedbackBox tone={feedback.tone} title={feedback.title}>
            {feedback.body}
            {attempts >= 2 && feedback.tone === "wrong" && (
              <span className="mt-2 block text-white">
                Hint: ongeveer {expected} m.
              </span>
            )}
          </FeedbackBox>
        )}
        <button className="primary-button w-full" onClick={check}>
          Check move
        </button>
        <button className="secondary-button w-full" onClick={skipQuestion}>
          Skip battle
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
      className="grid h-14 min-w-24 place-items-center rounded-lg border-4 border-dashed border-slate-900 bg-lime-100 px-4 text-slate-950"
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
  const [graphAnswer, setGraphAnswer] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone;
    title: string;
    body: string;
  } | null>(null);
  const brakeDistance = round((physics.speedMs * brakeTime) / 2, 2);
  const total = round((physics.reactionDistance || 0) + brakeDistance, 2);
  const margin = round(physics.catDistance - total, 2);
  const graphCorrect = graphAnswer === "triangle";

  const checkStop = () => {
    if (!graphCorrect) {
      setAttempts((current) => current + 1);
      setFeedback({
        tone: "wrong",
        title: "Kijk naar de grafiek",
        body: "Hint: de remweg is de driehoek.",
      });
      return;
    }

    if (margin < 0) {
      setAttempts((current) => current + 1);
      setFeedback({
        tone: "hint",
        title: "Nog te ver",
        body: `Je komt ${Math.abs(margin)} m tekort. Maak de remtijd korter.`,
      });
      return;
    }

    setFeedback({
      tone: "right",
      title: "Veilig",
      body: "De stopafstand is kort genoeg.",
    });
    onFinish(brakeTime);
  };

  const skipQuestion = () => {
    const safeBrakeTime = 1.2;
    setGraphAnswer("triangle");
    setBrakeTime(safeBrakeTime);
    setFeedback({
      tone: "info",
      title: "Vraag overgeslagen",
      body: "Antwoord: de remweg is de driehoek. We gebruiken een korte remtijd.",
    });
    window.setTimeout(() => onFinish(safeBrakeTime), 800);
  };

  return (
    <Panel title="Battle 3: v,t-diagram" icon={<Goal />}>
      <div className="space-y-4">
        <QuizPrompt
          question="Waar zie je de remweg?"
          body="Kies het vlak. Sleep daarna het rempunt."
        />
        <div className="grid gap-2">
          <AnswerButton
            active={graphAnswer === "rectangle"}
            correct={graphAnswer === "rectangle" ? false : undefined}
            onClick={() => setGraphAnswer("rectangle")}
          >
            De rechthoek tijdens reactietijd.
          </AnswerButton>
          <AnswerButton
            active={graphAnswer === "triangle"}
            correct={graphAnswer === "triangle" ? true : undefined}
            onClick={() => setGraphAnswer("triangle")}
          >
            De driehoek onder de schuine rem-lijn.
          </AnswerButton>
        </div>
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
        {feedback && (
          <FeedbackBox tone={feedback.tone} title={feedback.title}>
            {feedback.body}
            {attempts >= 2 && feedback.tone !== "right" && (
              <span className="mt-2 block text-white">
                Hint: probeer 1,2 s.
              </span>
            )}
          </FeedbackBox>
        )}
        <button className="primary-button w-full" onClick={checkStop}>
          Check battle
        </button>
        <button className="secondary-button w-full" onClick={skipQuestion}>
          Skip battle
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
          <div className="text-3xl font-black text-slate-950">
            {success ? "+50 XP" : "Probeer opnieuw"}
          </div>
          <p className="mt-1 font-bold text-slate-700">
            Stopafstand: <b className="text-slate-950">{physics.stopDistance} m</b>.
            Afstand: <b className="text-slate-950">{physics.catDistance} m</b>.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-200">
            Uitleg: stopafstand = reactieafstand + remweg.
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
      className="rounded-lg border-4 border-slate-900 bg-white p-5 text-slate-950 shadow-[6px_6px_0_#020617]"
    >
      <div className="mb-4 flex items-center gap-2 text-slate-950">
        <span className="text-red-500">{icon}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function StartScreen({
  tasks,
  onSelect,
  onStartExercise,
}: {
  tasks: PracticeTask[];
  onSelect: (index: number) => void;
  onStartExercise: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <section className="space-y-5">
        <div className="rounded-lg border-4 border-slate-900 bg-yellow-200 p-5 shadow-[6px_6px_0_#020617]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
            Kracht trainer
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-5xl">
            Kies je route
          </h1>
          <p className="mt-2 max-w-xl text-sm font-black text-slate-700">
            Bekijk de stap. Win daarna de battle.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task, index) => (
            <button
              key={task.video}
              type="button"
              onClick={() => onSelect(index)}
              className="rounded-lg border-4 border-slate-900 bg-white p-4 text-left text-slate-950 shadow-[4px_4px_0_#020617] transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full border-2 border-slate-900 bg-red-500 px-3 py-1 text-xs font-black uppercase text-white">
                  {chapterLabel(task)}
                </span>
                <Play size={18} className="text-red-500" />
              </div>
              <h2 className="text-lg font-black text-slate-950">{task.title}</h2>
              <p className="mt-2 text-sm font-bold text-slate-700">
                {task.skill}
              </p>
            </button>
          ))}
        </div>

        <button className="primary-button" onClick={onStartExercise}>
          Start arena battle
        </button>
      </section>
    </main>
  );
}

function LessonSlider({
  tasks,
  activeIndex,
  onSelect,
  onHome,
}: {
  tasks: PracticeTask[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onHome: () => void;
}) {
  const activeTask = tasks[activeIndex];

  return (
    <section className="sticky top-[65px] z-10 border-b-4 border-slate-900 bg-yellow-200 px-4 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <button className="secondary-button px-3 py-2 text-sm" onClick={onHome}>
            Start
          </button>
          <div className="text-right">
            <div className="text-xs font-black uppercase text-red-600">
              {chapterLabel(activeTask)}
            </div>
            <div className="max-w-[220px] truncate text-sm font-black text-slate-950 sm:max-w-none">
              {activeTask.title}
            </div>
          </div>
        </div>
        <input
          aria-label="Kies stap"
          type="range"
          min={1}
          max={tasks.length}
          step={1}
          value={activeIndex + 1}
          onChange={(event) => onSelect(Number(event.target.value) - 1)}
          className="w-full accent-red-500"
        />
        <div className="mt-1 grid grid-cols-7 text-center text-xs font-black text-slate-400">
          {tasks.map((task, index) => (
            <button
              key={task.video}
              type="button"
              onClick={() => onSelect(index)}
              className={index === activeIndex ? "text-red-600" : "text-slate-600"}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuizPrompt({ question, body }: { question: string; body: string }) {
  return (
    <div className="rounded-lg border-4 border-slate-900 bg-yellow-100 p-4 text-slate-950">
      <div className="text-xs font-black uppercase tracking-wide text-red-600">
        Battle vraag
      </div>
      <div className="mt-1 text-lg font-black text-slate-950">{question}</div>
      <p className="mt-2 text-sm font-bold text-slate-700">{body}</p>
    </div>
  );
}

function AnswerButton({
  active,
  correct,
  onClick,
  children,
}: {
  active: boolean;
  correct?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const stateClass =
    correct === true
      ? "border-lime-600 bg-lime-100 text-slate-950"
      : correct === false
        ? "border-red-600 bg-red-100 text-slate-950"
        : active
          ? "border-cyan-600 bg-cyan-100 text-slate-950"
          : "border-slate-900 bg-white text-slate-950 hover:bg-yellow-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-4 px-4 py-3 text-left text-sm font-black transition ${stateClass}`}
    >
      {children}
    </button>
  );
}

function FeedbackBox({
  tone,
  title,
  children,
}: {
  tone: FeedbackTone;
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-cyan-500 bg-cyan-100 text-slate-950",
    hint: "border-yellow-500 bg-yellow-100 text-slate-950",
    wrong: "border-red-600 bg-red-100 text-slate-950",
    right: "border-lime-600 bg-lime-100 text-slate-950",
  }[tone];

  return (
    <div className={`rounded-lg border-4 p-4 ${styles}`}>
      <div className="mb-1 flex items-center gap-2 font-black">
        <Lightbulb size={17} />
        {title}
      </div>
      <div className="text-sm font-bold leading-relaxed text-slate-800">
        {children}
      </div>
    </div>
  );
}

function FormulaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-slate-900 bg-white p-3">
      <div className="text-xs font-black uppercase text-red-600">{label}</div>
      <div className="mt-1 font-mono text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-4 border-slate-900 bg-white p-3 text-center text-slate-950 shadow-[4px_4px_0_#020617]">
      <div className="text-xs font-black uppercase text-red-600">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
    </div>
  );
}

function RouteMetrics({
  activeTask,
}: {
  activeTask: PracticeTask;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MiniMetric label="stap" value={activeTask.video.replace("Video ", "")} />
      <MiniMetric label="doel" value={activeTask.skill} />
      <MiniMetric label="regel" value={activeTask.method} />
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
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [step, setStep] = useState<Step>("intro");
  const [physics, setPhysics] = useState<PhysicsData>(INITIAL_PHYSICS);
  const [catVisible, setCatVisible] = useState(false);
  const [catAppearedAt, setCatAppearedAt] = useState<number | null>(null);
  const [reactionReady, setReactionReady] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const armed = step === "reaction" && catVisible;
  const activeTask = PRACTICE_TASKS[activeTaskIndex];

  useEffect(() => {
    if (step !== "reaction" || !reactionReady) return;
    setCatVisible(false);
    const delay = 2000 + Math.random() * 2000;
    const timer = window.setTimeout(() => {
      setCatVisible(true);
      setCatAppearedAt(performance.now());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [reactionReady, step]);

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
    setReactionReady(false);
    setStep("reaction");
  };

  const openLesson = (index: number) => {
    setActiveTaskIndex(index);
    setViewMode("lesson");
    setCatVisible(false);
    setCatAppearedAt(null);
    setReactionReady(false);
    setStep("intro");
  };

  const startExercise = () => {
    setViewMode("lesson");
    setStep("reaction");
  };

  if (viewMode === "home") {
    return (
      <div className="min-h-screen bg-cyan-200 font-display text-slate-950">
        <Navbar step={step} xp={xp} streak={streak} />
        <StartScreen
          tasks={PRACTICE_TASKS}
          onSelect={openLesson}
          onStartExercise={startExercise}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyan-200 font-display text-slate-950">
      <Navbar step={step} xp={xp} streak={streak} />
      <Confetti show={confetti} />
      <LessonSlider
        tasks={PRACTICE_TASKS}
        activeIndex={activeTaskIndex}
        onSelect={setActiveTaskIndex}
        onHome={() => setViewMode("home")}
      />

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1.25fr)_430px]">
        <section className="space-y-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Trainer route
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-5xl">
              {activeTask.title}
            </h1>
          </div>
          <SimulationCanvas
            step={step}
            physics={physics}
            catVisible={catVisible}
            taskIndex={activeTaskIndex}
            task={activeTask}
          />
          <RouteMetrics
            activeTask={activeTask}
          />
        </section>

        <aside className="space-y-4">
          <AnimatePresence mode="wait">
            <RouteBattlePanel
              key={activeTask.video}
              task={activeTask}
              canGoNext={activeTaskIndex < PRACTICE_TASKS.length - 1}
              onNext={() => setActiveTaskIndex((current) => Math.min(current + 1, PRACTICE_TASKS.length - 1))}
            />
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
