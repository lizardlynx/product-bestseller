function createProductHTML(product) {
  const productDiv = document.createElement('div');
  productDiv.classList.add('product');
  productDiv.setAttribute('data-id', product.id);
  productDiv.innerHTML = `<img src="${product.image}" width="200px" alt="${product.title}">
  <a class="title" href="/products/${product.id}">${product.title}</a>`;
  for (const price of product.prices) {
    productDiv.innerHTML += `<div class="price-description">${price.comment}</div><div class="price">${price.price}</div>`;
  }

  // <div class="price-description">${product.comment}</div><div class="price">${product.price}</div>`;
  return productDiv;
}

async function loadProducts(categoryId) {
  const productHolder = document.getElementsByClassName('products')[0];

  const apiUrl = '/categories/' + categoryId + '/products';
  const res = await fetch(apiUrl, {
    method: 'GET',
  });
  const resJSON = await res.json();
  for (let product of Object.values(resJSON)) {
    const productDiv = createProductHTML(product);
    productHolder.appendChild(productDiv);
  }
  console.log(resJSON);
}

document.addEventListener('DOMContentLoaded', () => {
  const pathname = new URL(location).pathname;
  const categoryId = pathname.split('/')[2];

  loadProducts(categoryId);
});
