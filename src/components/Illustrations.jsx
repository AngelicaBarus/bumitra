import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, Eye, Backpack, Footprints } from "lucide-react";

/* ---------- potongan gambar ---------- */
function Defs() {
  return <defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8ec5dd"/><stop offset="1" stopColor="#e6f6f1"/></linearGradient>
    <linearGradient id="watG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4aa0d0"/><stop offset="1" stopColor="#256f9f"/></linearGradient>
  </defs>;
}
function Sky({ step }) {
  const storm = [0.38, 0.6, 0.55, 0][step];
  return <g>
    <rect width="800" height="450" fill="url(#skyG)"/>
    <g className="sc-t" style={{ opacity: step === 3 ? 1 : 0 }}><circle cx="650" cy="86" r="40" fill="#ffd66b"/><circle cx="650" cy="86" r="58" fill="#ffd66b" opacity=".25"/></g>
    <g className="sc-cloud" fill="#fff" opacity=".95"><ellipse cx="170" cy="90" rx="70" ry="24"/><ellipse cx="215" cy="75" rx="46" ry="24"/><ellipse cx="450" cy="60" rx="60" ry="20"/><ellipse cx="490" cy="48" rx="38" ry="19"/></g>
    <rect className="sc-t" width="800" height="450" fill="#27475c" style={{ opacity: storm }}/>
  </g>;
}
function Rain({ step }) {
  const o = [0.55, 1, 0.8, 0][step];
  return <g className="sc-t" style={{ opacity: o }}>{Array.from({ length: 30 }, (_, i) =>
    <line key={i} className="rd" x1={(i * 53) % 840} y1="0" x2={((i * 53) % 840) - 8} y2="20" style={{ animationDelay: `${(i % 10) * 0.09}s` }}/>)}</g>;
}
function House({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><rect y="40" width="110" height="70" fill="#f6e7c8"/><polygon points="-10,42 55,-4 120,42" fill="#b4472f"/><rect x="42" y="68" width="24" height="42" fill="#7a4a2a"/><rect x="12" y="58" width="22" height="20" fill="#9fd3e6"/><rect x="78" y="58" width="22" height="20" fill="#9fd3e6"/></g>;
}
function Tree({ x, y, s = 1, rot = 0 }) {
  return <g className="sc-t" style={{ transform: `translate(${x}px,${y}px) scale(${s}) rotate(${rot}deg)` }}><rect x="-5" y="-40" width="10" height="42" fill="#7a5233"/><circle cy="-58" r="26" fill="#2f8a57"/><circle cx="-16" cy="-44" r="18" fill="#3a9c66"/><circle cx="17" cy="-46" r="18" fill="#3a9c66"/></g>;
}
function Person({ x, y, c = "#e4572e" }) {
  return <g className="sc-t" style={{ transform: `translate(${x}px,${y}px)` }}><circle cy="-31" r="7.5" fill="#f2c9a0"/><path d="M-9 0 L-7 -23 Q0 -28 7 -23 L9 0Z" fill={c}/></g>;
}
function Wave({ y }) {
  return <g className="sc-t" style={{ transform: `translateY(${y}px)` }}>
    <rect y="0" width="800" height="260" fill="url(#watG)"/>
    <path className="sc-wave" d="M-60 0 q30 -12 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 V12 H-60Z" fill="#7cc0e4" opacity=".85"/>
  </g>;
}
function Alert({ on, x, y }) {
  return <g className="sc-t" style={{ opacity: on ? 1 : 0, transform: `translate(${x}px,${y}px)` }}><path d="M0 -44 L22 -6 H-22Z" fill="#f4b400" stroke="#fff" strokeWidth="3"/><text y="-12" textAnchor="middle" fontSize="24" fontWeight="800" fill="#4a3300">!</text></g>;
}

function FloodArt({ step }) {
  const water = [360, 342, 316, 362][step];
  const a = [[510, 338], [510, 338], [250, 262], [205, 272]][step];
  return <>
    <path d="M0 250 Q140 175 300 232 T560 214 T800 240 V450 H0Z" fill="#92c59e"/>
    <path d="M0 300 Q200 244 380 292 T800 286 V450 H0Z" fill="#5fa877"/>
    <Tree x={90} y={262}/><Tree x={165} y={274} s={0.8}/><Tree x={720} y={268} s={0.9}/>
    <House x={440} y={226}/>
    <Person x={a[0]} y={a[1]}/><Person x={a[0] + 22} y={a[1] + 4} c="#2a6fb0"/>
    <Wave y={water}/>
    <Alert on={step === 1} x={640} y={water - 8}/>
  </>;
}
function SlideArt({ step }) {
  const p = [[360, 380], [360, 380], [105, 388], [70, 392]][step];
  const sl = [[0, 0, 0], [0, 0, 0], [45, 70, 1], [90, 130, 1]][step];
  return <>
    <path d="M0 322 Q200 296 440 344 V450 H0Z" fill="#5fa877"/>
    <path d="M430 450 L430 240 Q560 128 800 104 V450Z" fill="#6fae7e"/>
    <path className="sc-t" d="M560 175 Q650 150 745 168 L765 262 Q655 284 560 252Z" fill="#7b5a3a" style={{ opacity: step >= 2 ? 0.55 : 0 }}/>
    <g className="sc-t" style={{ transform: `translate(${sl[0]}px,${sl[1]}px)`, opacity: sl[2] }}><path d="M565 180 Q650 158 740 172 L758 258 Q655 276 565 248Z" fill="#a0714a"/><circle cx="610" cy="215" r="9" fill="#8b6140"/><circle cx="690" cy="232" r="12" fill="#8b6140"/></g>
    <g className="sc-t" stroke="#4a3320" strokeWidth="3" fill="none" strokeLinecap="round" style={{ opacity: step === 1 ? 1 : 0 }}><path d="M575 205 l30 14 l-8 18 l26 12"/><path d="M660 190 l-6 26 l22 10"/></g>
    <ellipse className="sc-t" cx="715" cy="222" rx="7" ry="11" fill="#4aa0d0" style={{ opacity: step >= 1 ? 0.9 : 0 }}/>
    <Tree x={620} y={196} s={0.9} rot={[0, 0, -14, -20][step]}/><Tree x={500} y={246} s={0.7}/>
    <House x={225} y={238}/>
    <Person x={p[0]} y={p[1]}/><Person x={p[0] + 22} y={p[1] + 3} c="#2a6fb0"/>
    <Alert on={step === 1} x={520} y={225}/>
  </>;
}

export function Scene({ kind = "flood", step = 0, slice = false, label }) {
  return <svg className="sc-svg" viewBox="0 0 800 450" preserveAspectRatio={slice ? "xMidYMid slice" : "xMidYMid meet"} role="img" aria-label={label || (kind === "flood" ? "Ilustrasi banjir" : "Ilustrasi tanah longsor")}>
    <Defs/><Sky step={step}/>
    {kind === "flood" ? <FloodArt step={step}/> : <SlideArt step={step}/>}
    <Rain step={step}/>
  </svg>;
}

const reduce = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Latar hero: animasi berputar otomatis */
export function HeroLoop() {
  const [s, setS] = useState(1);
  useEffect(() => { if (reduce()) return; const id = setInterval(() => setS((v) => (v + 1) % 4), 5500); return () => clearInterval(id); }, []);
  // HP: gambar ditampilkan utuh (tidak dipotong); desktop: memenuhi latar.
  const [phone, setPhone] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(max-width:760px)").matches);
  useEffect(() => { const m = matchMedia("(max-width:760px)"); const f = () => setPhone(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return <Scene kind="flood" step={s} slice={!phone} label="Ilustrasi animasi banjir dan evakuasi keluarga"/>;
}

/* ---------- video ilustrasi ---------- */
const DUR = 5000;
const SCRIPT = {
  flood: [
    ["Hujan deras berlangsung lama", "Air sungai mulai naik. Pantau cuaca dan informasi resmi dari BMKG dan BPBD."],
    ["Tanda bahaya muncul", "Air selokan meluap dan masuk ke halaman. Siapkan tas darurat dan dokumen penting."],
    ["Segera menjauh ke tempat aman", "Matikan listrik jika aman, ajak keluarga, dan ikuti arahan petugas. Jangan menerobos banjir."],
    ["Tunggu sampai dinyatakan aman", "Jangan menyalakan listrik atau kembali ke rumah sebelum petugas menyatakan aman."],
  ],
  landslide: [
    ["Hujan deras di daerah perbukitan", "Tanah pada lereng jenuh air. Perhatikan informasi cuaca dan kenali jalur aman."],
    ["Kenali tanda awal longsor", "Muncul retakan baru, pohon miring, atau rembesan air yang tidak biasa."],
    ["Jangan menunggu, segera menjauh", "Ajak keluarga ke tempat aman, beri tahu tetangga dan petugas. Jangan mendekat untuk memotret."],
    ["Waspadai longsor susulan", "Jangan mendekati lokasi dan jangan kembali sebelum dinyatakan aman."],
  ],
};

export function Explainer({ kind = "flood" }) {
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(() => !reduce());
  const [p, setP] = useState(0);
  const data = SCRIPT[kind];
  useEffect(() => { setStep(0); setP(0); }, [kind]);
  useEffect(() => { if (!play) return; const id = setInterval(() => setP((v) => v + 100), 100); return () => clearInterval(id); }, [play]);
  useEffect(() => { if (p >= DUR) { setP(0); setStep((s) => (s + 1) % 4); } }, [p]);
  const go = (i) => { setStep(i); setP(0); };
  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${data[step][0]}. ${data[step][1]}`); u.lang = "id-ID"; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };
  return <div className="x-vid">
    <div className="x-vid-stage">
      <div className="x-frame"><Scene kind={kind} step={step}/>
        <span className="x-badge">VIDEO ILUSTRASI</span>
        <div className="x-cap"><b>{step + 1}. {data[step][0]}</b></div>
        {!play && <button className="x-bigplay" onClick={() => setPlay(true)} aria-label="Putar"><Play size={34}/></button>}
      </div>
      <div className="x-bar"><i style={{ width: `${Math.min(100, ((step + p / DUR) / 4) * 100)}%` }}/></div>
      <div className="x-ctrl">
        <button onClick={() => setPlay(!play)}>{play ? <><Pause size={17}/> Jeda</> : <><Play size={17}/> Putar</>}</button>
        <button onClick={() => { go(0); setPlay(true); }}><RotateCcw size={17}/> Ulangi</button>
        <button onClick={speak}><Volume2 size={17}/> Dengarkan</button>
      </div>
    </div>
    <ol className="x-steps">{data.map((d, i) => <li key={i}><button className={i === step ? "on" : ""} onClick={() => go(i)}><span>{i + 1}</span><div><b>{d[0]}</b><small>{d[1]}</small></div></button></li>)}</ol>
  </div>;
}

export function ExplainerSection({ kind, className = "" }) {
  const [k, setK] = useState(kind || "flood");
  return <section className={`x-explain ${className}`}>
    <div className="x-explain-head"><div><span className="eyebrow">VIDEO ILUSTRASI</span><h2>Lihat langkahnya, lebih mudah dipahami</h2><p>Empat langkah singkat yang bisa dipahami siapa saja, juga bisa didengarkan.</p></div>
      {!kind && <div className="guide-switch"><button className={k === "flood" ? "active" : ""} onClick={() => setK("flood")}>Banjir</button><button className={k === "landslide" ? "active" : ""} onClick={() => setK("landslide")}>Tanah longsor</button></div>}
    </div>
    <Explainer kind={kind || k}/>
  </section>;
}

export function Steps3() {
  const it = [[Eye, "Kenali", "Pelajari tanda bahaya banjir dan longsor di sekitar rumah."], [Backpack, "Siapkan", "Siapkan tas darurat, dokumen, dan rencana keluarga."], [Footprints, "Selamatkan diri", "Menjauh lebih awal dan ikuti arahan petugas."]];
  return <section className="content-section x-steps3">{it.map(([I, t, d], i) => <article key={t}><span className="n">{i + 1}</span><I size={26}/><h3>{t}</h3><p>{d}</p></article>)}</section>;
}

/* ilustrasi kecil untuk tips lingkungan */
export function MiniArt({ kind }) {
  const g = <rect y="92" width="160" height="28" fill="#bfe3c8"/>;
  const a = {
    trash: <><rect x="58" y="48" width="44" height="50" rx="5" fill="#2c8a5c"/><rect x="52" y="40" width="56" height="9" rx="4" fill="#1f6f49"/><path d="M70 58v32M90 58v32" stroke="#bfe3c8" strokeWidth="3"/><circle cx="125" cy="36" r="6" fill="#f4b400"/><circle cx="36" cy="30" r="5" fill="#e4572e"/></>,
    tree: <><rect x="76" y="56" width="10" height="42" fill="#7a5233"/><circle cx="81" cy="42" r="26" fill="#2f8a57"/><circle cx="62" cy="54" r="16" fill="#3a9c66"/><circle cx="100" cy="54" r="16" fill="#3a9c66"/></>,
    drain: <><rect y="72" width="160" height="48" fill="#cfe4d6"/><rect y="84" width="160" height="14" fill="#4aa0d0"/><path className="sc-wave" d="M-20 90 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" strokeWidth="2" fill="none" opacity=".8"/><rect x="60" y="56" width="40" height="10" rx="3" fill="#7a8a93"/></>,
    sprout: <><path d="M40 98 Q80 60 120 98Z" fill="#9b7653"/><path d="M80 82 V46" stroke="#2f8a57" strokeWidth="5" strokeLinecap="round"/><path d="M80 56 Q56 56 52 36 Q76 34 80 56Z" fill="#3a9c66"/><path d="M80 50 Q104 50 108 30 Q84 28 80 50Z" fill="#4cb87a"/></>,
  }[kind];
  return <svg viewBox="0 0 160 120" className="x-mini" aria-hidden="true">{kind !== "drain" && g}{a}</svg>;
}
