import React, { useEffect, useState } from 'react';
import { ImagePlus, MapPin, X } from 'lucide-react';
import { PublishPreset, useApp } from '../context/AppContext';
import { EMERGENCY_PUBLISH_GROUPS, NORMAL_PUBLISH_GROUPS, PublishTile } from '../data/categories';
import { REPORT_KINDS, ReportKind } from '../services/reportsService';
import { normalizePhone } from '../utils/geo';
import { loadContact, saveContact } from '../utils/storage';
import { MAX_POST_PHOTOS, uploadPostPhoto } from '../services/postPhotos';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

const PRICE_BY_TYPE: Record<string, string> = { service: 'Conversar con el vecino' };

/** What to write in "¿Qué ofreces?", by kind of business. */
const OFFER_HINTS: Record<string, string> = {
  comida: 'Platos del día, horario, si haces delivery...',
  polleria: 'Pollo entero, 1/4 con papas, horario, delivery...',
  reposteria: 'Tortas, postres, por pedido, sabores...',
  restaurante: 'Menú, carta, horario, si atiendes en el local...',
  bodega: 'Qué vendes, horario, si recargas celulares...',
  streaming: 'Qué plataformas, por cuánto tiempo, cómo se paga...'
};

export const PublishSheet: React.FC = () => {
  const { isPublishOpen, closePublish, publishPreset, mode, addItem, userLocation, hasLocation, openReport } = useApp();
  const t = useT();
  const isEmergency = mode === 'emergency';
  const groups = isEmergency ? EMERGENCY_PUBLISH_GROUPS : NORMAL_PUBLISH_GROUPS;

  const [choice, setChoice] = useState<PublishPreset | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [place, setPlace] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isService = choice?.type === 'service';
  const allowsPhotos = choice?.type === 'service' || choice?.type === 'favor_offer' || choice?.type === 'favor_request';

  // A business writes its own name: the tile's words are only a suggestion.
  const choose = (selection: PublishPreset) => {
    setChoice(selection);
    setTitle(selection.type === 'service' ? '' : selection.title);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const images = [...files].filter((file) => file.type.startsWith('image/'));
    setPhotos((current) => [...current, ...images].slice(0, MAX_POST_PHOTOS));
  };

  useEffect(() => {
    if (!isPublishOpen) return;
    const contact = loadContact();
    setName(contact.name);
    setPhone(contact.phone);
    setDetails('');
    setPlace('');
    setPrice('');
    setAddress('');
    setPhotos([]);
    setProblem(null);
    if (publishPreset) choose(publishPreset);
    else setChoice(null);
  }, [isPublishOpen, publishPreset]);

  const needsPlace = !hasLocation;

  const startReport = (kind: ReportKind) => {
    closePublish();
    openReport(kind);
  };

  const publish = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const finalTitle = title.trim() || choice?.title.trim() || '';
    if (!choice || !finalTitle || (needsPlace && !place.trim())) return;
    if (photos.length > 0 && !navigator.onLine) {
      setProblem('Las fotos necesitan internet. Quítalas para publicar ahora, o espera a tener señal.');
      return;
    }

    let photoPaths: string[] = [];
    if (photos.length > 0) {
      setIsUploading(true);
      setProblem(null);
      try {
        photoPaths = await Promise.all(photos.map(uploadPostPhoto));
      } catch {
        setProblem('No se pudieron subir las fotos. Revisa tu internet y vuelve a intentar.');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    saveContact({ name: name.trim(), phone: phone.trim() });
    addItem({
      title: finalTitle,
      description: details.trim(),
      type: choice.type,
      category: choice.category,
      authorName: name.trim() || 'Un vecino',
      authorPhone: normalizePhone(phone),
      neighborhood: needsPlace ? place.trim() : userLocation.name,
      coordinates: [userLocation.lat, userLocation.lng],
      address: isService && address.trim() ? address.trim() : undefined,
      priceInfo: isService && price.trim() ? price.trim() : PRICE_BY_TYPE[choice.type],
      photos: photoPaths,
      urgencyLevel: choice.type === 'emergency_need' ? 'alta' : undefined,
      status: 'active'
    });
    closePublish();
  };

  const footer = choice ? (
    <button type="submit" form="publish-form" disabled={isUploading} className={`btn ${isEmergency ? 'btn-danger' : 'btn-primary'}`}>
      {isUploading ? t('Subiendo fotos...') : isEmergency ? t('Reportar') : t('Publicar')}
    </button>
  ) : undefined;

  return (
    <BottomSheet
      open={isPublishOpen}
      onClose={closePublish}
      title={choice ? t('Revisa y publica') : t('¿Qué quieres publicar?')}
      footer={footer}
    >
      {!choice ? (
        <div className="px-4 pb-6 space-y-5" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <section>
            <h3 className="pb-2 text-section font-bold">{t('Avisar lo que pasa')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_KINDS.map((kind) => {
                const Icon = kind.icon;
                return (
                  <button
                    key={kind.id}
                    type="button"
                    onClick={() => startReport(kind.id)}
                    className="flex flex-col items-start gap-2 min-h-[88px] p-3 rounded-lg bg-sunken text-left active:bg-line"
                  >
                    <Icon className="w-6 h-6 text-rojo" aria-hidden="true" />
                    <span className="text-secondary font-bold">{t(kind.label)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {groups.map((group) => (
            <section key={group.heading}>
              <h3 className="pb-2 text-section font-bold">{t(group.heading)}</h3>
              <div className="grid grid-cols-2 gap-2">
                {group.tiles.map((tile: PublishTile) => {
                  const Icon = tile.icon;
                  return (
                    <button
                      key={`${tile.type}-${tile.label}`}
                      type="button"
                      onClick={() => choose(tile)}
                      className="flex flex-col items-start gap-2 min-h-[88px] p-3 rounded-lg bg-sunken text-left active:bg-line"
                    >
                      <Icon className="w-6 h-6 text-anil" aria-hidden="true" />
                      <span className="text-secondary font-bold">{t(tile.label)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <form id="publish-form" onSubmit={publish} className="px-4 pb-4 space-y-3">
          <div>
            <label htmlFor="publish-title" className="block pb-1 text-secondary font-bold">
              {isService ? t('Nombre de tu negocio o servicio') : t('Título')}
            </label>
            <input
              id="publish-title"
              required={!isService || !choice.title}
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={isService ? choice.title || 'Ej.: Pollería Don Lucho' : undefined}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="publish-details" className="block pb-1 text-secondary font-bold">
              {isService ? t('¿Qué ofreces?') : t('Detalles (opcional)')}
            </label>
            <textarea
              id="publish-details"
              rows={isService ? 3 : 2}
              maxLength={2000}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={isService ? OFFER_HINTS[choice.category] ?? 'Qué haces, horario, cómo te contactan...' : undefined}
              className="field"
            />
          </div>

          {isService && (
            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <label htmlFor="publish-price" className="block pb-1 text-secondary font-bold">{t('Precio')}</label>
                <input
                  id="publish-price"
                  maxLength={120}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Desde S/ 10"
                  className="field"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="publish-address" className="block pb-1 text-secondary font-bold">{t('¿Dónde queda?')}</label>
                <input
                  id="publish-address"
                  maxLength={200}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder={t('Calle y referencia')}
                  className="field"
                />
              </div>
            </div>
          )}

          {allowsPhotos && (
            <div>
              <p className="pb-1 text-secondary font-bold">{t('Fotos')} ({photos.length} de {MAX_POST_PHOTOS})</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={`${photo.name}-${index}`} className="relative">
                    <img src={URL.createObjectURL(photo)} alt={`Foto ${index + 1}`} className="w-20 h-20 rounded-lg object-cover bg-sunken" />
                    <button
                      type="button"
                      onClick={() => setPhotos((current) => current.filter((_, at) => at !== index))}
                      className="absolute -top-2 -right-2 grid place-items-center w-8 h-8 rounded-full bg-ink text-white"
                      aria-label={`Quitar la foto ${index + 1}`}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_POST_PHOTOS && (
                  <label className="grid place-items-center w-20 h-20 rounded-lg border-2 border-dashed border-line text-anil cursor-pointer">
                    <ImagePlus className="w-7 h-7" aria-hidden="true" />
                    <span className="sr-only">Agregar fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        addPhotos(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="pt-1 text-meta text-ink-2">{t('Muestra tu trabajo, tu comida o tu local. Se achican para gastar pocos datos.')}</p>
            </div>
          )}

          {problem && <p role="alert" className="text-secondary font-bold text-rojo">{problem}</p>}

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label htmlFor="publish-name" className="block pb-1 text-secondary font-bold">{t('Tu nombre')}</label>
              <input
                id="publish-name"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="publish-phone" className="block pb-1 text-secondary font-bold">{t('Teléfono')}</label>
              <input
                id="publish-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="field"
              />
            </div>
          </div>

          {needsPlace ? (
            <div>
              <label htmlFor="publish-place" className="block pb-1 text-secondary font-bold">{t('¿Dónde estás?')}</label>
              <input
                id="publish-place"
                required
                maxLength={160}
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                placeholder={t('Calle o referencia')}
                className="field"
              />
              <p className="pt-1 text-meta text-ink-2">{t('No tenemos tu ubicación. Escribe una referencia.')}</p>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-secondary text-ink-2">
              <MapPin className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{userLocation.name}</span>
            </p>
          )}
        </form>
      )}
    </BottomSheet>
  );
};
