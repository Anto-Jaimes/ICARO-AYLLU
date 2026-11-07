import React, { useEffect, useState } from 'react';
import { PERU_DEPARTMENTS } from '../data/departments';
import { loadUbigeo, Ubigeo } from '../data/ubigeo';

export interface PlaceValue {
  departmentId: string;
  province: string;
  district: string;
}

export const EMPTY_PLACE: PlaceValue = { departmentId: '', province: '', district: '' };

interface PlacePickerProps {
  value: PlaceValue;
  onChange: (value: PlaceValue) => void;
  /** Label of the empty option. Without it, the neighbour must choose all three levels. */
  anyLabel?: string;
  idPrefix: string;
}

export const PlacePicker: React.FC<PlacePickerProps> = ({ value, onChange, anyLabel, idPrefix }) => {
  const [data, setData] = useState<Ubigeo | null>(null);

  useEffect(() => {
    loadUbigeo().then(setData);
  }, []);

  const provinces = value.departmentId && data ? Object.keys(data[value.departmentId] ?? {}) : [];
  const districts = value.province && data ? (data[value.departmentId]?.[value.province] ?? []).map(([name]) => name) : [];
  const required = !anyLabel;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-department`} className="block pb-1 text-secondary font-bold">Departamento</label>
        <select
          id={`${idPrefix}-department`}
          required={required}
          value={value.departmentId}
          onChange={(event) => onChange({ departmentId: event.target.value, province: '', district: '' })}
          className="field"
        >
          <option value="">{anyLabel ?? 'Elige'}</option>
          {PERU_DEPARTMENTS.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-province`} className="block pb-1 text-secondary font-bold">Provincia</label>
          <select
            id={`${idPrefix}-province`}
            required={required}
            disabled={provinces.length === 0}
            value={value.province}
            onChange={(event) => onChange({ ...value, province: event.target.value, district: '' })}
            className="field disabled:bg-sunken"
          >
            <option value="">{anyLabel ?? 'Elige'}</option>
            {provinces.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-district`} className="block pb-1 text-secondary font-bold">Distrito</label>
          <select
            id={`${idPrefix}-district`}
            required={required}
            disabled={districts.length === 0}
            value={value.district}
            onChange={(event) => onChange({ ...value, district: event.target.value })}
            className="field disabled:bg-sunken"
          >
            <option value="">{anyLabel ?? 'Elige'}</option>
            {districts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
