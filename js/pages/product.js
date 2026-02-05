import * as productService from "../services/productService.js";
// const subcategoriesContainer = document.querySelector(".categories-links");

let categoriesContainers;
let productsContainer;
let rangeMin;
let rangeMax;
let priceMin;
let priceMax;
let brandCounts;
let brandList;
let brandCountsproducts;
let ratingCounts;
let ratingList;
let discountList;
let productsgrid;
let resetBtn;
let pageTitle;
let pageVideo;
let pageBanner;
let bannerContent;
let currentPage = 1;
const productsPerPage = 12;
const selectedBrands = getSelectedBrands();
const selectedRatings = getSelectedRatings();
const selectedDiscounts = getSelectedDiscounts();

let cashedProducts;
let filteredProducts = []; // store filtered results globally

export async function init() {
  console.log("Initializing product page...");
  categoriesContainers = document.querySelectorAll(".categories-links");
  productsContainer = document.getElementById("productsContainer");
  productsgrid = document.querySelector(".products__grid");

  rangeMin = document.getElementById("priceRangeMin");
  rangeMax = document.getElementById("priceRangeMax");
  priceMin = document.getElementById("priceMin");
  priceMax = document.getElementById("priceMax");
  brandList = document.querySelector(".shop-sidebar__brands");
  ratingList = document.querySelector(".shop-sidebar__rating-list");
  discountList = document.querySelector(".shop-sidebar__block--list");
  resetBtn = document.querySelector(".shop-sidebar__reset");
  pageTitle = document.querySelector(".page-title");
  pageVideo = document.querySelector(".page-video");
  pageBanner = document.querySelector(".page-image");
  bannerContent = document.querySelector(".banner-content");

  //   const trigger = document.querySelector(".custom-select__trigger");
  //   const options = document.querySelector(".custom-select__options");

  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get("categoryId") || "cat-002";

  if (categoryId) {
    await renderProductsByCategory(categoryId, productsgrid);
  }

  switch (categoryId) {
    case "cat-001":
      pageTitle.textContent = "Laptops & Computers";
      pageVideo.src = "/assets/videos/Computers.gif";
      pageBanner.src = "/assets/videos/asus.avif";
      bannerContent.style.display = "none";
      break;
    case "cat-002":
      pageTitle.textContent = "Smartphones & Tablets";
      pageVideo.src = "/assets/videos/Apple.gif";
      pageBanner.src =
        "/assets/images/banners/main-top-cellphone/product-main-cellphone.svg";
      break;
    case "cat-003":
      pageTitle.textContent = "Cameras & Photography";
            pageVideo.src = "/assets/videos/canon.gif";
      pageBanner.src = "/assets/videos/GoPro.webp";
      bannerContent.style.display = "none";

      break;
    case "cat-004":
      pageTitle.textContent = "Audio & Sound";
             pageVideo.src = "/assets/videos/jbl.gif";
             pageBanner.src = "/assets/videos/Sony.jpg";
      bannerContent.style.display = "none";

      break;
  }

  rangeMin.addEventListener("input", () => {
    if (+rangeMin.value > +rangeMax.value) {
      rangeMin.value = rangeMax.value;
    }
    priceMin.value = rangeMin.value;
  });

  rangeMax.addEventListener("input", () => {
    if (+rangeMax.value < +rangeMin.value) {
      rangeMax.value = rangeMin.value;
    }
    priceMax.value = rangeMax.value;
  });
  priceMin.value = rangeMin.value;
  priceMax.value = rangeMax.value;

  document.querySelectorAll(".shop-sidebar__color").forEach((color) => {
    color.addEventListener("click", () => {
      document
        .querySelectorAll(".shop-sidebar__color")
        .forEach((c) => c.classList.remove("is-active"));
      color.classList.add("is-active");
    });
  });

  //   trigger.addEventListener("click", () => {
  //     options.style.display =
  //       options.style.display === "block" ? "none" : "block";
  //   });

  //   options.querySelectorAll("li").forEach((option) => {
  //     option.addEventListener("click", () => {
  //       trigger.childNodes[0].textContent = option.textContent;
  //       options
  //         .querySelectorAll("li")
  //         .forEach((o) => o.classList.remove("is-active"));
  //       option.classList.add("is-active");
  //       options.style.display = "none";
  //     });
  //   });

  //get all subcategories
  await renderCategories();
  await renderTopRatedProductsByCategory("cat-002", productsContainer);
  setupCarouselButtons();

  //apply filters
  document.querySelector(".shop-sidebar").addEventListener("change", (e) => {
    if (
      e.target.classList.contains("brand-checkbox") ||
      e.target.classList.contains("rating-checkbox") ||
      e.target.classList.contains("discount-checkbox") ||
      e.target.classList.contains("shop-sidebar__range")
    ) {
      applyFilters(cashedProducts);
    }
  });
  applyFilters(cashedProducts);


resetBtn.addEventListener("click", () => {
  console.log("✅ Reset clicked");

  // 1️⃣ Uncheck all checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
  });

  // 2️⃣ Reset price range
  const minInput = document.getElementById("priceMin");
  const maxInput = document.getElementById("priceMax");

  if (minInput) minInput.value = 0;
  if (maxInput) maxInput.value = 10000;

  // 3️⃣ Reset pagination
  currentPage = 1;

  // 4️⃣ Render all products again
  filteredProducts = [...cashedProducts];
  renderPage(filteredProducts);
});
}

async function renderCategories() {
  if (!categoriesContainers.length) return;

  try {
    const allCategories = await productService.getAllCategories();

    categoriesContainers.forEach((container) => {
      container.innerHTML = "";

      allCategories.forEach((category) => {
        const categoryElement = document.createElement("a");
        categoryElement.classList.add("subcategory");
        categoryElement.textContent = category.name;
        categoryElement.dataset.id = category.id;

        // subcategoryElement.href = `products.html?subcategory=${subcategory.id}`;
        categoryElement.addEventListener("click", async () => {
          productsContainer.innerHTML = "";
          await renderTopRatedProductsByCategory(
            category.id,
            productsContainer,
          );
        });

        container.appendChild(categoryElement);
      });

      const params = new URLSearchParams(window.location.search);
      const categoryFromUrl = params.get("categoryId") || "cat-002";

      if (categoryFromUrl) {
        const activeLink = container.querySelector(
          `.subcategory[data-id="${categoryFromUrl}"]`,
        );
        if (activeLink) {
          activeLink.classList.add("active");
          // تحميل المنتجات مباشرة حسب الـ URL
          renderTopRatedProductsByCategory(categoryFromUrl, productsContainer);
        }
      }
    });
  } catch (error) {
    console.error("Error loading subcategories:", error);
  }
}

document.querySelector(".categories-links").addEventListener("click", (e) => {
  const item = e.target.closest(".subcategory");
  if (!item) return;

  document
    .querySelectorAll(".subcategory")
    .forEach((l) => l.classList.remove("active"));
  item.classList.add("active");
});

async function renderProductsByCategory(categoryId, container) {
  if (!container) return;
  try {
    const products = await productService.getProductsByCategory(categoryId);
    products.forEach((product) => {
      displayProducts(product, container, "product-card product-card--grid");
    });

    cashedProducts = products;
    //Setup filter buttons
    setupFilter(products);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

async function renderTopRatedProductsByCategory(categoryId, container) {
  if (!container) return;
  try {
    //Get all products
    const products = await productService.getProductsByCategory(categoryId);

    //sort products by rating
    const topRatedProducts = await productService.sortProducts(
      products,
      "reviewCount",
    );
    topRatedProducts.slice(0, 15).forEach((product) => {
      displayProducts(product, container);
    });
    setupCarouselButtons();
  } catch (error) {
    console.error("Error loading top rated products:", error);
  }
}

function setupCarouselButtons() {
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel__track");
    const next = carousel.querySelector(".carousel__button--next");
    const prev = carousel.querySelector(".carousel__button--prev");

    if (!track || !next || !prev) return;

    const getScrollAmount = () => {
      const card = track.querySelector(".product-card");
      if (!card) return 0;

      const gap = parseInt(getComputedStyle(track).gap) || 0;
      return card.offsetWidth + gap;
    };

    const updateButtons = () => {
      const max = track.scrollWidth - track.clientWidth;

      next.disabled = track.scrollLeft <= 1;
      prev.disabled = track.scrollLeft >= max - 1;
    };

    prev.addEventListener("click", () => {
      track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
    });

    track.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    requestAnimationFrame(updateButtons);
  });
}

function displayProducts(product, container, className = "product-card") {
  const productCard = createProductCard(product, className);
  container.appendChild(productCard);
}

function createProductCard(product, className) {
  const BASE_URL = window.location.origin;
  const card = document.createElement("div");
  card.className = className;
  const hasDiscount = product.discount > 0 && product.originalPrice;
  let imagePath = product.thumbnail;
  if (typeof imagePath === "string") {
    imagePath = imagePath;
  } else if (Array.isArray(imagePath)) {
    imagePath = imagePath[0];
  }
  card.innerHTML = `
  ${
    hasDiscount
      ? `
    <div class="badge">
    <span class="badge__label">SAVE</span>
    <span class="badge__price">$${(product.originalPrice - product.price).toFixed(2)}</span>
    </div>
    `
      : ""
  }
  <div class="product-card__image-container">
  <img class="product-card__image"
  src="${imagePath}"
  alt="${product.name}"
  onerror="this.src='placeholder.png'">
  </div>
  <div class="product-card__reviews">(${product.reviewCount})</div>
  <h3 class="product-card__title">${product.name}</h3>
  <div class="product-card__price">
  ${
    hasDiscount
      ? `
    <span class="product-card__price-new">$${product.price.toFixed(2)}</span>
    <span class="product-card__price-original">$${product.originalPrice.toFixed(2)}</span>
    `
      : `
    <span class="product-card__price-current">$${product.price.toFixed(2)}</span>
    `
  }
  </div>
  <div class="product-card__shipping">
  <span class="product-card__shipping--free">FREE SHIPPING</span>
  ${Math.random() > 0.5 ? '<span class="gift-tag">FREE GIFT</span>' : ""}
  </div>
  <div class="status ${product.stock > 0 ? "status--in-stock" : "status--out-of-stock"}">
  <span class="status__indicator"></span>
  ${product.stock > 0 ? "In stock" : "Out of stock"}
  </div>
  `;

  card.addEventListener("click", () => {
    window.location.href = `${BASE_URL}/pages/single-product.html?productId=${product.id}`;
  });
  return card;
}

function setupFilter(products) {
  //Get All Brands and count of each brand
  brandCounts = products.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {});

  brandList.innerHTML = Object.entries(brandCounts)
    .map(
      ([brand, count]) => `
    <li class="shop-sidebar__brand">
      <label class="shop-sidebar__brand-label">
        <input type="checkbox" class="shop-sidebar__checkbox brand-checkbox " value="${brand}">
        <span class="shop-sidebar__brand-logo">${brand}</span>
        <span class="shop-sidebar__brand-count">(${count})</span>
      </label>
    </li>
  `,
    )
    .join("");

  // group by rounded rating
  ratingCounts = products.reduce((acc, p) => {
    const stars = Math.round(p.rating); //
    acc[stars] = (acc[stars] || 0) + 1;
    return acc;
  }, {});

  ratingList.innerHTML = Object.keys(ratingCounts)
    .sort((a, b) => b - a)
    .map(
      (stars) => `
    <li class="shop-sidebar__rating-item">
    <label>
      <input type="checkbox" class="shop-sidebar__checkbox rating-checkbox" value="${stars}">
        <span class="shop-sidebar__stars">

      ${`<i class="fa fa-star"></i>`.repeat(stars)}
        </span>

      <span class="shop-sidebar__rating-count">(${ratingCounts[stars]})</span>
    </label>
    </li>
  `,
    )
    .join("");

  // Count products
  const withDiscountCount = products.filter((p) => p.discount).length;
  const withoutDiscountCount = products.filter((p) => !p.discount).length;

  // Generate HTML
  discountList.innerHTML = `
  <div class="discount-item">
    <label>
      <input type="checkbox" class="shop-sidebar__checkbox discount-checkbox" value="with-discount">
      With Discount (${withDiscountCount})
    </label>
  </div>
  <div class="discount-item">
    <label>
      <input type="checkbox" class="shop-sidebar__checkbox discount-checkbox" value="without-discount">
      Without Discount (${withoutDiscountCount})
    </label>
  </div>
`;
}

function applyFilters(products) {
  const selectedBrands = getSelectedBrands();
  const selectedRatings = getSelectedRatings();
  const selectedDiscounts = getSelectedDiscounts();
  // Price range
  const pMin = Number(priceMin.value);
  const pMax = Number(priceMax.value);

  filteredProducts = products.filter((product) => {
    const brand = product.brand || "";
    const rating = Number(product.rating) || 0;
    const discount = Number(product.discount) || 0;

    const brandMatch = selectedBrands.length
      ? selectedBrands.includes(brand)
      : true;

    const ratingMatch = selectedRatings.length
      ? selectedRatings.includes(Math.round(rating))
      : true;

    const discountMatch =
      selectedDiscounts.length === 0 ||
      (selectedDiscounts.includes("with-discount") && discount > 0) ||
      (selectedDiscounts.includes("without-discount") && discount === 0);

    const priceMatch = product.price >= pMin && product.price <= pMax;

    return brandMatch && ratingMatch && discountMatch && priceMatch;
  });

  currentPage = 1; // reset page to 1 after filtering
  renderPage();
}

function getSelectedBrands() {
  return Array.from(document.querySelectorAll(".brand-checkbox:checked")).map(
    (cb) => cb.value,
  );
}

function getSelectedRatings() {
  return Array.from(document.querySelectorAll(".rating-checkbox:checked")).map(
    (cb) => Number(cb.value),
  );
}

function getSelectedDiscounts() {
  return Array.from(
    document.querySelectorAll(".discount-checkbox:checked"),
  ).map((cb) => cb.value); // ["with"] أو ["without"]
}

// ===== PAGINATION =====
function renderPage() {
  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = filteredProducts.slice(start, end);

  renderProducts(paginatedProducts);
  renderPagination();
}

// ===== RENDER PRODUCTS =====
function renderProducts(productsToRender) {
  productsgrid.innerHTML = "";

  if (!productsToRender.length) {
    const msg = document.createElement("div");
    msg.textContent = "No products found";
    msg.style.gridColumn = "1 / -1";
    msg.style.textAlign = "center";
    msg.style.padding = "50px 0";
    msg.style.fontSize = "1.2rem";
    productsgrid.appendChild(msg);
    return;
  }

  productsToRender.forEach((product) => {
    const card = createProductCard(product, "product-card product-card--grid");
    productsgrid.appendChild(card);
  });
}

// ===== RENDER PAGINATION =====
function renderPagination() {
  const container = document.querySelector(".products__pagination");
  container.innerHTML = "";
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (totalPages <= 1) return;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className =
      i === currentPage
        ? "products__page products__page--active"
        : "products__page";
    btn.addEventListener("click", () => {
      currentPage = i;
      renderPage();
    });
    container.appendChild(btn);
  }

  // Next button
  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "products__page";
    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderPage();
    });
    container.appendChild(nextBtn);
  }
}
