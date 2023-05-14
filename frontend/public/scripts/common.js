export function initError(message) {
  const errorHolder = document.getElementsByClassName('error-holder')[0];
  errorHolder.classList.add('filled');
  errorHolder.innerText = message;
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
