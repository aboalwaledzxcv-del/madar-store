import { Star } from 'lucide-react';

export default function Stars({ rating, count, size = 15 }: { rating: number; count?: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.35;
  return (
    <span className="stars-row" aria-label={`${rating} out of 5`}>
      <span className="stars-icons">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= full || (i === full + 1 && half);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? 'star-on' : 'star-off'}
              fill={filled ? 'currentColor' : 'none'}
            />
          );
        })}
      </span>
      <span className="stars-num">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="stars-count">({count})</span>}
    </span>
  );
}
