export let dbShopsData = null;
import { initError } from './common.js';

async function loadShops() {
  const res = await fetch('/shops', {
    method: 'GET',
  });
  const resJSON = await res.json();
  dbShopsData = resJSON;
}

async function getCategoryProducts(id) {
  location.href = '/categories/' + id;
}

function addSavedCategory(savedElements, id, categoryChildren) {
  const currChildren = savedElements[id];
  for (let child of currChildren) {
    categoryChildren.appendChild(child);
    const childId = child.getAttribute('data-id');
    if (childId in savedElements) {
      const childChildren =
        child.getElementsByClassName('category-children')[0];
      addSavedCategory(savedElements, childId, childChildren);
      childChildren.classList.add('filled');
    }
  }
  delete savedElements[id];
}

function createCategoryHTML(category) {
  const categoryDiv = document.createElement('div');
  categoryDiv.classList.add('category');
  categoryDiv.setAttribute('data-id', category.id);
  categoryDiv.innerHTML = `<div class="category-title" data-link="/categories/${category.id}">${category.title}</div>
    <div class="category category-children"></div>`;
  return categoryDiv;
}

async function loadShopData(shopName) {
  const res = await fetch('/categories/' + shopName, {
    method: 'POST',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  const resultWindow = document.getElementById('result-window');
  resultWindow.innerHTML = `Load${shopName}Data<br>Status Code: ${
    resJSON.statusCode
  }<br>Results: <br>${
    resJSON.data.success ? 'Success!' : 'Error!'
  }<br> Message: ${resJSON.data.message}`;
  loadCategories();
}

async function loadProducts() {
  const res = await fetch('/products/all', {
    method: 'POST',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  console.log(resJSON);
  // const resultWindow = document.getElementById('result-window');
  // resultWindow.innerHTML = `Load${shopName}Data<br>Status Code: ${resJSON.statusCode}<br>Results: <br>${resJSON.data.success ? 'Success!' : 'Error!'}<br> Message: ${resJSON.data.message}`;
  // loadCategories();
}

async function loadCategories() {
  const res = await fetch('/categories', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());
  
  const categories = await res.json();
  const categoriesHolder = document.getElementsByClassName('categories')[0];
  categoriesHolder.innerHTML = '';

  const savedElements = {}; // parentId: [elements]

  for (let category of categories) {
    const categoryEl = createCategoryHTML(category);
    const categoryChildren =
      categoryEl.getElementsByClassName('category-children')[0];
    const categoryTitle =
      categoryEl.getElementsByClassName('category-title')[0];
    const parentId = category.parent_category_id;
    const parentEl = document.querySelectorAll(`[data-id="${parentId}"]`);
    let elementAppended = false;
    if (parentId == null) {
      categoriesHolder.appendChild(categoryEl);
      elementAppended = true;
    } else if (parentEl.length > 0) {
      const parentChildren =
        parentEl[0].getElementsByClassName('category-children')[0];
      parentChildren.appendChild(categoryEl);
      parentChildren.classList.add('filled');
      elementAppended = true;
    } else {
      if (!(parentId in savedElements)) savedElements[parentId] = [];
      savedElements[parentId].push(categoryEl);
    }

    if (elementAppended && category.id in savedElements) {
      addSavedCategory(savedElements, category.id, categoryChildren);
    }

    categoryTitle.addEventListener('click', () =>
      getCategoryProducts(category.id)
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('header-holder').innerHTML = `
    <header>
      <div class="wrapper">
        <div class="categories"></div>
      </div>
      <h2>Emty database and load: </h2>
      <button id="auchan">Only Auchan</button>
      <button id="silpo">Only Silpo</button>
      <button id="all">All</button>
      <button id="products">Products</button>
      <div id="result-window"></div>
    </header>
    <div class="wrapper">
      <div class="breadcrumbs"></div>
      <div class="error-holder"></div>
    </div>
  `;

  loadCategories();
  // document
  //   .getElementById('auchan')
  //   .addEventListener('click', () => loadShopData('auchan'));
  // document
  //   .getElementById('silpo')
  //   .addEventListener('click', () => loadShopData('silpo'));
  document
    .getElementById('all')
    .addEventListener('click', () => loadShopData('all'));
  document.getElementById('products').addEventListener('click', loadProducts);
  loadShops();
});
