/**
 * The price of a 10 kg gas cylinder (GLP envasado): Osinergmin publishes it, store by store, in
 * Facilito. AYLLU sends there instead of keeping prices of its own, which would go out of date, and
 * adds the basic safety advice for using gas at home.
 */

/** Facilito's price search (choose GLP, then GLP envasado, then the district). */
export const FACILITO_GLP_URL = 'https://www.facilito.gob.pe/facilito/pages/facilito/menuPrecios.jsp';

export const GAS_SAFETY_TIPS = [
  'Compra en locales formales: el balón debe tener su precinto de seguridad.',
  'Si huele a gas, no prendas luces ni fósforos: abre puertas y ventanas, cierra la llave del balón y sal.',
  'Después de un sismo, revisa la manguera y la válvula antes de volver a prender la cocina.'
];

// An earlier version kept a made-up list of distributors here; it must not come back from storage.
try {
  localStorage.removeItem('ayllu_osinergmin_gas_v1');
} catch {
  // nothing to remove
}
