const choices = [...document.querySelectorAll('[data-mobile-category]')];
const message = document.querySelector('#mobileEmptyText');
choices.forEach((button) => button.addEventListener('click', () => {
  const active = button.classList.toggle('selected');
  choices.forEach((other) => { if (other !== button) other.classList.remove('selected'); });
  const category = button.dataset.mobileCategory;
  message.textContent = active
    ? `Nous préparons les premières bonnes adresses pour ${category}. Vous avez un restaurant ? Faites découvrir votre cuisine.`
    : 'Nous préparons les premières bonnes adresses de Yopougon. Vous avez un restaurant ? Faites découvrir votre cuisine.';
  document.querySelector('#mobile-restaurants').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

document.querySelector('#mobileSearch').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#mobileSearchInput').value.trim().toLocaleLowerCase('fr');
  let matches = 0;
  choices.forEach((button) => {
    const show = !query || button.dataset.mobileCategory.toLocaleLowerCase('fr').includes(query);
    button.hidden = !show;
    if (show) matches++;
  });
  if (query && !matches) message.textContent = `Aucune cuisine trouvée pour « ${document.querySelector('#mobileSearchInput').value.trim()} ».`;
  else if (query) message.textContent = `Nous préparons les premières bonnes adresses pour « ${document.querySelector('#mobileSearchInput').value.trim()} ».`;
  document.querySelector('#mobile-cuisines').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#mobileAddress').addEventListener('click', () => {
  const address = window.prompt('Votre adresse de livraison à Abidjan :');
  if (address?.trim()) document.querySelector('#mobileAddressLabel').textContent = address.trim();
});
document.querySelector('.app-cart').addEventListener('click', () => window.alert('Votre panier est encore vide.'));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
