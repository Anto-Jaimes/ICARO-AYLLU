import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { PublishPreset, useApp } from '../context/AppContext';
import { EMERGENCY_PUBLISH_GROUPS, NORMAL_PUBLISH_GROUPS, PublishTile } from '../data/categories';
import { REPORT_KINDS, ReportKind } from '../services/reportsService';
import { normalizePhone } from '../utils/geo';
import { loadContact, saveContact } from '../utils/storage';
import { BottomSheet } from './BottomSheet';

const PRICE_BY_TYPE: Record<string, string> = { service: 'Conversar con el vecino' };

export const PublishSheet: React.FC = () => {
  const { isPublishOpen, closePublish, publishPreset, mode, addItem, userLocation, hasLocation, openReport } = useApp();
  const isEmergency = mode === 'emergency';
  const groups = isEmergency ? EMERGENCY_PUBLISH_GROUPS : NORMAL_PUBLISH_GROUPS;

  const [choice, setChoice] = useState<PublishPreset | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [place, setPlace] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const choose = (selection: PublishPreset) => {
    setChoice(selection);
    setTitle(selection.title);
  };

  useEffect(() => {
    if (!isPublishOpen) return;
    const contact = loadContact();
    setName(contact.name);
    setPhone(contact.phone);
    setDetails('');
    setPlace('');
    if (publishPreset) choose(publishPreset);
    else setChoice(null);
  }, [isPublishOpen, publishPreset]);

  const needsPlace = !hasLocation;

  const startReport = (kind: ReportKind) => {
    closePublish();
    openReport(kind);
  };

  const publish = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!choice || !title.trim() || (needsPlace && !place.trim())) return;

    saveContact({ name: name.trim(), phone: phone.trim() });
    addItem({
      title: title.trim(),
      description: details.trim(),
      type: choice.type,
      category: choice.category,
      authorName: name.trim() || 'Un vecino',
      authorPhone: normalizePhone(phone),
      neighborhood: needsPlace ? place.trim() : userLocation.name,
      coordinates: [userLocation.lat, userLocation.lng],
      priceInfo: PRICE_BY_TYPE[choice.type],
      urgencyLevel: choice.type === 'emergency_need' ? 'alta' : undefined,
      status: 'active'
    });
    closePublish();
  };

  const footer = choice ? (
    <button type="submit" form="publish-form" className={`btn ${isEmergency ? 'btn-danger' : 'btn-primary'}`}>
      {isEmergency ? 'Reportar' : 'Publicar'}
    </button>
  ) : undefined;

  return (
    <BottomSheet
      open={isPublishOpen}
      onClose={closePublish}
      title={choice ? 'Revisa y publica' : '¿Qué quieres publicar?'}
      footer={footer}
    >
      {!choice ? (
        <div className="px-4 pb-6 space-y-5" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <section>
            <h3 className="pb-2 text-section font-bold">Avisar lo que pasa</h3>
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
                    <span className="text-secondary font-bold">{kind.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {groups.map((group) => (
            <section key={group.heading}>
              <h3 className="pb-2 text-section font-bold">{group.heading}</h3>
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
                      <span className="text-secondary font-bold">{tile.label}</span>
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
            <label htmlFor="publish-title" className="block pb-1 text-secondary font-bold">Título</label>
            <input
              id="publish-title"
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="publish-details" className="block pb-1 text-secondary font-bold">Detalles (opcional)</label>
            <textarea
              id="publish-details"
              rows={2}
              maxLength={2000}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label htmlFor="publish-name" className="block pb-1 text-secondary font-bold">Tu nombre</label>
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
              <label htmlFor="publish-phone" className="block pb-1 text-secondary font-bold">Teléfono</label>
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
              <label htmlFor="publish-place" className="block pb-1 text-secondary font-bold">¿Dónde estás?</label>
              <input
                id="publish-place"
                required
                maxLength={160}
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                placeholder="Calle o referencia"
                className="field"
              />
              <p className="pt-1 text-meta text-ink-2">No tenemos tu ubicación. Escribe una referencia.</p>
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
