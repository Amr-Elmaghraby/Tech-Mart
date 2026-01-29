import APP_CONFIG from "../core/config.js";
import * as storage from "../core/storage.js";
import { generateId } from "../core/utils.js";

const CART_KEY = APP_CONFIG.storageKeys.cart;

// Get current cart from storage
export const getCart = () => {
  const cart = storage.get(CART_KEY);
  return Array.isArray(cart) ? cart : [];
};

// Save cart to storage
const saveCart = (cart) => {
  return storage.set(CART_KEY, cart);
};

// Add product to cart
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
    const existingItemIndex = cart.findIndex(
      (item) => String(item.product.id) === String(product.id),
    );

    if (existingItemIndex > -1) {
      // Product exists, update quantity
      cart[existingItemIndex].quantity += quantity;
    } else {
      // New product, add to cart
      cart.push({
        id: generateId(),
        product: { ...product }, // Clone to avoid reference issues
        quantity: quantity,
        addedAt: new Date().toISOString(),
      });
    }

    return saveCart(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return false;
  }
};

// Remove product from cart
export const removeFromCart = (productId) => {
  try {
    const cart = getCart();
    const filteredCart = cart.filter(
      (item) => String(item.product.id) !== String(productId),
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
      // If quantity is 0 or negative, remove item
      return removeFromCart(productId);
    }

    const cart = getCart();
    const itemIndex = cart.findIndex(
      (item) => String(item.product.id) === String(productId),
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
  return cart.reduce((total, item) => total + item.quantity, 0);
};


 // Calculate cart subtotal (before tax and shipping)
export const getCartSubtotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const price = item.product.price || 0;
    return total + price * item.quantity;
  }, 0);
};


 // Calculate cart total with tax and shipping
export const getCartTotal = () => {
  const subtotal = getCartSubtotal();
  const tax = subtotal * APP_CONFIG.pricing.taxRate;

  // Free shipping if subtotal exceeds threshold
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
  return cart.some((item) => String(item.product.id) === String(productId));
};



 // Get specific cart item by product ID
export const getCartItem = (productId) => {
  const cart = getCart();
  return (
    cart.find((item) => String(item.product.id) === String(productId)) || null
  );
};
