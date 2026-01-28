const MAX_PRODUCTS = 48;
const PRODUCTS_TO_SHOW = 20;
async function fetchProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        const allProducts = data.products;
        const container = document.getElementById('productsContainer');
        container.innerHTML = '';
        for (let i = 0; i < PRODUCTS_TO_SHOW; i++) {
            const randomProductId = getRandomProductId(MAX_PRODUCTS);
            const randomProduct = allProducts.find(
                product => product.id === randomProductId
            );
            if (!randomProduct) {
                console.log('could not find product');
                --i;
                continue;
            }
            displayProducts(randomProduct);
        }
        setupCarouselButtons();
    } catch (error) {
        console.error('Error loading products', error);
    }
}

function getRandomProductId(max_num) {
    const randomNumber = Math.floor(Math.random() * max_num) + 1;
    return `prod-${String(randomNumber).padStart(3, '0')}`;
}

function displayProducts(product) {
    const container = document.getElementById('productsContainer');
    const productCard = createProductCard(product);
    container.appendChild(productCard);
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    const hasDiscount = product.discount > 0 && product.originalPrice;
    let imagePath = product.thumbnail;
    if (typeof imagePath === 'string') {
        imagePath = imagePath.replace(/^\.\.\//, '');
    } else if (Array.isArray(imagePath)) {
        imagePath = imagePath[0].replace(/^\.\.\//, '');
    }
    card.innerHTML = `
        ${hasDiscount ? `
            <div class="badge">
                <span class="badge__label">SAVE</span>
                <span class="badge__price">$${(product.originalPrice - product.price).toFixed(2)}</span>
            </div>
        ` : ''}
        <div class="product-card__image-container">
            <img class="product-card__image"
                src="${imagePath}"
                alt="${product.name}"
                onerror="this.src='placeholder.png'">
        </div>
        <div class="product-card__reviews">(${product.reviewCount})</div>
        <h3 class="product-card__title">${product.name}</h3>
        <div class="product-card__price">
            ${hasDiscount ? `
                <span class="product-card__price-new">$${product.price.toFixed(2)}</span>
                <span class="product-card__price-original">$${product.originalPrice.toFixed(2)}</span>
            ` : `
                <span class="product-card__price-current">$${product.price.toFixed(2)}</span>
            `}
        </div>
        <div class="product-card__shipping">
            <span class="product-card__shipping--free">FREE SHIPPING</span>
            ${Math.random() > 0.5 ? '<span class="gift-tag">FREE GIFT</span>' : ''}
        </div>
        <div class="status ${product.stock > 0 ? 'status--in-stock' : 'status--out-of-stock'}">
            <span class="status__indicator"></span>
            ${product.stock > 0 ? 'In stock' : 'Out of stock'}
        </div>
    `;
    return card;
}

function setupCarouselButtons() {
    const nextButton = document.querySelector('.carousel__button--next');
    const prevButton = document.querySelector('.carousel__button--prev');
    const track = document.querySelector('.carousel__track');
    if (!nextButton || !prevButton || !track) return;
    const scroll = (direction) => {
        const cards = document.querySelectorAll('.product-card');
        if (!cards.length) return;
        const cardWidth = cards[0].offsetWidth;
        const gap = 20;
        const scrollAmount = cardWidth + gap;
        track.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    };
    nextButton.addEventListener('click', () => scroll(-1));
    prevButton.addEventListener('click', () => scroll(1));
}

window.addEventListener('load', fetchProducts);
