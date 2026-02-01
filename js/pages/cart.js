/* ============================================
   CART PAGE - FIXED VERSION
   
   This version works with your ACTUAL cart structure:
   {
     id: "prod-025",
     name: "Product Name",
     price: 349.99,
     quantity: 2,
     totalPrice: 699.98
   }
   ============================================ */

// Import existing services
import * as cartService from '../services/cartService.js';
import { getProductById } from '../services/productService.js';
import * as userService from '../services/userService.js';
import { formatPrice } from '../core/utils.js';
import { updateCartBadge } from '../components/header.js';

/* ============================================
   CART PAGE CLASS
   Manages the cart page UI and interactions
   ============================================ */
class CartPage {
  constructor() {
    this.cart = [];
    this.discountPercent = 0;
    
    // DOM Elements (will be cached after init)
    this.elements = {
      emptyCartMessage: null,
      cartItemsList: null,
      orderSummary: null,
      continueShoppingSection: null,
      subtotalAmount: null,
      shippingAmount: null,
      taxAmount: null,
      totalAmount: null,
      totalItemsCount: null,
      promoCodeInput: null,
      promoMessage: null,
      applyPromoBtn: null,
      checkoutBtn: null,
      notificationToast: null
    };
  }

  /* ============================================
     STEP 1: INITIALIZE
     Load partials, cache elements, load cart
     ============================================ */
  async init() {
    try {
      // Cache DOM elements FIRST (before trying to use them)
      this.cacheElements();
      
      // Load header and footer partials (optional - won't break if they fail)
      await this.loadPartials();
      
      // Load cart from localStorage
      this.loadCart();
      
      // Render the cart
      await this.renderCart();
      
      // Attach event listeners
      this.attachEventListeners();
      
      // Update header cart badge (only if header exists)
      try {
        await updateCartBadge();
      } catch (error) {
        console.log('Header badge update skipped (header not loaded)');
      }
      
      console.log('✓ Cart page initialized successfully');
    } catch (error) {
      console.error('❌ Cart initialization error:', error);
      // Only show notification if the element exists
      if (this.elements.notificationToast) {
        this.showNotification('Failed to load cart', 'error');
      }
    }
  }

  /* ============================================
     STEP 2: LOAD HEADER & FOOTER PARTIALS
     ============================================ */
  async loadPartials() {
    try {
      await Promise.all([
        loadPartial('header', 'partials/header.html'),
        loadPartial('footer', 'partials/footer.html')
      ]);
    } catch (error) {
      console.log('Partials not loaded (this is OK, continuing without them)');
      // Continue even if partials fail - not critical
    }
  }

  /* ============================================
     STEP 3: CACHE DOM ELEMENTS
     Store references to avoid repeated queries
     ============================================ */
  cacheElements() {
    this.elements.emptyCartMessage = document.getElementById('emptyCartMessage');
    this.elements.cartItemsList = document.getElementById('cartItemsList');
    this.elements.orderSummary = document.getElementById('orderSummary');
    this.elements.continueShoppingSection = document.getElementById('continueShoppingSection');
    this.elements.subtotalAmount = document.getElementById('subtotalAmount');
    this.elements.shippingAmount = document.getElementById('shippingAmount');
    this.elements.taxAmount = document.getElementById('taxAmount');
    this.elements.totalAmount = document.getElementById('totalAmount');
    this.elements.totalItemsCount = document.getElementById('totalItemsCount');
    this.elements.promoCodeInput = document.getElementById('promoCodeInput');
    this.elements.promoMessage = document.getElementById('promoMessage');
    this.elements.applyPromoBtn = document.getElementById('applyPromoBtn');
    this.elements.checkoutBtn = document.getElementById('checkoutBtn');
    this.elements.notificationToast = document.getElementById('notificationToast');
  }

  /* ============================================
     STEP 4: LOAD CART FROM LOCALSTORAGE
     Uses YOUR cartService.getCart()
     ============================================ */
  loadCart() {
    this.cart = cartService.getCart();
    console.log('Cart loaded:', this.cart);
  }

  /* ============================================
     STEP 5: RENDER CART
     Display cart items or empty state
     ============================================ */
  async renderCart() {
    if (!this.elements.cartItemsList) {
      console.error('Cart elements not found in DOM');
      return;
    }
    
    if (this.cart.length === 0) {
      this.showEmptyCart();
    } else {
      await this.showCartItems();
    }
    
    this.updateOrderSummary();
  }

  /* ============================================
     SHOW EMPTY CART STATE
     ============================================ */
  showEmptyCart() {
    if (this.elements.emptyCartMessage) {
      this.elements.emptyCartMessage.classList.remove('hidden');
    }
    if (this.elements.cartItemsList) {
      this.elements.cartItemsList.classList.remove('visible');
    }
    if (this.elements.orderSummary) {
      this.elements.orderSummary.classList.remove('visible');
    }
    if (this.elements.continueShoppingSection) {
      this.elements.continueShoppingSection.classList.remove('visible');
    }
    if (this.elements.totalItemsCount) {
      this.elements.totalItemsCount.textContent = '0';
    }
  }

  /* ============================================
     SHOW CART ITEMS
     ============================================ */
  async showCartItems() {
    // Hide empty message
    if (this.elements.emptyCartMessage) {
      this.elements.emptyCartMessage.classList.add('hidden');
    }
    
    // Show cart sections
    if (this.elements.cartItemsList) {
      this.elements.cartItemsList.classList.add('visible');
    }
    if (this.elements.orderSummary) {
      this.elements.orderSummary.classList.add('visible');
    }
    if (this.elements.continueShoppingSection) {
      this.elements.continueShoppingSection.classList.add('visible');
    }
    
    // Generate HTML for all items
    const itemsHTML = this.cart.map((cartItem, index) => 
      this.createCartItemHTML(cartItem, index)
    );
    
    // Insert into DOM
    this.elements.cartItemsList.innerHTML = itemsHTML.join('');
    
    // Update total items count
    const totalItems = cartService.getCartItemCount();
    if (this.elements.totalItemsCount) {
      this.elements.totalItemsCount.textContent = totalItems;
    }
  }

  /* ============================================
     CREATE HTML FOR SINGLE CART ITEM
     
     FIXED: Works with YOUR actual cart structure:
     {
       id: "prod-025",
       name: "Samsung Galaxy S22",
       price: 349.99,
       quantity: 2,
       image: "path/to/image.jpg",
       description: "..."
     }
     ============================================ */
  createCartItemHTML(cartItem, index) {
    // YOUR cart items ARE the products - no nested product object
    const quantity = cartItem.quantity || 1;
    const itemTotal = cartItem.price * quantity;
    
    return `
      <div class="cart-item" data-cart-id="${cartItem.id}">
        <!-- Product Image -->
        <div class="cart-item-image">
          <img 
            src="${cartItem.thumbnail || cartItem.image || '/assets/images/logo/logo.svg'}" 
            alt="${cartItem.name}"
            onerror="this.src='/assets/images/logo/logo.svg'"
          />
        </div>
        
        <!-- Product Details -->
        <div class="cart-item-details">
          <h3>${cartItem.name}</h3>
          <p>${cartItem.description || ''}</p>
          <div class="cart-item-price">${formatPrice(cartItem.price)}</div>
          
          <!-- Quantity Controls -->
          <div class="quantity-controls">
            <button 
              class="btn-quantity-decrease" 
              data-cart-id="${cartItem.id}"
              ${quantity <= 1 ? 'disabled' : ''}
            >
            
            </button>
            <span class="quantity-value">${quantity}</span>
            <button 
              class="btn-quantity-increase" 
              data-cart-id="${cartItem.id}"
            >
              +
            </button>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="cart-item-actions">
          <div class="item-total">${formatPrice(itemTotal)}</div>
          <button class="btn-remove" data-cart-id="${cartItem.id}">
            Remove
          </button>
        </div>
      </div>
    `;
  }

  /* ============================================
     UPDATE ORDER SUMMARY
     Uses YOUR cartService.getCartTotal()
     ============================================ */
  updateOrderSummary() {
    if (!this.elements.subtotalAmount) return;
    
    // Get totals from YOUR cartService
    const totals = cartService.getCartTotal();
    
    // Apply discount if promo code was used
    let finalTotal = totals.total;
    if (this.discountPercent > 0) {
      const discount = totals.subtotal * (this.discountPercent / 100);
      finalTotal = totals.total - discount;
    }
    
    // Update DOM
    this.elements.subtotalAmount.textContent = formatPrice(totals.subtotal);
    this.elements.shippingAmount.textContent = totals.shipping === 0 ? 'FREE' : formatPrice(totals.shipping);
    this.elements.taxAmount.textContent = formatPrice(totals.tax);
    this.elements.totalAmount.textContent = formatPrice(finalTotal);
    
    // Show free shipping message if eligible
    if (totals.freeShippingEligible && this.elements.notificationToast) {
      this.showNotification('🎉 You qualify for free shipping!', 'success');
    }
  }

  /* ============================================
     ATTACH EVENT LISTENERS
     ============================================ */
  attachEventListeners() {
    if (!this.elements.cartItemsList) return;
    
    // Use event delegation for cart items (more efficient)
    this.elements.cartItemsList.addEventListener('click', (e) => {
      const cartId = e.target.dataset.cartId;
      if (!cartId) return;
      
      if (e.target.classList.contains('btn-quantity-increase')) {
        this.handleQuantityIncrease(cartId);
      } else if (e.target.classList.contains('btn-quantity-decrease')) {
        this.handleQuantityDecrease(cartId);
      } else if (e.target.classList.contains('btn-remove')) {
        this.handleRemoveItem(cartId);
      }
    });
    
    // Promo code button
    if (this.elements.applyPromoBtn) {
      this.elements.applyPromoBtn.addEventListener('click', () => {
        this.handleApplyPromo();
      });
    }
    
    // Checkout button
    if (this.elements.checkoutBtn) {
      this.elements.checkoutBtn.addEventListener('click', () => {
        this.handleCheckout();
      });
    }
    
    // Enter key on promo input
    if (this.elements.promoCodeInput) {
      this.elements.promoCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleApplyPromo();
        }
      });
    }
  }

  /* ============================================
     HANDLE QUANTITY INCREASE
     ============================================ */
  async handleQuantityIncrease(cartId) {
    const cartItem = this.cart.find(item => item.id === cartId);
    if (!cartItem) return;
    
    const newQuantity = cartItem.quantity + 1;
    
    const success = cartService.updateQuantity(cartId, newQuantity);
    
    if (success) {
      this.loadCart();
      await this.renderCart();
      try {
        await updateCartBadge();
      } catch (e) {
        // Header might not exist
      }
      this.showNotification('Quantity updated', 'success');
    }
  }

  /* ============================================
     HANDLE QUANTITY DECREASE
     ============================================ */
  async handleQuantityDecrease(cartId) {
    const cartItem = this.cart.find(item => item.id === cartId);
    if (!cartItem || cartItem.quantity <= 1) return;
    
    const newQuantity = cartItem.quantity - 1;
    
    const success = cartService.updateQuantity(cartId, newQuantity);
    
    if (success) {
      this.loadCart();
      await this.renderCart();
      try {
        await updateCartBadge();
      } catch (e) {
        // Header might not exist
      }
      this.showNotification('Quantity updated', 'success');
    }
  }

  /* ============================================
     HANDLE REMOVE ITEM
     ============================================ */
  async handleRemoveItem(cartId) {
    const cartItem = this.cart.find(item => item.id === cartId);
    if (!cartItem) return;
    
    const productName = cartItem.name; // FIXED: cartItem.name not cartItem.product.name
    
    const success = cartService.removeFromCart(cartId);
    
    if (success) {
      this.loadCart();
      await this.renderCart();
      try {
        await updateCartBadge();
      } catch (e) {
        // Header might not exist
      }
      this.showNotification(`${productName} removed from cart`, 'success');
    }
  }

  /* ============================================
     HANDLE APPLY PROMO CODE
     ============================================ */
  handleApplyPromo() {
    const code = this.elements.promoCodeInput?.value.trim();
    
    if (!code) {
      this.showPromoMessage('Please enter a promo code', 'error');
      return;
    }
    
    // Validate using YOUR cartService
    const discount = cartService.validatePromoCode(code);
    
    if (discount) {
      this.discountPercent = discount;
      this.updateOrderSummary();
      this.showPromoMessage(`✓ ${discount}% discount applied!`, 'success');
      this.showNotification(`Promo code applied: ${discount}% off`, 'success');
    } else {
      this.showPromoMessage('✗ Invalid promo code', 'error');
    }
  }

  /* ============================================
     SHOW PROMO MESSAGE
     ============================================ */
  showPromoMessage(message, type) {
    if (!this.elements.promoMessage) return;
    
    this.elements.promoMessage.textContent = message;
    this.elements.promoMessage.className = `promo-message ${type}`;
  }

  /* ============================================
     HANDLE CHECKOUT
     ============================================ */
  handleCheckout() {
    if (this.cart.length === 0) {
      this.showNotification('Your cart is empty', 'error');
      return;
    }
    // Require user to be logged in before proceeding
    if (!userService.isAuthenticated()) {
      this.showNotification('Please login to proceed to checkout', 'error');
      setTimeout(() => {
        window.location.href = '../pages/login.html';
      }, 1000);
      return;
    }

    this.showNotification('Proceeding to checkout...', 'success');
    setTimeout(() => {
      window.location.href = '../pages/checkout.html';
    }, 1000);
  }

  /* ============================================
     SHOW NOTIFICATION TOAST
     ============================================ */
  showNotification(message, type = 'success') {
    if (!this.elements.notificationToast) {
      console.log(`Notification: ${message}`);
      return;
    }
    
    const toast = this.elements.notificationToast;
    toast.textContent = message;
    toast.className = `notification-toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

/* ============================================
   INITIALIZE WHEN DOM IS READY
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const cartPage = new CartPage();
  await cartPage.init();
});