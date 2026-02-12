'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils/cn';

interface InteractiveStarRatingProps {
  onChange: (value: number) => void;
  value: number;
}

export function InteractiveStarRating({ onChange, value }: InteractiveStarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          className={cn(
            `
              text-2xl transition
              hover:scale-110
            `,
            star <= (hovered || value) ? 'text-amber-400' : 'text-text-quaternary',
          )}
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          type="button"
        >
          <Star className="size-6" fill={star <= (hovered || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-text-tertiary">{value}/5</span>}
    </div>
  );
}
