import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, Info } from "lucide-react";

/* Tanya cuaca dengan suara.
   - Mendengar: Web Speech API (SpeechRecognition), bahasa Indonesia.
   - Menjawab: speechSynthesis; di Chrome/Android suaranya adalah suara Google bahasa Indonesia.
   - Isi jawaban HANYA dari data prakiraan BMKG yang sedang tampil di halaman Cuaca. */

const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

const SUGGEST = ["Bagaimana cuaca hari ini?", "Apakah akan hujan?", "Bagaimana cuaca besok?", "Berapa suhu sekarang?"];

const PARTS = [
  { re: /\b(pagi)\b/, label: "pagi", from: 5, to: 10 },
  { re: /\b(siang)\b/, label: "siang", from: 11, to: 14 },
  { re: /\b(sore)\b/, label: "sore", from: 15, to: 17 },
  { re: /\b(malam)\b/, label: "malam", from: 18, to: 28 }, // 18:00 - 04:59 (28 = 04 + 24)
];

const hourOf = (t) => Number(String(t).slice(0, 2));
const inPart = (item, part) => {
  const h = hourOf(item.time);
  return part.label === "malam" ? (h >= 18 || h <= 4) : h >= part.from && h <= part.to;
};
const num = (x) => Number(x);
const isRainy = (i) => /hujan|gerimis|petir/i.test(i.description) || num(i.rain) > 0;
const jam = (i) => `pukul ${i.time}${""}`.replace(":", ".");
const range = (a, b) => (a === b ? `sekitar ${a}` : `${a} sampai ${b}`);
const list = (arr) => arr.length <= 1 ? arr.join("") : `${arr.slice(0, -1).join(", ")} dan ${arr[arr.length - 1]}`;

export function buildAnswer(question, data) {
  if (!data?.items?.length) {
    return "Data cuaca belum tampil. Pilih dulu desa atau kelurahan Anda sampai prakiraan BMKG muncul di halaman ini, lalu tanyakan lagi.";
  }
  const q = question.toLowerCase();
  const items = data.items;
  const parts = String(data.place || "").split(",").map((s) => s.trim()).filter(Boolean);
  const place = parts.length > 2 ? `${parts[0]}, ${parts[2]}` : parts.join(", ") || "lokasi terpilih";
  const dates = [...new Set(items.map((i) => i.date))];

  let dayIdx = 0;
  if (/\blusa\b/.test(q) && dates[2]) dayIdx = 2;
  else if (/\bbesok\b/.test(q)) dayIdx = 1;
  const askedOtherDay = dayIdx > 0;
  if (dayIdx >= dates.length) {
    return `Prakiraan yang tersedia di halaman ini baru sampai ${dates.length > 1 ? "besok" : "hari ini"}, jadi saya belum bisa menjawab untuk hari yang Anda tanyakan.`;
  }
  const day = dates[dayIdx];
  const dayLabel = dayIdx === 0 ? "hari ini" : dayIdx === 1 ? "besok" : "lusa";
  const part = PARTS.find((p) => p.re.test(q));
  let slots = items.filter((i) => i.date === day);
  if (part) slots = slots.filter((i) => inPart(i, part));
  const when = part ? (dayIdx === 0 ? `${part.label} ini` : `${dayLabel} ${part.label}`) : dayLabel;
  if (!slots.length) {
    return `Prakiraan untuk ${when} di ${place} belum tersedia pada data yang tampil.`;
  }

  const temps = slots.map((i) => num(i.temperature)).filter(Number.isFinite);
  const tMin = Math.min(...temps), tMax = Math.max(...temps);
  const rainy = slots.filter(isRainy);
  const heavy = slots.filter((i) => i.heavy);
  const now = items[0];
  const useNow = dayIdx === 0 && !part;
  const ref = useNow ? now : slots[0];

  if (/bahaya|waspada|banjir|longsor|aman|siaga|lebat/.test(q)) {
    if (heavy.length) {
      return `Perhatian. Untuk ${when} di ${place}, prakiraan BMKG memuat hujan lebat atau petir ${list(heavy.slice(0, 3).map(jam))}. Jika Anda tinggal dekat sungai atau lereng, tingkatkan kewaspadaan dan ikuti arahan petugas.`;
    }
    return `Untuk ${when} di ${place}, tidak ada prakiraan hujan lebat atau petir pada data yang tampil. Tetap pantau pembaruan resmi BMKG, terutama jika Anda tinggal dekat sungai atau lereng.`;
  }

  if (/hujan|payung|jas hujan|basah|gerimis/.test(q)) {
    if (!rainy.length) return `Tidak ada prakiraan hujan untuk ${when} di ${place} pada data yang tampil.`;
    const peak = Math.max(...rainy.map((i) => num(i.rain) || 0));
    const desc = [...new Set(rainy.map((i) => i.description.toLowerCase()))].slice(0, 2).join(" dan ");
    return `Ya, ada prakiraan ${desc} untuk ${when} di ${place}, yaitu ${list(rainy.slice(0, 3).map(jam))}${rainy.length > 3 ? " dan beberapa waktu lainnya" : ""}.${peak > 0 ? ` Curah hujan tertinggi sekitar ${peak} milimeter.` : ""} Sebaiknya bawa payung.`;
  }

  if (/suhu|panas|dingin|derajat|gerah|hawa/.test(q)) {
    if (useNow) return `Suhu sekarang di ${place} sekitar ${ref.temperature} derajat Celsius. Sisa hari ini suhu ${tMin === tMax ? "tetap" : "berkisar"} ${range(tMin, tMax)} derajat Celsius.`;
    return `Suhu ${when} di ${place} berkisar ${range(tMin, tMax)} derajat Celsius.`;
  }

  if (/angin/.test(q)) {
    const w = slots.map((i) => num(i.wind)).filter(Number.isFinite);
    return `Kecepatan angin ${useNow ? "sekarang" : when} di ${place} sekitar ${useNow ? ref.wind : Math.max(...w)} kilometer per jam${useNow ? "" : " pada puncaknya"}.`;
  }

  if (/lembap|lembab|kelembapan/.test(q)) {
    return `Kelembapan udara ${useNow ? "sekarang" : when} di ${place} sekitar ${ref.humidity} persen.`;
  }

  // Ringkasan umum
  const out = [];
  if (useNow) {
    out.push(`Cuaca di ${place} saat ini ${ref.description.toLowerCase()}, suhu ${ref.temperature} derajat Celsius, kelembapan ${ref.humidity} persen, dan angin ${ref.wind} kilometer per jam.`);
    out.push(`Sisa hari ini suhu ${tMin === tMax ? "tetap" : "berkisar"} ${range(tMin, tMax)} derajat Celsius.`);
  } else {
    const descs = [...new Set(slots.map((i) => i.description.toLowerCase()))].slice(0, 3);
    out.push(`Prakiraan cuaca ${when} di ${place}: ${list(descs)}, dengan suhu ${range(tMin, tMax)} derajat Celsius.`);
  }
  out.push(rainy.length ? `Ada prakiraan hujan ${list(rainy.slice(0, 3).map(jam))}.` : "Tidak ada prakiraan hujan.");
  if (heavy.length) out.push("Waspada, ada prakiraan hujan lebat atau petir. Ikuti arahan petugas bila perlu.");
  if (!askedOtherDay && !part) out.push("Data ini dari prakiraan BMKG.");
  return out.join(" ");
}

function pickVoice(voices) {
  const id = voices.filter((v) => /^id([-_]|$)/i.test(v.lang) || /indonesia/i.test(v.name));
  return id.find((v) => /google/i.test(v.name)) || id[0] || null;
}

export default function VoiceWeather({ data }) {
  const [state, setState] = useState("idle"); // idle | listening | speaking
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const dataRef = useRef(data);
  const recRef = useRef(null);
  const voiceRef = useRef(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if (!canSpeak) return;
    const load = () => { voiceRef.current = pickVoice(window.speechSynthesis.getVoices()); };
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
      window.speechSynthesis.cancel();
      try { recRef.current?.abort(); } catch { /* ignore */ }
    };
  }, [canSpeak]);

  const speak = useCallback((text) => {
    if (!canSpeak) { setState("idle"); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.95;
    u.onstart = () => setState("speaking");
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    window.speechSynthesis.speak(u);
  }, [canSpeak]);

  const respond = useCallback((question) => {
    const text = buildAnswer(question, dataRef.current);
    setHeard(question);
    setReply(text);
    if (canSpeak && !voiceRef.current && window.speechSynthesis.getVoices().length) {
      setNote("Suara bahasa Indonesia tidak ditemukan di perangkat ini; jawaban dibacakan dengan suara bawaan.");
    }
    speak(text);
  }, [speak, canSpeak]);

  function listen() {
    if (!SR) return;
    if (canSpeak) window.speechSynthesis.cancel();
    setNote(""); setHeard(""); setReply("");
    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    let finalText = "";
    rec.onstart = () => setState("listening");
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      finalText = t;
      setHeard(t);
    };
    rec.onerror = (e) => {
      setState("idle");
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setNote("Izin mikrofon ditolak. Izinkan mikrofon pada pengaturan peramban, lalu coba lagi.");
      else if (e.error === "no-speech") setNote("Suara tidak terdengar. Tekan tombol mikrofon lalu bicara lagi.");
      else if (e.error === "audio-capture") setNote("Mikrofon tidak ditemukan pada perangkat ini.");
      else if (e.error === "network") setNote("Pengenalan suara membutuhkan koneksi internet.");
      else if (e.error !== "aborted") setNote("Suara belum dapat dikenali. Coba lagi.");
    };
    rec.onend = () => {
      recRef.current = null;
      if (finalText.trim()) respond(finalText.trim()); else setState((s) => (s === "listening" ? "idle" : s));
    };
    recRef.current = rec;
    try { rec.start(); } catch { setState("idle"); }
  }

  function stop() {
    try { recRef.current?.abort(); } catch { /* ignore */ }
    if (canSpeak) window.speechSynthesis.cancel();
    setState("idle");
  }

  const busy = state !== "idle";
  const label = state === "listening" ? "Mendengarkan… bicara sekarang" : state === "speaking" ? "Membacakan jawaban…" : "Tekan dan tanyakan cuaca";

  return (
    <section className="voice-wx" aria-label="Tanya cuaca dengan suara">
      <div className="voice-wx-head">
        <span className="voice-wx-ic"><Volume2 size={20} /></span>
        <div>
          <h2>Tanya cuaca dengan suara</h2>
          <p>Tekan mikrofon lalu ucapkan, misalnya “bagaimana cuaca hari ini?”. Jawaban dibacakan berdasarkan data BMKG yang tampil di halaman ini.</p>
        </div>
      </div>

      <div className="voice-wx-controls">
        {SR ? (
          <button type="button" className={`voice-mic ${state}`} onClick={busy ? stop : listen} aria-pressed={busy} aria-label={busy ? "Hentikan" : "Mulai bertanya dengan suara"}>
            {busy ? <Square size={22} /> : <Mic size={24} />}
          </button>
        ) : (
          <div className="voice-unsupported"><Info size={18} /><span>Peramban ini belum mendukung pengenalan suara. Gunakan Google Chrome atau Edge, atau pilih pertanyaan di bawah.</span></div>
        )}
        {SR && <span className="voice-state" role="status">{label}</span>}
      </div>

      <div className="voice-chips" aria-label="Pertanyaan cepat">
        {SUGGEST.map((s) => <button type="button" key={s} onClick={() => { stop(); respond(s); }}>{s}</button>)}
      </div>

      {(heard || reply) && (
        <div className="voice-log" aria-live="polite">
          {heard && <p className="voice-q"><b>Anda:</b> {heard}</p>}
          {reply && <p className="voice-a"><b>Jawaban:</b> {reply}</p>}
        </div>
      )}
      {!data && !reply && <p className="voice-hint"><Info size={14} /> Pilih desa/kelurahan di atas sampai data cuaca tampil agar pertanyaan dapat dijawab.</p>}
      {note && <p className="voice-note" role="status">{note}</p>}
    </section>
  );
}
