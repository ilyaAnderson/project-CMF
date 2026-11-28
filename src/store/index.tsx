import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Tour, type TourHandle } from './tour';
import { cartItemVisual, cartKey, itemKey, media, money, products, readCart, type CartItem } from './products';

function Arrow({ down = false }: { down?: boolean }) {
  return <span className="arrow" aria-hidden="true">{down ? '↓' : '→'}</span>;
}

function ButtonContent({ children }: { children: ReactNode }) {
  return <>{children}<Arrow /></>;
}

type Selection = { product: typeof products[number]; variantIndex: number };
const legacyAnchors: Record<string, string[]> = {
  'buds-pro-2': ['case', 'showcase-buds'],
  'neckband-pro': ['head'],
  'phone-3': ['showcase-phone'],
  'watch-pro': ['watch'],
};

function Store() {
  const [selection, select] = useState<Selection | null>(null);
  const [cart, setCart] = useState(() => {
    try { return readCart(localStorage.getItem(cartKey)); }
    catch { return []; }
  });
  const [modal, setModal] = useState<'product' | 'cart' | null>(null);
  const [toast, setToast] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const productDialog = useRef<HTMLDialogElement>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const closeCart = useRef<HTMLButtonElement>(null);
  const tour = useRef<TourHandle>(null);
  const opener = useRef<HTMLElement | null>(null);
  const toastTimer = useRef<number>(0);
  const focusAfterQuantity = useRef<{ key: string; delta: number } | null>(null);
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!modal) return;
    const dialog = modal === 'product' ? productDialog.current : cartDialog.current;
    document.documentElement.classList.add('modal-open');
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.documentElement.classList.remove('modal-open');
    };
  }, [modal]);

  useEffect(() => {
    const pending = focusAfterQuantity.current;
    if (!pending) return;
    focusAfterQuantity.current = null;
    const buttons = [...(cartDialog.current?.querySelectorAll<HTMLButtonElement>('[data-quantity]') ?? [])];
    const control = buttons.find(button => button.dataset.key === pending.key && Number(button.dataset.quantity) === pending.delta);
    (control ?? buttons[0] ?? closeCart.current)?.focus();
  }, [cart]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    const syncCart = (event: StorageEvent) => {
      if (event.key === cartKey || event.key === null) setCart(readCart(event.newValue));
    };
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  function announce(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(''), 3000);
  }

  function openModal(type: 'product' | 'cart', trigger: HTMLElement) {
    opener.current = trigger;
    setCheckoutMessage('');
    setModal(type);
  }

  function dismiss() {
    if (!modal) return;
    setModal(null);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  function updateCart(item: CartItem, change: number) {
    let current = cart;
    try {
      const stored = localStorage.getItem(cartKey);
      if (stored !== null) current = readCart(stored);
    } catch { /* The in-memory cart remains available. */ }
    const key = itemKey(item);
    const existing = current.find(entry => itemKey(entry) === key);
    const next = existing
      ? current.map(entry => entry === existing ? { ...entry, quantity: Math.min(999, entry.quantity + change) } : entry).filter(entry => entry.quantity > 0)
      : change > 0 ? [...current, item] : current;
    setCart(next);
    try { localStorage.setItem(cartKey, JSON.stringify(next)); }
    catch { return false; }
    return true;
  }

  function addProduct() {
    if (!selection) return;
    const { product, variantIndex } = selection;
    const { id, name, price } = product;
    const saved = updateCart({ id, name, price, color: product.variants[variantIndex].id, quantity: 1 }, 1);
    dismiss();
    announce(saved ? `${name} добавлен в корзину` : `${name} добавлен до закрытия вкладки`);
  }

  function goToCollection() {
    if (modal) dismiss();
    requestAnimationFrame(() => {
      document.getElementById('collection-title')?.focus({ preventScroll: true });
      document.getElementById('product-collections')?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
  }

  const activeVariant = selection?.product.variants[selection.variantIndex];

  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CMF Store — наверх"><span className="brand-mark">C</span><span>CMF</span></a>
      <nav className="header-nav" aria-label="По сайту">
        <a href="#showcase">3D-обзор</a>
        <a href="#product-collections">Коллекция</a>
      </nav>
      <button className="cart-button" type="button" aria-label={quantity ? `Открыть корзину, товаров: ${quantity}` : 'Открыть корзину'}
        onClick={event => openModal('cart', event.currentTarget)}>
        <img src="material/icons8-тележка-64%20White.png" width="22" height="22" alt="" />
        {quantity > 0 && <span className="cart-count" aria-hidden="true">{quantity}</span>}
      </button>
    </header>

    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <picture className="hero-image">
          <source media="(max-width: 620px)" srcSet={media('hero-mobile')} />
          <img src={media('hero')} alt="" fetchPriority="high" width="1440" height="960" />
        </picture>
        <div className="hero-inner">
          <p className="eyebrow">CMF by Nothing</p>
          <h1 id="hero-title">Buds Pro 2</h1>
          <p className="hero-subtitle">Два динамика. Один Smart Dial.</p>
          <div className="hero-actions">
            <button className="action" type="button" onClick={event => tour.current?.begin(event.currentTarget)}>
              <ButtonContent>Начать 3D-обзор</ButtonContent>
            </button>
            <a className="text-action" href="#product-collections">К коллекции <Arrow down /></a>
          </div>
        </div>
        <div className="hero-specs"><span>11 мм + 6 мм</span><span>Smart Dial</span></div>
      </section>

      <Tour ref={tour} paused={modal !== null} onCollection={goToCollection} />

      <section className="lineup" id="showcase-selection" aria-labelledby="lineup-title">
        <img src={media('lineup')} alt="Buds Pro 2, Watch Pro, Nothing Phone (3) и Neckband Pro" loading="lazy" width="1440" height="960" />
        <div className="lineup-content">
          <h2 id="lineup-title">Устройства<br className="desktop-break" /> в коллекции</h2>
          <a className="action" href="#product-collections"><ButtonContent>Смотреть устройства</ButtonContent></a>
        </div>
      </section>

      <section className="collection" id="product-collections" aria-labelledby="collection-title">
        <h2 id="collection-title" tabIndex={-1}>Коллекция</h2>
        <p className="section-note">Учебные цены</p>
        <div className="product-grid">
          {products.map(product => <article className="product-card" id={product.id} key={product.id}>
            {legacyAnchors[product.id].map(id => <span id={id} className="legacy-anchor" aria-hidden="true" key={id} />)}
            <button type="button" className="product-trigger" onClick={event => {
              select({ product, variantIndex: 0 });
              openModal('product', event.currentTarget);
            }} aria-label={`${product.name}, ${money(product.price)}. Подробнее`}>
              <span className="card-image"><img src={product.variants[0].image} alt="" decoding="async" width="300" height="245" /></span>
              <span className="card-name">{product.name}</span>
              <span className="card-summary">{product.summary}</span>
              <span className="card-bottom"><strong>{money(product.price)}</strong><span className="circle-arrow"><Arrow /></span></span>
            </button>
          </article>)}
        </div>
      </section>
    </main>

    <footer className="site-footer">
      <span className="footer-title">CMF Store</span>
      <nav aria-label="Навигация в подвале">
        <a href="#showcase">3D-обзор</a>
        <a href="#product-collections">Коллекция</a>
        <a className="footer-top" href="#top">Наверх ↑</a>
      </nav>
      <p>Учебная витрина</p>
    </footer>

    <dialog ref={productDialog} className="product-dialog" aria-labelledby="product-title"
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
      {selection && activeVariant && <div className="product-dialog-panel">
        <button className="close-button" type="button" aria-label="Закрыть карточку" onClick={dismiss}>×</button>
        <div className="dialog-photo">
          <img src={activeVariant.image} alt={`${selection.product.name}, ${activeVariant.name.toLowerCase()} цвет`} />
        </div>
        <div className="dialog-copy">
          <h2 id="product-title">{selection.product.name}</h2>
          <p>{selection.product.details}</p>
          <div className="variant-picker" role="group" aria-label="Цвет">
            {selection.product.variants.map((variant, index) => <button className="swatch" key={variant.id}
              type="button" aria-label={variant.name} aria-pressed={variant.id === activeVariant.id}
              onClick={() => select({ product: selection.product, variantIndex: index })}>
              <span style={{ backgroundColor: variant.hex }} />
            </button>)}
            <span className="variant-name" aria-live="polite">{activeVariant.name}</span>
          </div>
          <p className="dialog-price"><strong>{money(selection.product.price)}</strong><small>Учебная цена</small></p>
          <button className="action dialog-add" type="button" onClick={addProduct}><ButtonContent>В корзину</ButtonContent></button>
          <p className="section-note">{selection.product.summary}</p>
        </div>
      </div>}
    </dialog>

    <dialog ref={cartDialog} className="cart-dialog" aria-labelledby="cart-title"
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className="cart-panel">
        <div className="cart-head">
          <h2 id="cart-title">Корзина</h2>
          <button ref={closeCart} className="close-button" type="button" aria-label="Закрыть корзину" onClick={dismiss}>×</button>
        </div>
        {cart.length ? <>
          <ul className="cart-items">
            {cart.map(item => {
              const { image, color } = cartItemVisual(item);
              const key = itemKey(item);
              return <li className="cart-item" key={key}>
                <span className="cart-image">{image && <img src={image} alt="" />}</span>
                <div className="cart-copy"><strong>{item.name}</strong><span>{color}</span>
                  <div className="quantity" role="group" aria-label={`Количество ${item.name}`}>
                    {[-1, 1].map(delta => <button type="button" data-quantity={delta} data-key={key} key={delta}
                      aria-label={delta < 0 ? 'Уменьшить количество' : 'Увеличить количество'}
                      onClick={() => { focusAfterQuantity.current = { key, delta }; updateCart(item, delta); }}>{delta < 0 ? '−' : '+'}</button>)}
                    <span aria-live="polite">{item.quantity}</span>
                  </div>
                </div>
                <strong className="cart-line-price">{money(item.price * item.quantity)}</strong>
              </li>;
            })}
          </ul>
          <div className="cart-bottom">
            <div className="cart-total"><span>Итого</span><strong>{money(total)}</strong></div>
            <button className="action" type="button" onClick={() => setCheckoutMessage('Учебная витрина. Заказ и оплата не отправлены.')}>
              <ButtonContent>Оформить (демо)</ButtonContent>
            </button>
            <p className="section-note" role="status">{checkoutMessage || 'Учебная витрина. Без заказа и оплаты.'}</p>
          </div>
        </> : <div className="cart-empty">
          <p>Корзина пуста</p>
          <button className="action" type="button" onClick={goToCollection}><ButtonContent>К коллекции</ButtonContent></button>
        </div>}
      </div>
    </dialog>
    <div className={`toast${toast ? ' visible' : ''}`} role="status" aria-live="polite">{toast}</div>
  </>;
}

createRoot(document.getElementById('app')!).render(<Store />);
