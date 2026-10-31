"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The homepage is already rendered underneath this floating video card. */
export function IntroSplash() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const closingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finished = useRef(false);
  const [closed, setClosed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [manual, setManual] = useState(false);
  const [muted, setMuted] = useState(true);

  const dismiss = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    clearTimeout(stallTimer.current);
    video.current?.pause();
    setClosing(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    closingTimer.current = setTimeout(() => { dialog.current?.close(); setClosed(true); }, delay);
  }, []);

  const resetStallTimer = useCallback(() => {
    clearTimeout(stallTimer.current);
    if (!finished.current) stallTimer.current = setTimeout(dismiss, 20_000);
  }, [dismiss]);

  useEffect(() => {
    if (closed) return;
    const element = dialog.current;
    const media = video.current;
    if (!element || !media) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    finished.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      media.controls = true;
      queueMicrotask(() => setManual(true));
    } else {
      media.autoplay = true;
      media.muted = true;
      void media.play().catch(() => {
        if (!finished.current) { media.controls = true; setManual(true); clearTimeout(stallTimer.current); }
      });
      resetStallTimer();
    }
    return () => {
      clearTimeout(closingTimer.current);
      clearTimeout(stallTimer.current);
      media.pause();
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [closed, resetStallTimer]);

  if (closed) return null;
  return <dialog ref={dialog} aria-label="ASEAN ONE intro" onCancel={event => { event.preventDefault(); dismiss(); }}
    className={`fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-5xl overflow-visible rounded-3xl border border-white/15 bg-night-950 p-0 text-foreground shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-200 ${closing ? "opacity-0" : "opacity-100"}`}>
    <div className="relative overflow-hidden rounded-3xl">
      <video ref={video} src="/intro.mp4" aria-label="Southeast Asia introduction" muted={muted} playsInline preload="auto" controls={manual}
        className="block aspect-video w-full bg-black object-contain" onEnded={dismiss} onError={dismiss}
        onPlaying={resetStallTimer} onTimeUpdate={() => { if (!video.current?.paused) resetStallTimer(); }} />
      <button type="button" aria-label="Skip intro" autoFocus onClick={dismiss}
        className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4 sm:top-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
      {!manual && <button type="button" onClick={() => setMuted(value => !value)} aria-label={muted ? "Unmute intro video" : "Mute intro video"}
        className="absolute bottom-3 left-3 min-h-11 rounded-full border border-white/25 bg-black/70 px-4 text-xs font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-4 sm:left-4">{muted ? "Sound off" : "Sound on"}</button>}
      {manual && <button type="button" onClick={() => { void video.current?.play().then(() => { setManual(false); resetStallTimer(); }).catch(() => undefined); }}
        className="absolute left-3 top-3 min-h-11 rounded-full border border-white/25 bg-black/70 px-4 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Play intro</button>}
    </div>
    <p className="sr-only">An introduction to Southeast Asia. Close with the X button or Escape to continue to the homepage.</p>
  </dialog>;
}
