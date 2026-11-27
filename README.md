# CMF Store — интерактивная витрина

Адаптивный учебный концепт витрины устройств CMF by Nothing, собранный на HTML, CSS и JavaScript. Интерактивный 3D-обзор использует React, TypeScript и Three.js.

**Демо:** https://ilyaanderson.github.io/project-CMF/

## Возможности

- Адаптивная промо-карусель с кнопками, свайпом и паузой при фокусе или наведении.
- 3D-обзор с управлением прокруткой и переходами между Buds Pro 2, Neckband Pro, Nothing Phone (3) и Watch Pro.
- Каталог устройств с переключением цветовых вариантов.
- Карточки товара с подробностями и ценой.
- Корзина: добавление товаров, изменение количества, подсчёт суммы и сохранение в `localStorage`.
- Диалоги, уведомления и управление с клавиатуры.
- Поддержка системной настройки уменьшения анимации.

Корзина демонстрационная: заказ и платёж не отправляются.

## Запуск

Откройте `index.html` или запустите в корне проекта:

```bash
python3 -m http.server 8000
```

Перейдите на http://localhost:8000.

После изменений в `src/showcase/` проверьте типы и обновите статический бандл:

```bash
npm ci
npm run typecheck
npm run build
```

Сохраните обновлённый `showcase.js` вместе с исходниками. GitHub Pages отдаёт его напрямую, поэтому серверу не нужны Node.js или шаг сборки. Экран загрузки ждёт текстуру телефона и подготовку шейдеров. Его можно пропустить и открыть тот же обзор со статическими кадрами. При отключённом WebGL доступны кадры с описаниями товаров. С системным уменьшением движения кадры переключаются кнопками.

Характеристики устройств можно сверить на страницах [Nothing Phone (3)](https://intl.nothing.tech/products/phone-3), [Buds Pro 2](https://intl.nothing.tech/products/cmf-buds-pro-2), [Neckband Pro](https://support.cmf.tech/hc/en-us/sections/22758577414929-How-To) и [Watch Pro](https://support.nothing.tech/hc/en-us/categories/25888172835217-CMF-Watch-Pro). Сцена USB-C показывает зарядку Neckband Pro. Компоновка электроники часов условная.

---

# CMF Store — interactive storefront

A responsive storefront concept for CMF by Nothing devices, built with HTML, CSS, and JavaScript. The scroll-driven product tour uses React, TypeScript, and Three.js.

**Live demo:** https://ilyaanderson.github.io/project-CMF/

It includes an accessible campaign carousel, product color variants, detail dialogs, and a browser-persisted demo cart with quantity controls. Checkout and payment are not connected.

Run `python3 -m http.server 8000` from the project root and open http://localhost:8000. After editing `src/showcase/`, run `npm ci`, `npm run typecheck`, and `npm run build`, then commit the generated `showcase.js` alongside its source.
