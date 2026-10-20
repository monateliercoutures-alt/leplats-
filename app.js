const toast = document.querySelector('#toast');
let toastTimer;
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// Lightweight interactions for the static demonstration.
document.querySelectorAll('[data-modal]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.modal)?.showModal());
});

document.querySelectorAll('.modal').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.querySelector('#addressForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.querySelector('#addressInput').value.trim();
  if (!value) return;
  document.querySelector('#addressLabel').textContent = value;
  document.querySelector('#addressModal').close();
  notify(`Adresse enregistrée : ${value}`);
});

document.querySelector('#searchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#searchInput').value.trim();
  document.querySelector('#restaurants').scrollIntoView({ behavior: 'smooth' });
  notify(query ? `Recherche « ${query} » — les restaurants arrivent bientôt.` : 'Choisissez une cuisine pour commencer.');
});

document.querySelectorAll('[data-filter="all"]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector('#saveurs').scrollIntoView({ behavior: 'smooth' }));
});

document.querySelectorAll('.category-card, .flavour-card').forEach((card) => {
  card.addEventListener('click', () => {
    const name = card.querySelector('h3')?.textContent.replaceAll('\n', ' ').trim() || 'cuisine';
    notify(`${name} : le catalogue des restaurants sera bientôt disponible.`);
  });
});

document.querySelector('#retryButton').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Chargement…';
  document.querySelector('#loadMessage').textContent = 'Nous vérifions les restaurants disponibles dans votre quartier.';
  setTimeout(() => {
    button.disabled = false;
    button.textContent = 'Réessayer';
    document.querySelector('#loadMessage').textContent = 'Réponse du serveur indisponible. Veuillez réessayer.';
    notify('Le catalogue n’est pas encore connecté à un serveur.');
  }, 1200);
});

document.querySelector('#installButton').addEventListener('click', () => {
  notify('Pour installer TonMenu, utilisez « Ajouter à l’écran d’accueil » dans le menu de votre navigateur.');
});

document.querySelector('#mobileMenu').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const nav = document.querySelector('#mainNav');
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.nav-inner a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('#mainNav').classList.remove('open');
  document.querySelector('#mobileMenu').setAttribute('aria-expanded', 'false');
}));
