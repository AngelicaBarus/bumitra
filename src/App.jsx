import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, CloudSun, HeartHandshake, Leaf, MapPin, Menu, Mountain, ShieldCheck, Waves, X, MessageCircle, Phone, ExternalLink, Siren, Info, House, MapPinned, LocateFixed } from "lucide-react";
import Chatbot from "./components/Chatbot.jsx";
import RiskMap from "./components/RiskMap.jsx";
import WeatherPage from "./components/WeatherPage.jsx";
import { HERO_BG } from "./config.js";
import NearbyHelp from "./components/NearbyHelp.jsx";
import { TentangSection, KontakKomentar } from "./components/HomeSections.jsx";

const navItems = [["Beranda","home"],["Peta Risiko","map"],["Cuaca","weather"],["Bantuan","help"],["Tentang","about"]];

const NATIONAL=[
 {icon:<Siren/>,num:"112",title:"Panggilan darurat",desc:"Nomor darurat nasional; di Kota Medan tersambung ke Pusat Panggilan Darurat 112.",url:"https://portalsmartcity.medan.go.id/welcome/detail_call",label:"Info 112 Medan"},
 {icon:<ShieldCheck/>,num:"115",title:"Basarnas",desc:"Pencarian dan pertolongan: korban terjebak, hilang, atau butuh evakuasi.",url:"https://basarnas.go.id",label:"Situs Basarnas"},
 {icon:<HeartHandshake/>,num:"117",title:"BNPB",desc:"Call center Badan Nasional Penanggulangan Bencana untuk laporan dan informasi bencana.",url:"https://bnpb.go.id",label:"Situs BNPB"},
];
/* Kontak daerah. Setiap nomor sudah dicocokkan dengan halaman resmi pada 21 Okt 2026.
   scope: "medan" = hanya Kota Medan, "sumut" = seluruh Sumatera Utara. */
const REGIONAL=[
 {scope:"medan",icon:<HeartHandshake/>,title:"BPBD Kota Medan",area:"Kota Medan",detail:"WhatsApp 0813-7080-0880",phone:"+6281370800880",desc:"Penanggulangan bencana dan koordinasi bantuan di Kota Medan.",addr:"Jl. Rahmad No. 1, Komplek PIK Menteng, Medan 20228",url:"https://bpbd.medan.go.id/menu-single/Kontak.html",label:"Halaman kontak resmi"},
 {scope:"sumut",icon:<ShieldCheck/>,title:"BPBD Provinsi Sumatera Utara",area:"Sumatera Utara",detail:"Telepon (061) 846-8469",phone:"+62618468469",desc:"Tingkat provinsi untuk informasi dan koordinasi penanggulangan bencana.",addr:"Jl. Medan–Binjai Km 10,3 No. 8, Medan",url:"https://www.sumutprov.go.id/artikel/halaman/organisasi",label:"Direktori Pemprov Sumut"},
 {scope:"medan",icon:<MapPinned/>,title:"RSU Haji Medan",area:"Kota Medan",detail:"Telepon (061) 661-9520 / 661-9521",phone:"+62616619520",desc:"Rumah sakit milik Pemprov Sumut. Hubungi dulu untuk memastikan layanan sebelum menuju lokasi.",addr:"Jl. Rumah Sakit Haji, Medan Estate, Medan",url:"https://www.sumutprov.go.id/artikel/halaman/organisasi",label:"Direktori Pemprov Sumut"},
];

function SecHead({n,title,sub}){return <header className="hp-sec-head"><span className="hp-sec-n">{n}</span><div><h3>{title}</h3><p>{sub}</p></div></header>}

function HelpPage(){
 const [loc,setLoc]=useState(null);
 const bpbdSearch=loc&&`https://www.google.com/search?q=${encodeURIComponent("BPBD "+(loc.kab||loc.prov)+" kontak resmi")}`;
 const shown=!loc?[]:loc.isMedan?REGIONAL:loc.inSumut?REGIONAL.filter(c=>c.scope==="sumut"):[];
 const title=!loc?"Kontak sesuai lokasi Anda":loc.isMedan?"Kontak untuk Kota Medan":loc.inSumut?`Kontak untuk Sumatera Utara (${loc.kab||"lokasi Anda"})`:`Kontak untuk ${loc.kab||loc.prov||"lokasi Anda"}`;
 return <div className="page-wrap section-page help-page"><div className="page-heading"><span className="eyebrow">UTAMAKAN KESELAMATAN</span><h1>Informasi Bantuan</h1><p>Jalur bantuan resmi dan langkah awal ketika terjadi keadaan darurat.</p></div>
 <div className="emergency-banner"><div className="emergency-symbol"><Siren size={28}/></div><div className="emergency-copy"><strong>Jika Anda berada dalam bahaya</strong><p>Menjauhlah ke tempat aman jika jalurnya memungkinkan. Ikuti arahan petugas dan jangan menerobos arus banjir.</p><a className="emergency-call-link" href="tel:112"><Phone size={16}/> Hubungi 112</a></div></div>

 <section className="hp-sec"><SecHead n="1" title="Nomor darurat nasional" sub="Berlaku di seluruh Indonesia, tidak bergantung lokasi."/>
 <div className="hp-grid hp-grid3">{NATIONAL.map(c=><article className="hp-card" key={c.num}><div className="hp-card-top"><span className="hp-ic">{c.icon}</span><span className="hp-badge">Seluruh Indonesia</span></div><h4>{c.title}</h4><strong className="hp-num">{c.num}</strong><p>{c.desc}</p><div className="hp-actions"><a className="hp-call" href={`tel:${c.num}`}><Phone size={14}/> Hubungi {c.num}</a><a className="hp-link" href={c.url} target="_blank" rel="noreferrer">{c.label} <ExternalLink size={13}/></a></div></article>)}</div></section>

 <section className="hp-sec"><SecHead n="2" title="Bantuan sesuai lokasi Anda" sub="Fasilitas dan nomor di sekitar posisi Anda, berubah mengikuti perpindahan."/><NearbyHelp onLocation={setLoc}/></section>

 <section className="hp-sec"><SecHead n="3" title={title} sub="Kontak resmi yang sudah diverifikasi untuk wilayah Anda."/>
 {!loc&&<div className="hp-empty-box neutral"><LocateFixed size={18}/><p>Kontak BPBD, rumah sakit, kepolisian, dan pemadam kebakaran akan tampil di sini setelah Anda menekan <b>Gunakan lokasi saya</b>, sesuai tempat Anda berada. Daftarnya ikut berubah jika Anda berpindah.</p></div>}
 {loc&&!shown.length&&<div className="hp-empty-box"><Info size={18}/><p>Kontak BPBD untuk <b>{loc.kab||loc.prov||"wilayah Anda"}</b> belum tersimpan di SIGMA-BUMI. Nomor yang belum terverifikasi sengaja tidak ditampilkan; gunakan 112, 115, 117 di atas atau cari kontak resminya.</p><a className="hp-link" href={bpbdSearch} target="_blank" rel="noreferrer">Cari kontak BPBD {loc.kab||loc.prov} <ExternalLink size={13}/></a></div>}
 {loc&&loc.inSumut&&!loc.isMedan&&<div className="hp-empty-box"><Info size={18}/><p>Kontak BPBD <b>{loc.kab||"kabupaten/kota Anda"}</b> belum tersimpan. Yang tampil di bawah adalah tingkat provinsi.</p><a className="hp-link" href={bpbdSearch} target="_blank" rel="noreferrer">Cari kontak BPBD {loc.kab} <ExternalLink size={13}/></a></div>}
 {!!shown.length&&<div className="hp-grid">{shown.map(c=><article className="hp-card" key={c.title}><div className="hp-card-top"><span className="hp-ic">{c.icon}</span><span className="hp-badge">{c.area}</span></div><h4>{c.title}</h4><strong className="hp-num sm">{c.detail}</strong><p>{c.desc}</p><small className="hp-addr"><MapPin size={13}/> {c.addr}</small><div className="hp-actions"><a className="hp-call" href={`tel:${c.phone}`}><Phone size={14}/> Hubungi</a><a className="hp-link" href={c.url} target="_blank" rel="noreferrer">{c.label} <ExternalLink size={13}/></a></div></article>)}</div>}</section>

 <section className="hp-sec"><SecHead n="4" title="Evakuasi dan fasilitas kesehatan" sub="Selalu ikuti arahan petugas."/><div className="hp-evac"><span className="hp-ic"><House size={22}/></span><div><h4>Tempat evakuasi dapat berubah</h4><p>Lokasi pengungsian dapat berubah mengikuti kejadian. Jangan mengandalkan alamat yang belum dikonfirmasi; minta arahan BPBD atau petugas setempat sebelum bergerak.</p></div></div></section>
 <div className="source-warning wide"><Info size={18}/><span>Nomor 112, 115, 117 dan kontak BPBD Medan, BPBD Sumut, serta RSU Haji Medan dicocokkan dengan situs resmi pemerintah pada 21 Oktober 2026 (sumber ada di tiap kartu). Status aktif dan respons layanan dapat berubah; kontak BPBD yang sudah diverifikasi saat ini baru untuk Medan dan Sumatera Utara.</span></div></div>
}

function Home({navigate,openChat}){
 return <main id="home">
  <section className="hero hero-redesign"><div className="hero-photo" aria-hidden="true"><picture>{HERO_BG.srcMobile&&<source media="(max-width:760px)" srcSet={HERO_BG.srcMobile}/>}<img className="hero-bg-img" src={HERO_BG.src} alt="" decoding="async" fetchpriority="high" draggable="false" style={{"--pos-d":HERO_BG.positionDesktop,"--pos-m":HERO_BG.positionMobile}}/></picture></div><div className="hero-shade"></div><div className="hero-content"><span className="hero-kicker"><ShieldCheck size={15}/> EDUKASI • KESIAPSIAGAAN • LINGKUNGAN</span><h1>Kenali bahayanya.<br/><em>Siapkan diri bersama.</em></h1><p>Sahabat SIGMA membantu Anda memahami banjir, tanah longsor, cuaca, dan kebiasaan menjaga lingkungan melalui percakapan yang mudah diikuti.</p><div className="hero-actions"><button className="primary-button" onClick={()=>openChat("mulai")}>Mulai belajar <MessageCircle size={17}/></button><button className="hero-secondary" onClick={()=>navigate("map")}>Cek peta risiko <ArrowRight size={16}/></button></div><div className="hero-note"><span className="live-dot"></span> Materi edukasi dirangkum dari panduan SIGMA-BUMI</div></div><div className="hero-side-card"><div className="mini-weather-icon"><CloudSun size={24}/></div><div><small>Cuaca dan kewaspadaan</small><strong>Periksa prakiraan cuaca</strong><span>Informasi dari layanan BMKG</span></div><button onClick={()=>navigate("weather")} aria-label="Buka cuaca"><ArrowUpRight size={19}/></button></div><div className="hero-bottom-label"><span>SIGMA-BUMI</span><span>Kenali risiko. Siapkan diri.</span></div></section>
</main>
}

export default function App(){
 const [active,setActive]=useState("home"); const [mobileNav,setMobileNav]=useState(false);
 const navigate=(id)=>{setMobileNav(false);const el=document.getElementById(id);if(!el)return;const top=el.getBoundingClientRect().top+window.scrollY-(id==="home"?0:header_h());window.scrollTo({top,behavior:"smooth"});};
 const header_h=()=>document.querySelector(".site-header")?.offsetHeight||70;
 const openChat=(topic="mulai")=>window.dispatchEvent(new CustomEvent("open-sigma-chat",{detail:{topic}}));
 useEffect(()=>{
  const ids=navItems.map(n=>n[1]);
  const onScroll=()=>{const y=window.scrollY+header_h()+Math.min(160,window.innerHeight*.25);let cur="home";for(const id of ids){const el=document.getElementById(id);if(el&&el.offsetTop<=y)cur=id;}setActive(cur);};
  onScroll();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);
  return()=>{window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);};
 },[]);
 return <div className="app-shell">
  <header className="site-header"><button className="brand" onClick={()=>navigate("home")} aria-label="SIGMA-BUMI beranda"><span className="brand-mark"><Mountain size={24}/><Leaf size={13}/></span><span><strong>SIGMA-BUMI</strong><small>Sahabat Siaga Bencana</small></span></button><nav className={`main-nav ${mobileNav?"show":""}`} aria-label="Navigasi utama">{navItems.map(([label,id])=><button key={id} className={active===id?"active":""} onClick={()=>navigate(id)}>{label}</button>)}</nav><div className="header-actions"><button className="mobile-menu" aria-label="Buka menu" onClick={()=>setMobileNav(v=>!v)}>{mobileNav?<X/>:<Menu/>}</button></div></header>
  <Home navigate={navigate} openChat={openChat}/>
  <section id="map" className="page-section"><RiskMap/></section>
  <section id="weather" className="page-section alt"><WeatherPage/></section>
  <section id="help" className="page-section"><HelpPage/></section>
  <section id="about" className="page-section alt"><TentangSection/></section>
  <footer className="site-footer" id="contact"><KontakKomentar/><div className="footer-top"><button className="brand footer-brand" onClick={()=>navigate("home")}><span className="brand-mark"><Mountain size={24}/><Leaf size={13}/></span><span><strong>SIGMA-BUMI</strong><small>Sahabat Siaga Bencana</small></span></button><p>Kenali bahayanya, lindungi keluarga, jaga lingkungan.</p></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SIGMA-BUMI · Prototipe edukasi</span><span>Untuk keputusan keselamatan, ikuti informasi resmi dan arahan petugas.</span></div></footer>
  <Chatbot/>
 </div>
}
