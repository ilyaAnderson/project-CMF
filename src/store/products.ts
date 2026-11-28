const orange = { name: 'Оранжевый', hex: '#fa5428' };
const white = { name: 'Белый', hex: '#edece6' };
const black = { name: 'Чёрный', hex: '#262828' };
const gray = { name: 'Серый', hex: '#8b8d90' };

export type Variant = { id: string; name: string; hex: string; image: string };
type Product = { id: string; name: string; price: number; summary: string; details: string; variants: Variant[] };

export const media = (name: string) => `material/cmf/${name}.webp`;
const original = (name: string) => `material/${name}`;

export const products: Product[] = [
  {
    id: 'buds-pro-2', name: 'Buds Pro 2', price: 4990,
    summary: '11 мм + 6 мм · Smart Dial',
    details: 'Два динамика. Один Smart Dial. Гибридное активное шумоподавление до 50 дБ.',
    variants: [
      { id: 'orange', ...orange, image: media('buds-orange') },
      { id: 'gray', ...gray, image: media('buds-gray') },
    ],
  },
  {
    id: 'neckband-pro', name: 'Neckband Pro', price: 3990,
    summary: 'До 50 дБ ANC · Bluetooth 5.3',
    details: 'Гибкий шейный обод, гибридное шумоподавление и колёсико управления.',
    variants: [
      { id: 'orange', ...orange, image: media('neckband-orange') },
      { id: 'black', ...black, image: original('showcase/neckband-dark.webp') },
      { id: 'white', ...white, name: 'Светло-серый', image: media('neckband-white') },
    ],
  },
  {
    id: 'phone-3', name: 'Nothing Phone (3)', price: 69990,
    summary: 'AMOLED 6,67″ · Glyph Matrix',
    details: 'Дисплей AMOLED до 120 Гц, три задние камеры по 50 Мп и дисплей Glyph Matrix.',
    variants: [{ id: 'white', ...white, image: media('phone-white') }],
  },
  {
    id: 'watch-pro', name: 'Watch Pro', price: 4990,
    summary: 'AMOLED 1,96″ · 600 нит',
    details: 'Экран 410 × 502, встроенный GPS, отслеживание активности и пульса.',
    variants: [
      { id: 'orange', ...orange, image: media('watch-orange') },
      { id: 'black', ...black, image: original('showcase/watch-pro.webp') },
      { id: 'white', ...white, image: original('b903c5b245881213539f1991a7dc673a.png') },
      { id: 'gray', ...gray, image: media('watch-gray') },
    ],
  },
];

export type CartItem = { id: string; name: string; price: number; color: string; quantity: number };
export const cartKey = 'cmf-store-demo-cart-v1';
const formatter = new Intl.NumberFormat('ru-RU');
export const money = (value: number) => `${formatter.format(value)} ₽`;
export const itemKey = (item: CartItem) => `${item.id}:${item.color}`;

export function readCart(raw: string | null): CartItem[] {
  try {
    const entries: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(entries)) return [];
    const items = new Map<string, CartItem>();
    for (const entry of entries) {
      if (!entry || typeof entry.id !== 'string' || typeof entry.name !== 'string' ||
        typeof entry.color !== 'string' || !Number.isSafeInteger(entry.price) || entry.price < 0 ||
        !Number.isSafeInteger(entry.quantity) || entry.quantity < 1) continue;
      const product = products.find(({ id }) => id === entry.id);
      const item = {
        id: entry.id, name: product?.name ?? entry.name, price: product?.price ?? entry.price,
        color: entry.color, quantity: Math.min(entry.quantity, 999),
      };
      const key = itemKey(item);
      item.quantity = Math.min(999, item.quantity + (items.get(key)?.quantity ?? 0));
      items.set(key, item);
    }
    return [...items.values()];
  } catch {
    return [];
  }
}

export function cartItemVisual(item: CartItem) {
  const product = products.find(({ id }) => id === item.id);
  const variant = product?.variants.find(({ id }) => item.color === id) ?? product?.variants[0];
  const knownColors: Record<string, { name: string }> = { orange, white, black, gray };
  const legacy: Record<string, string> = {
    orange: 'fb91c1a17d330ca059d103e384a6119f.png',
    white: '594e9df43f5be68df78870977d66e3f3.png',
    black: 'f6326174f79882b188ab05c685ada3bf.png',
  };
  return {
    image: variant?.image ?? (item.id === 'buds-pro' && legacy[item.color] ? original(legacy[item.color]) : ''),
    color: product?.variants.find(({ id }) => item.color === id)?.name ?? knownColors[item.color]?.name ?? 'Стандартный',
  };
}
