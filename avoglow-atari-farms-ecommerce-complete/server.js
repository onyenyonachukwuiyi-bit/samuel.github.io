const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const root = __dirname;
const img = file => `my works/${file}`;

const products = [
  { id: 1, sequence: 1, name: "Pure Cold Pressed Avocado Oil", brand: "Avoglow", category: "Beauty", price: 65000, originalPrice: 82000, image: img("product pictures_1.png"), rating: 4.9, stock: 84, description: "100ml multipurpose avocado oil for dry skin, damaged hair, and daily natural care." },
  { id: 2, sequence: 2, name: "Avocado Oil with Lavender", brand: "Avoglow", category: "Beauty", price: 58000, originalPrice: 72000, image: img("product pictures_2.png"), rating: 4.8, stock: 66, description: "A calming body oil blend for gentle daily care, relaxation, and skin nourishment." },
  { id: 3, sequence: 3, name: "Avocado Oil with Rosemary", brand: "Avoglow", category: "Beauty", price: 58000, originalPrice: 72000, image: img("product pictures_3.png"), rating: 4.8, stock: 61, description: "Botanical avocado and rosemary nourishment for healthy-looking skin and hair." },
  { id: 4, sequence: 4, name: "Root and Revive Hair Elixir", brand: "Avoglow", category: "Hair Care", price: 72000, originalPrice: 88000, image: img("product pictures_5.png"), rating: 4.9, stock: 44, description: "Triple active hair elixir with jojoba, avocado, and castor for scalp and hair rituals." },
  { id: 5, sequence: 5, name: "Intensive Hair Butter", brand: "Avoglow", category: "Hair Care", price: 68000, originalPrice: 85000, image: img("product pictures_6.png"), rating: 4.7, stock: 51, description: "Deep moisture hair butter for strength, length retention, and protective styling." },
  { id: 6, sequence: 6, name: "AvoChai Caffeine-Free Wellness", brand: "Avoglow", category: "Wellness", price: 42000, originalPrice: 55000, image: img("product pictures_7.png"), rating: 4.6, stock: 73, description: "Avocado seed chai with ginger and warming botanicals for caffeine-free wellness." },
  { id: 7, sequence: 7, name: "Avoglow Packaging Set", brand: "Avoglow", category: "Beauty", price: 155000, originalPrice: 190000, image: img("product pictures_4.png"), rating: 4.7, stock: 28, description: "Gift-ready avocado oil packaging set for retail, salon, and premium gifting." },
  { id: 8, sequence: 8, name: "Fresh Atari Avocado Crate", brand: "Atari Farms", category: "Produce", price: 95000, originalPrice: 120000, image: img("product pictures_8.png"), rating: 4.8, stock: 120, description: "Fresh avocado crates from verified Atari Farms growers for home or wholesale delivery." }
];

const orders = [
  { id: "ATARI-DEMO-1001", customer: "Guest Customer", status: "Out for delivery", total: 181000, delivery: "Kampala route A", timeline: ["Confirmed", "Packed", "Dispatched", "Out for delivery"] }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
  });
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = path.normalize(requestPath === "/" ? "/index.html" : requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);
  if (!filePath.startsWith(root)) return sendJson(res, 403, { message: "Forbidden" });

  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(res, 404, { message: "File not found" });
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/products") return sendJson(res, 200, products);

  if (req.method === "POST" && url.pathname === "/api/checkout") {
    const body = await readBody(req);
    const { items, total, name, phone, address, mode } = body;
    if (!items || !Array.isArray(items) || items.length === 0) return sendJson(res, 400, { message: "Your cart is empty." });
    if (!name || !phone || !address) return sendJson(res, 400, { message: "Name, phone, and delivery address are required." });
    const order = {
      id: `ATARI-${Date.now()}`,
      customer: mode === "guest" ? `${name} (Guest)` : name,
      status: "Confirmed",
      total,
      delivery: "Route assignment pending",
      timeline: ["Confirmed"],
      items
    };
    orders.unshift(order);
    return sendJson(res, 200, { message: "Checkout success.", orderId: order.id, status: order.status, total });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/orders/")) {
    const id = decodeURIComponent(url.pathname.replace("/api/orders/", ""));
    const order = orders.find(item => item.id.toLowerCase() === id.toLowerCase());
    return order ? sendJson(res, 200, order) : sendJson(res, 404, { message: "Order not found. Check the reference and try again." });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/otp") {
    const body = await readBody(req);
    return body.phone ? sendJson(res, 200, { message: "Demo OTP sent. Use 123456 to continue.", expiresIn: "5 minutes" }) : sendJson(res, 400, { message: "Enter a phone number first." });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readBody(req);
    if (body.phone && body.otp === "123456") return sendJson(res, 200, { message: "Phone verified. Welcome back.", user: { phone: body.phone } });
    if (body.email && body.password) return sendJson(res, 200, { message: "Email login successful.", user: { email: body.email } });
    return sendJson(res, 400, { message: "Use OTP 123456 or enter email and password." });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/forgot") {
    const body = await readBody(req);
    return body.email ? sendJson(res, 200, { message: "Password reset link prepared for demo delivery." }) : sendJson(res, 400, { message: "Enter your email address first." });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/social") {
    const body = await readBody(req);
    const provider = body.provider === "facebook" ? "Facebook" : "Google";
    return sendJson(res, 200, { message: `${provider} login connected in demo mode.` });
  }

  if (req.method === "GET" && url.pathname === "/api/admin/dashboard") {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0) + 8420000;
    return sendJson(res, 200, {
      revenue,
      customers: 1248,
      farmers: 86,
      products: products.length,
      payments: "Mobile money, card, cash",
      coupons: 12,
      promotions: 5,
      deliveryZones: 9,
      reports: ["Daily sales", "Farmer payouts", "Inventory health"],
      roles: ["Owner", "Admin", "Operations", "Delivery", "Farmer"],
      orders: orders.slice(0, 6)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/subscribe") {
    const body = await readBody(req);
    return body.email && body.email.includes("@")
      ? sendJson(res, 200, { message: "Subscribed to Avoglow updates." })
      : sendJson(res, 400, { message: "Enter a valid email address." });
  }

  if (req.method === "GET") return serveStatic(req, res);
  sendJson(res, 405, { message: "Method not allowed" });
}

http.createServer(router).listen(port, () => {
  console.log(`Avoglow by Atari Farms running at http://localhost:${port}`);
});
