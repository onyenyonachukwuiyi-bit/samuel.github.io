const state = {
  products: [],
  filter: "all",
  sort: "featured",
  search: "",
  cart: JSON.parse(localStorage.getItem("avoglowCart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("avoglowWishlist") || "[]")
};

const fallbackProducts = [
  { id: 1, sequence: 1, name: "Pure Cold Pressed Avocado Oil", brand: "Avoglow", category: "Beauty", price: 65000, originalPrice: 82000, image: "my works/product pictures_1.png", rating: 4.9, description: "100ml multipurpose avocado oil for dry skin, damaged hair, and daily natural care." },
  { id: 2, sequence: 2, name: "Avocado Oil with Lavender", brand: "Avoglow", category: "Beauty", price: 58000, originalPrice: 72000, image: "my works/product pictures_2.png", rating: 4.8, description: "A calming body oil blend for gentle daily care, relaxation, and skin nourishment." },
  { id: 3, sequence: 3, name: "Avocado Oil with Rosemary", brand: "Avoglow", category: "Beauty", price: 58000, originalPrice: 72000, image: "my works/product pictures_3.png", rating: 4.8, description: "Botanical avocado and rosemary nourishment for healthy-looking skin and hair." },
  { id: 4, sequence: 4, name: "Root and Revive Hair Elixir", brand: "Avoglow", category: "Hair Care", price: 72000, originalPrice: 88000, image: "my works/product pictures_5.png", rating: 4.9, description: "Triple active hair elixir with jojoba, avocado, and castor for scalp and hair rituals." },
  { id: 5, sequence: 5, name: "Intensive Hair Butter", brand: "Avoglow", category: "Hair Care", price: 68000, originalPrice: 85000, image: "my works/product pictures_6.png", rating: 4.7, description: "Deep moisture hair butter for strength, length retention, and protective styling." },
  { id: 6, sequence: 6, name: "AvoChai Caffeine-Free Wellness", brand: "Avoglow", category: "Wellness", price: 42000, originalPrice: 55000, image: "my works/product pictures_7.png", rating: 4.6, description: "Avocado seed chai with ginger and warming botanicals for caffeine-free wellness." },
  { id: 7, sequence: 7, name: "Avoglow Packaging Set", brand: "Avoglow", category: "Beauty", price: 155000, originalPrice: 190000, image: "my works/product pictures_4.png", rating: 4.7, description: "Gift-ready avocado oil packaging set for retail, salon, and premium gifting." },
  { id: 8, sequence: 8, name: "Fresh Atari Avocado Crate", brand: "Atari Farms", category: "Produce", price: 95000, originalPrice: 120000, image: "my works/product pictures_8.png", rating: 4.8, description: "Fresh avocado crates from verified Atari Farms growers for home or wholesale delivery." }
];

let localOrders = JSON.parse(localStorage.getItem("avoglowOrders") || "[]");

const money = value => `UGX ${Number(value).toLocaleString()}`;
const qs = selector => document.querySelector(selector);
const qsa = selector => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindUi();
  restoreTheme();
  revealOnScroll();
  await loadProducts();
  await loadDashboard();
  updateCart();
  updateWishlist();
}

function bindUi() {
  const header = qs("[data-header]");
  window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 12));

  qs("[data-menu-toggle]").addEventListener("click", () => {
    qs("[data-nav-links]").classList.toggle("open");
    qs(".nav-actions").classList.toggle("open");
  });

  qs("[data-theme-toggle]").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("avoglowTheme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  qs("#globalSearch").addEventListener("input", event => {
    state.search = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  qs("#sortProducts").addEventListener("change", event => {
    state.sort = event.target.value;
    renderProducts();
  });

  qsa("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      qsa("[data-filter]").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      state.filter = button.dataset.filter;
      renderProducts();
    });
  });

  qs("[data-open-cart]").addEventListener("click", openCart);
  qsa("[data-close-cart]").forEach(button => button.addEventListener("click", closeCart));
  qs("[data-open-wishlist]").addEventListener("click", openWishlist);
  qs("[data-close-wishlist]").addEventListener("click", closeWishlist);
  qs("[data-open-auth]").addEventListener("click", openAuth);
  qs("[data-close-auth]").addEventListener("click", closeAuth);
  qs("[data-play-story]").addEventListener("click", () => toast("Video story placeholder ready for production media."));
  qs("[data-market-order]").addEventListener("click", () => toast("Bulk supply request captured. Admin delivery team notified."));

  qsa("[data-auth-tab]").forEach(tab => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab));
  });

  qs("[data-send-otp]").addEventListener("click", sendOtp);
  qs("[data-forgot-password]").addEventListener("click", forgotPassword);
  qsa("[data-social-login]").forEach(button => button.addEventListener("click", () => socialLogin(button.dataset.socialLogin)));
  qs("[data-biometric]").addEventListener("click", biometricLogin);
  qs("#authForm").addEventListener("submit", submitAuth);
  qs("#checkoutForm").addEventListener("submit", checkout);
  qs("#trackForm").addEventListener("submit", trackOrder);
  qs("#subscribeForm").addEventListener("submit", subscribe);

  qs("#languageSelector").addEventListener("change", event => {
    const labels = { en: "English", lg: "Luganda", sw: "Swahili" };
    toast(`Language set to ${labels[event.target.value]}. Translation strings can connect here.`);
  });
}

function restoreTheme() {
  if (localStorage.getItem("avoglowTheme") === "dark") document.body.classList.add("dark");
}

function revealOnScroll() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });
  qsa(".reveal").forEach(item => observer.observe(item));
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Products unavailable");
    state.products = await response.json();
  } catch (error) {
    state.products = fallbackProducts;
    toast("Static demo mode: products loaded locally.");
  }
  renderProducts();
}

function renderProducts() {
  const grid = qs("#productGrid");
  const search = state.search;
  let products = state.products.filter(product => {
    const matchesCategory = state.filter === "all" || product.category === state.filter;
    const haystack = `${product.name} ${product.category} ${product.brand} ${product.description}`.toLowerCase();
    return matchesCategory && (!search || haystack.includes(search));
  });

  products = [...products].sort((a, b) => {
    if (state.sort === "price-low") return a.price - b.price;
    if (state.sort === "price-high") return b.price - a.price;
    if (state.sort === "rating") return b.rating - a.rating;
    return a.sequence - b.sequence;
  });

  grid.innerHTML = products.map(product => `
    <article class="product-card">
      <figure><img src="${product.image}" alt="${product.name}"></figure>
      <div class="product-info">
        <div class="product-meta"><span>${product.category}</span><span>${product.rating.toFixed(1)} rating</span></div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="price-row"><span>${money(product.price)}</span><del>${money(product.originalPrice)}</del></div>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-add-cart="${product.id}">Add to Cart</button>
          <button class="wish-btn" type="button" data-add-wishlist="${product.id}" aria-label="Add ${product.name} to wishlist">+</button>
        </div>
      </div>
    </article>
  `).join("") || `<p>No products match your search.</p>`;

  qsa("[data-add-cart]").forEach(button => button.addEventListener("click", () => addToCart(Number(button.dataset.addCart))));
  qsa("[data-add-wishlist]").forEach(button => button.addEventListener("click", () => addToWishlist(Number(button.dataset.addWishlist))));
}

function addToCart(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return;
  const existing = state.cart.find(item => item.id === id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ ...product, quantity: 1 });
  updateCart();
  toast(`${product.name} added to cart.`);
}

function removeFromCart(id) {
  state.cart = state.cart.filter(item => item.id !== id);
  updateCart();
}

function updateQuantity(id, change) {
  const item = state.cart.find(product => product.id === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) removeFromCart(id);
  else updateCart();
}

function updateCart() {
  localStorage.setItem("avoglowCart", JSON.stringify(state.cart));
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  qs("[data-cart-count]").textContent = count;
  qs("[data-cart-total]").textContent = money(total);
  qs("#cartItems").innerHTML = state.cart.map(item => `
    <article class="drawer-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>${money(item.price)} x ${item.quantity}</p>
        <p>${money(item.price * item.quantity)}</p>
      </div>
      <div>
        <button type="button" data-qty-minus="${item.id}">-</button>
        <button type="button" data-qty-plus="${item.id}">+</button>
        <button type="button" data-remove-cart="${item.id}">x</button>
      </div>
    </article>
  `).join("") || `<p>Your cart is empty. Add Avoglow products or fresh produce to begin.</p>`;

  qsa("[data-remove-cart]").forEach(button => button.addEventListener("click", () => removeFromCart(Number(button.dataset.removeCart))));
  qsa("[data-qty-minus]").forEach(button => button.addEventListener("click", () => updateQuantity(Number(button.dataset.qtyMinus), -1)));
  qsa("[data-qty-plus]").forEach(button => button.addEventListener("click", () => updateQuantity(Number(button.dataset.qtyPlus), 1)));
  loadDashboard();
}

function addToWishlist(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return;
  if (!state.wishlist.some(item => item.id === id)) state.wishlist.push(product);
  updateWishlist();
  toast(`${product.name} saved to wishlist.`);
}

function removeFromWishlist(id) {
  state.wishlist = state.wishlist.filter(item => item.id !== id);
  updateWishlist();
}

function updateWishlist() {
  localStorage.setItem("avoglowWishlist", JSON.stringify(state.wishlist));
  qs("[data-wishlist-count]").textContent = state.wishlist.length;
  qs("#wishlistItems").innerHTML = state.wishlist.map(item => `
    <article class="drawer-item">
      <img src="${item.image}" alt="${item.name}">
      <div><h3>${item.name}</h3><p>${money(item.price)}</p></div>
      <button type="button" data-remove-wishlist="${item.id}">x</button>
    </article>
  `).join("") || `<p>Your wishlist is empty.</p>`;
  qsa("[data-remove-wishlist]").forEach(button => button.addEventListener("click", () => removeFromWishlist(Number(button.dataset.removeWishlist))));
}

async function checkout(event) {
  event.preventDefault();
  if (!state.cart.length) return toast("Your cart is empty.");
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let result;
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, items: state.cart, total })
    });
    result = await response.json();
    if (!response.ok) return toast(result.message || "Checkout failed.");
  } catch (error) {
    result = {
      orderId: `ATARI-LOCAL-${Date.now()}`,
      status: "Confirmed",
      total
    };
    localOrders.unshift({
      id: result.orderId,
      customer: `${data.name} (${data.mode})`,
      status: result.status,
      total,
      delivery: "Static demo route",
      timeline: ["Confirmed", "Packed locally for demo"]
    });
    localStorage.setItem("avoglowOrders", JSON.stringify(localOrders));
  }
  state.cart = [];
  updateCart();
  closeCart();
  qs("#trackingResult").innerHTML = `Order created: <b>${result.orderId}</b>. Status: ${result.status}.`;
  toast(`Checkout complete: ${result.orderId}`);
  await loadDashboard();
}

async function trackOrder(event) {
  event.preventDefault();
  const orderId = new FormData(event.currentTarget).get("orderId").trim();
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    const result = await response.json();
    qs("#trackingResult").innerHTML = response.ok
      ? `<b>${result.id}</b>: ${result.status}. ${result.timeline.join(" -> ")}. Delivery: ${result.delivery}.`
      : result.message;
  } catch (error) {
    const demoOrder = localOrders.find(item => item.id.toLowerCase() === orderId.toLowerCase()) || {
      id: "ATARI-DEMO-1001",
      status: "Out for delivery",
      timeline: ["Confirmed", "Packed", "Dispatched", "Out for delivery"],
      delivery: "Kampala route A"
    };
    qs("#trackingResult").innerHTML = `<b>${demoOrder.id}</b>: ${demoOrder.status}. ${demoOrder.timeline.join(" -> ")}. Delivery: ${demoOrder.delivery}.`;
  }
}

async function loadDashboard() {
  try {
    const response = await fetch("/api/admin/dashboard");
    if (!response.ok) throw new Error("Dashboard unavailable");
    const data = await response.json();
    const cartValue = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const metrics = [
      ["Revenue", money(data.revenue)],
      ["Orders", data.orders.length],
      ["Customers", data.customers],
      ["Farmers", data.farmers],
      ["Products", state.products.length || data.products],
      ["Payments", data.payments],
      ["Coupons", data.coupons],
      ["Cart Value", money(cartValue)]
    ];
    qs("#metricGrid").innerHTML = metrics.map(([label, value]) => `<div class="metric"><b>${value}</b><span>${label}</span></div>`).join("");
    qs("#orderRows").innerHTML = data.orders.map(order => `
      <tr><td>${order.id}</td><td>${order.customer}</td><td>${order.status}</td><td>${money(order.total)}</td><td>${order.delivery}</td></tr>
    `).join("");
  } catch (error) {
    const cartValue = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orders = localOrders.length ? localOrders : [{ id: "ATARI-DEMO-1001", customer: "Guest Customer", status: "Out for delivery", total: 181000, delivery: "Kampala route A" }];
    const metrics = [["Revenue", money(8601000 + cartValue)], ["Orders", orders.length], ["Customers", 1248], ["Farmers", 86], ["Products", state.products.length || fallbackProducts.length], ["Payments", "MM/Card/Cash"], ["Coupons", 12], ["Cart Value", money(cartValue)]];
    qs("#metricGrid").innerHTML = metrics.map(([label, value]) => `<div class="metric"><b>${value}</b><span>${label}</span></div>`).join("");
    qs("#orderRows").innerHTML = orders.map(order => `<tr><td>${order.id}</td><td>${order.customer}</td><td>${order.status}</td><td>${money(order.total)}</td><td>${order.delivery}</td></tr>`).join("");
  }
}

async function sendOtp() {
  const phone = qs("#authForm [name='phone']").value;
  const response = await fetch("/api/auth/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  const result = await response.json();
  qs("#authMessage").textContent = result.message;
}

async function submitAuth(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  qs("#authMessage").textContent = result.message;
  if (response.ok) toast("Logged in for demo session.");
}

async function forgotPassword() {
  const email = qs("#authForm [name='email']").value;
  const response = await fetch("/api/auth/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const result = await response.json();
  qs("#authMessage").textContent = result.message;
}

async function socialLogin(provider) {
  const response = await fetch("/api/auth/social", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider })
  });
  const result = await response.json();
  qs("#authMessage").textContent = result.message;
  toast(result.message);
}

function biometricLogin() {
  const available = Boolean(window.PublicKeyCredential);
  qs("#authMessage").textContent = available
    ? "Biometric-capable browser detected. Production WebAuthn registration can start here."
    : "This browser does not expose biometric login support.";
}

async function subscribe(event) {
  event.preventDefault();
  const email = new FormData(event.currentTarget).get("email");
  const response = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const result = await response.json();
  toast(result.message);
  if (response.ok) event.currentTarget.reset();
}

function switchAuthTab(name) {
  qsa("[data-auth-tab]").forEach(tab => tab.classList.toggle("active", tab.dataset.authTab === name));
  qsa("[data-auth-panel]").forEach(panel => { panel.hidden = panel.dataset.authPanel !== name; });
}

function openCart() { qs("[data-cart-drawer]").classList.add("open"); }
function closeCart() { qs("[data-cart-drawer]").classList.remove("open"); }
function openWishlist() { qs("[data-wishlist-drawer]").classList.add("open"); }
function closeWishlist() { qs("[data-wishlist-drawer]").classList.remove("open"); }
function openAuth() { qs("[data-auth-modal]").classList.add("open"); }
function closeAuth() { qs("[data-auth-modal]").classList.remove("open"); }

function toast(message) {
  const el = qs("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3000);
}
