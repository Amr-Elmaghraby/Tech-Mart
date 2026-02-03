import { getUserById } from "../services/userService.js";
import { updateCartBadge } from "../components/header.js";
import { getProductsBySubcategory,getProductById } from "../services/productService.js";
import { formatPrice } from "../core/utils.js";


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
// const formatPrice = (() => {
//   const cache = new Map();
//   return (price) => {
//     if (cache.has(price)) return cache.get(price);
//     const formatted = price.toLocaleString(CONFIG.LOCALE, CONFIG.NUMBER_FORMAT);
//     cache.set(price, formatted);
//     return formatted;
//   };
// })();

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

function updateBuyNow(itemsToMerge){  
  localStorage.setItem('buyNow', JSON.stringify(itemsToMerge));
  // redirect to checkout
  const url = new URL('../pages/checkout.html', window.location.origin);
  url.searchParams.set('buyNow', 'true');
  window.location.href = url.href;
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
      quantityBtnsContainer: null,
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
    this.elements.quantityBtnsContainer = document.querySelector(
      ".single-product__quant-btn--container",
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
    const { subImageContainer, mainImage } = this.elements;
    if (!subImageContainer) return;

    const originalSrc = mainImage.src;

    // Helpers to detect hover-capable devices
    const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // mouse hover behavior (desktop)
    const handleMouseEnter = (event) => {
      if (event.target && event.target.tagName === 'IMG') {
        mainImage.src = event.target.dataset.ImageURL || event.target.src;
      }
    };
    const handleMouseLeave = (event) => {
      mainImage.src = originalSrc;
    };

    // touch/click behavior (mobile) - tap sub image to set main image
    const handleClick = (event) => {
      const img = event.target.closest('img');
      if (!img) return;
      mainImage.src = img.dataset.ImageURL || img.src;
    };

    // Resize handler to rebind appropriate handlers when viewport changes
    const resizeHandler = () => {
      // remove previously attached listeners (if any)
      subImageContainer.removeEventListener('mouseenter', handleMouseEnter, true);
      subImageContainer.removeEventListener('mouseleave', handleMouseLeave, true);
      subImageContainer.removeEventListener('click', handleClick, true);

      if (canHover()) {
        subImageContainer.addEventListener('mouseenter', handleMouseEnter, true);
        subImageContainer.addEventListener('mouseleave', handleMouseLeave, true);
      } else {
        subImageContainer.addEventListener('click', handleClick, true);
      }
    };

    // Initial bind
    resizeHandler();

    // Track listeners for cleanup
    this.listeners.push({ element: subImageContainer, handler: handleMouseEnter, events: ['mouseenter'] });
    this.listeners.push({ element: subImageContainer, handler: handleMouseLeave, events: ['mouseleave'] });
    this.listeners.push({ element: subImageContainer, handler: handleClick, events: ['click'] });

    // Track resize so we can rebind on orientation/viewport changes
    window.addEventListener('resize', resizeHandler);
    this.listeners.push({ element: window, handler: resizeHandler, events: ['resize'] });
  }

  renderInfo() {
    // product feature making it list of features
    const features = this.product.features ? this.product.features.map((item) => {
              return `<li>${item}</li>`;}).join(""): "";
    // product info
    this.elements.productInfo.innerHTML = `
    <h2 class="single-product__info-name">${this.product.name}</h2>
    <h3 class="single-product__info-price">
    ${this.product.discount !==0 ? 
      ` 
      <span class="price_after_discount">(${formatPrice(this.product.price)}) </span>
      <span class="price_before_discount">${formatPrice(this.product.originalPrice)}</span>
      <span class="price_discount"> (${this.product.discount}%) OFF</span>
      ` : `${formatPrice(this.product.price)}`}
    </h3>
    <p class="single-product__info-description">${this.product.description}</p>
    <hr>
    <p class="single-product__info-features"><strong>features:</strong>
    <ul style="list-style-type:disc">${features}</ul></p>`;
    this.elements.productInfo.innerHTML += `<h6>CATEGORY: ${this.product.tags[0]}</h6>
    <h6>Brand: ${this.product.brand}</h6>`;
  }

  renderPurchase() {
    // product purchase
    this.elements.productPrice.textContent = `${formatPrice(this.product.price)}`;
  }

  attachEventListeners() {
    /** Quantity buttons event listeners */  
    this.elements.quantityBtnsContainer.addEventListener("click",(e)=>{
      const btn = e.target.closest(".single-product__quant-btn");
      if(!btn)return;
      const isPlus = btn.innerText === "+";
      let currentQty = Number(this.elements.quantity.innerText);

      if(isPlus && currentQty < this.product.stock){
        currentQty ++;
      }else if (!isPlus && currentQty > 1)
      {
        currentQty --;
      }
      this.elements.quantity.innerText = currentQty;
      this.elements.productPrice.innerText = formatPrice(this.product.price * currentQty);
    })

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
        window.location.href = "/../../pages/cart.html";
      }
    });
    this.listeners.push(
      {element:goToBasketBtn,handler:"none",events:['mouseenter']},
      {element:goToBasketBtn,handler:"none",events:['click']}
    )

    /**buy now button event listeners */
    const buyNowBtn = this.elements.buyNowBtn;
    buyNowBtn.addEventListener("click", () => {
      if(localStorage.getItem("current_user")){        
        const item = new CartItem(
          this.productId,
          this.product.name,
          Number(this.product.price),
          1,
          Number(this.product.price),
          this.product.thumbnail,
          this.product.description
        )
        updateBuyNow(item);
      }else{
        window.location.href = "/../../pages/login.html";
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
    this.elements.productInfo.remove();

    this.elements.galleryContainer
      .querySelectorAll(
        ":scope > *:not(.single-product__gallery-image--main-container)",
      )
      .forEach((item) => {
        item.remove();
      });
    this.elements.purchaseTitle.textContent = `Cart subtotal: ${getCartSubTotal()} $`;
    this.elements.addToCartBtn.remove();
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

class FrequencySection
{
  constructor(product){
    this.Items = [product];
    this.listeners = [];
    this.totalPrice = product.price;
    this.checked = 1;
    this.elements = {
      frequencyContainer: null,
      frequencyImgContainer: null,
      frequencyCheckBoxContainer: null,
      frequencyPurchaseContainer: null,
      frequencyPurchaseTotalPrice: null,
    };
  }


  async init()
  { 
    try{
      await this.cacheElements();
      await this.fetchSubProducts();
      await this.render();
    }catch(error){
      console.error('FrequencySection Error:',error);
    }
  }

  subCatFreqSuggestions()
  {
    const arrayOfSuggestions = ["subcat-010","subcat-016","subcat-017"];
    return arrayOfSuggestions[this.generateRandomNumber(0,arrayOfSuggestions.length-1)];
  }

  async cacheElements(){
    try{
      this.elements.frequencyContainer = document.getElementById('.single-product__frequency-container');
      this.elements.frequencyImgContainer = document.querySelector('.single-product__freq-items-imgs--container');
      this.elements.frequencyCheckBoxContainer = document.querySelector('.single-product__freq-items-checkbox--container');
      this.elements.frequencyPurchaseContainer = document.querySelector('.single-product__freq-purchase');      
      this.elements.frequencyPurchaseTotalPrice = this.elements.frequencyPurchaseContainer.querySelector('.single-product__purchase-price');
      // Purchase buttons & containers inside the frequency purchase area
      this.elements.frequencyPurchaseBtnsContainer = this.elements.frequencyPurchaseContainer.querySelector('.single-product__btns-container');
      this.elements.frequencyAddBtn = this.elements.frequencyPurchaseContainer.querySelector('.single-product__add-btn');
      this.elements.frequencyGoToBasketBtn = this.elements.frequencyPurchaseContainer.querySelector('.single-product__basket-btn');
      this.elements.frequencyBuyNowBtn = this.elements.frequencyPurchaseContainer.querySelector('.single-product__buy-now-btn');
            
    }catch(error){
      console.error('FrequencySection Error:',error);
    }
  }

  async fetchSubProducts(){
    try{
      let productBySub_1 = await getProductsBySubcategory(this.subCatFreqSuggestions());
      this.Items.push(productBySub_1[this.generateRandomNumber(0,productBySub_1.length-1)]);
      let productBySub_2 = await getProductsBySubcategory(this.subCatFreqSuggestions());
      this.Items.push(productBySub_2[this.generateRandomNumber(0,productBySub_2.length-1)]);
    }catch(error){
      console.error('FrequencySection Error:',error);
    }
  }

  generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  async render(){
    try
    {
      await Promise.all([
        this.renderItems(),
        this.renderCheckBox(),
        this.renderPurchase(),
      ])
    }catch(error){
      console.error('FrequencySection Error:',error);
    }
  }

  async renderItems(){
    try{
      const imgContainer = this.elements.frequencyImgContainer;
      const fragment = document.createDocumentFragment();
      console.log(this.Items);
      this.Items.forEach((item,index)=>
        {
          const img = document.createElement('img');
          img.src = item.thumbnail;
          img.alt = item.name;
          img.setAttribute('data-id',item.id);
          if(index != 0){
            img.classList.add('not_checked');
          }
          fragment.appendChild(img);
          if(index != this.Items.length - 1){
            const plus = document.createElement('span');
            plus.classList.add('single-product__freq-items-imgs-plus');
            plus.textContent = '+';
            fragment.appendChild(plus);
          }
        })  
      imgContainer.appendChild(fragment);
      
      // imgContainer.children[0].src = product.img;
    } catch(error){
      console.error('FrequencySection Error:',error);
    }
  }

  async renderCheckBox(){
    try{
      const checkboxContainer = this.elements.frequencyCheckBoxContainer;
      const fragment = document.createDocumentFragment();
      this.Items.forEach((item,index)=>
        {
          const label = document.createElement('label');
          const checkbox = document.createElement('input');
          const bold = document.createElement('b');
          bold.textContent = 'This item: ';
          checkbox.type = 'checkbox';
          checkbox.name = 'freq-item';
          checkbox.setAttribute('data-id',item.id);
          label.appendChild(checkbox);
          if(index != 0){
            checkbox.classList.add('not_checked');
          }else{
            checkbox.checked = true;
            label.appendChild(bold);
          }
          // Extract one specification from the object key, value pair
          const [specKey, specValue] = Object.entries(item.specifications)[0] || [0];
          const specText = specKey? `, ${specKey}: ${specValue}`: '';

          // Discount string
          const discountContainer = document.createElement('span');
          const discountHTML = `
          ${item.discount !==0 ? 
            ` 
            <span class="price_after_discount">(${formatPrice(item.price)}) </span> 
            <span class="price_before_discount">${formatPrice(item.originalPrice)}</span>
            <span class="price_discount"> (${item.discount}%) OFF</span>
            ` : `(${formatPrice(item.price)})`}
          `.trim();
          discountContainer.innerHTML = discountHTML;

          // Update Label
          label.appendChild(document.createTextNode(` ${item.name}${specText} `));
          label.appendChild(discountContainer);

          fragment.appendChild(label);
        })  
      checkboxContainer.appendChild(fragment);
      this.handleCheckboxListeners();
    } catch(error){
      console.error('FrequencySection Error:',error);
    }
  }

  async renderPurchase(){
    const purchaseContainer = this.elements.frequencyPurchaseContainer;
    const totalPrice = this.elements.frequencyPurchaseTotalPrice;
    totalPrice.textContent = formatPrice(this.totalPrice);
    this.attachPurchaseListeners();
  }

  updateTotalPrice(){
    this.totalPrice = 0;
    this.elements.frequencyCheckBoxContainer.querySelectorAll('input[type="checkbox"]:not(.not_checked)').forEach(input=>{      
      this.Items.forEach(item=>{
        if(input.dataset.id == item.id){
          this.totalPrice += item.price;
          }
        })       
      })
      
      this.elements.frequencyPurchaseTotalPrice.textContent = formatPrice(this.totalPrice);            
  }

  handleCheckboxListeners(){
    const checkBoxContainer = this.elements.frequencyCheckBoxContainer;

    const handleEvent = (event)=>{
      if(event.target.tagName == 'INPUT'){
        const img = this.elements.frequencyImgContainer.querySelector(`img[data-id="${event.target.dataset.id}"]`);
        if(event.target.checked){
          event.target.classList.remove('not_checked');
          event.target.checked = true;
          img.classList.remove('not_checked');
          this.checked++;
        }else{
          event.target.classList.add('not_checked');
          img.classList.add('not_checked');
          this.checked--;
        }
        this.updateTotalPrice();
        this.updateAddBtn();  
      }
    }
    checkBoxContainer.addEventListener('click',handleEvent,true);
    this.listeners.push({element:checkBoxContainer,handler:handleEvent,events:['click']});
  }  

  updateAddBtn(){
    if(this.checked === 0){
      this.elements.frequencyAddBtn.classList.add('disabled');
      this.elements.frequencyGoToBasketBtn.classList.add('disabled');
      this.elements.frequencyBuyNowBtn.classList.add('disabled');
    }else{
      this.elements.frequencyAddBtn.classList.remove('disabled');
      this.elements.frequencyGoToBasketBtn.classList.remove('disabled');
      this.elements.frequencyBuyNowBtn.classList.remove('disabled');
    }
  }
  attachPurchaseListeners(){
    try{
      const addBtn = this.elements.frequencyAddBtn;
      const goToBasketBtn = this.elements.frequencyGoToBasketBtn;
      const buyNowBtn = this.elements.frequencyBuyNowBtn;

      if(!addBtn) return;

      const handleAdd = async () => {
        // gather selected products from checkboxes
        const itemsToMerge =  this.updateItemsToMerge();
        this.updateCartFromFrequency(itemsToMerge);

        // UI transitions: remove unchecked items (both checkbox labels and images)
        try{
          const inputsAll = Array.from(this.elements.frequencyCheckBoxContainer.querySelectorAll('input[type="checkbox"]'));
          const imgsAll = Array.from(this.elements.frequencyImgContainer.children);
          console.log(this.elements.frequencyImgContainer.children);
          
          imgsAll.forEach((img,index,array)=>{
            if(index%2 !==0){return;}
              if(img.dataset.id === inputsAll[index/2].dataset.id && !inputsAll[index/2].checked){
                // to check + button before or after img to be removed from Live
                // DOM using ElementSibling not static array it self so accessing 
                // a ghost + button to remove that already was deleted before
                const buttonToRemove = img.previousElementSibling || img.nextElementSibling;
                img.remove();
                // insure chosen sibling is a button not an img with attribute data-id
                if(buttonToRemove && !buttonToRemove.hasAttribute('data-id'))
                  {
                    //document.startViewTransition(()=>{
                    buttonToRemove.remove();//});
                  }
              }else{
                img.classList.add("checked_remaining");
              }
          })
        }catch(e){/* ignore UI cleanup errors */}

        // update purchase UI
        try{
          const titleEl = this.elements.frequencyPurchaseContainer.querySelector('.single-product__purchase-title');
          titleEl.classList.add('added_to_cart');
          titleEl.textContent = `Cart subtotal: ${getCartSubTotal()} $`;
          addBtn.style.display = 'none';
          if(goToBasketBtn) goToBasketBtn.style.display = 'block';
          this.elements.frequencyPurchaseBtnsContainer?.classList.add('added_to_cart');
          this.elements.frequencyCheckBoxContainer.remove();
        }catch(e){}

        await updateCartBadge();
      };

      addBtn.addEventListener('click', handleAdd);
      this.listeners.push({element:addBtn, handler: handleAdd, events: ['click']});

      if(buyNowBtn){
        const handleBuy = async ()=>{
          // reuse add behavior to ensure items are in cart
          if(localStorage.getItem('current_user')){
          const itemsToMerge =  this.updateItemsToMerge();
          updateBuyNow(itemsToMerge);
          }else{
            window.location.href = '../pages/login.html';
          }
        };
        buyNowBtn.addEventListener('click', handleBuy);
        this.listeners.push({element:buyNowBtn, handler: handleBuy, events: ['click']});
      }

      if(goToBasketBtn){
        // handle clicking
        const handleGo = ()=>{
          if(goToBasketBtn.classList.contains('active') || goToBasketBtn.style.display === 'block'){
            window.location.href = '../pages/checkout.html';
          }
        };
        goToBasketBtn.addEventListener('click', handleGo);
        this.listeners.push({element:goToBasketBtn, handler: handleGo, events: ['click']});
        // handle hover
        const basketBtn = ()=>
        {
          if(localStorage.getItem('cart'))
            {
              goToBasketBtn.classList.add('active');
            }
        }
        goToBasketBtn.addEventListener('mouseenter', basketBtn);
        this.listeners.push({element:goToBasketBtn, handler: basketBtn, events: ['mouseenter']});
      }

    }catch(error){
      console.error('attachPurchaseListeners error:', error);
    }
  }

  updateItemsToMerge(){
    if(this.checked === 0) return;          
      const inputs = Array.from(this.elements.frequencyCheckBoxContainer.querySelectorAll('input[type="checkbox"]'));
      const checked = inputs.filter(i=>i.checked);
      const productsToAdd = [];
      checked.forEach((input)=>{
        const prodId = input.dataset.id;
        console.log(prodId);
        const prod = this.Items.find(p=>p.id === prodId);
        if(prod) productsToAdd.push(prod);
        });

      // create CartItem objects and merge into cart
      const itemsToMerge = productsToAdd.map(p=> new CartItem(
        p.id,
        p.name,
        Number(p.price),
        1,
        Number(p.price * 1),
        p.thumbnail,
        p.description
      ));
      return itemsToMerge;
  }

  updateCartFromFrequency(itemsArray){
    try{
      const cartJson = localStorage.getItem('cart');
      let cart = cartJson ? JSON.parse(cartJson) : [];
      itemsArray.forEach(newItem=>{
        const existing = cart.find(i=>i.id === newItem.id);
        if(existing){
          existing.quantity = (existing.quantity || 0) + (newItem.quantity || 1);
          existing.totalPrice = Number(existing.totalPrice || 0) + Number(newItem.totalPrice || (newItem.price * newItem.quantity));
        } else {
          cart.push(newItem);
        }
      });
      localStorage.setItem('cart', JSON.stringify(cart));
    }catch(error){
      console.error('Error updating cart from frequency:', error);
      alert('Failed to add items to cart. Please try again.');
    }
  }


  cleanup(){
    this.listeners.forEach(({element,handler,events})=>{
      events.forEach(event=>{
        element.removeEventListener(event,handler);
      });
    });
    this.listeners = [];
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

    const freq = new FrequencySection(prod.product);
    await freq.init();

    const rev = new ReviewSection(productId);
    await rev.init();

    //Cleanup listeners on page unload
    window.addEventListener('beforeunload',()=>{
      prod.cleanup();
      freq.cleanup();
    })
  }catch(error){
    console.log('Page initialization error:',error);
    document.body.innerHTML = `<div class="error-container" style="text-align: center;margin:10px auto;"><h1 style="color:red">Error Loading Product</h1><p>${error.message}</p></div>`
  }
});
