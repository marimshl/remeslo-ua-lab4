// RemesloUA — клієнтські сценарії сайту.
// ЛР2–3: бургер-меню, фільтр каталогу, галерея товару.
// ЛР4: робота з DOM, події миші й клавіатури, тема сайту, власна валідація форм, LocalStorage.

// ---------- LocalStorage ----------

// Ключі, під якими сайт зберігає налаштування в браузері
const STORAGE_KEYS = {
  theme: "remeslo-theme",
  fontSize: "remeslo-font-size",
  userName: "remeslo-user-name",
};

// Обгортка з try/catch: у приватному режимі або з вимкненими cookie сховище може бути недоступне
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* сховище недоступне — налаштування просто не збережеться */
    }
  },
};

// Тему застосовуємо одразу, ще до DOMContentLoaded, щоб сторінка не «блимала» світлою темою
if (storage.get(STORAGE_KEYS.theme) === "dark") {
  document.documentElement.classList.add("dark-theme");
}

document.addEventListener("DOMContentLoaded", () => {
  // ЛР2–3
  initNavToggle();
  initCatalogFilter();
  initGallery();

  // ЛР4, п. 2 — робота з DOM
  highlightPrices();
  addPageNote();
  showFooterDate();
  initAccordions();

  // ЛР4, п. 3 — події
  initThemeToggle();
  initNavHover();
  initFontSizeKeys();

  // ЛР4, п. 4–5 — форми, валідація, LocalStorage
  initForms();
  restoreUserName();
});

// ==========================================================================
// ЛР2–3
// ==========================================================================

// Бургер-меню на мобільних і планшетах
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;

  const label = toggle.querySelector(".visually-hidden");
  const desktop = window.matchMedia("(min-width: 1024px)");

  function setOpen(isOpen) {
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (label) label.textContent = isOpen ? "Закрити меню" : "Відкрити меню";
  }

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

  // Закриття клавішею Esc з поверненням фокуса на кнопку
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Після переходу на десктопну ширину меню скидається в початковий стан
  desktop.addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

// Фільтрація та сортування товарів у каталозі (без перезавантаження сторінки)
function initCatalogFilter() {
  const form = document.getElementById("filters");
  const list = document.getElementById("product-list");
  if (!form || !list) return;

  const counter = document.getElementById("product-count");
  const sort = document.getElementById("sort");
  const items = [...list.querySelectorAll("[data-category]")];

  function apply() {
    const categories = [...form.querySelectorAll('input[name="category"]:checked')].map((i) => i.value);
    const maxPrice = Number(form.elements["max-price"].value) || Infinity;
    const region = form.elements.region.value;
    let visible = 0;

    items.forEach((item) => {
      const matches =
        (categories.length === 0 || categories.includes(item.dataset.category)) &&
        Number(item.dataset.price) <= maxPrice &&
        (region === "" || item.dataset.region === region);
      item.hidden = !matches;
      if (matches) visible++;
    });

    if (sort) {
      const sorted = [...items].sort((a, b) => {
        if (sort.value === "price-asc") return a.dataset.price - b.dataset.price;
        if (sort.value === "price-desc") return b.dataset.price - a.dataset.price;
        return a.dataset.order - b.dataset.order;
      });
      sorted.forEach((item) => list.appendChild(item));
    }

    if (counter) counter.textContent = visible;
  }

  form.addEventListener("input", apply);
  form.addEventListener("reset", () => setTimeout(apply));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    apply();
  });
  if (sort) sort.addEventListener("change", apply);
}

// Перемикання фото в галереї товару
function initGallery() {
  const main = document.querySelector(".gallery-main");
  if (!main) return;

  document.querySelectorAll(".gallery-thumbs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = btn.querySelector("img");
      main.src = img.src;
      main.alt = img.alt;
    });
  });
}

// ==========================================================================
// ЛР4, п. 2.1 — маніпуляція елементами
// ==========================================================================

// Знаходимо всі елементи з класом .price і змінюємо їм стиль: ціна стає «цінником»
function highlightPrices() {
  const prices = document.querySelectorAll(".price");

  prices.forEach((price) => {
    price.classList.add("is-tagged");
    price.style.backgroundColor = "var(--color-price-bg)";
    price.style.color = "var(--color-price)";
  });
}

// Додаємо новий абзац у кінець <main> через createElement() та append()
function addPageNote() {
  const main = document.querySelector("main");
  if (!main) return;

  const note = document.createElement("p");
  note.className = "page-note";
  note.innerHTML =
    "Порада: натисніть <kbd>↑</kbd> або <kbd>↓</kbd> на клавіатурі, щоб збільшити чи зменшити шрифт. " +
    "Тему сайту можна змінити кнопкою «Змінити тему» в шапці.";

  main.append(note);
}

// ==========================================================================
// ЛР4, п. 2.2 — динамічна зміна контенту
// ==========================================================================

// Поточна дата в підвалі
function showFooterDate() {
  const copyright = document.querySelector(".copyright");
  if (!copyright) return;

  const now = new Date();
  const formatted = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const time = document.createElement("time");
  time.className = "footer-date";
  time.dateTime = now.toISOString().slice(0, 10);
  time.textContent = `Сьогодні: ${formatted}`;

  copyright.append(time);
}

// Кнопки «Показати більше»: розкривають прихований блок тексту (акордеон)
function initAccordions() {
  document.querySelectorAll(".more-toggle").forEach((button) => {
    const content = document.getElementById(button.getAttribute("aria-controls"));
    if (!content) return;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      button.textContent = isOpen ? "Показати більше" : "Згорнути";
      content.hidden = isOpen;
    });
  });
}

// ==========================================================================
// ЛР4, п. 3.1 — клік: зміна теми сайту (+ збереження в LocalStorage)
// ==========================================================================

function initThemeToggle() {
  const button = document.querySelector(".theme-toggle");
  if (!button) return;

  const icon = button.querySelector(".theme-toggle-icon");
  const root = document.documentElement;

  function render() {
    const isDark = root.classList.contains("dark-theme");
    button.setAttribute("aria-pressed", String(isDark));
    if (icon) icon.textContent = isDark ? "☀" : "☾";
  }

  button.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark-theme");
    storage.set(STORAGE_KEYS.theme, isDark ? "dark" : "light");
    render();
  });

  render();
}

// ==========================================================================
// ЛР4, п. 3.2 — події миші та клавіатури
// ==========================================================================

// Підсвітка пунктів меню при наведенні миші — класом .is-hovered, без CSS :hover
function initNavHover() {
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("mouseenter", () => link.classList.add("is-hovered"));
    link.addEventListener("mouseleave", () => link.classList.remove("is-hovered"));
    // Для клавіатурної навігації — те саме при фокусі
    link.addEventListener("focus", () => link.classList.add("is-hovered"));
    link.addEventListener("blur", () => link.classList.remove("is-hovered"));
  });
}

// Клавіші ArrowUp / ArrowDown змінюють розмір шрифту сторінки
const FONT_SIZE = { min: 12, max: 24, step: 1 };

function initFontSizeKeys() {
  const saved = Number(storage.get(STORAGE_KEYS.fontSize));
  if (saved >= FONT_SIZE.min && saved <= FONT_SIZE.max) {
    document.body.style.fontSize = `${saved}px`;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    // У полях форм стрілки працюють як зазвичай (курсор, список, число)
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;

    event.preventDefault();
    const current = parseFloat(getComputedStyle(document.body).fontSize);
    const next = current + (event.key === "ArrowUp" ? FONT_SIZE.step : -FONT_SIZE.step);
    setFontSize(next);
  });
}

function setFontSize(size) {
  const value = Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, size));
  document.body.style.fontSize = `${value}px`;
  storage.set(STORAGE_KEYS.fontSize, String(value));
  showToast(`Розмір шрифту: ${value} px`);
}

// Коротке спливаюче повідомлення внизу екрана
let toastTimer;

function showToast(text) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }

  toast.textContent = text;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

// ==========================================================================
// ЛР4, п. 4 — форми: власна валідація на JavaScript
// ==========================================================================

// Правила перевірки для полів за їхнім атрибутом name.
// Кожне правило повертає текст помилки або порожній рядок, якщо значення коректне.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // щось@домен.зона

const validators = {
  name(value) {
    if (value.trim() === "") return "Введіть ім’я.";
    if (value.trim().length < 3) return "Ім’я має містити щонайменше 3 символи.";
    return "";
  },
  email(value) {
    if (value.trim() === "") return "Введіть email.";
    if (!value.includes("@")) return "Email має містити символ @.";
    if (!EMAIL_PATTERN.test(value.trim())) return "Вкажіть домен після @, наприклад name@gmail.com.";
    return "";
  },
  phone(value) {
    if (value.trim() === "") return ""; // необов’язкове поле
    const digits = value.replace(/\D/g, "");
    if (!/^\+?[\d\s()-]+$/.test(value) || digits.length < 10 || digits.length > 12) {
      return "Номер має містити 10–12 цифр, наприклад +380 67 123 45 67.";
    }
    return "";
  },
  message(value) {
    if (value.trim().length < 10) return "Повідомлення має містити щонайменше 10 символів.";
    return "";
  },
  password(value) {
    if (value.length < 8) return "Пароль має містити щонайменше 8 символів.";
    return "";
  },
  password2(value, form) {
    if (value === "") return "Повторіть пароль.";
    if (value !== form.elements.password.value) return "Паролі не збігаються.";
    return "";
  },
  consent(value, form, field) {
    return field.checked ? "" : "Потрібна ваша згода на обробку даних.";
  },
  terms(value, form, field) {
    return field.checked ? "" : "Потрібно прийняти умови користування.";
  },
  qty(value, form, field) {
    const qty = Number(value);
    const max = Number(field.max) || Infinity;
    if (!Number.isInteger(qty) || qty < 1) return "Вкажіть кількість від 1.";
    if (qty > max) return `В наявності лише ${max} шт.`;
    return "";
  },
};

// Перевіряє одне поле: підсвічує його червоним і показує текст помилки під ним
function validateField(field, form) {
  const rule = validators[field.name];
  if (!rule) return true; // поля без правил (select, radio) не перевіряємо

  const message = rule(field.value, form, field);
  const errorBox = document.getElementById(`${field.id}-error`);

  field.classList.toggle("is-invalid", Boolean(message));
  field.setAttribute("aria-invalid", message ? "true" : "false");
  if (errorBox) errorBox.textContent = message;

  return !message;
}

// Зчитує дані з усіх полів форми в об’єкт
function readFormData(form) {
  const data = {};

  [...form.elements].forEach((field) => {
    if (!field.name || field.type === "submit" || field.type === "button") return;
    if (field.type === "radio" && !field.checked) return;

    if (field.type === "checkbox") {
      data[field.name] = field.checked ? "так" : "ні";
    } else if (field.type === "password") {
      data[field.name] = "•".repeat(field.value.length); // пароль не показуємо
    } else if (field.tagName === "SELECT") {
      data[field.name] = field.options[field.selectedIndex].text;
    } else {
      data[field.name] = field.value.trim();
    }
  });

  return data;
}

// Підписи полів для блоку з надісланими даними
const FIELD_LABELS = {
  name: "Ім’я",
  email: "Email",
  phone: "Телефон",
  topic: "Тема",
  message: "Повідомлення",
  consent: "Згода",
  role: "Роль",
  password: "Пароль",
  password2: "Повтор пароля",
  terms: "Умови",
  qty: "Кількість",
};

// Виводить зчитані дані у спеціальний блок під формою
function renderFormOutput(form, data) {
  const output = form.parentElement.querySelector(".form-output");
  if (!output) return;

  output.innerHTML = "<h3>Отримані дані</h3>";
  const list = document.createElement("dl");

  Object.entries(data).forEach(([name, value]) => {
    const term = document.createElement("dt");
    term.textContent = FIELD_LABELS[name] || name;
    const desc = document.createElement("dd");
    desc.textContent = value || "—"; // textContent, а не innerHTML: захист від XSS
    list.append(term, desc);
  });

  output.append(list);
  output.hidden = false;
}

function initForms() {
  document.querySelectorAll("form[data-validate]").forEach((form) => {
    const fields = [...form.elements].filter((el) => el.name && validators[el.name]);
    const status = form.querySelector(".form-status");

    // Перевірка при виході з поля; після першої помилки — під час введення
    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field, form));
      field.addEventListener("input", () => {
        if (field.classList.contains("is-invalid")) validateField(field, form);
      });
      field.addEventListener("change", () => {
        if (field.type === "checkbox") validateField(field, form);
      });
    });

    // п. 4.1 — обробка події submit
    form.addEventListener("submit", (event) => {
      event.preventDefault(); // забороняємо стандартну відправку

      const isValid = fields.map((field) => validateField(field, form)).every(Boolean);

      if (!isValid) {
        if (status) {
          status.textContent = "";
          status.className = "form-status";
        }
        form.querySelector(".is-invalid").focus();
        return;
      }

      const data = readFormData(form);
      console.log(`Форма «${form.getAttribute("aria-label") || "без назви"}» надіслана:`);
      console.table(data);
      renderFormOutput(form, data);

      // п. 5 — зберігаємо ім’я користувача
      if (data.name) storage.set(STORAGE_KEYS.userName, data.name);

      form.reset();
      fields.forEach((field) => {
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
      });

      if (status) {
        status.textContent = form.dataset.success || "Форма успішно надіслана!";
        status.className = "form-status form-success";
      }
    });
  });
}

// ==========================================================================
// ЛР4, п. 5 — LocalStorage: ім’я користувача
// ==========================================================================

// Якщо користувач уже надсилав форму, підставляємо його ім’я й вітаємо
function restoreUserName() {
  const name = storage.get(STORAGE_KEYS.userName);
  if (!name) return;

  document.querySelectorAll('form[data-validate] input[name="name"]').forEach((input) => {
    if (!input.value) input.value = name;
  });

  const greeting = document.querySelector(".form-greeting");
  if (greeting) {
    greeting.textContent = `Вітаємо знову, ${name}! Ми підставили ваше ім’я у форму.`;
    greeting.hidden = false;
  }
}
