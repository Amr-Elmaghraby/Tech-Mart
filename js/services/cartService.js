import APP_CONFIG from "../core/config.js";
import * as storage from "../core/storage.js";

const CART_KEY = APP_CONFIG.storageKeys.cart;
const BUY_NOW_KEY = APP_CONFIG.storageKeys.buyNow;

// Get current cart from storage
export const getCart = () => {
  const cart = storage.get(CART_KEY);
  return Array.isArray(cart) ? cart : [];
};
export const getBuyNow = () => {
  const buyNow = storage.get(BUY_NOW_KEY);    
  return Array.isArray(buyNow) ? buyNow : [];
}

// Save cart to storage
const saveCart = (cart) => {
  return storage.set(CART_KEY, cart);
};

// Add product to cart. Store items as flat product-like objects
// { id, name, price, quantity, thumbnail, description, ... }
export const addToCart = (product, quantity = 1) => {
  try {
    if (!product || !product.id) {
      console.error("Invalid product");
      return false;
    }

    if (quantity <= 0) {
      console.error("Quantity must be positive");
      return false;
    }

    const cart = getCart();

    const existingIndex = cart.findIndex(
      (item) => String(item.id) === String(product.id),
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity =
        (cart[existingIndex].quantity || 0) + quantity;
      // keep other product fields up-to-date
      cart[existingIndex] = { ...cart[existingIndex], ...product };
    } else {
      const newItem = { ...product, quantity };
      cart.push(newItem);
    }

    return saveCart(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return false;
  }
};

// Remove product from cart by product id
export const removeFromCart = (productId) => {
  try {
    const cart = getCart();
    const filteredCart = cart.filter(
      (item) => String(item.id) !== String(productId),
    );
    return saveCart(filteredCart);
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
};

// Update product quantity in cart
export const updateQuantity = (productId, quantity) => {
  try {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    const cart = getCart();
    const itemIndex = cart.findIndex(
      (item) => String(item.id) === String(productId),
    );

    if (itemIndex === -1) {
      console.error("Product not found in cart");
      return false;
    }

    cart[itemIndex].quantity = quantity;
    return saveCart(cart);
  } catch (error) {
    console.error("Error updating quantity:", error);
    return false;
  }
};

// Clear entire cart
export const clearCart = () => {
  try {
    return storage.remove(CART_KEY);
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
};

// Get cart item count (total items, not unique products)
export const getCartItemCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.quantity || 0), 0);
};

// Calculate cart subtotal (before tax and shipping)
export const getCartSubtotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const price = item.price || 0;
    const qty = item.quantity || 0;
    return total + price * qty;
  }, 0);
};

// Calculate cart total with tax and shipping
export const getCartTotal = () => {
  const subtotal = getCartSubtotal();
  const tax = subtotal * APP_CONFIG.pricing.taxRate;

  const shipping =
    subtotal >= APP_CONFIG.pricing.freeShippingThreshold
      ? 0
      : APP_CONFIG.pricing.shippingCost;

  const total = subtotal + tax + shipping;

  return {
    subtotal,
    tax,
    shipping,
    total,
    freeShippingEligible: subtotal >= APP_CONFIG.pricing.freeShippingThreshold,
  };
};

// Check if product is in cart
export const isInCart = (productId) => {
  const cart = getCart();
  return cart.some((item) => String(item.id) === String(productId));
};

// Get specific cart item by product ID
export const getCartItem = (productId) => {
  const cart = getCart();
  return cart.find((item) => String(item.id) === String(productId)) || null;
};

// Basic promo validation - extend as needed
export const validatePromoCode = (code) => {
  if (!code) return 0;
  const c = String(code).trim().toUpperCase();
  const promos = {
    SAVE10: 10,
    SAVE15: 15,
    FREESHIP: 0,
    OMNIA_ELSHEIKH: 70,
  };
  return promos[c] || 0;
};
