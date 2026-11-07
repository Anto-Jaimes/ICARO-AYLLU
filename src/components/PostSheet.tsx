import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Copy, MessageCircle, Phone, ThumbsUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { findCategory } from '../data/categories';
import { calculateWalkingEstimate } from '../services/geoService';
import { CommunityItem } from '../types';
import { buildWhatsAppLink, describeDistance } from '../utils/geo';
import { BottomSheet } from './BottomSheet';
import { recommendationText } from './PostRow';

const EMERGENCY_TYPES = ['emergency_need', 'emergency_resource', 'support_group'];

export const PostSheet: React.FC = () => {
  const { selectedItem, closeItem, toggleVistoBueno, addReview, updateItemStatus, userLocation, hasLocation, showNotice } = useApp();

  // Keeps showing the post while the sheet slides away.
  const lastItem = useRef<CommunityItem | null>(null);
  if (selectedItem) lastItem.current = selectedItem;
  const item = selectedItem ?? lastItem.current;

  const [walking, setWalking] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isConfirmingResolved, setIsConfirmingResolved] = useState(false);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  const itemId = selectedItem?.id;

  useEffect(() => {
    setIsWriting(false);
    setIsConfirmingResolved(false);
    setComment('');
    setWalking(null);
    if (!selectedItem || !hasLocation) return;

    let isCurrent = true;
    calculateWalkingEstimate(userLocation.lat, userLocation.lng, selectedItem.coordinates[0], selectedItem.coordinates[1])
      .then((estimate) => {
        if (isCurrent) setWalking(`a ${estimate.durationMinutes} min a pie`);
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
  const distance = walking ?? describeDistance(item.distanceMeters);

  const whatsappUrl = item.authorPhone
    ? buildWhatsAppLink(item.authorPhone, `Hola ${item.authorName}, te escribo por "${item.title}" que vi en AYLLU.`)
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
      showNotice('Número copiado. Pégalo en Yape o Plin.');
    } catch {
      showNotice(`Número: ${item.authorPhone}`);
    }
  };

  const footer = whatsappUrl ? (
    <div className="flex gap-2">
      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        Escribir
      </a>
      <a href={`tel:${item.authorPhone}`} className="btn btn-secondary">
        <Phone className="w-5 h-5" aria-hidden="true" />
        Llamar
      </a>
    </div>
  ) : undefined;

  return (
    <BottomSheet open={selectedItem !== null} onClose={closeItem} title={item.title} footer={footer}>
      <div className="px-4 pb-4 space-y-4">
        <p className="text-secondary text-ink-2">
          {[category.label, distance, item.neighborhood].filter(Boolean).join(', ')}
        </p>

        {item.description && <p>{item.description}</p>}

        <dl className="space-y-1 text-secondary">
          <div className="flex gap-2">
            <dt className="text-ink-2">Publicó</dt>
            <dd className="font-medium">{item.authorName}</dd>
          </div>
          {item.priceInfo && (
            <div className="flex gap-2">
              <dt className="text-ink-2">Precio</dt>
              <dd className="font-medium">{item.priceInfo}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-ink-2">Fecha</dt>
            <dd className="font-medium">{item.createdAt}</dd>
          </div>
        </dl>

        {!whatsappUrl && <p className="text-secondary text-ink-2">No dejó teléfono de contacto.</p>}

        {isNeed && item.status === 'active' && (
          <button type="button" className="btn btn-danger" onClick={() => updateItemStatus(item.id, 'in_progress')}>
            Voy a ayudar
          </button>
        )}

        {isNeed && item.status === 'in_progress' && (
          <div>
            <p className="pb-2 font-bold">Un vecino ya va en camino</p>
            {isConfirmingResolved ? (
              <button type="button" className="btn btn-primary" onClick={() => updateItemStatus(item.id, 'resolved')}>
                Sí, ya está resuelto
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setIsConfirmingResolved(true)}>
                Ya está resuelto
              </button>
            )}
          </div>
        )}

        {isService && item.authorPhone && (
          <button type="button" className="btn btn-secondary" onClick={copyPhone}>
            <Copy className="w-5 h-5" aria-hidden="true" />
            Copiar número para Yape o Plin
          </button>
        )}

        {!isEmergency && (
          <section aria-labelledby="visto-bueno-title" className="pt-2 border-t border-line">
            <h3 id="visto-bueno-title" className="pt-3 text-section font-bold">Visto Bueno Vecinal</h3>
            <p className="pb-3 text-secondary text-ink-2">{recommendationText(item.vistosBuenos)}</p>

            {!item.isMine && (
              <button
                type="button"
                aria-pressed={item.hasUserVoted ?? false}
                className={`btn ${item.hasUserVoted ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleVistoBueno(item.id)}
              >
                <ThumbsUp className={`w-5 h-5 ${item.hasUserVoted ? 'fill-current' : ''}`} aria-hidden="true" />
                {item.hasUserVoted ? 'Ya diste tu Visto Bueno' : 'Dar mi Visto Bueno'}
              </button>
            )}

            {item.reviews.length > 0 && (
              <ul className="list-plain mt-3">
                {item.reviews.map((review) => (
                  <li key={review.id} className="py-3">
                    <p>{review.comment}</p>
                    <p className="flex items-center gap-1.5 mt-1 text-meta text-ink-2">
                      {review.isNeighborVerified && <BadgeCheck className="w-4 h-4 text-verde" aria-hidden="true" />}
                      {review.authorName}{review.isNeighborVerified ? ', vive cerca' : ''}, {review.date.toLowerCase()}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {!item.isMine &&
              (isWriting ? (
                <form onSubmit={sendRecommendation} className="mt-3 space-y-2">
                  <label htmlFor="review-name" className="block text-secondary font-bold">Tu nombre</label>
                  <input
                    id="review-name"
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    autoComplete="name"
                    className="field"
                  />
                  <label htmlFor="review-text" className="block text-secondary font-bold">Tu recomendación</label>
                  <textarea
                    id="review-text"
                    required
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="field"
                  />
                  <button type="submit" className="btn btn-primary">Enviar recomendación</button>
                </form>
              ) : (
                <button type="button" className="btn btn-secondary mt-3" onClick={() => setIsWriting(true)}>
                  Escribir una recomendación
                </button>
              ))}
          </section>
        )}
      </div>
    </BottomSheet>
  );
};
