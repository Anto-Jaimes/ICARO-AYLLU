import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Copy, MessageCircle, Phone, ThumbsUp } from 'lucide-react';
import { ANONYMOUS_REVIEWER, useApp } from '../context/AppContext';
import { formatRelativeTime } from '../utils/time';
import { findCategory } from '../data/categories';
import { calculateWalkingEstimate } from '../services/geoService';
import { CommunityItem } from '../types';
import { buildWhatsAppLink, describeDistance } from '../utils/geo';
import { BottomSheet } from './BottomSheet';
import { recommendationText } from './PostRow';
import { postPhotoUrl } from '../services/postPhotos';
import { useT } from '../i18n/LanguageContext';

const EMERGENCY_TYPES = ['emergency_need', 'emergency_resource', 'support_group'];

export const PostSheet: React.FC = () => {
  const { selectedItem, closeItem, toggleVistoBueno, addReview, updateItemStatus, userLocation, hasLocation, showNotice, canWrite, openAccess } = useApp();
  const t = useT();

  // Keeps showing the post while the sheet slides away.
  const lastItem = useRef<CommunityItem | null>(null);
  if (selectedItem) lastItem.current = selectedItem;
  const item = selectedItem ?? lastItem.current;

  const [walkingMinutes, setWalkingMinutes] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isConfirmingResolved, setIsConfirmingResolved] = useState(false);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  const itemId = selectedItem?.id;

  useEffect(() => {
    setIsWriting(false);
    setIsConfirmingResolved(false);
    setComment('');
    setWalkingMinutes(null);
    if (!selectedItem || !hasLocation) return;

    let isCurrent = true;
    calculateWalkingEstimate(userLocation.lat, userLocation.lng, selectedItem.coordinates[0], selectedItem.coordinates[1])
      .then((estimate) => {
        if (isCurrent) setWalkingMinutes(estimate.durationMinutes);
      });
    return () => {
      isCurrent = false;
    };
    // Keyed by id: a live vote must not reset what the neighbour is typing.
  }, [itemId]);

  if (!item) return null;

  const category = findCategory(item.category);
  const isEmergency = EMERGENCY_TYPES.includes(item.type);
  const isNeed = item.type === 'emergency_need';
  const isService = item.type === 'service';
  const distance = walkingMinutes !== null ? t('a {minutes} min a pie', { minutes: walkingMinutes }) : describeDistance(item.distanceMeters);

  const whatsappUrl = item.authorPhone
    ? buildWhatsAppLink(item.authorPhone, t('Hola {name}, te escribo por "{title}" que vi en AYLLU.', { name: item.authorName, title: item.title }))
    : null;

  const sendRecommendation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    addReview(item.id, comment.trim(), reviewerName.trim());
    setComment('');
    setIsWriting(false);
  };

  const copyPhone = async () => {
    if (!item.authorPhone) return;
    try {
      await navigator.clipboard.writeText(item.authorPhone.replace('+51', ''));
      showNotice(t('Número copiado. Pégalo en Yape o Plin.'));
    } catch {
      showNotice(`${t('Teléfono')}: ${item.authorPhone}`);
    }
  };

  const footer = whatsappUrl ? (
    <div className="flex gap-2">
      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        {t('Escribir')}
      </a>
      <a href={`tel:${item.authorPhone}`} className="btn btn-secondary">
        <Phone className="w-5 h-5" aria-hidden="true" />
        {t('Llamar')}
      </a>
    </div>
  ) : undefined;

  const recText = item.vistosBuenos === 1
    ? t('Recomendado por 1 vecino')
    : item.vistosBuenos === 0
    ? t('Aún sin recomendaciones')
    : t('Recomendado por {count} vecinos', { count: item.vistosBuenos });

  return (
    <BottomSheet open={selectedItem !== null} onClose={closeItem} title={item.title} footer={footer}>
      {item.photos && item.photos.length > 0 && (
        <ul className="list-plain flex gap-2 overflow-x-auto px-4 pb-3 snap-x" aria-label={t('Fotos')}>
          {item.photos.map((path, index) => (
            <li key={path} className="shrink-0 snap-start">
              <a href={postPhotoUrl(path)} target="_blank" rel="noreferrer" aria-label={t('Foto {number}', { number: index + 1 })}>
                <img
                  src={postPhotoUrl(path)}
                  alt={t('Foto {number}', { number: index + 1 })}
                  className={`${item.photos!.length === 1 ? 'w-[calc(100vw-2rem)] max-w-xl' : 'w-64'} h-48 rounded-xl object-cover bg-sunken`}
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="px-4 pb-4 space-y-4">
        <p className="text-secondary text-ink-2">
          {[t(category.label), distance, item.neighborhood].filter(Boolean).join(', ')}
        </p>

        {item.description && <p>{item.description}</p>}

        <dl className="space-y-1 text-secondary">
          <div className="flex gap-2">
            <dt className="text-ink-2">{t('Publicó')}</dt>
            <dd className="font-medium">{item.authorName}</dd>
          </div>
          {item.priceInfo && (
            <div className="flex gap-2">
              <dt className="text-ink-2">{t('Precio')}</dt>
              <dd className="font-medium">{item.priceInfo}</dd>
            </div>
          )}
          {item.address && (
            <div className="flex gap-2">
              <dt className="text-ink-2">{t('Dónde')}</dt>
              <dd className="font-medium">{item.address}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-ink-2">{t('Fecha')}</dt>
            <dd className="font-medium">{item.createdAtIso ? formatRelativeTime(item.createdAtIso) : t(item.createdAt)}</dd>
          </div>
        </dl>

        {!whatsappUrl && <p className="text-secondary text-ink-2">{t('No dejó teléfono de contacto.')}</p>}

        {isNeed && item.status === 'active' && (
          <button type="button" className="btn btn-danger" onClick={() => updateItemStatus(item.id, 'in_progress')}>
            {t('Voy a ayudar')}
          </button>
        )}

        {isNeed && item.status === 'in_progress' && (
          <div>
            <p className="pb-2 font-bold">{t('Un vecino ya va en camino')}</p>
            {isConfirmingResolved ? (
              <button type="button" className="btn btn-primary" onClick={() => updateItemStatus(item.id, 'resolved')}>
                {t('Sí, ya está resuelto')}
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setIsConfirmingResolved(true)}>
                {t('Ya está resuelto')}
              </button>
            )}
          </div>
        )}

        {isService && item.authorPhone && (
          <button type="button" className="btn btn-secondary" onClick={copyPhone}>
            <Copy className="w-5 h-5" aria-hidden="true" />
            {t('Copiar número para Yape o Plin')}
          </button>
        )}

        {!isEmergency && (
          <section aria-labelledby="visto-bueno-title" className="pt-2 border-t border-line">
            <h3 id="visto-bueno-title" className="pt-3 text-section font-bold">{t('Visto Bueno Vecinal')}</h3>
            <p className="pb-3 text-secondary text-ink-2">{recText}</p>

            {!item.isMine && (
              <button
                type="button"
                aria-pressed={item.hasUserVoted ?? false}
                className={`btn ${item.hasUserVoted ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleVistoBueno(item.id)}
              >
                <ThumbsUp className={`w-5 h-5 ${item.hasUserVoted ? 'fill-current' : ''}`} aria-hidden="true" />
                {item.hasUserVoted ? t('Ya diste tu Visto Bueno') : t('Dar mi Visto Bueno')}
              </button>
            )}

            {item.reviews.length > 0 && (
              <ul className="list-plain mt-3">
                {item.reviews.map((review) => (
                  <li key={review.id} className="py-3">
                    <p>{review.comment}</p>
                    <p className="flex items-center gap-1.5 mt-1 text-meta text-ink-2">
                      {review.isNeighborVerified && <BadgeCheck className="w-4 h-4 text-verde" aria-hidden="true" />}
                      {review.authorName === ANONYMOUS_REVIEWER ? t(review.authorName) : review.authorName}
                      {review.isNeighborVerified ? `, ${t('vive cerca')}` : ''}, {(review.dateIso ? formatRelativeTime(review.dateIso) : t(review.date)).toLowerCase()}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {!item.isMine &&
              (isWriting ? (
                <form onSubmit={sendRecommendation} className="mt-3 space-y-2">
                  <label htmlFor="review-name" className="block text-secondary font-bold">{t('Tu nombre')}</label>
                  <input
                    id="review-name"
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    autoComplete="name"
                    className="field"
                  />
                  <label htmlFor="review-text" className="block text-secondary font-bold">{t('Tu recomendación')}</label>
                  <textarea
                    id="review-text"
                    required
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="field"
                  />
                  <button type="submit" className="btn btn-primary">{t('Enviar recomendación')}</button>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary mt-3"
                  onClick={() => (canWrite ? setIsWriting(true) : openAccess(t('Para recomendar o comentar necesitas entrar con tu código de usuario.')))}
                >
                  {t('Escribir una recomendación')}
                </button>
              ))}
          </section>
        )}
      </div>
    </BottomSheet>
  );
};
