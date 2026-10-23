import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { VIDEO } from "../config.js";

export default function VideoModal({ onClose }) {
  // Urutan: YouTube -> file lokal (autoplay) -> pemutar Google Drive (cadangan, perlu 1x klik play).
  const [mode, setMode] = useState("local");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="video-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="video-box" role="dialog" aria-modal="true" aria-label={VIDEO.title}>
        <header>
          <strong>{VIDEO.title}</strong>
          <button type="button" className="video-close" onClick={onClose} aria-label="Tutup video"><X size={20} /></button>
        </header>
        <div className="video-stage">
          {VIDEO.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(VIDEO.youtubeId)}?autoplay=1&rel=0`}
              title={VIDEO.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : mode === "local" ? (
            // File di public/video langsung diputar otomatis (tombol "Klik video" sudah dianggap izin autoplay).
            <video src={VIDEO.src} poster={VIDEO.poster || undefined} controls autoPlay playsInline preload="auto"
              onError={() => setMode(VIDEO.driveId ? "drive" : "none")}
              onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}>
              Peramban Anda tidak mendukung pemutar video.
            </video>
          ) : mode === "drive" ? (
            // Pemutar Google Drive tidak mendukung autoplay: pengunjung harus menekan play satu kali.
            <iframe
              src={`https://drive.google.com/file/d/${encodeURIComponent(VIDEO.driveId)}/preview`}
              title={VIDEO.title}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="video-missing">
              <Info size={22} />
              <p>Video belum tersedia. Pengelola perlu menaruh file video di <code>public/video/profil.mp4</code> atau mengisi <code>youtubeId</code> di <code>src/config.js</code>.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
