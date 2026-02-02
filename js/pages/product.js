import * as productService from "../services/productService.js";
// const subcategoriesContainer = document.querySelector(".categories-links");

// For test
const subcategoriesContainers = document.querySelectorAll(".categories-links");
const productsContainer = document.getElementById("productsContainer");


const rangeMin = document.getElementById("priceRangeMin");
const rangeMax = document.getElementById("priceRangeMax");
const priceMin = document.getElementById("priceMin");
const priceMax = document.getElementById("priceMax");

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


document.querySelectorAll('.shop-sidebar__color').forEach(color => {
    color.addEventListener('click', () => {
    document
        .querySelectorAll('.shop-sidebar__color')
        .forEach(c => c.classList.remove('is-active'));
        color.classList.add('is-active');
    });
});


const trigger = document.querySelector('.custom-select__trigger');
const options = document.querySelector('.custom-select__options');
trigger.addEventListener('click', () => {
    options.style.display =
        options.style.display === 'block' ? 'none' : 'block';
});

options.querySelectorAll('li').forEach(option => {
    option.addEventListener('click', () => {
        trigger.childNodes[0].textContent = option.textContent;
        options.querySelectorAll('li').forEach(o => o.classList.remove('is-active'));
        option.classList.add('is-active');
        options.style.display = 'none';
    });
});


//get all subcategories
await renderSubcategories();

  // await renderTopdiscounts();
//   await renderTopProducts("discount", productsContainer);


    await renderTopRatedProductsByCategory("cat-002", productsContainer);


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

//get all subcategories
// async function renderSubcategories() {
//   if (!subcategoriesContainer) return;

//   try {
//     const subcategories = await productService.getAllSubcategories();

//     subcategoriesContainer.innerHTML = "";

//     subcategories.forEach((subcategory) => {
//       const subcategoryElement = document.createElement("a");
//       subcategoryElement.classList.add("subcategory");
//       subcategoryElement.textContent = subcategory.name;
//       subcategoryElement.href = `products.html?subcategory=${subcategory.id}`;

//       subcategoriesContainer.appendChild(subcategoryElement);
//     });
//   } catch (error) {
//     console.error("Error loading subcategories:", error);
//   }
// }


// for test
async function renderSubcategories() {
    if (!subcategoriesContainers.length) return;

    try {
        const subcategories = await productService.getAllSubcategories();

        subcategoriesContainers.forEach(container => {
            container.innerHTML = "";

            subcategories.forEach(subcategory => {
                const subcategoryElement = document.createElement("a");
                subcategoryElement.classList.add("subcategory");
                subcategoryElement.textContent = subcategory.name;
                subcategoryElement.href = `products.html?subcategory=${subcategory.id}`;

                container.appendChild(subcategoryElement);
            });
        });

    } catch (error) {
        console.error("Error loading subcategories:", error);
    }
}


//render top rated products
async function renderTopProducts(query, container) {
    if (!container) return;
    container.innerHTML = "";
    try {
        //Get all products
        const products = await productService.getAllProducts();
        //sort products by rating
        const topRatedProducts = await productService.sortProducts(products, query);
        topRatedProducts.slice(0, 10).forEach((product) => {
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
setupCarouselButtons();

function displayProducts(product, container) {
    const productCard = createProductCard(product);
    container.appendChild(productCard);
}

function createProductCard(product) {
    const BASE_URL = window.location.origin;
    const card = document.createElement("div");
    card.className = "product-card";
    const hasDiscount = product.discount > 0 && product.originalPrice;
    let imagePath = product.thumbnail;
    if (typeof imagePath === "string") {
        imagePath = imagePath;
    } else if (Array.isArray(imagePath)) {
        imagePath = imagePath[0];
    }
    card.innerHTML = `
  ${hasDiscount
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
  ${hasDiscount
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