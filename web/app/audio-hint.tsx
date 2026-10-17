'use client';

import { useEffect, useState } from 'react';

/** 48×48 ▸ audio hint on a need tile (design: inline-end/top). Speaks the tile name with an
 *  on-device voice only (SpeechSynthesisVoice.localService), so no text leaves the phone; the
 *  button is not shown when no local voice exists for the language. Label: placeholder key
 *  [copy: need.audioHint] until Whitey adds it. */
export function AudioHint({ text, lang }: { text: string; lang: string }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const pick = () => setVoice(speechSynthesis.getVoices().find((v) => v.localService && v.lang.toLowerCase().startsWith(lang)) ?? null);
    pick();
    speechSynthesis.addEventListener('voiceschanged', pick);
    return () => speechSynthesis.removeEventListener('voiceschanged', pick);
  }, [lang]);
  if (!voice) return null;
  return (
    <button
      type="button"
      className="audio-hint"
      aria-label={`[copy: need.audioHint] ${text}`}
      onClick={() => {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.voice = voice;
        u.lang = voice.lang;
        speechSynthesis.speak(u);
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
    </button>
  );
}
