export type Chapter = {
  label: string; start: number; stop: number; product: string;
  title: string; body: string; link: string; action: string;
};

export const chapters: Chapter[] = [
  {
    label: 'Buds Pro 2', start: 0, stop: .111, product: 'CMF Buds Pro 2',
    title: 'Два динамика в каждом наушнике',
    body: '11 мм для басов, 6 мм для высоких частот. Колёсико Smart Dial на кейсе управляет громкостью.',
    link: '#showcase-buds', action: 'О модели',
  },
  {
    label: 'Neckband', start: .285, stop: .347, product: 'CMF Neckband Pro',
    title: 'Управление на шейном ободе',
    body: 'Громкость регулируется колёсиком. До 37 часов музыки при выключенном шумоподавлении.',
    link: '#head', action: 'Цвета и цена',
  },
  {
    label: 'Phone (3)', start: .451, stop: .572, product: 'Nothing Phone (3)',
    title: 'Glyph Matrix',
    body: 'Точечный дисплей на задней панели показывает уведомления и анимации.',
    link: '#showcase-phone', action: 'О модели',
  },
  {
    label: 'Внутри часов', start: .631, stop: .748, product: 'CMF Watch Pro',
    title: 'Под дисплеем',
    body: 'Процессор, флеш-память и радиомодуль. Компоновка платы показана условно.',
    link: '#watch', action: 'Цвета и цена',
  },
  {
    label: 'AMOLED', start: .880, stop: .916, product: 'CMF Watch Pro',
    title: 'Экран 1,96″',
    body: 'AMOLED с разрешением 410 × 502. Переключите циферблат, тренировку или входящий звонок.',
    link: '#watch', action: 'Цвета и цена',
  },
];

export const editorialBeats: (Chapter & { photo?: string; caption?: string })[] = [
  { ...chapters[0], start: 0, title: 'Buds Pro 2', body: 'Два динамика в каждом наушнике. Колёсико Smart Dial на кейсе.' },
  { ...chapters[0], start: .076, title: 'Smart Dial', body: 'Поверните колёсико, чтобы изменить громкость. Нажатия можно настроить в Nothing X.' },
  { ...chapters[0], start: .136 },
  { ...chapters[0], start: .225, title: 'До 43 часов с кейсом', body: 'При выключенном активном шумоподавлении.' },
  { ...chapters[1], start: .285, title: 'Neckband Pro', body: 'Два внутриканальных наушника на гибком шейном ободе.' },
  { ...chapters[1], start: .321, photo: 'material/showcase/neckband-orange.webp', caption: 'Neckband Pro в оранжевом цвете', title: 'До 50 дБ', body: 'Гибридное активное шумоподавление.' },
  { ...chapters[1], start: .378, photo: 'material/showcase/neckband-dark.webp', caption: 'Neckband Pro в тёмно-сером цвете' },
  { ...chapters[2], start: .451, title: 'Подключение USB‑C', body: 'Кабель заряжает Neckband Pro от Nothing Phone (3). Звук передаётся по Bluetooth.' },
  { ...chapters[2], start: .517 },
  { ...chapters[3], start: .631, title: 'Внутри Watch Pro', body: 'Изображение платы и размещение компонентов условны.' },
  { ...chapters[3], start: .694, title: 'Флеш-память', body: 'Хранит прошивку и настройки часов.' },
  { ...chapters[3], start: .729, title: 'Процессор', body: 'Обновляет интерфейс и обрабатывает показания датчиков.' },
  { ...chapters[3], start: .780, title: 'Радиомодуль', body: 'Обеспечивает беспроводное соединение со смартфоном.' },
  { ...chapters[3], start: .837, title: 'Под дисплеем', body: 'Камера выходит из корпуса через открытый экран.' },
  { ...chapters[4], start: .880 },
];

export function steppedIndex<T extends { start: number }>(steps: T[], progress: number) {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (progress >= steps[i].start) return i;
  }
  return 0;
}
