'use client';

import { Label } from '@/components/ui/label';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { VolumeHighIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface ClickableLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  description?: string;
  className?: string;
  required?: boolean;
}

export function ClickableLabel({ htmlFor, children, description, className, required }: ClickableLabelProps) {
  const { speak, isSpeaking } = useSpeechSynthesis();

  const handleClick = () => {
    let textToRead = typeof children === 'string' ? children : '';

    // Remove the asterisk from required fields
    textToRead = textToRead.replace(/\s*\*\s*$/, '');

    if (description) {
      textToRead += '. ' + description;
    }

    if (textToRead) {
      speak(textToRead);
    }
  };

  return (
    <div className="flex items-start gap-2 group">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Baca pertanyaan"
        className={cn(
          "mt-0.5 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full border transition-colors",
          isSpeaking
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
        )}
      >
        <VolumeHighIcon
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            isSpeaking && "animate-pulse"
          )}
        />
      </button>
      <Label
        htmlFor={htmlFor}
        className={cn(
          "cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5",
          className
        )}
        onClick={handleClick}
      >
        {children}
        {required && <span className="text-destructive">*</span>}
      </Label>
    </div>
  );
}
