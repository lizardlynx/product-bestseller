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

async function loadProductsSilpo() {
  const res = await fetch('/products/silpo', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  console.log(resJSON);
}

async function loadProductsAuchan() {
  const res = await fetch('/products/auchan', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  console.log(resJSON);
}

async function loadApiUsd() {
  const res = await fetch('/api/bank/usd', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  console.log(resJSON);
}

async function loadApiEur() {
  const res = await fetch('/api/bank/eur', {
    method: 'GET',
  });
  if (!res.ok) return initError(await res.text());

  const resJSON = await res.json();
  console.log(resJSON);
}

document.addEventListener('DOMContentLoaded', () => {
  document
    .getElementById('auchan')
    .addEventListener('click', () => loadShopData('auchan'));
  document
    .getElementById('silpo')
    .addEventListener('click', () => loadShopData('silpo'));
  document
    .getElementById('all')
    .addEventListener('click', () => loadShopData('all'));
  document
    .getElementById('products-silpo')
    .addEventListener('click', loadProductsSilpo);
  document
    .getElementById('products-auchan')
    .addEventListener('click', loadProductsAuchan);

  document.getElementById('api-usd').addEventListener('click', loadApiUsd);
  document.getElementById('api-eur').addEventListener('click', loadApiEur);
});
