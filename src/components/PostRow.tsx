import React from 'react';
import { ChevronRight, ThumbsUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { findCategory } from '../data/categories';
import { CommunityItem } from '../types';
import { describeDistance } from '../utils/geo';

export function recommendationText(count: number): string {
  if (count === 0) return 'Aún sin recomendaciones';
  return count === 1 ? 'Recomendado por 1 vecino' : `Recomendado por ${count} vecinos`;
}

export const PostRow: React.FC<{ item: CommunityItem; showRecommendations?: boolean }> = ({
  item,
  showRecommendations = true
}) => {
  const { openItem } = useApp();
  const category = findCategory(item.category);
  const Icon = category.icon;
  const distance = describeDistance(item.distanceMeters);

  return (
    <button type="button" className="row" onClick={() => openItem(item.id)}>
      <span className="grid place-items-center shrink-0 w-11 h-11 rounded-lg bg-sunken text-anil">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-row font-semibold line-clamp-2">{item.title}</span>
        {showRecommendations && item.vistosBuenos > 0 && (
          <span className="flex items-center gap-1.5 text-secondary font-medium text-anil">
            <ThumbsUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            {recommendationText(item.vistosBuenos)}
          </span>
        )}
        <span className="block text-secondary text-ink-2 truncate">
          {[category.label, distance].filter(Boolean).join(', ')}
        </span>
      </span>

      <ChevronRight className="w-5 h-5 shrink-0 text-ink-2" aria-hidden="true" />
    </button>
  );
};
