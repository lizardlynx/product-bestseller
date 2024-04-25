import { initError, initSearch, clearError } from './common.js';
let submitting = false;

async function loadLists() {
  const res = await fetch('/lists', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const lists = await res.json();
  const listsEl = document.getElementsByClassName('lists')[0];
  for (const list of lists) {
    listsEl.innerHTML += `<a href="/lists/${list.list_id}">${list.title}</a>`;
  }
}

function removeProduct(e) {
  const element = e.target;
  const productId = element.getAttribute('data-product');
  const product = document.querySelector('.row-product[data-id="'+productId+'"]');
  product.remove();
}

function addToList(product) {
  const productsSet = document.getElementsByClassName('products-set')[0];
  product.addEventListener('click', () => {
    const rowProduct = document.createElement('div');
    const productRemove = document.createElement('div');
    rowProduct.classList.add('row-product');
    rowProduct.setAttribute('data-id', product.getAttribute('data-id'));
    rowProduct.innerHTML = `<div class="product-name">${product.innerText}</div>`;
    productRemove.classList.add('product-remove');
    productRemove.setAttribute('data-product', product.getAttribute('data-id'));
    productRemove.innerText='X';
    rowProduct.appendChild(productRemove);
    productsSet.appendChild(rowProduct);
  
    productRemove.addEventListener('click', removeProduct);
  });
}

async function submitList() {
  clearError();
  if (submitting) return;
  submitting = true;
  const res = {};
  const list = [];
  const title = document.getElementById('list-title').value;
  if (title.length == 0) {
    submitting = false;
    return initError('Введіть назву списка!');
  }
  const rows = document.getElementsByClassName('row-product');
  if (rows.length == 0) {
    submitting = false;
    return initError('В списку має бути хоча б один продукт!');
  }
  Array.from(rows).forEach(row => list.push(row.getAttribute('data-id')));
  res.products = list;
  res.title = title;

  const resp = await fetch('/lists/add' , {
    method: 'POST',
    body: JSON.stringify(res)
  });
  if (!resp.ok) {
    submitting = false;
    return initError(await resp.text());
  }

  location.reload();
}

document.addEventListener('DOMContentLoaded', async () => {
  loadLists();
  await initSearch('product-search-list', 'search-results-list', ['disable-a', 'product-list-add'], addToList);
  document.getElementsByClassName('submit')[0].addEventListener('click', submitList);
});