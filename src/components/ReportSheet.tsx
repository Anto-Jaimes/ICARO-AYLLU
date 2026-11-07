import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { departmentName, districtCoordinates, loadUbigeo, nearestPlace } from '../data/ubigeo';
import { inspectMedia, MediaOutcome, validateFile } from '../services/mediaCheck';
import { REPORT_KINDS, ReportKind, submitReport } from '../services/reportsService';
import { loadContact, saveContact } from '../utils/storage';
import { BottomSheet } from './BottomSheet';
import { EMPTY_PLACE, PlacePicker, PlaceValue } from './PlacePicker';

const MAX_DESCRIPTION = 500;

export const ReportSheet: React.FC = () => {
  const { reportKind, closeReport, isOnline, hasLocation, userLocation, showNotice, refreshReports } = useApp();
  const isOpen = reportKind !== null;

  const [kind, setKind] = useState<ReportKind>('otro');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState<PlaceValue>(EMPTY_PLACE);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaOutcome, setMediaOutcome] = useState<MediaOutcome | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearMedia = () => {
    setFile(null);
    setMediaOutcome(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    if (!isOpen) return;
    setKind(reportKind);
    setDescription('');
    setProblem(null);
    clearMedia();
    setPlace(EMPTY_PLACE);
    if (hasLocation) {
      loadUbigeo().then((data) => {
        const nearest = nearestPlace(data, userLocation.lat, userLocation.lng);
        if (nearest) setPlace(nearest);
      });
    }
  }, [isOpen, reportKind]);

  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    clearMedia();
    setProblem(null);

    const invalid = validateFile(picked);
    if (invalid) {
      setProblem(invalid);
      return;
    }

    setIsChecking(true);
    const result = await inspectMedia(picked);
    setIsChecking(false);

    if (result.outcome === 'blocked') {
      setProblem(result.message ?? 'Este archivo no se puede publicar.');
      return;
    }

    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setMediaOutcome(result.outcome);
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSending || isChecking || !description.trim()) return;

    setProblem(null);
    setIsSending(true);
    try {
      const ubigeo = await loadUbigeo();
      const coordinates = hasLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : districtCoordinates(ubigeo, place);
      if (!coordinates) throw new Error('Sin coordenadas para el lugar');

      const contact = loadContact();
      const result = await submitReport({
        kind,
        description: description.trim(),
        authorName: contact.name || 'Un vecino',
        place: { department: departmentName(place.departmentId), province: place.province, district: place.district, ...coordinates },
        file,
        mediaOutcome
      });

      if (result.status === 'rejected') {
        setProblem(
          result.reason === 'advertising'
            ? 'Esto parece publicidad. Para ofrecer algo, usa Publicar y elige "Ofrezco mi trabajo".'
            : 'Ya publicaste varias noticias. Espera un momento.'
        );
        return;
      }

      saveContact({ ...contact });
      showNotice(result.status === 'published' ? 'Noticia publicada' : 'Un moderador la revisará antes de publicarla.');
      refreshReports();
      closeReport();
    } catch (err) {
      console.error('No se pudo publicar la noticia:', err);
      setProblem('No se pudo enviar. Revisa tu internet y vuelve a intentar.');
    } finally {
      setIsSending(false);
    }
  };

  const isVideo = file?.type.startsWith('video/');

  return (
    <BottomSheet
      open={isOpen}
      onClose={closeReport}
      title="Avisar a tus vecinos"
      footer={
        <button
          type="submit"
          form="report-form"
          disabled={!isOnline || isChecking || isSending}
          className="btn btn-primary disabled:opacity-50"
        >
          {isSending ? 'Enviando...' : 'Publicar noticia'}
        </button>
      }
    >
      <form id="report-form" onSubmit={send} className="pb-4 space-y-4">
        {!isOnline && (
          <p role="status" className="mx-4 p-3 rounded-lg bg-offline text-white text-secondary">
            Necesitas internet para enviar una noticia. Si es urgente, toca SOS.
          </p>
        )}

        <fieldset className="border-0 p-0 m-0">
          <legend className="px-4 pb-1 text-secondary font-bold">¿Qué pasó?</legend>
          <div className="chip-row">
            {REPORT_KINDS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="chip"
                aria-pressed={kind === option.id}
                onClick={() => setKind(option.id)}
              >
                {kind === option.id && <Check className="w-4 h-4" aria-hidden="true" />}
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="px-4">
          <input
            ref={inputRef}
            id="report-file"
            type="file"
            accept="image/*,video/*"
            onChange={pickFile}
            className="sr-only"
          />

          {previewUrl ? (
            <div>
              {isVideo ? (
                <video src={previewUrl} controls playsInline className="w-full max-h-56 rounded-lg bg-black" />
              ) : (
                <img src={previewUrl} alt="Vista previa" className="w-full max-h-56 object-cover rounded-lg" />
              )}
              <button type="button" onClick={clearMedia} className="mt-1 min-h-12 flex items-center gap-2 text-secondary font-bold text-anil">
                <Trash2 className="w-5 h-5" aria-hidden="true" />
                Quitar
              </button>
            </div>
          ) : (
            <label
              htmlFor="report-file"
              className="flex items-center justify-center gap-2 min-h-14 rounded-lg bg-sunken text-row font-bold text-anil cursor-pointer active:bg-line"
            >
              <Camera className="w-6 h-6" aria-hidden="true" />
              {isChecking ? 'Revisando el archivo...' : 'Agregar foto o video'}
            </label>
          )}
          <p className="pt-1 text-meta text-ink-2">Opcional. Video de hasta 1 minuto.</p>
        </div>

        <div className="px-4">
          <label htmlFor="report-description" className="block pb-1 text-secondary font-bold">Cuéntalo en pocas palabras</label>
          <textarea
            id="report-description"
            required
            rows={3}
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="field"
          />
        </div>

        <div className="px-4">
          <PlacePicker idPrefix="report-place" value={place} onChange={setPlace} />
        </div>

        {problem && (
          <p role="alert" className="mx-4 p-3 rounded-lg bg-sunken text-secondary font-bold">{problem}</p>
        )}
      </form>
    </BottomSheet>
  );
};
