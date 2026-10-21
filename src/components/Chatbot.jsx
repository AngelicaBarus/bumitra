import { useEffect, useMemo, useRef, useState } from "react";
import { answers } from "../data/answers.js";
import { Bot, X, Send, ShieldCheck, MessageCircle, Waves, Mountain, Leaf, CloudSun, MapPin, Backpack, ChevronRight, RotateCcw, Sparkles, Phone, ExternalLink, ArrowRight } from "lucide-react";

const categories = [
 {id:"banjir",label:"Waspada banjir",icon:Waves,color:"blue",questions:["Apa itu banjir?","Apa tanda-tanda banjir?","Apa yang harus dilakukan sebelum banjir?","Apa yang harus dilakukan saat banjir?","Apa yang harus dilakukan setelah banjir?","Apa yang tidak boleh dilakukan saat banjir?"]},
 {id:"longsor",label:"Waspada tanah longsor",icon:Mountain,color:"earth",questions:["Apa itu tanah longsor?","Apa tanda-tanda tanah longsor?","Apa yang harus dilakukan sebelum longsor?","Apa yang harus dilakukan jika ada tanda bahaya longsor?","Apa yang harus dilakukan setelah longsor?"]},
 {id:"cuaca",label:"Cuaca",icon:CloudSun,color:"sun",questions:["Apa yang harus dilakukan saat hujan deras?","Mengapa perlu memeriksa cuaca?","Di mana melihat prakiraan cuaca resmi?"]},
 {id:"wilayah",label:"Cek wilayah",icon:MapPin,color:"green",questions:["Bagaimana cara menggunakan peta risiko?","Apa arti warna pada peta risiko?","Apakah wilayah hijau berarti bebas bencana?"]},
 {id:"lingkungan",label:"Jaga lingkungan",icon:Leaf,color:"green",questions:["Bagaimana cara menjaga lingkungan?","Mengapa sampah tidak boleh dibuang ke selokan?","Mengapa pohon dan daerah resapan perlu dijaga?","Apa yang bisa dilakukan bersama tetangga?"]},
 {id:"persiapan",label:"Persiapan keluarga",icon:Backpack,color:"gold",questions:["Apa yang perlu disiapkan sebelum bencana?","Apa saja yang perlu ada di tas darurat?","Bagaimana membuat keluarga lebih siap?"]},
 {id:"bantuan",label:"Butuh bantuan",icon:Phone,color:"coral",questions:["Apa yang harus dilakukan saat keadaan darurat?","Bagaimana mencari tempat evakuasi?","Bagaimana menghubungi BPBD Kota Medan?"]}
];
const normalize=(s)=>s.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const A=(k)=>answers[k];
const SRC="Sumber: panduan SIGMA-BUMI";
const ok=(text,suggest)=>({text,kind:"materi",suggest});
const info=(text,suggest)=>({text,kind:"info",suggest});
const STOP=new Set("apa yang di ke dari dan atau untuk dengan pada itu ini saya kita kami anda adalah apakah bagaimana mengapa kenapa bisa dapat harus perlu cara saja ada tidak jika bila kalau agar supaya akan sudah belum sebagai oleh dalam lebih juga mau tolong dong ya kah lah".split(" "));
const tokens=(q)=>normalize(q).split(" ").filter(w=>w.length>2&&!STOP.has(w));
const allQuestions=categories.flatMap(c=>c.questions);
function closest(q){
 const t=new Set(tokens(q)); if(!t.size) return [];
 return allQuestions.map(x=>{const u=new Set(tokens(x));let hit=0;t.forEach(w=>{if(u.has(w))hit++});return {x,score:hit/Math.max(1,Math.min(t.size,u.size))*Math.min(1,hit/2)}}).filter(r=>r.score>=0.5).sort((a,b)=>b.score-a.score).slice(0,3).map(r=>r.x);
}
const TOPIC_HELP={
 banjir:["Apa tanda-tanda banjir?","Apa yang harus dilakukan sebelum banjir?","Apa yang harus dilakukan saat banjir?","Apa yang harus dilakukan setelah banjir?"],
 longsor:["Apa tanda-tanda tanah longsor?","Apa yang harus dilakukan sebelum longsor?","Apa yang harus dilakukan jika ada tanda bahaya longsor?","Apa yang harus dilakukan setelah longsor?"]
};
const OFFICIAL="Untuk informasi resmi, gunakan menu Cuaca (data BMKG), menu Peta Risiko (data InaRISK BNPB), BPBD setempat, atau hubungi 112 jika keadaan mendesak.";
function answerFor(question){
 const q=normalize(question);
 if(!q) return info("Silakan tulis atau pilih pertanyaan.");
 if(answers[q]) return ok(answers[q]);
 if(/^(halo|hai|hi|hello|selamat (pagi|siang|sore|malam)|assalamualaikum|permisi)\b/.test(q)&&q.split(" ").length<=4) return info("Halo! Saya Sahabat SIGMA. Saya bisa menjelaskan materi tentang banjir, tanah longsor, cuaca, peta risiko, persiapan keluarga, dan menjaga lingkungan.",["Apa tanda-tanda banjir?","Apa tanda-tanda tanah longsor?","Bagaimana cara menggunakan peta risiko?"]);
 if(/^(terima kasih|makasih|thanks|thank you|oke|ok|siap)\b/.test(q)&&q.split(" ").length<=4) return info("Sama-sama. Tetap waspada dan pantau informasi resmi ya.");
 if(/(tolong|darurat|terjebak|hanyut|terkubur|tertimbun|korban|terendam)/.test(q)&&/(sekarang|lagi|sedang|saat ini|rumah|saya|kami|keluarga)/.test(q)&&!/(apa yang harus|bagaimana|cara)/.test(q)) return info("Jika Anda atau orang lain dalam bahaya sekarang, segera hubungi 112 atau petugas setempat dan menjauh dari lokasi berbahaya jika jalurnya aman. Saya hanya chatbot edukasi dan tidak dapat mengirim bantuan.\n\nInformasi 112 Kota Medan: https://portalsmartcity.medan.go.id/welcome/detail_call");
 const realtime=/(hari ini|sekarang|saat ini|besok|lusa|nanti|minggu ini|bulan ini|malam ini|barusan|terbaru|terkini|kemarin)/.test(q)&&/(cuaca|hujan|banjir|longsor|suhu|angin|bencana|status|siaga|peringatan)/.test(q);
 const predict=/(prediksi|ramalan|memprediksi|akan terjadi|bakal|kapan (akan )?(terjadi )?(banjir|longsor|hujan)|apakah .*(akan|bakal|sedang))/.test(q);
 const placeRisk=/(apakah|seberapa|tingkat|status).*(rawan|aman|bahaya|risiko|terdampak).*(di|daerah|wilayah|desa|kelurahan|kecamatan|kota|kabupaten|provinsi|rumah saya|tempat saya)\b|(apakah|apa).*(desa|kelurahan|kecamatan|kota|kabupaten|daerah|wilayah|rumah) .*(rawan|aman|terdampak)/.test(q)&&!/(cara|bagaimana|langkah|tanda|ciri|persiapan|arti|warna)/.test(q);
 if(realtime||predict||placeRisk) return info("Saya tidak punya data cuaca atau kejadian terkini, dan tidak bisa memprediksi atau menebak kondisi suatu lokasi.\n\n• Prakiraan cuaca per desa/kelurahan: menu Cuaca (data BMKG).\n• Tingkat bahaya banjir/longsor di suatu lokasi: menu Peta Risiko (data InaRISK BNPB).\n• Peringatan dini resmi: https://www.bmkg.go.id/cuaca/peringatan-dini-cuaca\n\nJika keadaan mendesak, hubungi 112 atau BPBD setempat.");
 const other=q.match(/(gempa|tsunami|gunung berapi|erupsi|kebakaran|karhutla|puting beliung|angin kencang|badai|kekeringan|likuefaksi|abrasi|covid|pandemi)/);
 if(other&&!/(banjir|longsor)/.test(q)) return info("Materi SIGMA-BUMI berfokus pada banjir dan tanah longsor, jadi saya tidak punya panduan tentang "+other[1]+". Agar tidak keliru, ikuti informasi resmi.\n\n"+OFFICIAL);
 if(/banjir bandang/.test(q)) return info("Materi SIGMA-BUMI membahas banjir secara umum dan belum memuat panduan khusus banjir bandang. Untuk banjir bandang, ikuti arahan petugas. Panduan umum banjir:",TOPIC_HELP.banjir);
 const flood=/(banjir|genangan|sungai meluap|air meluap)/.test(q), slide=/(longsor|lereng|tanah bergerak|tebing)/.test(q);
 if(flood&&!slide){
  if(/(sebelum|persiapan|antisipasi|cegah|mencegah|musim hujan)/.test(q)) return ok(A("apa yang harus dilakukan sebelum banjir?"));
  if(/(setelah|sesudah|pasca|usai|surut|membersihkan)/.test(q)) return ok(A("apa yang harus dilakukan setelah banjir?"));
  if(/(tidak boleh|jangan|larangan|pantangan|dilarang)/.test(q)) return ok(A("apa yang tidak boleh dilakukan saat banjir?"));
  if(/(tanda|ciri|gejala|pertanda|waspada)/.test(q)) return ok(A("apa tanda-tanda banjir?"));
  if(/(apa itu|pengertian|definisi|arti|penyebab|mengapa|kenapa|terjadi karena)/.test(q)) return ok(A("apa itu banjir?"));
  if(/(saat|ketika|sedang|terjadi|menghadapi|bertindak|selamat|menyelamatkan|jika|bila|kalau|lakukan|tindakan)/.test(q)) return ok(A("apa yang harus dilakukan saat banjir?"));
  return info("Saya punya panduan banjir berikut. Pilih salah satu agar jawabannya tepat:",TOPIC_HELP.banjir);
 }
 if(slide&&!flood){
  if(/(sebelum|persiapan|antisipasi|cegah|mencegah)/.test(q)) return ok(A("apa yang harus dilakukan sebelum longsor?"));
  if(/(setelah|sesudah|pasca|usai|susulan)/.test(q)) return ok(A("apa yang harus dilakukan setelah longsor?"));
  if(/(tanda bahaya|jika ada tanda|melihat tanda|menemukan tanda|saat|ketika|sedang|terjadi|menghadapi|menyelamatkan|selamat|lakukan|tindakan|retak)/.test(q)) return ok(A("apa yang harus dilakukan jika ada tanda bahaya longsor?"));
  if(/(tanda|ciri|gejala|pertanda|waspada)/.test(q)) return ok(A("apa tanda-tanda tanah longsor?"));
  if(/(apa itu|pengertian|definisi|arti|penyebab|mengapa|kenapa|terjadi karena)/.test(q)) return ok(A("apa itu tanah longsor?"));
  return info("Saya punya panduan tanah longsor berikut. Pilih salah satu agar jawabannya tepat:",TOPIC_HELP.longsor);
 }
 if(flood&&slide) return info("Pertanyaan Anda menyebut banjir dan longsor sekaligus. Pilih salah satu panduan agar jawabannya tepat:",[...TOPIC_HELP.banjir.slice(0,2),...TOPIC_HELP.longsor.slice(0,2)]);
 if(/(retakan|retak).*(tanah|dinding|lereng)|(pohon|tiang).*miring/.test(q)) return ok(A("apa yang harus dilakukan jika ada tanda bahaya longsor?"));
 if(/(bpbd)/.test(q)) return ok(A("bagaimana menghubungi bpbd kota medan?"));
 if(/(evakuasi|pengungsi|pengungsian|mengungsi)/.test(q)) return ok(A("bagaimana mencari tempat evakuasi?"));
 if(/(tas darurat|tas siaga|isi tas|perlengkapan darurat)/.test(q)) return ok(A("apa saja yang perlu ada di tas darurat?"));
 if(/(sampah|selokan|got|saluran air|drainase)/.test(q)) return ok(A("mengapa sampah tidak boleh dibuang ke selokan?"));
 if(/(pohon|tanaman|resapan|ruang terbuka hijau|vegetasi|hutan)/.test(q)) return ok(A("mengapa pohon dan daerah resapan perlu dijaga?"));
 if(/(tetangga|kerja bakti|gotong royong)/.test(q)) return ok(A("apa yang bisa dilakukan bersama tetangga?"));
 if(/(lingkungan)/.test(q)) return ok(A("bagaimana cara menjaga lingkungan?"));
 if(/(hijau).*(bebas|aman)|(bebas|aman).*(hijau)/.test(q)) return ok(A("apakah wilayah hijau berarti bebas bencana?"));
 if(/(warna|legenda|merah|kuning|hijau)/.test(q)&&/(peta|risiko|rawan)/.test(q)) return ok(A("apa arti warna pada peta risiko?"));
 if(/(peta|inarisk)/.test(q)) return ok(A("bagaimana cara menggunakan peta risiko?"));
 if(/(bmkg|prakiraan|peringatan dini)/.test(q)) return ok(A("di mana melihat prakiraan cuaca resmi?"));
 if(/(hujan deras|hujan lebat)/.test(q)&&!/(apa itu|pengertian|definisi|arti)/.test(q)) return ok(A("apa yang harus dilakukan saat hujan deras?"));
 if(/(cuaca)/.test(q)) return ok(A("mengapa perlu memeriksa cuaca?"));
 if(/(112|keadaan darurat|situasi darurat|kondisi darurat)/.test(q)) return ok(A("apa yang harus dilakukan saat keadaan darurat?"));
 if(/(keluarga).*(siap|persiapan)|(siap|persiapan).*(keluarga)/.test(q)) return ok(A("bagaimana membuat keluarga lebih siap?"));
 if(/(persiapan|siapkan|menyiapkan|sebelum bencana|dokumen penting)/.test(q)) return ok(A("apa yang perlu disiapkan sebelum bencana?"));
 const near=closest(question);
 if(near.length) return info("Saya belum yakin maksud pertanyaan Anda. Apakah salah satu ini yang Anda maksud?",near);
 return info("Maaf, saya belum punya informasi tentang itu di materi SIGMA-BUMI, dan saya tidak ingin menjawab dengan menebak.\n\nSaya bisa membantu seputar banjir, tanah longsor, cuaca, peta risiko, persiapan keluarga, bantuan, dan menjaga lingkungan. Silakan pilih topik di bawah.\n\n"+OFFICIAL);
}
function getTopic(id){return categories.find(c=>c.id===id)}
export default function Chatbot(){
 const [open,setOpen]=useState(false); const [input,setInput]=useState(""); const [activeCategory,setActiveCategory]=useState("banjir"); const [showTopics,setShowTopics]=useState(true); const [messages,setMessages]=useState([]); const bottomRef=useRef(null); const inputRef=useRef(null);
 useEffect(()=>{const openChat=(e)=>{setOpen(true);const topic=e?.detail?.topic;if(topic&&topic!=="mulai"&&topic!=="semua"){setActiveCategory(topic);setShowTopics(false)}if(topic==="semua")setShowTopics(true);};window.addEventListener("open-sigma-chat",openChat);return()=>window.removeEventListener("open-sigma-chat",openChat)},[]);
 useEffect(()=>{if(open)bottomRef.current?.scrollIntoView({behavior:"smooth",block:"end"})},[messages,open]);
 const category=useMemo(()=>getTopic(activeCategory)||categories[0],[activeCategory]);
 function send(text=input){const value=text.trim();if(!value)return;setMessages(old=>[...old,{role:"user",text:value},{role:"bot",...answerFor(value)}]);setInput("");setShowTopics(false);}
 function reset(){setMessages([]);setActiveCategory("banjir");setShowTopics(true);setInput("")}
 return <>
  {!open && <button className="chat-fab" aria-label="Buka Sahabat SIGMA" onClick={()=>setOpen(true)}><MessageCircle size={20}/><span>Sahabat SIGMA</span><span className="chat-fab-sparkle"><Sparkles size={12}/></span></button>}
  {open&&<div className="chat-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="chat-panel chat-panel-new" aria-label="Sahabat SIGMA" role="dialog" aria-modal="true" aria-labelledby="chat-title">
   <header className="chat-head-new"><div className="chat-avatar-new"><Bot size={25}/><span></span></div><div className="chat-head-copy"><strong id="chat-title">Sahabat SIGMA</strong><small><i></i> Teman belajar kesiapsiagaan</small></div><button className="chat-reset" onClick={reset} title="Mulai percakapan baru" aria-label="Mulai percakapan baru"><RotateCcw size={17}/></button><button className="chat-close-new" aria-label="Tutup chatbot" onClick={()=>setOpen(false)}><X size={20}/></button></header>
   <div className="chat-safety-strip"><ShieldCheck size={15}/> Materi edukasi dari panduan SIGMA-BUMI. Bukan layanan darurat.</div>
   <div className="chat-thread" role="log" aria-live="polite">
    {messages.length===0&&<div className="chat-welcome"><div className="welcome-art"><div className="welcome-art-circle"><Bot size={35}/></div><span className="welcome-spark s1">✦</span><span className="welcome-spark s2">✧</span></div><span className="welcome-eyebrow">HALO, SAHABAT!</span><h2>Mau belajar apa<br/>hari ini?</h2><p>Pilih topik dan pertanyaan yang sudah disiapkan. Saya akan membantu menjelaskan dengan bahasa yang sederhana.</p><div className="welcome-pills"><span><Waves size={13}/> Banjir</span><span><Mountain size={13}/> Longsor</span><span><Leaf size={13}/> Lingkungan</span></div></div>}
    {messages.map((m,i)=><div key={i} className={`chat-message-row ${m.role}`}><div className="message-avatar">{m.role==="bot"?<Bot size={16}/>:"K"}</div><div className="chat-message-content"><span className="message-name">{m.role==="bot"?"Sahabat SIGMA":"Anda"}</span><div className={`chat-bubble-new ${m.role}`}>{m.text.split("\n").map((line,j)=><span className="message-line" key={j}>{line||" "}</span>)}</div>{m.role==="bot"&&m.kind==="materi"&&<span className="message-source"><ShieldCheck size={12}/> {SRC}</span>}{m.role==="bot"&&m.suggest?.length>0&&<div className="chat-suggest">{m.suggest.map(q=><button key={q} onClick={()=>send(q)}>{q}<ArrowRight size={13}/></button>)}</div>}</div></div>)}<div ref={bottomRef}/>
   </div>
   <div className="chat-question-area"><div className="question-area-heading"><div><span className="eyebrow">PANDUAN INTERAKTIF</span><strong>{showTopics?"Pilih topik edukasi":"Pertanyaan berikutnya"}</strong></div><button onClick={()=>setShowTopics(v=>!v)}>{showTopics?"Pertanyaan":"Topik"} <ChevronRight size={14}/></button></div>
    {showTopics?<div className="chat-category-grid">{categories.map(c=>{const I=c.icon;return <button key={c.id} className={`chat-category ${activeCategory===c.id?"selected":""}`} onClick={()=>{setActiveCategory(c.id);setShowTopics(false)}}><span className={"category-icon " + c.color}><I size={17}/></span><span>{c.label}</span><ChevronRight size={15}/></button>})}</div>:<div className="chat-topic-tabs">{categories.map(c=><button key={c.id} className={activeCategory===c.id?"active":""} onClick={()=>setActiveCategory(c.id)}>{c.label}</button>)}</div>}
    <div className="chat-prepared-questions">{category.questions.map(q=><button key={q} onClick={()=>send(q)}>{q}<ArrowRight size={14}/></button>)}</div>
   </div>
   <form className="chat-input-new" onSubmit={e=>{e.preventDefault();send()}}><input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder="Tulis pertanyaan lain..." aria-label="Tulis pertanyaan lain"/><button type="submit" disabled={!input.trim()} aria-label="Kirim pertanyaan"><Send size={18}/></button></form><div className="chat-bottom-note">Dibuat untuk membantu masyarakat lebih siap dan peduli lingkungan.</div>
  </section></div>}
 </>;
}
