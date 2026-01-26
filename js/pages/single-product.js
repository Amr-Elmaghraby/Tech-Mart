// all inside document ready
document.addEventListener("DOMContentLoaded", () => {
  // get the query string from URL "part after ?"
  const queryString = window.location.search;  
  // parse parameters
  const urlParam = new URLSearchParams(queryString);    
  // get the specific productName value
  const productId = urlParam.get("productId");
  // fetch product
  async function getProduct(productId) {
    const response = await fetch(`../data/products.json`);
    const data = await response.json();
    const product = data.products.find((product) => product.id === productId);
    return product;
  }
  // render product after fetch
  async function renderProduct(product) {
    // select element to contain new tag
    const newTag = document.querySelector(".single-product__gallery-tag");
    const dataString = product.createdAt;
    if( isWithin60Days(dataString) )
        {
            newTag.style.visibility = "visible";
        }

    // select main image
    const mainImage = document.querySelector(".single-product__gallery-image--main");
    // select container of sub images if exists
    const subImageContainer = document.querySelector(
      ".single-product__gallery-image--sub-container",
    );
    // set src of main image
    mainImage.src= `${product.thumbnail}`;
    // set src of sub images if exists
    if(product.images.length > 1)
        {
            product.images.forEach((element, index) => {
                if(index === 0) return;
                const subImage = document.createElement("img");
                subImage.classList.add("single-product__gallery-image--sub");
                subImage.src = `${element}`;
                subImageContainer.appendChild(subImage);
            });
            subImageContainer.style.visibility = "visible";
        }
    // product info
    const productInfo = document.querySelector(".single-product__info");
    productInfo.innerHTML = `
    <h2 class="single-product__info-name">${product.name}</h2>
    <h3 class="single-product__info-price">${product.price}</h3>
    <p class="single-product__info-description">${product.description}</p>
    <hr>
    <p class="single-product__info-features"><strong>features:</strong> 
    <ul style="list-style-type:disc">${product.features?product.features.map(item=>{return `<li>${item}</li>`}).join(''):""}</ul></p>
    `;

    productInfo.innerHTML += `<h6>CATEGORY: ${product.tags[0]}</h6>
    <h6>Brand: ${product.brand}</h6>`;
    
    // product purchase
    const productPurchase = document.querySelector(".single-product__purchase");
    const productPrice = document.querySelector(".single-product__purchase-price");
    productPrice.innerHTML += `<div><h2>${product.price} $</h2></div>`;
    const btn = document.querySelectorAll(".single-product__quant-btn");
    btn.forEach((btn) => {
      btn.addEventListener("click", () => {
      const quant = document.querySelector(".single-product__quant-value");
      if (btn.innerText === "+") {
        if(Number(quant.innerText) === product.stock) return;
        quant.innerText = Number(quant.innerText) + 1;
      } else {
        if(Number(quant.innerText) === 1) return;
        quant.innerText = Number(quant.innerText) - 1;
      }
    });
    });


    const add_to_card = document.querySelector(".single-product__add-btn");
    /**
     *  ADD TO CARD FUNCTION
    */
  }
    
  // call function to fetch product then render it
  getProduct(productId).then((product) => renderProduct(product));
    
});


function isWithin60Days(isoString)
{   // isoString is in format "YYYY-MM-DD", make it a date
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