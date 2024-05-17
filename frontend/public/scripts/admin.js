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
}

document.addEventListener('DOMContentLoaded', () => {
  // document
  //   .getElementById('auchan')
  //   .addEventListener('click', () => loadShopData('auchan'));
  // document
  //   .getElementById('silpo')
  //   .addEventListener('click', () => loadShopData('silpo'));
  // document
  //   .getElementById('all')
  //   .addEventListener('click', () => loadShopData('all'));
  document.getElementById('products').addEventListener('click', loadProducts);
});