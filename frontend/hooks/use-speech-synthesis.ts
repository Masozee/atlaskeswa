import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  defaultVolume?: number;
  defaultRate?: number;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(options.defaultVolume ?? 1);
  const [rate, setRate] = useState(options.defaultRate ?? 0.9);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentTextRef = useRef<string>('');

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string, lang: string = 'id-ID') => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    currentTextRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      options.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      options.onEnd?.();
    };

    utterance.onpause = () => {
      setIsPaused(true);
      options.onPause?.();
    };

    utterance.onresume = () => {
      setIsPaused(false);
      options.onResume?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, options, volume, rate]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported, isSpeaking, isPaused]);

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const updateVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  }, []);

  const updateRate = useCallback((newRate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, newRate));
    setRate(clampedRate);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    volume,
    rate,
    speak,
    pause,
    resume,
    cancel,
    setVolume: updateVolume,
    setRate: updateRate,
  };
}
