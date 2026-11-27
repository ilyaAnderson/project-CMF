export const chapters = [
  {
    label: 'Кейс', start: 0, stop: .186, product: 'CMF Buds Pro',
    title: 'От кейса к звуку',
    body: 'Активное шумоподавление до 45 дБ. До 11 часов музыки на одном заряде с выключенным шумоподавлением.',
    link: '#case', action: 'Выбрать цвет',
  },
  {
    label: 'Кабель', start: .255, stop: .320, product: 'Проводное аудио',
    title: 'По линии звука',
    body: 'От силиконовых насадок через пульт на кабеле к штекеру USB‑C. Наушники в этой сцене — концепт.',
    link: '#showcase-phone', action: 'О Phone 1',
  },
  {
    label: 'Телефон', start: .415, stop: .445, product: 'CMF Phone 1',
    title: 'Подключение по USB‑C',
    body: 'Сменная задняя панель, камера Sony на 50 Мп и AMOLED-экран 6,67″ с частотой до 120 Гц.',
    link: '#showcase-phone', action: 'О Phone 1',
  },
  {
    label: 'Плата', start: .604, stop: .735, product: 'CMF Watch Pro',
    title: 'Под стеклом',
    body: 'Процессор, флеш-память и радиомодуль на плате. Расположение компонентов показано условно.',
    link: '#watch', action: 'К часам в каталоге',
  },
  {
    label: 'Экран', start: .815, stop: .904, product: 'CMF Watch Pro',
    title: 'AMOLED 1,96″',
    body: 'Взгляните на циферблат, экран тренировки с GPS и входящий звонок по Bluetooth.',
    link: '#watch', action: 'К часам в каталоге',
  },
] as const;

export function getChapter(progress: number) {
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (progress >= chapters[i].start) return i;
  }
  return 0;
}
