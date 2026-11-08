import React, { useState } from 'react';
import { HeartPulse, Pencil, Phone } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';
import { BottomSheet } from './BottomSheet';

export interface MedicalProfile {
  fullName: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const STORAGE_KEY = 'ayllu_medical_id_v1';

const EMPTY_PROFILE: MedicalProfile = {
  fullName: '',
  bloodType: '',
  allergies: '',
  conditions: '',
  emergencyContactName: '',
  emergencyContactPhone: ''
};

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// An earlier version shipped invented sample data. It must never pass for a real record.
const isOldSample = (profile: MedicalProfile) =>
  profile.fullName === 'Vecino del Barrio' && profile.emergencyContactPhone === '+51 987 654 321';

function loadProfile(): MedicalProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return EMPTY_PROFILE;
    const profile = { ...EMPTY_PROFILE, ...JSON.parse(saved) };
    return isOldSample(profile) ? EMPTY_PROFILE : profile;
  } catch {
    return EMPTY_PROFILE;
  }
}

const dialable = (phone: string) => phone.replace(/[^\d+]/g, '');

interface MedicalIdSheetProps {
  open: boolean;
  onClose: () => void;
}

export const MedicalIdSheet: React.FC<MedicalIdSheetProps> = ({ open, onClose }) => {
  const t = useT();
  const [profile, setProfile] = useState<MedicalProfile>(loadProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<MedicalProfile>(profile);
  const isFilled = profile.fullName.trim().length > 0;

  const startEditing = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as unknown as MedicalProfile;
    setProfile(clean);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch (err) {
      console.warn('No se pudo guardar la ficha médica:', err);
    }
    setIsEditing(false);
  };

  const field = (key: keyof MedicalProfile) => ({
    id: `medical-${key}`,
    value: draft[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft({ ...draft, [key]: event.target.value }),
    className: 'field'
  });

  const footer = isEditing ? (
    <div className="flex gap-2">
      <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>{t('Cancelar')}</button>
      <button type="submit" form="medical-form" className="btn btn-primary">{t('Guardar')}</button>
    </div>
  ) : (
    <button type="button" className="btn btn-secondary" onClick={startEditing}>
      <Pencil className="w-5 h-5" aria-hidden="true" />
      {isFilled ? t('Cambiar mis datos') : t('Llenar mi ficha')}
    </button>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Ficha médica')} footer={footer}>
      <div className="px-4 pb-4 space-y-4">
        <p className="text-secondary text-ink-2">
          {t('Para que un rescatista sepa tu tipo de sangre, tus alergias y a quién llamar. Se guarda solo en este teléfono y se abre sin internet.')}
        </p>

        {isEditing ? (
          <form id="medical-form" onSubmit={save} className="space-y-3">
            <div>
              <label htmlFor="medical-fullName" className="block pb-1 text-secondary font-bold">{t('Tu nombre completo')}</label>
              <input type="text" required autoComplete="name" {...field('fullName')} />
            </div>
            <div>
              <label htmlFor="medical-bloodType" className="block pb-1 text-secondary font-bold">{t('Tipo de sangre')}</label>
              <select {...field('bloodType')}>
                <option value="">{t('No lo sé')}</option>
                {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="medical-allergies" className="block pb-1 text-secondary font-bold">{t('Alergias')}</label>
              <input type="text" placeholder={t('Por ejemplo: penicilina')} {...field('allergies')} />
            </div>
            <div>
              <label htmlFor="medical-conditions" className="block pb-1 text-secondary font-bold">{t('Enfermedades o medicinas que tomas')}</label>
              <input type="text" placeholder={t('Por ejemplo: diabetes, asma')} {...field('conditions')} />
            </div>
            <div>
              <label htmlFor="medical-emergencyContactName" className="block pb-1 text-secondary font-bold">{t('A quién llamar')}</label>
              <input type="text" placeholder={t('Nombre de un familiar')} {...field('emergencyContactName')} />
            </div>
            <div>
              <label htmlFor="medical-emergencyContactPhone" className="block pb-1 text-secondary font-bold">{t('Su celular')}</label>
              <input type="tel" inputMode="tel" autoComplete="tel" {...field('emergencyContactPhone')} />
            </div>
          </form>
        ) : isFilled ? (
          <dl className="list">
            <div className="py-3">
              <dt className="text-meta text-ink-2">{t('Nombre')}</dt>
              <dd className="text-row font-bold">{profile.fullName}</dd>
            </div>
            <div className="py-3">
              <dt className="text-meta text-ink-2">{t('Tipo de sangre')}</dt>
              <dd className="text-row font-bold">{profile.bloodType || t('No lo sabe')}</dd>
            </div>
            <div className="py-3">
              <dt className="text-meta text-ink-2">{t('Alergias')}</dt>
              <dd className="text-row font-bold">{profile.allergies || t('No anotó ninguna')}</dd>
            </div>
            <div className="py-3">
              <dt className="text-meta text-ink-2">{t('Enfermedades o medicinas')}</dt>
              <dd className="text-row font-bold">{profile.conditions || t('No anotó ninguna')}</dd>
            </div>
            {profile.emergencyContactPhone && (
              <div className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <dt className="text-meta text-ink-2">{t('A quién llamar')}</dt>
                  <dd className="text-row font-bold truncate">{profile.emergencyContactName || t('Familiar')}</dd>
                  <dd className="text-secondary text-ink-2">{profile.emergencyContactPhone}</dd>
                </div>
                <a href={`tel:${dialable(profile.emergencyContactPhone)}`} className="btn btn-primary w-auto shrink-0">
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  {t('Llamar')}
                </a>
              </div>
            )}
          </dl>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-sunken">
            <HeartPulse className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
            <p className="text-secondary">{t('Todavía no llenaste tu ficha. Toma un minuto y puede ayudar a salvarte.')}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
