import { CommunityItem } from '../types';

export const INITIAL_USER_LOCATION = {
  lat: -12.0935,
  lng: -77.0320,
  name: 'Barrio Central / Los Sauces'
};

export const INITIAL_ITEMS: CommunityItem[] = [
  // --- MÓDULO 1: SERVICIOS DE PROXIMIDAD (DÍA A DÍA) ---
  {
    id: 'srv-1',
    title: 'Gasfitería y Reparación de Fugas Don Carlos',
    description: 'Más de 20 años en el barrio. Arreglo de tuberías, cañerías, sanitarios, termas e instalación de bombas de agua. Descuentos a vecinos mayores.',
    type: 'service',
    category: 'gasfiteria',
    authorName: 'Carlos M.',
    authorPhone: '+51987654321',
    neighborhood: 'Pasaje Los Laureles 142',
    address: 'A 2 cuadras del Parque Principal',
    coordinates: [-12.0920, -77.0335],
    vistosBuenos: 28,
    priceInfo: 'S/ 35 - S/ 60 (Tarifa vecinal)',
    status: 'active',
    createdAt: 'Hace 2 horas',
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Doña Teresa (Vecina Jr. Robles)',
        comment: 'Don Carlos vino en 15 minutos cuando se rompió la tubería del baño. Muy honrado y dejó todo limpio.',
        date: 'Ayer',
        isNeighborVerified: true
      },
      {
        id: 'rev-2',
        authorName: 'Marco Aurelio',
        comment: '100% recomendado por los vecinos de la cuadra 3. Cobra lo justo.',
        date: 'Hace 4 días',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'srv-2',
    title: 'Electricidad Domiciliaria y Cuadros Eléctricos',
    description: 'Técnico certificado. Instalación de interruptores térmicos, cableado, luminarias LED y solución a cortocircuitos urgentes en la zona.',
    type: 'service',
    category: 'electricidad',
    authorName: 'Ing. Javier Rojas',
    authorPhone: '+51976543210',
    neighborhood: 'Av. Las Gardenias 450',
    address: 'Frente a la farmacia comunitaria',
    coordinates: [-12.0945, -77.0305],
    vistosBuenos: 19,
    priceInfo: 'Evaluación rápida S/ 25',
    status: 'active',
    createdAt: 'Hace 5 horas',
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Patricia Solís',
        comment: 'Me arregló la llave general que botaba chispas en la noche. Muy puntual y profesional.',
        date: 'Hace 1 semana',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'srv-3',
    title: 'Cerrajería 24 Horas "El Candado Vecinal"',
    description: 'Apertura de puertas sin daños, cambio de chapas, duplicado de llaves al instante. Atención a pie en menos de 10 minutos.',
    type: 'service',
    category: 'cerrajeria',
    authorName: 'Miguel Benítez',
    authorPhone: '+51965432109',
    neighborhood: 'Calle Los Pinos 210',
    address: 'Cerca a la bodega Don Pepe',
    coordinates: [-12.0910, -77.0310],
    vistosBuenos: 34,
    priceInfo: 'Desde S/ 20',
    status: 'active',
    createdAt: 'Hace 1 día',
    reviews: [
      {
        id: 'rev-4',
        authorName: 'Lucía G.',
        comment: 'Olvidé mis llaves adentro con la olla prendida y Miguel llegó corriendo. Nos salvó el día.',
        date: 'Hace 3 días',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'srv-4',
    title: 'Paseo y Cuidado de Mascotas Responsable',
    description: 'Estudiante de veterinaria ofrece paseos grupales o individuales para perritos y visitas a gatos cuando viajas. Máximo cariño y paciencia.',
    type: 'service',
    category: 'mascotas',
    authorName: 'Valeria Quispe',
    authorPhone: '+51954321098',
    neighborhood: 'Jr. Bolognesi 330',
    address: 'Zona Parque de los Niños',
    coordinates: [-12.0955, -77.0340],
    vistosBuenos: 15,
    priceInfo: 'S/ 12 la hora',
    status: 'active',
    createdAt: 'Hace 3 días',
    reviews: []
  },

  // --- MÓDULO 2: CADENA DE FAVORES & ECONOMÍA SOLIDARIA (SIN DINERO) ---
  {
    id: 'fav-1',
    title: 'Presto Taladro Percutor y Escalera de Aluminio (4m)',
    description: 'Tengo un taladro Bosch con brocas para concreto y madera, y escalera tijera de 4 metros. Los presto a vecinos para arreglos de casa sin ningún costo.',
    type: 'favor_offer',
    category: 'herramientas',
    authorName: 'Roberto Mendoza',
    authorPhone: '+51943210987',
    neighborhood: 'Calle Las Acacias 120',
    address: 'Casa con reja verde',
    coordinates: [-12.0928, -77.0290],
    vistosBuenos: 14,
    priceInfo: 'GRATIS / Préstamo solidario',
    status: 'active',
    createdAt: 'Hoy a las 10:00 AM',
    reviews: [
      {
        id: 'rev-5',
        authorName: 'Esteban C.',
        comment: 'Roberto me prestó el taladro el fin de semana para colgar mis repisas. ¡Gran iniciativa comunitaria!',
        date: 'Ayer',
        isNeighborVerified: true
      }
    ]
  },
  {
    id: 'fav-2',
    title: 'Donación: 3 Cajas de Libros Escolares de Primaria y Secundaria',
    description: 'Mis hijos ya terminaron el colegio. Son libros de matemáticas, ciencias, literatura y cuadernos de trabajo nuevos listos para familias que los necesiten.',
    type: 'favor_offer',
    category: 'donacion',
    authorName: 'Carmen Rosa',
    authorPhone: '+51932109876',
    neighborhood: 'Jr. Grau 512',
    address: 'Costado del colegio Santa Rosa',
    coordinates: [-12.0960, -77.0315],
    vistosBuenos: 22,
    priceInfo: 'DONACIÓN GRATUITA',
    status: 'active',
    createdAt: 'Hace 6 horas',
    reviews: []
  },
  {
    id: 'fav-3',
    title: 'Necesito apoyo trasladando mueble pesado 3 cuadras',
    description: 'Soy una vecina de la tercera edad y compré una cajonera pequeña. Necesito ayuda de 1 o 2 vecinos para cargarla 300 metros.',
    type: 'favor_request',
    category: 'ayuda_temporal',
    authorName: 'Sra. Beatriz Flores',
    authorPhone: '+51921098765',
    neighborhood: 'Calle Jacarandá 180',
    address: 'Tercer piso',
    coordinates: [-12.0940, -77.0330],
    vistosBuenos: 8,
    priceInfo: 'Trueque: Ofrezco queque casero y limonada',
    status: 'active',
    createdAt: 'Hace 40 minutos',
    reviews: []
  },
  {
    id: 'fav-4',
    title: 'Trueque de Saberes: Enseño Clases de Computación a cambio de Huerta',
    description: 'Enseño uso de celular, WhatsApp e internet a adultos mayores a cambio de que me enseñen a cultivar tomates y plantas aromáticas en azotea.',
    type: 'favor_offer',
    category: 'habilidades',
    authorName: 'Daniel Vega',
    authorPhone: '+51910987654',
    neighborhood: 'Pasaje San Martín 105',
    coordinates: [-12.0915, -77.0345],
    vistosBuenos: 11,
    priceInfo: 'Trueque directo de habilidades',
    status: 'active',
    createdAt: 'Hace 1 día',
    reviews: []
  },

  // --- MÓDULO EMERGENCIA: BRIGADAS Y GRUPOS DE APOYO ---
  {
    id: 'emg-grp-1',
    title: 'Brigada Vecinal de Primeros Auxilios y Triage',
    description: 'Grupo voluntario formado por vecinos enfermeros y bomberos del sector. Equipados con botiquín mayor, tensiómetro, oxímetro e inmovilizadores.',
    type: 'support_group',
    category: 'primeros_auxilios',
    authorName: 'Dra. Elena Silva (Coordinadora)',
    authorPhone: '+51999888777',
    neighborhood: 'Sede Comunal - Parque Central',
    address: 'Local Comunal Los Sauces',
    coordinates: [-12.0930, -77.0322],
    vistosBuenos: 52,
    urgencyLevel: 'alta',
    priceInfo: 'Servicio Comunitario 100% Voluntario',
    status: 'active',
    createdAt: 'Activo permanente',
    reviews: []
  },
  {
    id: 'emg-grp-2',
    title: 'Comité de Alerta Temprana y Radio Vecinal',
    description: 'Red con megáfonos y radios walkie-talkie para alertar cortes imprevistos, aniegos, sismos o emergencias de seguridad en los cuadrantes 1 al 4.',
    type: 'support_group',
    category: 'rescate_movilidad',
    authorName: 'Comité Vecinal de Defensa Civil',
    authorPhone: '+51988776655',
    neighborhood: 'Cuadrante Central 1-4',
    coordinates: [-12.0918, -77.0308],
    vistosBuenos: 41,
    urgencyLevel: 'media',
    status: 'active',
    createdAt: 'Activo permanente',
    reviews: []
  },

  // --- MÓDULO EMERGENCIA: RECURSOS CRÍTICOS COMPARTIDOS ---
  {
    id: 'emg-res-1',
    title: 'Punto Comunitario de Carga Solar y Generador Eléctrico',
    description: 'En caso de corte masivo de luz, habilitamos en nuestro garaje regletas de enchufes solares para cargar celulares de vecinos y equipos médicos.',
    type: 'emergency_resource',
    category: 'energia_luz',
    authorName: 'Familia Paredes',
    authorPhone: '+51977665544',
    neighborhood: 'Calle Los Álamos 310',
    coordinates: [-12.0950, -77.0310],
    vistosBuenos: 37,
    urgencyLevel: 'alta',
    priceInfo: 'Recurso Solidario Compartido',
    status: 'active',
    createdAt: 'Disponible para emergencias',
    reviews: []
  },
  {
    id: 'emg-res-2',
    title: 'Tanque Comunitario de Agua Potable y Filtro Cerámico',
    description: 'Reserva comunitaria de 2,500 litros de agua limpia con pastillas purificadoras para abastecer a familias en desabastecimiento.',
    type: 'emergency_resource',
    category: 'agua_alimentos',
    authorName: 'Olla Común "Corazón de Barrio"',
    authorPhone: '+51966554433',
    neighborhood: 'Jr. Amazonas 102',
    coordinates: [-12.0938, -77.0350],
    vistosBuenos: 46,
    urgencyLevel: 'critica',
    priceInfo: 'Abastecimiento Gratuito de Emergencia',
    status: 'active',
    createdAt: 'Disponible para emergencias',
    reviews: []
  },

  // --- MÓDULO EMERGENCIA: REPORTES DE AUXILIO HUMANITARIO ---
  {
    id: 'emg-need-1',
    title: 'URGENTE: Adulto mayor de 82 años requiere apoyo con recarga de oxígeno',
    description: 'Don Hernán vive solo en segundo piso. Se le está agotando el balón de respaldo y no cuenta con movilidad para trasladarlo.',
    type: 'emergency_need',
    category: 'vulnerabilidad_mayor',
    authorName: 'Rosa (Vecina contigua)',
    authorPhone: '+51955443322',
    neighborhood: 'Pasaje Olivos 115 - Dpto 201',
    coordinates: [-12.0925, -77.0315],
    vistosBuenos: 18,
    urgencyLevel: 'critica',
    priceInfo: 'Auxilio Humanitario Inmediato',
    status: 'active',
    createdAt: 'Hace 15 minutos',
    reviews: []
  },
  {
    id: 'emg-need-2',
    title: 'Filtración grave de agua amenaza cuadro eléctrico vecinal',
    description: 'Rotura de matriz en vereda exterior está inundando la caja de fusibles comunitaria de 4 casas contiguas.',
    type: 'emergency_need',
    category: 'energia_luz',
    authorName: 'Junta Vecinal Sector B',
    authorPhone: '+51944332211',
    neighborhood: 'Esq. Las Acacias y Bolognesi',
    coordinates: [-12.0948, -77.0332],
    vistosBuenos: 9,
    urgencyLevel: 'alta',
    status: 'in_progress',
    createdAt: 'Hace 45 minutos',
    reviews: []
  }
];
