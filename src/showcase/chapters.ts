export const chapters = [
  { start: 0, stop: 0, art: 'coast', title: 'Камни и волна', body: 'Кейс Buds Pro 2 на берегу. Волна переносит его в студию.' },
  { start: .13, stop: .20, art: 'case', title: 'Кейс открывается', body: 'Smart Dial, шарнир и два вкладыша, выходящие из диагональных гнёзд.' },
  { start: .27, stop: .355, art: 'drivers', title: 'Разбор вкладыша', body: 'Силиконовый амбушюр, 11-мм басовый динамик и 6-мм твитер. Схема условная.' },
  { start: .41, stop: .53, art: 'neckband', title: 'Длинный проход Neckband Pro', body: 'Гибридное шумоподавление до 50 дБ и подключение по Bluetooth 5.3.' },
  { start: .61, stop: .73, art: 'phone', title: 'Nothing Phone (3)', body: 'AMOLED 6,67″, три задние камеры по 50 Мп и Glyph Matrix.' },
  { start: .78, stop: .87, art: 'board', title: 'Камера внутри часов', body: 'Контроллер, чипы и память Watch Pro. Условная визуализация.' },
  { start: .91, stop: .955, art: 'watch', title: 'Циферблат и финал', body: 'Часы Watch Pro с AMOLED 1,96″. Активность и пульс показаны на демонстрационных данных.' },
] as const;

export const beats = [
  { start: 0, title: 'С берега\nв студию', body: 'Прокрутите, чтобы открыть кейс и рассмотреть четыре устройства.' },
  { start: .043, title: '', body: '' },
  { start: .13, title: 'Buds Pro 2', body: 'Два динамика. Один Smart Dial.' },
  { start: .157, title: 'Smart Dial', body: 'Настройте управление в Nothing X.', anchor: 'dial' },
  { start: .183, title: '', body: '' },
  { start: .305, title: 'Амбушюр', body: 'Мягкий силикон.', anchor: 'tip' },
  { start: .345, title: '11 мм', body: 'Басовый динамик.', anchor: 'woofer' },
  { start: .385, title: '6 мм', body: 'Твитер для высоких частот.', anchor: 'tweeter' },
  { start: .41, title: 'Neckband Pro', body: 'Гибкий шейный обод.' },
  { start: .47, title: 'До 50 дБ', body: 'Гибридное шумоподавление.' },
  { start: .525, title: 'Smart Dial', body: 'Управление на шейном ободе.' },
  { start: .58, title: '', body: '' },
  { start: .603, title: 'Bluetooth 5.3', body: 'Беспроводное подключение.' },
  { start: .632, title: 'AMOLED 6,67″', body: 'Частота обновления до 120 Гц.' },
  { start: .662, title: '', body: '' },
  { start: .684, title: 'Основная камера', body: '50 Мп', anchor: 'camera-main' },
  { start: .698, title: 'Сверхширокоугольная', body: '50 Мп', anchor: 'camera-wide' },
  { start: .709, title: 'Перископическая', body: '50 Мп', anchor: 'camera-tele' },
  { start: .717, title: 'Glyph Matrix', body: '489 светодиодов.', anchor: 'glyph' },
  { start: .76, title: '', body: '' },
  { start: .81, title: 'Внутри Watch Pro', body: 'Условная визуализация.' },
  { start: .856, title: 'Контроллер', body: 'Условная визуализация.' },
  { start: .887, title: 'Чипы и память', body: 'Условная визуализация.' },
  { start: .91, title: 'AMOLED 1,96″', body: '410 × 502 пикселей.' },
  { start: .941, title: 'Watch Pro', body: 'Алюминиевая рамка и оранжевый ремешок.' },
  { start: .957, title: 'Активность', body: 'Демонстрационные данные.' },
  { start: .972, title: 'Пульс', body: 'Демонстрационные данные.' },
  { start: .984, title: 'Устройства\nв коллекции', body: '' },
] as const;

export function steppedIndex(steps: readonly { start: number }[], progress: number) {
  for (let index = steps.length - 1; index >= 0; index--) {
    if (progress >= steps[index].start) return index;
  }
  return 0;
}
