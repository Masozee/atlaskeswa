'use client';

import { Button } from '@/components/ui/button';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { PlayIcon, PauseIcon, StopIcon, VolumeHighIcon, VolumeMute01Icon, VolumeLowIcon } from 'hugeicons-react';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SpeechControlsProps {
  text: string;
  label?: string;
  autoRead?: boolean;
}

export function SpeechControls({ text, label = 'Baca pertanyaan', autoRead = false }: SpeechControlsProps) {
  const { isSupported, isSpeaking, isPaused, speak, pause, resume, cancel } = useSpeechSynthesis();
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  useEffect(() => {
    if (autoRead && !hasAutoPlayed && text) {
      speak(text);
      setHasAutoPlayed(true);
    }
  }, [autoRead, hasAutoPlayed, text, speak]);

  if (!isSupported) {
    return null;
  }

  const handlePlayPause = () => {
    if (!isSpeaking) {
      speak(text);
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePlayPause}
        aria-label={!isSpeaking ? label : isPaused ? 'Lanjutkan pembacaan' : 'Jeda pembacaan'}
        className="gap-2"
      >
        {!isSpeaking || isPaused ? (
          <>
            <PlayIcon className="h-4 w-4" />
            <span className="text-xs">{isPaused ? 'Lanjutkan' : 'Baca'}</span>
          </>
        ) : (
          <>
            <PauseIcon className="h-4 w-4" />
            <span className="text-xs">Jeda</span>
          </>
        )}
      </Button>

      {isSpeaking && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={cancel}
          aria-label="Hentikan pembacaan"
          className="gap-2"
        >
          <StopIcon className="h-4 w-4" />
          <span className="text-xs">Hentikan</span>
        </Button>
      )}
    </div>
  );
}

interface PageSpeechControlsProps {
  title: string;
  description?: string;
  instructions?: string[];
}

export function PageSpeechControls({ title, description, instructions = [] }: PageSpeechControlsProps) {
  const { isSupported, isSpeaking, isPaused, speak, pause, resume, cancel } = useSpeechSynthesis();

  if (!isSupported) {
    return null;
  }

  const readPageContent = () => {
    let fullText = title;
    if (description) {
      fullText += '. ' + description;
    }
    if (instructions.length > 0) {
      fullText += '. Instruksi: ' + instructions.join('. ');
    }
    speak(fullText);
  };

  const handlePlayPause = () => {
    if (!isSpeaking) {
      readPageContent();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <VolumeHighIcon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground flex-1">Pembaca Layar</span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePlayPause}
        aria-label={!isSpeaking ? 'Baca halaman' : isPaused ? 'Lanjutkan pembacaan' : 'Jeda pembacaan'}
        className="gap-2"
      >
        {!isSpeaking || isPaused ? (
          <>
            <PlayIcon className="h-4 w-4" />
            <span className="text-xs">{isPaused ? 'Lanjutkan' : 'Baca Halaman'}</span>
          </>
        ) : (
          <>
            <PauseIcon className="h-4 w-4" />
            <span className="text-xs">Jeda</span>
          </>
        )}
      </Button>

      {isSpeaking && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={cancel}
          aria-label="Hentikan pembacaan"
          className="gap-2"
        >
          <StopIcon className="h-4 w-4" />
          <span className="text-xs">Hentikan</span>
        </Button>
      )}
    </div>
  );
}

// ============================================
// Vertical Audio Controls
// ============================================

interface VerticalAudioControlsProps {
  text: string;
  className?: string;
  position?: 'fixed' | 'relative';
}

export function VerticalAudioControls({ text, className, position = 'fixed' }: VerticalAudioControlsProps) {
  const {
    isSupported,
    isSpeaking,
    isPaused,
    volume,
    speak,
    pause,
    resume,
    cancel,
    setVolume
  } = useSpeechSynthesis();

  const handlePlay = useCallback(() => {
    if (!isSpeaking) {
      speak(text);
    } else if (isPaused) {
      resume();
    }
  }, [isSpeaking, isPaused, text, speak, resume]);

  const handlePause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      pause();
    }
  }, [isSpeaking, isPaused, pause]);

  const handleStop = useCallback(() => {
    cancel();
  }, [cancel]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  }, [setVolume]);

  if (!isSupported) {
    return null;
  }

  const VolumeIcon = volume === 0 ? VolumeMute01Icon : volume < 0.5 ? VolumeLowIcon : VolumeHighIcon;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-2",
        "bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg",
        position === 'fixed' && "fixed right-4 top-1/2 -translate-y-1/2 z-50",
        className
      )}
    >
      {/* Play Button */}
      <Button
        type="button"
        variant={isSpeaking && !isPaused ? "secondary" : "outline"}
        size="icon"
        onClick={handlePlay}
        aria-label={!isSpeaking ? 'Baca' : isPaused ? 'Lanjutkan' : 'Sedang membaca'}
        className="h-10 w-10"
        disabled={isSpeaking && !isPaused}
      >
        <PlayIcon className="h-5 w-5" />
      </Button>

      {/* Pause Button */}
      <Button
        type="button"
        variant={isPaused ? "secondary" : "outline"}
        size="icon"
        onClick={handlePause}
        aria-label="Jeda"
        className="h-10 w-10"
        disabled={!isSpeaking || isPaused}
      >
        <PauseIcon className="h-5 w-5" />
      </Button>

      {/* Stop Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleStop}
        aria-label="Hentikan"
        className="h-10 w-10"
        disabled={!isSpeaking}
      >
        <StopIcon className="h-5 w-5" />
      </Button>

      {/* Divider */}
      <div className="w-full h-px bg-border my-1" />

      {/* Volume Control */}
      <div className="flex flex-col items-center gap-2">
        <VolumeIcon className="h-4 w-4 text-muted-foreground" />

        {/* Vertical Volume Slider */}
        <div className="h-24 flex items-center justify-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="h-24 w-2 appearance-none bg-muted rounded-full cursor-pointer accent-primary
              [writing-mode:vertical-lr] [direction:rtl]
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Volume"
          />
        </div>

        {/* Volume Percentage */}
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
