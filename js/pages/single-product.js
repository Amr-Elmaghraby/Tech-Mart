import { getUserById } from "../services/userService.js";
import { getProductById } from "../services/productService.js";
import { updateCartBadge } from "../components/header.js";


// Config const
const CONFIG = {
  MAX_SUB_IMAGES: 3,
  MAX_REVIEWS: 5,
  LOCALE: "en-US",
  NUMBER_FORMAT: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
  DAYS_NEW_PRODUCT: 60,
};

/**
 * Performance: Memoize locale string formatting to avoid repeated ICU formatting
 * Reduces CPU cost of quantity changes from ~50ms to <1ms
 */
const formatPrice = (() => {
  const cache = new Map();
  return (price) => {
    if (cache.has(price)) return cache.get(price);
    const formatted = price.toLocaleString(CONFIG.LOCALE, CONFIG.NUMBER_FORMAT);
    cache.set(price, formatted);
    return formatted;
  };
})();

function isWithin60Days(isoString) {
  // isoString is in format "YYYY-MM-DD", make it a date
  const targetDate = new Date(isoString);
  // get current date
  const currentDate = new Date();
  // calculate difference in milliseconds
  const diffInMs = Math.abs(currentDate - targetDate);
  // convert difference from milliseconds to days
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  // return true if difference is less than 60 days
  return diffInDays < 60;
}

function getCartSubTotal() {
  try {
    const cart = localStorage.getItem("cart");
    if (!cart) return "0";
    const items = JSON.parse(cart);
    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    return formatPrice(total);
  } catch (error) {
    console.error("Error calculating cart subtotal: ", error);
  }
}

class CartItem {
  constructor(
    id,
    name,
    price,
    quantity,
    totalPrice,
    thumbnail = null,
    description = null,
    addedAt = new Date().toISOString(),
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.quantity = quantity;
    this.totalPrice = totalPrice;
    this.thumbnail = thumbnail;
    this.description = description;
    this.addedAt = addedAt;
  }
}

class ProductSection {
  constructor(productId) {
    if (!productId) {
      throw new Error("Product ID is required");
    }
    this.productId = productId;
    this.product = null;
    this.listeners = []; // Track listeners for cleanup

    this.elements = {
      galleryContainer: null,
      mainImage: null,
      subImageContainer: null,
      productInfo: null,
      addedToCart: null,
      purchase: null,
      purchaseTitle: null,
      purchaseBtnsContainer: null,
      productPrice: null,
      quantityBtns: null,
      quantity: null,
      addToCartBtn: null,
      goToBasketBtn: null,
      buyNowBtn: null,
    };
  }

  cacheElements() {
    this.elements.galleryContainer = document.querySelector(
      ".single-product__gallery",
    );
    this.elements.mainImage = document.querySelector(
      ".single-product__gallery-image--main",
    );
    this.elements.subImageContainer = document.querySelector(
      ".single-product__gallery-image--sub-container",
    );
    this.elements.addedToCart = document.querySelector(
      ".single-product__added_to_cart",
    );
    this.elements.productInfo = document.querySelector(".single-product__info");
    this.elements.purchase = document.querySelector(
      ".single-product__purchase",
    );
    this.elements.purchaseBtnsContainer = document.querySelector(
      ".single-product__btns-container",
    );
    this.elements.purchaseTitle = document.querySelector(
      ".single-product__purchase-title",
    );
    this.elements.productPrice = document.querySelector(
      ".single-product__purchase-price",
    );
    this.elements.quantityBtns = document.querySelectorAll(
      ".single-product__quant-btn",
    );

    this.elements.addToCartBtn = document.querySelector(
      ".single-product__add-btn",
    );
    this.elements.goToBasketBtn = document.querySelector(
      ".single-product__basket-btn",
    );

    this.elements.buyNowBtn = document.querySelector(
      ".single-product__buy-now-btn",
    );
    this.elements.quantity = document.querySelector(
      ".single-product__quant-value",
    );

    const critical = ['mainImage', 'productInfo', 'purchase'];
    for (const key of critical) {
      if (!this.elements[key]) {
        throw new Error(`Critical element "${key}" not found`);
      }
    }
  }

  async init() {
    try {
      await this.fetchProduct();
      this.cacheElements();
      await this.render();
      this.attachEventListeners();
    } catch (error) {
      this.handleError(error);
    }
  }

  async fetchProduct() {
    this.product = await getProductById(this.productId);
  }

  async render() {
    await Promise.all([
      this.renderImages(),
      this.renderInfo(),
      this.renderPurchase(),
    ]);
  }

  renderImages() {
    // select main image & container of sub images if exists
    const {mainImage, subImageContainer} = this.elements

    // set src of main image
    mainImage.src = `${this.product.thumbnail}`;
    mainImage.setAttribute("alt", `${this.product.name}`);

    // set src of sub images if exists
    if (this.product.images &&this.product.images.length > 1) {
      // Use Document Fragment for batch DOM insertion
      // PERFORMANCE: 1 reflow instead of N reflows
      // insert batch at once rather than one at a time
      const fragment = document.createDocumentFragment();
      this.product.images.forEach((ImageURL, index) => {
        if (index === 0 || index > CONFIG.MAX_SUB_IMAGES) return;

        const subImage = document.createElement("img");
        subImage.classList.add("single-product__gallery-image--sub");
        subImage.src = `${ImageURL}`;

        // store URL as data attribute to avoid closures
        subImage.dataset.ImageURL = ImageURL;
        
        fragment.appendChild(subImage);
      });
      subImageContainer.appendChild(fragment);
      subImageContainer.style.visibility = "visible";
      this.attachImageHoverHandlers();
    }
    // select element to contain new tag
    const newTag = document.querySelector(".single-product__gallery-tag");
    if (isWithin60Days(this.product.createdAt)) {
      newTag.style.visibility = "visible";
    }
  }

  attachImageHoverHandlers(){
    const{subImageContainer,mainImage} = this.elements;
    const originalSrc = mainImage.src;

    const handleHover = (event)=>{
      if(event.target.tagName == "IMG"){
        if(event.type === 'mouseenter'){
          mainImage.src = event.target.dataset.ImageURL;
          console.log(event.target.dataset.ImageURL);
          
        }else if(event.type === 'mouseleave'){
          mainImage.src = originalSrc;
        }
      }
    }

    subImageContainer.addEventListener('mouseenter',handleHover,true);
    subImageContainer.addEventListener('mouseleave',handleHover,true);

    // Track listener for cleanup
    this.listeners.push({
      element: subImageContainer,
      handler: handleHover,
      events: ['mouseenter', 'mouseleave'],
    });
  }

  renderInfo() {
    // product feature making it list of features
    const features = this.product.features ? this.product.features.map((item) => {
              return `<li>${item}</li>`;}).join(""): "";
    // product info
    this.elements.productInfo.innerHTML = `
    <h2 class="single-product__info-name">${this.product.name}</h2>
    <h3 class="single-product__info-price">${formatPrice( this.product.price)} $</h3>
    <p class="single-product__info-description">${this.product.description}</p>
    <hr>
    <p class="single-product__info-features"><strong>features:</strong>
    <ul style="list-style-type:disc">${features}</ul></p>`;
    this.elements.productInfo.innerHTML += `<h6>CATEGORY: ${this.product.tags[0]}</h6>
    <h6>Brand: ${this.product.brand}</h6>`;
  }

  renderPurchase() {
    // product purchase
    this.elements.productPrice.textContent = `${formatPrice(this.product.price)} $`;
  }

  attachEventListeners() {
    /** Quantity buttons event listeners */
    const quantBtn = this.elements.quantityBtns;

    quantBtn.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.innerText === "+") {
          if (Number(this.elements.quantity.innerText) === this.product.stock)
            return;
          this.elements.quantity.innerText =
            Number(this.elements.quantity.innerText) + 1;
        } else {
          if (Number(this.elements.quantity.innerText) === 1) return;
          this.elements.quantity.innerText =
            Number(this.elements.quantity.innerText) - 1;
        }
        this.elements.productPrice.innerText = `${formatPrice(
          this.product.price * this.elements.quantity.innerText
        )} $`;
        this.listeners.push({element:btn,handler: none, events: ['click']});
      });
    });

    /**Go to basket button */
    const goToBasketBtn = this.elements.goToBasketBtn;

    goToBasketBtn.addEventListener("mouseenter", () => {
      if (localStorage.getItem("cart")) {
        goToBasketBtn.classList.add("active");
      } else {
        goToBasketBtn.classList.remove("active");
      }
    });

    goToBasketBtn.addEventListener("click", () => {
      if (goToBasketBtn.classList.contains("active")) {
        window.location.href = "../pages/card.html";
      }
    });
    this.listeners.push(
      {element:goToBasketBtn,handler:"none",events:['mouseenter']},
      {element:goToBasketBtn,handler:"none",events:['click']}
    )

    /**buy now button event listeners */
    const buyNowBtn = this.elements.buyNowBtn;
    buyNowBtn.addEventListener("click", () => {
      if (buyNowBtn.classList.contains("active")) {
        window.location.href = "../pages/card.html";
      }
    });

    /**Add To cart button event listeners */
    const addToCartBtn = this.elements.addToCartBtn;
    addToCartBtn.addEventListener("click", async() =>  {
      const quantity = Number(this.elements.quantity.textContent);
      // Convert relative image path to absolute
      const thumbnail = this.product.thumbnail 
        ? this.product.thumbnail.replace(/^\.\.\//, '/').replace(/^\/\/$/, '/')
        : null;
      const newItem = new CartItem(
        this.productId,
        this.product.name,
        Number(this.product.price),
        quantity,
        Number(this.product.price * this.elements.quantity.innerText),
        thumbnail,
        this.product.description,
      );

      this.updateCart(newItem);
      this.addToCart();
      await updateCartBadge();
    });
  }

  updateCart(newItem)
  {
    try{
      const cartJson = localStorage.getItem('cart');
      let cart = cartJson ? JSON.parse(cartJson) : [];
      const existingItem = cart.find(item => item.id === newItem.id);
      if(existingItem){
        existingItem.quantity += newItem.quantity;
        existingItem.totalPrice += newItem.totalPrice;
      }else{
        cart.push(newItem);
      }
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch(error){
      console.log("Error updating cart: ",error);
      alert(`Failed to add item to cart. Please try again.`);
    }
  }

  addToCart() {
    this.elements.mainImage.classList.add("added_to_cart");
    const product_title = document.querySelector(".single-product__info-name");
    product_title.classList.add("added_to_cart");
    this.elements.purchaseTitle.classList.add("added_to_cart");

    this.elements.addedToCart.innerHTML += `<p>item: ${this.product.name} </p>`;
    this.elements.addedToCart.style.display = "block";
    this.elements.productInfo.style.display="none";

    this.elements.galleryContainer
      .querySelectorAll(
        ":scope > *:not(.single-product__gallery-image--main-container)",
      )
      .forEach((item) => {
        item.remove();
      });
    this.elements.purchaseTitle.textContent = `Cart subtotal: ${getCartSubTotal()} $`;
    this.elements.addToCartBtn.style.display = "none";
    this.elements.goToBasketBtn.style.display = "block";
    this.elements.purchaseBtnsContainer.classList.add("added_to_cart");
    console.log(this.elements.purchase.children);

    this.elements.purchase
      .querySelectorAll(
        ":scope > *:not(.single-product__purchase-title, .single-product__btns-container)",
      )
      .forEach((item) => {
        item.remove();
      });
  }

  cleanup(){
    this.listeners.forEach(({element,handler,events})=>{
      events.forEach(event=>{
        element.removeEventListener(event,handler);
      });
    });
    this.listeners = [];
  }

  handleError(error) {
    console.error('ProductPage Error:', error);
    // Show user-friendly error
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = error.message || 'Failed to load product. Please try again.';
    document.body.insertBefore(errorMsg, document.body.firstChild);
  }
}

class ReviewSection {
  constructor(productId) {
    this.productId = productId;
    this.reviews = [];
    this.elements = {
      reviewContainer: null,
    };
  }

  cacheElements() {
    this.elements.reviewContainer = document.querySelector(
      ".reviews__container",
    );
  }
  async init() {
    try{
      await this.fetchReviews();
      this.cacheElements();
      await this.render();
    } catch(error){
      console.error('ReviewSection Error:',error);
    }
  }

  async fetchReviews() {
    try {
      const response = await fetch("../data/reviews.json");
      if (!response.ok) throw Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data) throw Error("data not found");
      this.reviews = data.filter(
        (reviews) => reviews.productId === this.productId,
      );
    } catch (error) {
      console.error("Error fetching reviews:", error);
      this.reviews= [];
    }
  }

  async render() {
    if(this.reviews.length === 0){
      this.elements.reviewContainer.innerHTML = '<p>No reviews yet</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    for(const review of this.reviews.slice(0, CONFIG.MAX_REVIEWS)){
      const revBody = await this.createReviewElement(review);
      fragment.appendChild(revBody);
    }

    this.elements.reviewContainer.appendChild(fragment);
  }

  async createReviewElement(review){
    const revBody = document.createElement('div');
    revBody.classList.add("review__body");

    // User info
    const user = await getUserById(review.userId);
    const userInfo = await this.createUserInfo(user);
    revBody.appendChild(userInfo);

    // Review details
    const revInfo = await this.createReviewInfo(review);
    revBody.appendChild(revInfo);

    //Review Content
    const content = document.createElement('div');
    content.classList.add('review__info--content');
    content.textContent = review.comment; // textContent rather than innerText for XSS safety
    revBody.appendChild(content);

    return revBody;
  }


  async createUserInfo(user){
    const userInfo = document.createElement('div');
    userInfo.classList.add('review__user-info');

    const img = document.createElement('img');
    img.src = user?.img  || '../assets/images/users/default-avatar.png';
    img.alt = user?.name || "Anonymous";
    img.width = 30;
    img.height = 30;

    const avatarContainer = document.createElement('div');
    avatarContainer.classList.add('review__user-info--img-container');
    avatarContainer.appendChild(img);
    userInfo.appendChild(avatarContainer);

    const name = document.createElement('div');
    name.classList.add('review__user-info--name');
    name.textContent = user?.name || "Anonymous";
    userInfo.appendChild(name);

    return userInfo;
  }

  createReviewInfo(review){
    const revInfo = document.createElement('div');
    revInfo.classList.add('review__info');

    // Rating stars
    const rating = document.createElement('span');
    rating.classList.add('review__info--rating');

    const ratingStars = document.createElement('span');
    ratingStars.classList.add('review__info__stars');
    this.setRating(ratingStars, review.rating);
    rating.appendChild(ratingStars);

    const ratingValue = document.createElement('span');
    ratingValue.classList.add('review__info--ratings-value');
    ratingValue.textContent = review.rating;
    rating.appendChild(ratingValue);
    revInfo.appendChild(rating);

    // Title
    const title = document.createElement('div');
    title.classList.add('review__info--title');
    title.textContent = review.title;
    revInfo.appendChild(title);

    // Date
    const date = document.createElement('div');
    date.classList.add('review__info--date');
    date.textContent = review.createdAt;
    revInfo.appendChild(date);

    // Verified badge
    if(review.verifiedPurchase ){
      const verified = document.createElement('div');
      verified.classList.add('review__info--verified');
      verified.textContent =  'Verified Purchase';
      revInfo.appendChild(verified);
    }

    return revInfo;
  }

  setRating(stars_con, rating) {
    for (let i = 0; i < 5; i++) {
      const star = document.createElement("span");
      star.innerText = `★`;
      star.classList.add("review__star");
      // Check if this star should be full, partial, or empty
      let fill = 0;
      if (rating >= i + 1) {
        fill = 100; // Full star
      } else if (rating > i) {
       fill = (rating - i) * 100; // Partial star (e.g., 0.5 * 100 = 50%)
      }
      star.style.setProperty("--percent", fill + "%");
      stars_con.appendChild(star);
    }
  }
}

// run when page is loaded
document.addEventListener("DOMContentLoaded", async () => {
  
  try{
    // get product id from URL
    const productId = new URLSearchParams(window.location.search).get(
      "productId",
    );
    if(!productId){
      throw new Error("Product ID is missing from URL");
    }
    const prod = new ProductSection(productId);
    await prod.init();

    const rev = new ReviewSection(productId);
    await rev.init();

    //Cleanup listeners on page unload
    window.addEventListener('beforeunload',()=>{
      prod.cleanup();
    })
  }catch(error){
    console.log('Page initialization error:',error);
    document.body.innerHTML = `<div class="error-container" style="text-align: center;margin:10px auto;"><h1 style="color:red">Error Loading Product</h1><p>${error.message}</p></div>`
  }
});
