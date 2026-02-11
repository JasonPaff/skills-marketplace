import { Star } from 'lucide-react';

import { formatRating } from '@/lib/utils/format';

interface StarRatingProps {
  rating: number;
  showLabel?: boolean;
}

export function StarRating({ rating, showLabel = true }: StarRatingProps) {
  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={
            star <= Math.round(rating)
              ? 'size-4 text-amber-400'
              : `size-4 text-gray-300`
          }
          fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
          key={star}
        />
      ))}
      {showLabel && <span className="ml-1 text-gray-500">({formatRating(rating)})</span>}
    </span>
  );
}
