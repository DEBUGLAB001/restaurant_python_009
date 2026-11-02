const $ = (selector) => document.querySelector(selector);
let dashboard = { menu: [], orders: [], popular: [], kitchen_queue: [], prep_batch: [] };
let activeFilter = "all";
const cart = new Map();
const nextStatus = { new: "preparing", preparing: "ready", ready: "completed" };
const statusLabel = { new: "New", preparing: "Preparing", ready: "Ready", completed: "Completed" };
let modalReturnFocus = null;

const dateNode = $("#today-date");
if (dateNode) dateNode.textContent = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date()).toUpperCase();

function syncActiveNavigation() {
  const currentHash = window.location.hash || "#overview";
  document.querySelectorAll(".nav-item").forEach((item) => {
    const selected = item.id !== "menu-navigation" && item.getAttribute("href") === currentHash;
    item.classList.toggle("active", selected);
    if (selected) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function loadDashboard() {
  try {
    const response = await fetch("api/state", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Could not load service data.");
    dashboard = await response.json();
    renderOrders();
    renderQueue();
    renderPopular();
    renderMenu();
    $("#nav-orders").textContent = dashboard.orders.filter((order) => order.status !== "completed").length;
  } catch (error) {
    $("#order-list").innerHTML = `<div class="empty-state">${escapeHtml(error.message)} Try refreshing in a moment.</div>`;
  }
}

function renderOrders() {
  const active = dashboard.orders.filter((order) => order.status !== "completed");
  const visible = dashboard.orders.filter((order) => activeFilter === "all" ? true : order.status === activeFilter);
  const counts = { all: dashboard.orders.length, new: 0, preparing: 0, ready: 0 };
  active.forEach((order) => counts[order.status] = (counts[order.status] || 0) + 1);
  Object.entries(counts).forEach(([key, count]) => {
    const node = $(`#${key}-count`);
    if (node) node.textContent = count;
  });
  $("#orders-value").innerHTML = `${48 + Math.max(0, dashboard.orders.length - 4)}<span class="trend" aria-label="Up 8.2 percent"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 10 4-4 3 3 4-5"/><path d="M10 4h4v4"/></svg>8.2%</span>`;
  $("#order-list").innerHTML = visible.length ? visible.map((order) => {
    const itemSummary = order.items.map((item) => `${item.quantity} × ${escapeHtml(item.name)}`).join(", ");
    const action = nextStatus[order.status]
      ? `<button class="order-action" data-order="${escapeHtml(order.id)}" data-status="${nextStatus[order.status]}">${nextStatus[order.status] === "completed" ? "Complete" : `Mark ${statusLabel[nextStatus[order.status]]}`}</button>`
      : "";
    return `<article class="order-row"><div class="order-id">${escapeHtml(order.id)}<small>${escapeHtml(order.created_at)}</small></div><div class="guest">${escapeHtml(order.guest)}<small>${escapeHtml(order.channel)}</small></div><div class="order-items">${itemSummary}</div><div class="order-total"><span class="status-pill status-${escapeHtml(order.status)}">${statusLabel[order.status] || escapeHtml(order.status)}</span><small>$${Number(order.total).toFixed(2)}</small>${action}</div></article>`;
  }).join("") : `<div class="empty-state">No ${activeFilter === "all" ? "orders" : `${activeFilter} orders`} right now.</div>`;
  document.querySelectorAll(".order-action").forEach((button) => button.addEventListener("click", () => advanceOrder(button.dataset.order, button.dataset.status)));
}

function renderQueue() {
  const queue = dashboard.kitchen_queue || [];
  $("#active-tickets").textContent = queue.length;
  $("#kitchen-queue").innerHTML = queue.length ? queue.slice(0, 3).map((ticket, index) => {
    const order = dashboard.orders.find((row) => row.id === ticket.id);
    const name = order ? order.items.map((item) => item.name).join(", ") : "Prep ticket";
    return `<div class="queue-row"><span class="queue-num">${index + 1}</span><div><strong>${escapeHtml(ticket.id)} · ${escapeHtml(name)}</strong><small>Urgency ${escapeHtml(ticket.priority)} · position ${escapeHtml(ticket.received_order)}</small></div><span class="queue-time">${escapeHtml(ticket.prep_minutes)} min</span></div>`;
  }).join("") : `<div class="empty-state small">No active kitchen tickets.</div>`;
  $("#prep-batch").textContent = (dashboard.prep_batch || []).join(" + ") || "No orders";
}

function renderPopular() {
  const popular = dashboard.popular || [];
  $("#popular-list").innerHTML = popular.slice(0, 3).map((item, index) => `<div class="popular-row"><span class="food-thumb dish-photo dish-${escapeHtml(item.id)}" aria-hidden="true"></span><div><strong>${escapeHtml(item.name)}</strong><small>Popular this service</small></div><span class="pop-value">#${index + 1}</span></div>`).join("");
}

async function renderMenu() {
  const query = $("#menu-search").value.trim();
  let matches = dashboard.menu;
  if (query) {
    try {
      const response = await fetch(`api/menu/search?q=${encodeURIComponent(query)}`);
      if (response.ok) matches = await response.json();
      else matches = [];
    } catch {
      matches = [];
    }
  }
  $("#modal-menu").innerHTML = matches.map((item) => {
    const photo = ["m1", "m2", "m3", "m5"].includes(item.id) ? `menu-photo dish-photo dish-${escapeHtml(item.id)}` : `menu-photo menu-art menu-art-${escapeHtml(item.id)}`;
    return `<button class="menu-item" type="button" data-menu="${escapeHtml(item.id)}"><span class="${photo}" aria-hidden="true"></span><span class="menu-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.prep_minutes)} min</small></span><b>$${Number(item.price).toFixed(2)}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg></b></button>`;
  }).join("") || `<div class="empty-state small">No menu items match that search.</div>`;
  document.querySelectorAll(".menu-item").forEach((button) => button.addEventListener("click", () => addToCart(button.dataset.menu)));
}

function addToCart(menuId) {
  const menuItem = dashboard.menu.find((item) => item.id === menuId);
  if (!menuItem) return;
  const current = cart.get(menuId) || { menu_id: menuId, name: menuItem.name, quantity: 0, unit_price: menuItem.price, modifiers: [] };
  current.quantity += 1;
  current.modifiers = menuId === "m2" && $("#add-avocado").checked ? [{ name: "Avocado", price: 2 }] : [];
  cart.set(menuId, current);
  updateCart();
}

function updateCart() {
  const rows = [...cart.values()];
  const count = rows.reduce((sum, item) => sum + item.quantity, 0);
  const total = rows.reduce((sum, item) => sum + item.quantity * (item.unit_price + item.modifiers.reduce((extra, modifier) => extra + modifier.price, 0)), 0);
  $("#cart-count").textContent = `${count} item${count === 1 ? "" : "s"}`;
  $("#cart-total").textContent = `$${total.toFixed(2)}`;
  $("#submit-order").disabled = count === 0;
}

async function advanceOrder(orderId, status) {
  try {
    const response = await fetch(`api/orders/${encodeURIComponent(orderId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Could not update order.");
    }
    await loadDashboard();
  } catch (error) { window.alert(error.message); }
}

async function submitOrder() {
  const guest = $("#guest-name").value.trim() || "Walk-in guest";
  const button = $("#submit-order");
  button.disabled = true;
  try {
    const response = await fetch("api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guest, channel: "Pickup", items: [...cart.values()] }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not place order.");
    cart.clear();
    updateCart();
    $("#order-message").textContent = `${result.id} is in the kitchen queue.`;
    await loadDashboard();
    window.setTimeout(closeModal, 800);
  } catch (error) {
    $("#order-message").textContent = error.message;
    button.disabled = false;
  }
}

function openModal() {
  modalReturnFocus = document.activeElement;
  $("#order-modal").hidden = false;
  document.body.style.overflow = "hidden";
  $("#guest-name").focus();
}
function closeModal() {
  $("#order-modal").hidden = true;
  document.body.style.overflow = "";
  $("#order-message").textContent = "";
  if (modalReturnFocus && typeof modalReturnFocus.focus === "function") modalReturnFocus.focus();
  modalReturnFocus = null;
}

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((item) => {
    item.classList.remove("active");
    item.setAttribute("aria-pressed", "false");
  });
  tab.classList.add("active");
  tab.setAttribute("aria-pressed", "true");
  activeFilter = tab.dataset.filter;
  renderOrders();
}));
$("#new-order-button").addEventListener("click", openModal);
$("#close-modal").addEventListener("click", closeModal);
$("#refresh-button").addEventListener("click", loadDashboard);
$("#view-all").addEventListener("click", () => {
  activeFilter = "all";
  document.querySelectorAll(".tab").forEach((tab) => {
    const selected = tab.dataset.filter === "all";
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  });
  renderOrders();
});
$("#menu-search").addEventListener("input", renderMenu);
$("#submit-order").addEventListener("click", submitOrder);
$("#add-avocado").addEventListener("change", (event) => {
  const chicken = cart.get("m2");
  if (!chicken) return;
  chicken.modifiers = event.target.checked ? [{ name: "Avocado", price: 2 }] : [];
  updateCart();
});
$("#menu-navigation").addEventListener("click", (event) => {
  event.preventDefault();
  openModal();
});
window.addEventListener("hashchange", syncActiveNavigation);
$("#order-modal").addEventListener("click", (event) => { if (event.target.id === "order-modal") closeModal(); });
document.addEventListener("keydown", (event) => {
  const modal = $("#order-modal");
  if (modal.hidden) return;
  if (event.key === "Escape") {
    closeModal();
    return;
  }
  if (event.key === "Tab") {
    const focusable = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
loadDashboard();
syncActiveNavigation();
window.setInterval(loadDashboard, 5000);
