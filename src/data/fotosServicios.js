// Fotos por defecto para cada servicio (de la galería propia).
// Si el dueño sube una foto desde el panel, la de la base pisa a estas.
import corte01 from '../assets/galeria/corte-01.jpg'
import corte02 from '../assets/galeria/corte-02.jpg'
import corte03 from '../assets/galeria/corte-03.jpg'
import corte04 from '../assets/galeria/corte-04.jpg'
import corte05 from '../assets/galeria/corte-05.jpg'
import corte06 from '../assets/galeria/corte-06.jpg'
import corte07 from '../assets/galeria/corte-07.jpg'
import corte08 from '../assets/galeria/corte-08.jpg'

export const FOTOS_SERVICIOS = {
  'corte-jubilado': corte06,
  'corte-clasico': corte02,
  'corte-degrade': corte08,
  'corte-barba': corte06,
  'corte-barba-cejas': corte07,
  barba: corte06,
  cejas: corte03,
  mechas: corte04,
  'full-color': corte01,
  franja: corte05,
}

export const fotoServicio = (s) => s.foto_url || FOTOS_SERVICIOS[s.id] || corte02
