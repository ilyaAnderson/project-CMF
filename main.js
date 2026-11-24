const carousel = document.querySelector(".main");
const track = document.querySelector(".ribbon");
const slides = [...document.querySelectorAll(".section")];
const indicators = [...document.querySelectorAll(".progress")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const slideDuration = 6500;
let activeSlide = 0;
let carouselTimer;
let progressFrame;
let touchStartX = 0;

function showSlide(index) {
  if (!track || slides.length === 0) return;
  activeSlide = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${activeSlide * 100}%)`;
  slides.forEach((slide, position) => {
    slide.setAttribute("aria-hidden", String(position !== activeSlide));
    slide.querySelectorAll("button").forEach((button) => {
      button.tabIndex = position === activeSlide ? 0 : -1;
    });
  });
  indicators.forEach((indicator, position) => {
    indicator.classList.remove("is-active");
    indicator.setAttribute("aria-pressed", String(position === activeSlide));
    indicator.style.setProperty("--progress-duration", `${slideDuration}ms`);
    indicator.style.setProperty("--progress-fill", "0%");
  });
  window.cancelAnimationFrame(progressFrame);
  const activeIndicator = indicators[activeSlide];
  if (activeIndicator) {
    if (reducedMotion.matches) {
      activeIndicator.style.setProperty("--progress-fill", "100%");
      activeIndicator.classList.add("is-active");
    } else {
      progressFrame = window.requestAnimationFrame(() => {
        activeIndicator.style.setProperty("--progress-fill", "100%");
        activeIndicator.classList.add("is-active");
      });
    }
  }
}

function stopCarousel() {
  window.clearTimeout(carouselTimer);
  window.cancelAnimationFrame(progressFrame);
  const activeIndicator = indicators[activeSlide];
  if (activeIndicator && !reducedMotion.matches) {
    const railWidth = activeIndicator.getBoundingClientRect().width;
    const fillWidth = Number.parseFloat(getComputedStyle(activeIndicator, "::before").width) || 0;
    const progress = railWidth ? Math.min(100, (fillWidth / railWidth) * 100) : 0;
    activeIndicator.style.setProperty("--progress-duration", "0ms");
    activeIndicator.style.setProperty("--progress-fill", `${progress}%`);
  }
}

function startCarousel() {
  stopCarousel();
  if (reducedMotion.matches || document.hidden || slides.length < 2) return;
  showSlide(activeSlide);
  carouselTimer = window.setTimeout(() => {
    showSlide(activeSlide + 1);
    startCarousel();
  }, slideDuration);
}

document.querySelector(".slider-previous")?.addEventListener("click", () => {
  showSlide(activeSlide - 1);
  startCarousel();
});
document.querySelector(".slider-next")?.addEventListener("click", () => {
  showSlide(activeSlide + 1);
  startCarousel();
});
indicators.forEach((indicator, index) => indicator.addEventListener("click", () => {
  showSlide(index);
  startCarousel();
}));
carousel?.addEventListener("mouseenter", stopCarousel);
carousel?.addEventListener("mouseleave", startCarousel);
carousel?.addEventListener("focusin", stopCarousel);
carousel?.addEventListener("focusout", (event) => {
  if (!carousel.contains(event.relatedTarget)) startCarousel();
});
carousel?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
carousel?.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) < 45) return;
  showSlide(activeSlide + (delta < 0 ? 1 : -1));
  startCarousel();
}, { passive: true });
document.addEventListener("visibilitychange", startCarousel);
reducedMotion.addEventListener?.("change", startCarousel);
showSlide(0);
startCarousel();

document.querySelectorAll("[data-scroll-to]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(button.dataset.scrollTo)?.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" }));
});
document.querySelector("#menu")?.addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#product-collections")?.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
});

const cartDialog = document.querySelector("#cart-dialog");
const productDialog = document.querySelector("#product-dialog");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const cartCount = document.querySelector(".cart-count");
const toast = document.querySelector("#toast");
const cartKey = "cmf-store-demo-cart-v1";
let cart = loadCart();
let toastTimer;
let activeProductCard = null;

function loadCart() {
  try {
    const value = JSON.parse(localStorage.getItem(cartKey) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item.id === "string" && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  } catch {
    announce("Корзина сохранится только до закрытия этой вкладки.");
  }
}

function productCard(id) {
  return document.querySelector(`[data-product-id="${CSS.escape(id)}"]`);
}

function selectedColor(card) {
  return card.querySelector(".color[aria-pressed='true']")?.dataset.color || "default";
}

function colorName(color) {
  return ({ white: "Белый", black: "Чёрный", gray: "Серый", orange: "Оранжевый" })[color] || "Стандартный";
}

function productDetails(card) {
  return {
    id: card.dataset.productId,
    name: card.dataset.productName,
    price: Number(card.dataset.productPrice),
    color: selectedColor(card),
  };
}

function addToCart(card) {
  const product = productDetails(card);
  const existing = cart.find((item) => item.id === product.id && item.color === product.color);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart();
  renderCart();
  announce(`${product.name} добавлен в корзину`);
}

function renderCart() {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = String(totalQuantity);
  cartCount.hidden = totalQuantity === 0;
  cartItems.replaceChildren();

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Корзина пока пуста. Выберите товар и цвет.";
    cartItems.append(empty);
  }

  let total = 0;
  cart.forEach((item) => {
    const card = productCard(item.id);
    const name = card?.dataset.productName || item.name;
    const price = Number(card?.dataset.productPrice || item.price);
    total += price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item";
    const copy = document.createElement("div");
    copy.className = "cart-item-copy";
    const title = document.createElement("strong");
    title.textContent = name;
    const meta = document.createElement("span");
    meta.textContent = `${colorName(item.color)} · ${price.toLocaleString("ru-RU")} ₽ за шт.`;
    copy.append(title, meta);

    const controls = document.createElement("div");
    controls.className = "quantity-controls";
    controls.setAttribute("aria-label", `Количество ${name}`);
    controls.append(
      quantityButton("−", "Уменьшить количество", item.id, item.color, -1),
      Object.assign(document.createElement("span"), { textContent: String(item.quantity), className: "quantity-value" }),
      quantityButton("+", "Увеличить количество", item.id, item.color, 1),
    );
    row.append(copy, controls);
    cartItems.append(row);
  });

  cartTotal.textContent = `${total.toLocaleString("ru-RU")} ₽`;
  document.querySelector("#checkout-button").disabled = cart.length === 0;
}

function quantityButton(label, accessibleName, id, color, delta) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quantity-button";
  button.textContent = label;
  button.setAttribute("aria-label", accessibleName);
  button.addEventListener("click", () => {
    const item = cart.find((entry) => entry.id === id && entry.color === color);
    if (!item) return;
    item.quantity += delta;
    cart = cart.filter((entry) => entry.quantity > 0);
    saveCart();
    renderCart();
  });
  return button;
}

function announce(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

document.querySelector(".shop")?.addEventListener("click", () => cartDialog.showModal());
document.querySelectorAll(".product-card").forEach((card) => {
  card.querySelectorAll(".color").forEach((button) => button.addEventListener("click", () => {
    const color = button.dataset.color;
    card.querySelectorAll(".color").forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
    card.querySelectorAll(".device > div").forEach((image) => image.classList.remove("white", "black", "gray", "orange"));
    card.querySelector(`.device > div[id*='${color}']`)?.classList.add(color);
    card.dataset.selectedColor = color;
  }));
  card.querySelector("[data-add-to-cart]")?.addEventListener("click", () => addToCart(card));
  card.querySelector("[data-open-product]")?.addEventListener("click", () => {
    activeProductCard = card;
    document.querySelector("#product-dialog-title").textContent = card.dataset.productName;
    document.querySelector("#product-dialog-description").textContent = card.querySelector(".lor").textContent;
    document.querySelector("#product-dialog-price").textContent = card.querySelector(".price").textContent;
    productDialog.showModal();
  });
});
document.querySelector("#dialog-add-button")?.addEventListener("click", () => {
  if (!activeProductCard) return;
  addToCart(activeProductCard);
  productDialog.close();
});
document.querySelector("#checkout-button")?.addEventListener("click", () => {
  document.querySelector("#cart-note").textContent = "Это учебная витрина: заказ и оплата не отправляются.";
  announce("Корзина готова. Оформление в демо не подключено.");
});

[cartDialog, productDialog].forEach((dialog) => dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));

renderCart();
