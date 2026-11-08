import React from 'react';
import { ChevronRight, ThumbsUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { findCategory } from '../data/categories';
import { CommunityItem } from '../types';
import { describeDistance } from '../utils/geo';
import { postPhotoUrl } from '../services/postPhotos';
import { tr, useT } from '../i18n/LanguageContext';
import { VerifiedBadge } from './VerifiedBadge';

export function recommendationText(count: number): string {
  if (count === 0) return tr('Aún sin recomendaciones');
  return count === 1 ? tr('Recomendado por 1 vecino') : tr('Recomendado por {count} vecinos', { count });
}

export const PostRow: React.FC<{ item: CommunityItem; showRecommendations?: boolean }> = ({
  item,
  showRecommendations = true
}) => {
  const { openItem } = useApp();
  const t = useT();
  const category = findCategory(item.category);
  const Icon = category.icon;
  const distance = describeDistance(item.distanceMeters);

  const recText = item.vistosBuenos === 1
    ? t('Recomendado por 1 vecino')
    : t('Recomendado por {count} vecinos', { count: item.vistosBuenos });

  return (
    <button type="button" className="row" onClick={() => openItem(item.id)}>
      {item.photos?.length ? (
        <img src={postPhotoUrl(item.photos[0])} alt="" loading="lazy" className="shrink-0 w-14 h-14 rounded-lg object-cover bg-sunken" />
      ) : (
        <span className="grid place-items-center shrink-0 w-11 h-11 rounded-lg bg-sunken text-primary">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </span>
      )}

      <span className="flex-1 min-w-0">
        <span className="block text-row font-semibold line-clamp-2">{item.title}</span>
        {item.authorVerified && <VerifiedBadge />}
        {showRecommendations && item.vistosBuenos > 0 && (
          <span className="flex items-center gap-1.5 text-secondary font-medium text-primary">
            <ThumbsUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            {recText}
          </span>
        )}
        {item.type === 'favor_request' && item.status === 'resolved' && (
          <span className="block text-secondary font-bold text-status-safe">{t('Ya los ayudaron')}</span>
        )}
        {item.type === 'favor_offer' && item.status === 'resolved' && (
          <span className="block text-secondary font-bold text-status-safe">{t('Ya se entregó')}</span>
        )}
        {(item.type === 'favor_offer' || item.type === 'favor_request') && item.audience === 'organizacion' && item.status !== 'resolved' && (
          <span className="block text-secondary font-medium text-primary">
            {item.type === 'favor_offer' ? t('Para organizaciones') : t('Pide una organización')}
          </span>
        )}
        <span className="block text-secondary text-ink-secondary truncate">
          {[t(category.label), distance].filter(Boolean).join(', ')}
        </span>
      </span>

      <ChevronRight className="w-5 h-5 shrink-0 text-ink-secondary" aria-hidden="true" />
    </button>
  );
};
