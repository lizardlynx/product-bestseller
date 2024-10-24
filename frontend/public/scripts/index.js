import { initError, initSearch, dbShopsData } from './common.js';

async function loadShops() {
  const res = await fetch('/shops', {
    method: 'GET',
  });
  const resJSON = await res.json();
  for (const [key, value] of Object.entries(resJSON)) {
    dbShopsData[key] = value;
  }
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

async function loadCategories() {
  const res = await fetch('/categories', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const categories = await res.json();
  const categoriesHolder = document.getElementsByClassName('categories')[0];
  categoriesHolder.innerHTML = '';

  const savedElements = {};

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

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('header-holder').innerHTML = `
    <header>
      <div class="wrapper">
        <a class="page-link" href="/admin.html">Адмінпанель</a>
        <a class="page-link" href="/lists.html">Списки</a>
        <a class="page-link" href="/analysis.html">Аналіз магазинів</a>
        <a class="page-link" href="/prices.html">Аналіз цін</a>
        <div class="categories"></div>
        <div class="search-field">
          <input type="text" class="product-search" id="product-search" placeholder="Введіть продукт.." title="Введіть назву продукта">
          <div class="search-results" id="search-results"></div>
        </div>
      </div>
    </header>
    <div class="wrapper">
      <div class="breadcrumbs"></div>
      <div class="error-holder"></div>
    </div>
  `;
  document.getElementsByTagName('body')[0].innerHTML += `<footer></footer>`;
  document.getElementById('overlay').style.display = 'none';

  loadCategories();
  loadShops();

  initSearch('product-search', 'search-results');
});
