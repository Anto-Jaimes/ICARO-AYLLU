import { CommunityItem } from '../types';

export const INITIAL_USER_LOCATION = {
  lat: -12.0935,
  lng: -77.0320,
  name: 'Barrio Los Sauces (Sector 2)'
};

export const INITIAL_ITEMS: CommunityItem[] = [
  // --- MÓDULO 1: SERVICIOS Y EMPRENDIMIENTOS DEL BARRIO (Texto literal Julio Cortijo) ---
  {
    id: 'srv-lasana',
    title: 'Lasañas Caseras y Pasteles de Doña Rosa',
    description: 'Aprovecho mis momentos para hacer ricas lasañas de carne y verduras, además de queques caseros. Venta para vecinos de la cuadra.',
    type: 'service',
    category: 'comida',
    authorName: 'Doña Rosa',
    authorPhone: '+51987654321',
    neighborhood: 'Jr. Los Sauces 234',
    address: 'A 1 cuadra del parque',
    coordinates: [-12.0930, -77.0315],
    vistosBuenos: 32,
    priceInfo: 'S/ 18 porción',
    status: 'active',
    createdAt: 'Hoy, 11:30 AM',
    reviews: [
      {
        id: 'rev-lasana-1',
        authorName: 'Julio Cortijo (Vecino)',
        comment: 'La lasaña de mi vecina es muy buena, se las recomiendo a todos los vecinos del barrio.',
        date: 'Ayer',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'srv-clases',
    title: 'Clases de Matemáticas Escolar y Secundaria',
    description: 'Apoyo a niños y jóvenes del barrio con álgebra, geometría y aritmética. Sin necesidad de gastar en pasajes ni traslados.',
    type: 'service',
    category: 'clases',
    authorName: 'Prof. Julio',
    authorPhone: '+51976543210',
    neighborhood: 'Av. Las Palmeras 104',
    address: 'Piso 2',
    coordinates: [-12.0940, -77.0305],
    vistosBuenos: 24,
    priceInfo: 'S/ 20 la hora',
    status: 'active',
    createdAt: 'Hoy, 09:00 AM',
    reviews: [
      {
        id: 'rev-clases-1',
        authorName: 'Sra. Carmen',
        comment: 'Excelente paciencia con mis hijos, vive a media cuadra.',
        date: 'Hace 2 días',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'srv-gasfitero',
    title: 'Gasfitería Don Carlos (Reparación Express)',
    description: 'Solución a cañerías rotas, grifos y sanitarios. Atención en menos de 15 minutos en el cuadrante.',
    type: 'service',
    category: 'gasfiteria',
    authorName: 'Don Carlos Mendoza',
    authorPhone: '+51965432109',
    neighborhood: 'Calle Los Pinos 210',
    address: 'Frente a bodega Don Pepe',
    coordinates: [-12.0920, -77.0335],
    vistosBuenos: 41,
    priceInfo: 'Tarifa vecinal',
    status: 'active',
    createdAt: 'Hace 3 horas',
    reviews: []
  },
  {
    id: 'srv-cerrajero',
    title: 'Cerrajería de Confianza "Lucho"',
    description: 'Apertura de chapas trabadas sin romper puertas y duplicados al instante para vecinos.',
    type: 'service',
    category: 'cerrajeria',
    authorName: 'Lucho Cerrajería',
    authorPhone: '+51954321098',
    neighborhood: 'Pasaje Santa Rosa Mz C',
    address: 'Local 4',
    coordinates: [-12.0910, -77.0310],
    vistosBuenos: 29,
    priceInfo: 'Desde S/ 15',
    status: 'active',
    createdAt: 'Ayer',
    reviews: []
  },

  // --- MÓDULO 2: CADENA DE FAVORES SIN DINERO (Texto literal Julio Cortijo) ---
  {
    id: 'fav-muleta',
    title: 'Presto Par de Muletas Ortopédicas (Talla Adulto)',
    description: 'Mi hermano se recuperó de una lesión jugando fútbol. Juancito o cualquier vecino que las necesite, no las compres, yo te las presto sin costo.',
    type: 'favor_offer',
    category: 'salud',
    authorName: 'Marcos (Vecino Mz D)',
    authorPhone: '+51943210987',
    neighborhood: 'Jr. Arequipa 512',
    address: 'Casa con reja blanca',
    coordinates: [-12.0928, -77.0290],
    vistosBuenos: 38,
    priceInfo: 'GRATIS / Préstamo solidario',
    status: 'active',
    createdAt: 'Hoy, 08:30 AM',
    reviews: [
      {
        id: 'rev-muleta-1',
        authorName: 'Juancito',
        comment: 'Me ahorró comprar unas muletas nuevas por 1 mes de yeso. ¡Muchísimas gracias!',
        date: 'Ayer',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'fav-carpool',
    title: 'Movilidad Solidaria / Pool al Colegio San Agustín',
    description: 'Llevo a mis hijas en auto al colegio todos los días a las 7:30 AM. Tengo 2 asientos libres para vecinos de la ruta para mitigar costos y autos en el barrio.',
    type: 'favor_offer',
    category: 'movilidad',
    authorName: 'Familia Barreto',
    authorPhone: '+51932109876',
    neighborhood: 'Calle Los Sauces 410',
    address: 'Estacionamiento 12',
    coordinates: [-12.0950, -77.0330],
    vistosBuenos: 27,
    priceInfo: 'Solidario / Sin fines de lucro',
    status: 'active',
    createdAt: 'Hoy, 07:15 AM',
    reviews: []
  },
  {
    id: 'fav-escalera',
    title: 'Presto Escalera Tijera de Aluminio y Taladro',
    description: 'Para pintar o arreglar la casa el fin de semana. Solo pido devolverla limpia el mismo día.',
    type: 'favor_offer',
    category: 'herramientas',
    authorName: 'Don Roberto',
    authorPhone: '+51921098765',
    neighborhood: 'Jr. Lima 180',
    address: 'Taller',
    coordinates: [-12.0915, -77.0325],
    vistosBuenos: 19,
    priceInfo: 'Préstamo entre vecinos',
    status: 'active',
    createdAt: 'Ayer',
    reviews: []
  },

  // --- MÓDULO 3: EMERGENCIAS / EL NIÑO / SISMOS (Texto literal Julio Cortijo) ---
  {
    id: 'emg-baldes',
    title: 'Se mojó mi techo por la lluvia, necesito baldes y plásticos',
    description: 'Filtración fuerte en el segundo piso por lluvias del Fenómeno El Niño. ¿Algún vecino que me preste baldes grandes o plástico grueso?',
    type: 'emergency_need',
    category: 'agua_alimentos',
    authorName: 'Sra. Elena (Mz H Lt 4)',
    authorPhone: '+51910987654',
    neighborhood: 'Pasaje Bolognesi 105',
    address: 'Segundo piso',
    coordinates: [-12.0938, -77.0345],
    vistosBuenos: 15,
    urgencyLevel: 'alta',
    status: 'active',
    createdAt: 'Hace 25 min',
    reviews: []
  },
  {
    id: 'emg-anciano',
    title: 'Don Alfonso (84 años) necesita ayuda con bidón de agua',
    description: 'Corte de agua en el sector. Don Alfonso no puede cargar peso por las escaleras. Se requiere voluntario joven.',
    type: 'emergency_need',
    category: 'vulnerabilidad_mayor',
    authorName: 'Brigada Vecinal Sector 2',
    authorPhone: '+51909876543',
    neighborhood: 'Torre B Dpto 301',
    address: 'Urb. Los Sauces',
    coordinates: [-12.0925, -77.0310],
    vistosBuenos: 42,
    urgencyLevel: 'critica',
    status: 'active',
    createdAt: 'Hace 40 min',
    reviews: []
  },
  {
    id: 'emg-punto-agua',
    title: 'Tanque Comunitario y Punto de Carga de Celulares',
    description: 'En el local comunal tenemos grupo electrógeno para cargar teléfonos y tanque de agua potable disponible para vecinos sin servicio.',
    type: 'emergency_resource',
    category: 'energia_luz',
    authorName: 'Junta Vecinal Los Sauces',
    authorPhone: '+51998877665',
    neighborhood: 'Local Comunal (Parque Central)',
    address: 'Frente al mirador',
    coordinates: [-12.0935, -77.0320],
    vistosBuenos: 60,
    status: 'active',
    createdAt: 'Hace 1 hora',
    reviews: []
  }
];
