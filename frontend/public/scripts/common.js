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
