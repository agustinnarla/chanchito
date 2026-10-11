import { z } from 'zod'

/**
 * Curated Fluent Emoji 3D (Microsoft, MIT) for categories. The key is stored in the database
 * and names the image the web app ships (`/emoji/<key>.webp`); the label is its accessible name.
 */
export const CATEGORY_EMOJIS = [
  // Home and bills
  { key: 'house', label: 'Casa' },
  { key: 'office_building', label: 'Edificio' },
  { key: 'light_bulb', label: 'Lamparita' },
  { key: 'high_voltage', label: 'Rayo' },
  { key: 'droplet', label: 'Gota' },
  { key: 'fire', label: 'Fuego' },
  { key: 'globe_with_meridians', label: 'Globo terráqueo' },
  { key: 'mobile_phone', label: 'Celular' },
  { key: 'television', label: 'Televisor' },
  { key: 'broom', label: 'Escoba' },
  { key: 'hammer_and_wrench', label: 'Herramientas' },
  { key: 'potted_plant', label: 'Planta' },
  // Food
  { key: 'shopping_cart', label: 'Carrito de compras' },
  { key: 'fork_and_knife_with_plate', label: 'Plato con cubiertos' },
  { key: 'hot_beverage', label: 'Café' },
  { key: 'pizza', label: 'Pizza' },
  { key: 'hamburger', label: 'Hamburguesa' },
  { key: 'clinking_beer_mugs', label: 'Cervezas' },
  // Transport and travel
  { key: 'bus', label: 'Colectivo' },
  { key: 'automobile', label: 'Auto' },
  { key: 'taxi', label: 'Taxi' },
  { key: 'fuel_pump', label: 'Surtidor de nafta' },
  { key: 'airplane', label: 'Avión' },
  { key: 'luggage', label: 'Valija' },
  // Health and care
  { key: 'pill', label: 'Pastilla' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'tooth', label: 'Diente' },
  { key: 'lipstick', label: 'Lápiz labial' },
  { key: 'scissors', label: 'Tijera' },
  // Shopping and leisure
  { key: 'shopping_bags', label: 'Bolsas de compras' },
  { key: 't_shirt', label: 'Remera' },
  { key: 'wrapped_gift', label: 'Regalo' },
  { key: 'video_game', label: 'Videojuego' },
  { key: 'clapper_board', label: 'Claqueta' },
  { key: 'musical_notes', label: 'Notas musicales' },
  { key: 'soccer_ball', label: 'Pelota de fútbol' },
  { key: 'running_shoe', label: 'Zapatilla' },
  // Family
  { key: 'books', label: 'Libros' },
  { key: 'graduation_cap', label: 'Birrete' },
  { key: 'baby_bottle', label: 'Mamadera' },
  { key: 'dog_face', label: 'Perro' },
  { key: 'cat_face', label: 'Gato' },
  // Money
  { key: 'receipt', label: 'Recibo' },
  { key: 'credit_card', label: 'Tarjeta de crédito' },
  { key: 'bank', label: 'Banco' },
  { key: 'briefcase', label: 'Maletín' },
  { key: 'laptop', label: 'Notebook' },
  { key: 'money_bag', label: 'Bolsa de dinero' },
  { key: 'chart_increasing', label: 'Gráfico en alza' },
  { key: 'package', label: 'Paquete' },
] as const satisfies readonly { key: string; label: string }[]

export type CategoryEmoji = (typeof CATEGORY_EMOJIS)[number]['key']

export const DEFAULT_CATEGORY_EMOJI: CategoryEmoji = 'package'

const BY_KEY = new Map<string, string>(CATEGORY_EMOJIS.map((e) => [e.key, e.label]))

export function isCategoryEmoji(key: unknown): key is CategoryEmoji {
  return typeof key === 'string' && BY_KEY.has(key)
}

/** The key to show: a stored key the app doesn't know (or none) shows the default. */
export function resolveCategoryEmoji(key: string | null | undefined): CategoryEmoji {
  return isCategoryEmoji(key) ? key : DEFAULT_CATEGORY_EMOJI
}

export function categoryEmojiLabel(key: string | null | undefined): string {
  return BY_KEY.get(resolveCategoryEmoji(key)) ?? ''
}

export const CategoryEmojiSchema = z.string().refine(isCategoryEmoji, {
  message: 'Elegí un emoji de la lista.',
})
