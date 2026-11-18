import type { Driver } from '@/types'

/**
 * Domiciliarios del parche.
 *
 * El `email` es con el que cada uno entra a la app. Al crearlos desde el panel
 * se guardan aquí igual que cualquier otro registro.
 */
export const drivers: Driver[] = [
  {
    id: 'drv_andres',
    name: 'Andrés “El Rápido”',
    email: 'domiciliario@elparche.co',
    phone: '+57 300 123 4567',
    vehicle: 'moto',
    photo: 'https://i.pravatar.cc/150?img=68',
    rating: 4.9,
    active: true,
  },
  {
    id: 'drv_camila',
    name: 'Camila Torres',
    email: 'camila@elparche.co',
    phone: '+57 301 555 8899',
    vehicle: 'moto',
    photo: 'https://i.pravatar.cc/150?img=45',
    rating: 4.8,
    active: true,
  },
  {
    id: 'drv_julian',
    name: 'Julián Mesa',
    email: 'julian@elparche.co',
    phone: '+57 302 777 1122',
    vehicle: 'bici',
    photo: 'https://i.pravatar.cc/150?img=12',
    rating: 4.7,
    active: true,
  },
]

export const vehicleLabel: Record<Driver['vehicle'], string> = {
  moto: 'Moto',
  bici: 'Bicicleta',
  carro: 'Carro',
}

export const vehicleEmoji: Record<Driver['vehicle'], string> = {
  moto: '🛵',
  bici: '🚲',
  carro: '🚗',
}
