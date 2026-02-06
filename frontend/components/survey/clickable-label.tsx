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
    <div className="flex items-center gap-2 group">
      <Label
        htmlFor={htmlFor}
        className={cn(
          "cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5",
          className
        )}
        onClick={handleClick}
      >
        <VolumeHighIcon
          className={cn(
            "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
            isSpeaking && "opacity-100 text-primary animate-pulse"
          )}
        />
        {children}
        {required && <span className="text-destructive">*</span>}
      </Label>
    </div>
  );
}
