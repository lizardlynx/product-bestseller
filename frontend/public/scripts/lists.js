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

document.addEventListener('DOMContentLoaded', () => {
  loadLists();
});