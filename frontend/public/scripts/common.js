let interval = null;
export const dbShopsData = {};

export function initError(message) {
  const errorHolder = document.getElementsByClassName('error-holder')[0];
  errorHolder.classList.add('filled');
  errorHolder.innerText = message;
}

export function clearError() {
  const errorHolder = document.getElementsByClassName('error-holder')[0];
  errorHolder.classList.remove('filled');
  errorHolder.innerText = '';
}

export function insertBreadcrumbs(breadcrumbs) {
  const crumbsHolder = document.getElementsByClassName('breadcrumbs')[0];
  const breadcrumbsHTML = [];
  for (const crumb of breadcrumbs) {
    const crumbHTML = `<a href="/categories/${crumb.id}">${crumb.title}</a>`
    breadcrumbsHTML.push(crumbHTML);
  }
  crumbsHolder.innerHTML += breadcrumbsHTML.join(' | ');
}

export function firstToUpper(string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

export function getJsonFromUrl(url) {
  if(!url) url = location.search;
  const query = url.substr(1);
  const result = {};
  query.split("&").forEach(part => {
    const item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

export function createPagination(pageCount, pages, pageNumber, url) {
  pages.innerHTML += `<a class="page ${(pageNumber - 1 == 0)? 'disabled': ''}" href="${url}?pageNumber=${pageNumber - 1}"><</a>`;
  let visiblePages = pageCount < 6? pageCount: 6;
  let leftVisiblePages = Math.floor(visiblePages/2);
  let rightVisiblePages = Math.ceil(visiblePages/2);
  pages.innerHTML += `<a class="page ${pageNumber == 1? 'chosen': ''}" href="${url}?pageNumber=1">1</a>`;
  if (pageCount > 1) {
    const leftAvailablePages = pageNumber - 1;
    const rightAvailablePages = pageCount - pageNumber;
    const leftDiff = leftVisiblePages - leftAvailablePages;
    const rightDiff = rightVisiblePages - rightAvailablePages;
    if (leftDiff > 0) {
      rightVisiblePages += leftDiff;
      leftVisiblePages -= leftDiff;
    } else if (rightDiff > 0) {
      leftVisiblePages += rightDiff;
      rightVisiblePages -= rightDiff;
    }
    
    for (let i = 1; i < pageCount - 1; i++) {
      if (i >= pageNumber - 1 - leftVisiblePages && i <= pageNumber - 1 + rightVisiblePages) 
        pages.innerHTML += `<a class="page ${(i + 1 == pageNumber)? 'disabled': ''}" href="${url}?pageNumber=${i + 1}">${i + 1}</a>`;
      else if (i == pageNumber - 2 - leftVisiblePages || i == pageNumber + rightVisiblePages)
        pages.innerHTML += '...';
    } 
    pages.innerHTML += `<a class="page ${pageNumber == pageCount? 'chosen': ''}" href="${url}?pageNumber=${pageCount}">${pageCount}</a>`;
  }

  pages.innerHTML += `<a class="page ${(pageNumber + 1 > pageCount)? 'disabled': ''}" href="${url}?pageNumber=${pageNumber + 1}">></a>`;
}

export function openTab(e) {
  const tabs = document.getElementsByClassName('tab-holder');
  const btns = document.getElementsByClassName('tab-opener-button');
  for (const btn of btns) {
    if (btn != e.target) btn.classList.remove('clicked');
  }

  for (const tab of tabs) {
    if (!tab.classList.contains('hidden')) tab.classList.add('hidden');
  }

  if (!e.target.classList.contains('clicked')) {
    const id = e.target.getAttribute('data-ref');
    const tab = document.getElementById(id);
    tab.classList.remove('hidden');
    e.target.classList.add('clicked');
  } else e.target.classList.remove('clicked');
}


export function hideSearchResults(e, id) {
  document.getElementById(id).classList.add('hidden');
}

export function showSearchResults(e, id) {
  if (!e || e.target.value.trim().length != 0)  document.getElementById(id).classList.remove('hidden');
}

export function addSearchItem(item, id, additionalClasses, callback = null) {
  const searchResults = document.getElementById(id);
  const row = document.createElement('div');
  row.classList.add('row-search-holder');
  row.setAttribute('data-id', item.id);
  const itemA = document.createElement('a');
  itemA.classList.add('product-result');
  additionalClasses.forEach(item => itemA.classList.add(item));
  itemA.setAttribute('href', '/products/' + item.id);
  let imgs = '<div class="shop-name search">';
  item.shops.forEach(shop => imgs += `<div class="shop-logo"><img src="/images/${dbShopsData[shop].title}.png"></div>`);
  imgs += '</div>';
  itemA.innerHTML = imgs + `<div class="search-product-title">${item.title}</div>`;
  row.appendChild(itemA);
  searchResults.appendChild(row);
  if (callback) callback(row);
}

export function initSearch(inputId, resultId, additionalClasses = [], callback = null) {
  const productSearch = document.getElementById(inputId);
  const hideResultSet = (e) => hideSearchResults(e, resultId);
  productSearch.addEventListener('keyup', (e) => searchProduct(e, resultId, additionalClasses, callback));
  productSearch.addEventListener('focusout', hideResultSet);
  productSearch.addEventListener('focusin', (e) => showSearchResults(e, resultId));
  
  const searchRes = document.getElementById(resultId);
  searchRes.addEventListener('mouseenter', () => productSearch.removeEventListener('focusout', hideResultSet));
  searchRes.addEventListener('mouseleave', () => productSearch.addEventListener('focusout', hideResultSet));
}

function searchProduct(e, resultId, additionalClasses, callback) {
  clearInterval(interval);
  if (e.target.value.trim().length == 0) return hideSearchResults(null, resultId);
  interval = setTimeout(async () => {
    const res = await fetch(
      '/products?' + new URLSearchParams({ name: e.target.value.trim() }),
      {
        method: 'GET',
      }
    );
    if (!res.ok) return initError(await res.text());

    const resJSON = await res.json();
    document.getElementById(resultId).innerHTML = '';
    showSearchResults(null, resultId);
    resJSON.forEach(item => addSearchItem(item, resultId, additionalClasses, callback));
  }, 1000);
};
