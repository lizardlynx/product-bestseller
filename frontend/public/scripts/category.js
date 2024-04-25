import {
  initError,
  insertBreadcrumbs,
  getJsonFromUrl,
  createPagination,
  dbShopsData
} from './common.js';

function createProductHTML(product) {
  const productDiv = document.createElement('div');
  productDiv.classList.add('product');
  productDiv.setAttribute('data-id', product.id);
  productDiv.innerHTML = `<img src="${product.image}" width="200px" alt="${product.title}">
  <a class="title" href="/products/${product.id}">${product.title}</a>`;
  for (const price of product.prices) {
    if (price.comment != 'price' && price.comment != 'oldPrice') continue;
    productDiv.innerHTML += `<div class="price ${price.comment}">${price.price}</div>`;
  }

  let shopHTML = '';
  shopHTML += '<div class="shop-name">';
  for (const shop of product.shops) {
    shopHTML += `<div class="shop-logo"><img src="/images/${dbShopsData[shop].title}.png"></div>`;
  }
  shopHTML += '</div>';
  productDiv.innerHTML += shopHTML;
  return productDiv;
}

async function loadProducts(categoryId, pageNumber) {
  const productHolder = document.getElementsByClassName('products')[0];

  const apiUrl =
    '/categories/' +
    categoryId +
    '/products?' +
    new URLSearchParams({
      page: pageNumber,
      items: 20,
    });
  const res = await fetch(apiUrl, {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  const products = resJSON.products;
  for (let product of Object.values(products)) {
    const productDiv = createProductHTML(product);
    productHolder.appendChild(productDiv);
  }
  const breadcrumbs = resJSON.breadcrumbs;
  insertBreadcrumbs(breadcrumbs);
  const pages = document.getElementsByClassName('pages')[0];
  const pageCount = resJSON.count;
  createPagination(pageCount, pages, pageNumber, `/categories/${categoryId}`);
}

document.addEventListener('DOMContentLoaded', () => {
  const pathname = new URL(location).pathname;
  const categoryId = pathname.split('/')[2];
  const queries = getJsonFromUrl(location.search);
  let pageNumber = 1;
  if ('pageNumber' in queries) pageNumber = queries.pageNumber;

  loadProducts(categoryId, +pageNumber);
});
