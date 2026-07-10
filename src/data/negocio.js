export const NEGOCIO = {
  nombre: '7 Navajas Barber',
  instagram: '7navajas.barber',
  instagramUrl: 'https://instagram.com/7navajas.barber',
  direccion: 'Wilson Ferreira Aldunate n°51, Paso Carrasco, Montevideo',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Wilson Ferreira Aldunate 51, Paso Carrasco, Montevideo'),
}

// Horarios: [horaApertura, horaCierre] en formato 24h. null = cerrado.
// Índice = getDay(): 0 domingo ... 6 sábado
export const HORARIOS = [
  null,      // domingo: cerrado
  [12, 19],  // lunes
  [11, 20],  // martes
  [11, 20],  // miércoles
  [11, 20],  // jueves
  [11, 20],  // viernes
  [11, 20],  // sábado
]

export const HORARIOS_TEXTO = [
  { dias: 'Lunes', horas: '12:00 – 19:00' },
  { dias: 'Martes a sábado', horas: '11:00 – 20:00' },
  { dias: 'Domingo', horas: 'Cerrado' },
]

export const BARBEROS = [
  { id: 'juanca', nombre: 'Juan Carlos', apodo: 'Juanca' },
  { id: 'mathias-fonseca', nombre: 'Mathias Fonseca', apodo: null },
  { id: 'mathias-alegre', nombre: 'Mathias Alegre', apodo: null },
]

export const SERVICIOS = [
  { id: 'corte-jubilado', nombre: 'Corte jubilado', precio: 240, nota: null },
  { id: 'corte-clasico', nombre: 'Corte clásico', precio: 280, nota: null },
  { id: 'corte-degrade', nombre: 'Corte degradé', precio: 350, nota: null },
  { id: 'corte-barba', nombre: 'Corte + barba', precio: 420, nota: null },
  { id: 'corte-barba-cejas', nombre: 'Corte + barba + cejas', precio: 450, nota: null },
  { id: 'barba', nombre: 'Barba', precio: 150, nota: null },
  { id: 'cejas', nombre: 'Cejas', precio: 80, nota: null },
  { id: 'mechas', nombre: 'Mechas + corte', precio: 1300, nota: 'sin corte: $1150' },
  { id: 'full-color', nombre: 'Full color + corte', precio: 1700, nota: 'sin corte: $1550' },
  { id: 'franja', nombre: 'Franja + corte', precio: 1200, nota: 'sin corte: $1050' },
]
