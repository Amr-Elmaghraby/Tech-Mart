import * as storage from "../core/storage.js";
import APP_CONFIG from "../core/config.js";
import * as productService from "../services/productService.js";
import * as cartService from "../services/cartService.js";
import * as userService from "../services/userService.js";
import * as orderService from "../services/orderService.js";
import { formatPrice } from "../core/utils.js";

// ===== DOM ELEMENTS =====
const checkoutForm = document.getElementById("checkoutForm");
const summaryItems = document.getElementById("summaryItems");
const subtotalEl = document.getElementById("subtotal");
const shippingEl = document.getElementById("shipping");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const loadingModal = document.getElementById("loadingModal");
const successModal = document.getElementById("successModal");
const promoInput = document.getElementById("promoCode");
const applyPromoBtn = document.querySelector(".btn-apply-promo");

// ===== STATE =====
let cartItems = [];
let orderSummary = {
  subtotal: 0,
  shipping: 10,
  tax: 0,
  discount: 0,
  total: 0,
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", initCheckout);
window.addEventListener("beforeunload", () => {});

async function initCheckout() {
  // Check if this is a "Buy Now" flow
  const urlParams = new URLSearchParams(window.location.search);
  const isBuyNow = urlParams.get("buyNow") === "true";

  if (isBuyNow) {
    loadBuyNow();
  } else {
    // Load cart items normally
    loadCart();
  }

  // Load user data if logged in
  const currentUser = userService.getCurrentUser();
  if (currentUser) {
    prefillForm(currentUser);
  }

  // Update summary
  updateOrderSummary();

  // Restore promo applied in cart (if any) only when NOT a buyNow flow
  if (!isBuyNow) {
    try {
      const storedPromo = storage.get("promo");
      if (storedPromo && storedPromo.percent) {
        // apply discount as amount
        orderSummary.discount =
          orderSummary.subtotal * (storedPromo.percent / 100);
        if (promoInput) {
          promoInput.value = storedPromo.code || "";
          promoInput.disabled = true;
        }
        updateOrderSummary();
        showNotification(
          `Promo code applied: ${storedPromo.percent}% off`,
          "success",
        );
      }
    } catch (err) {
      // ignore storage errors
    }
  }

  // Attach event listeners
  checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  applyPromoBtn.addEventListener("click", handleApplyPromo);
}

// ===== LOAD BUY NOW =====
function loadBuyNow() {
  try {
    cartItems = cartService.getBuyNow();
    console.log(cartItems);

    if (cartItems.length === 0) {
      summaryItems.innerHTML = '<p class="empty-message">No items in order</p>';
      return;
    } else {
      renderCartItems();
      // Clean up buyNow data
      localStorage.removeItem("buyNow");
    }
  } catch (error) {
    console.error("Error loading buy now data:", error);
    summaryItems.innerHTML = '<p class="empty-message">Error loading order</p>';
  }
}

// ===== LOAD CART =====
function loadCart() {
  cartItems = cartService.getCart();

  if (cartItems.length === 0) {
    summaryItems.innerHTML = '<p class="empty-message">Your cart is empty</p>';
    return;
  }

  renderCartItems();
}

// ===== RENDER CART ITEMS =====
function renderCartItems() {
  summaryItems.innerHTML = cartItems
    .map((item) => createCartItemElement(item))
    .join("");
}

function createCartItemElement(item) {
  // Support both cart items and buyNow items
  const itemTotal = item.totalPrice || (item.price || 0) * (item.quantity || 1);
  const quantity = item.quantity || 1;
  const thumbnail =
    item.thumbnail || item.image || "../assets/images/icons/no-image.png";

  return `
    <div class="summary-item">
      <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(item.name)}" class="item-thumbnail" />
      <div class="item-details">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-meta">
          <span>Qty: ${quantity}</span>
          <span>${formatPrice(item.price)}</span>
        </div>
      </div>
      <div class="item-price">${formatPrice(itemTotal)}</div>
    </div>
  `;
}

// ===== UPDATE ORDER SUMMARY =====
function updateOrderSummary() {
  // Calculate subtotal - support both cart items and buyNow items
  orderSummary.subtotal = cartItems.reduce((sum, item) => {
    const itemTotal =
      item.totalPrice || (item.price || 0) * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // Tax (use centralized config)
  orderSummary.tax = orderSummary.subtotal * APP_CONFIG.pricing.taxRate;

  // Shipping (use centralized config and same threshold logic as cart)
  orderSummary.shipping =
    orderSummary.subtotal >= APP_CONFIG.pricing.freeShippingThreshold
      ? 0
      : APP_CONFIG.pricing.shippingCost;

  // Calculate total
  orderSummary.total =
    orderSummary.subtotal +
    orderSummary.tax +
    orderSummary.shipping -
    orderSummary.discount;

  // Update UI
  subtotalEl.textContent = formatPrice(orderSummary.subtotal);
  taxEl.textContent = formatPrice(orderSummary.tax);
  shippingEl.textContent =
    orderSummary.shipping === 0 ? "FREE" : formatPrice(orderSummary.shipping);
  totalEl.textContent = formatPrice(Math.max(orderSummary.total, 0));
}

// ===== PREFILL FORM WITH USER DATA =====
function prefillForm(user) {
  const formFields = {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    company: user.company || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    zip: user.zip || "",
    country: user.country || "",
  };

  Object.entries(formFields).forEach(([key, value]) => {
    const field = document.getElementById(key);
    if (field) {
      field.value = value;
    }
  });
}

// ===== HANDLE CHECKOUT SUBMIT =====
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  // Validate cart
  if (cartItems.length === 0) {
    showNotification("Please add items to your cart", "error");
    return;
  }

  // Show loading modal
  showLoadingModal();

  try {
    // Get form data
    const formData = new FormData(checkoutForm);
    const billingDetails = Object.fromEntries(formData.entries());

    // Create order object
    const order = {
      id: userService.getCurrentUser().id,
      items: cartItems,
      billingDetails,
      summary: orderSummary,
      status: "pending",
      paymentMethod: billingDetails.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    // Simulate API call (replace with actual API)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Save order to storage
    const orders = storage.get("orders") || [];
    orders.push(order);
    storage.set("orders", orders);

    // Clear cart
    cartService.clearCart();
    // Clear stored promo after successful order
    try {
      storage.remove("promo");
    } catch (err) {
      console.warn("Could not remove promo from storage:", err);
    }

    // Show success modal
    hideLoadingModal();
    showSuccessModal(order);

    // Optionally save billing details for future use
    if (document.getElementById("saveAddress")?.checked) {
      saveUserBillingDetails(billingDetails);
    }
  } catch (error) {
    console.error("Checkout error:", error);
    hideLoadingModal();
    showNotification("An error occurred. Please try again.", "error");
  }
}

// ===== HANDLE PROMO CODE =====
function handleApplyPromo() {
  const code = promoInput.value.trim();

  if (!code) {
    showNotification("Please enter a promo code", "error");
    return;
  }

  // Use central cartService validation so promos match cart behavior
  const percent = cartService.validatePromoCode(code);

  if (percent > 0) {
    const discountAmount = orderSummary.subtotal * (percent / 100);
    orderSummary.discount = discountAmount;

    showNotification(
      `Promo code applied! You saved ${formatPrice(discountAmount)}`,
      "success",
    );
    updateOrderSummary();
    promoInput.value = "";
    promoInput.disabled = true;
  } else {
    showNotification("Invalid promo code", "error");
  }
}

// ===== UTILITY FUNCTIONS =====

function generateOrderId() {
  return "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
}

// function formatPrice(price) {
//   return parseFloat(price).toFixed(2);
// }

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function saveUserBillingDetails(details) {
  const currentUser = userService.getCurrentUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...details };
    userService.saveUser(updatedUser);
  }
}

// ===== MODAL FUNCTIONS =====

function showLoadingModal() {
  loadingModal.classList.remove("hidden");
}

function hideLoadingModal() {
  loadingModal.classList.add("hidden");
}

function showSuccessModal(order) {
  const successMessage = document.getElementById("successMessage");
  successMessage.textContent = `Order #${order.id} has been confirmed. Total: ${formatPrice(
    order.summary.total,
  )}`;
  successModal.classList.remove("hidden");
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
