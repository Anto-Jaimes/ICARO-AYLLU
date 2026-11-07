import React, { useState, useEffect } from 'react';
import { HeartPulse, Phone, User, AlertCircle, Save, Edit3, X } from 'lucide-react';
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

const DEFAULT_PROFILE: MedicalProfile = {
  fullName: 'Vecino del Barrio',
  bloodType: 'O+',
  allergies: 'Ninguna conocida',
  conditions: 'Ninguna',
  emergencyContactName: 'Familiar Directo',
  emergencyContactPhone: '+51 987 654 321'
};

interface MedicalIdSheetProps {
  open: boolean;
  onClose: () => void;
}

export const MedicalIdSheet: React.FC<MedicalIdSheetProps> = ({ open, onClose }) => {
  const [profile, setProfile] = useState<MedicalProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<MedicalProfile>(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (err) {
      console.warn('Could not save medical profile:', err);
    }
    setIsEditing(false);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Ficha Médica (ICE)"
      footer={
        !isEditing ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-5 h-5 mr-1" aria-hidden="true" />
            Editar mi ficha médica
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={handleSave}
            >
              <Save className="w-5 h-5 mr-1" aria-hidden="true" />
              Guardar datos
            </button>
          </div>
        )
      }
    >
      <div className="px-4 pb-4 space-y-4 text-ink">
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-rojo flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Información médica para rescatistas, paramédicos o vecinos en emergencias. <strong>Funciona sin internet</strong> y se almacena solo en este teléfono.
          </p>
        </div>

        {!isEditing ? (
          <div className="space-y-3">
            {/* Header Card */}
            <div className="p-4 bg-surface rounded-2xl border border-line flex items-center justify-between">
              <div>
                <span className="text-meta text-ink-2 uppercase font-bold tracking-wider">Titular</span>
                <h3 className="text-title font-bold text-ink mt-0.5">{profile.fullName}</h3>
              </div>
              <div className="text-center px-3 py-1.5 bg-rojo text-white rounded-xl shadow-xs">
                <span className="text-[10px] uppercase font-black block">Sangre</span>
                <span className="text-lg font-black">{profile.bloodType || 'Desc.'}</span>
              </div>
            </div>

            {/* Critical Info */}
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 bg-surface rounded-xl border border-line">
                <span className="text-meta text-ink-2 font-bold uppercase block">Alergias Conocidas</span>
                <p className="font-semibold text-rojo mt-0.5">{profile.allergies || 'Ninguna'}</p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line">
                <span className="text-meta text-ink-2 font-bold uppercase block">Condiciones o Enfermedades</span>
                <p className="font-semibold text-ink mt-0.5">{profile.conditions || 'Ninguna'}</p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 bg-surface rounded-2xl border-2 border-anil/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-meta text-anil font-bold uppercase tracking-wider block">
                  Contacto de Emergencia Familiar
                </span>
                <h4 className="font-bold text-row truncate mt-0.5">{profile.emergencyContactName}</h4>
                <p className="text-secondary text-ink-2">{profile.emergencyContactPhone}</p>
              </div>

              <a
                href={`tel:${profile.emergencyContactPhone}`}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-anil text-white font-bold text-secondary rounded-xl no-underline shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Llamar</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-meta font-bold text-ink-2 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-line text-row bg-surface"
              />
            </div>

            <div>
              <label className="block text-meta font-bold text-ink-2 mb-1">Grupo Sanguíneo</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-line text-row bg-surface"
              >
                <option value="O+">O Positivo (O+)</option>
                <option value="O-">O Negativo (O-)</option>
                <option value="A+">A Positivo (A+)</option>
                <option value="A-">A Negativo (A-)</option>
                <option value="B+">B Positivo (B+)</option>
                <option value="B-">B Negativo (B-)</option>
                <option value="AB+">AB Positivo (AB+)</option>
                <option value="AB-">AB Negativo (AB-)</option>
                <option value="Desconocido">No lo sé</option>
              </select>
            </div>

            <div>
              <label className="block text-meta font-bold text-ink-2 mb-1">Alergias Críticas (ej: Penicilina)</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Penicilina, mariscos, polen, etc."
                className="w-full px-3 py-2 rounded-xl border border-line text-row bg-surface"
              />
            </div>

            <div>
              <label className="block text-meta font-bold text-ink-2 mb-1">Condiciones Médicas (ej: Diabetes, Asma)</label>
              <input
                type="text"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="Hipertensión, diabetes, marcapasos..."
                className="w-full px-3 py-2 rounded-xl border border-line text-row bg-surface"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
              <div>
                <label className="block text-meta font-bold text-ink-2 mb-1">Nombre Familiar</label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-line text-row bg-surface"
                />
              </div>
              <div>
                <label className="block text-meta font-bold text-ink-2 mb-1">Celular Familiar</label>
                <input
                  type="tel"
                  required
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-line text-row bg-surface"
                />
              </div>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
