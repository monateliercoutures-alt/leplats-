const asset = (name) => `/images/${name}`;
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const validAsset = (value, fallback = 'story-meal.webp') => /^[a-z0-9-]+\.(?:webp|png)$/i.test(String(value || '')) ? String(value) : fallback;

const categories = [
  { slug: 'maquis', title: 'Maquis', image: 'plats-sauce.webp', alt: 'Kédjénou traditionnel en sauce', description: 'Restaurants ivoiriens traditionnels, souvent en plein air : kedjenou, sauce feuille, sauce graine.' },
  { slug: 'grillades', title: 'Grillades / Rôtisserie', image: 'grillades.webp', alt: 'Poulet braisé, riz et alloco', description: "Poulet braisé, poisson grillé et brochettes, en kiosque ou à l’allocodrome." },
  { slug: 'attieke', title: 'Attiéké & Aloco', image: 'attieke-poisson.webp', alt: 'Attiéké et poisson braisé', description: 'Spécialités de manioc râpé et de banane plantain, incontournables de la street-food ivoirienne.' },
  { slug: 'africaine', title: 'Cuisine africaine (autre)', image: 'cuisine-africaine.webp', alt: 'Riz jollof au poulet grillé et plantain', description: "Les saveurs d’Afrique de l’Ouest hors Côte d’Ivoire : cuisines sénégalaise, ghanéenne et autres." },
  { slug: 'libanaise', title: 'Cuisine libanaise', image: 'cuisine-libanaise.webp', alt: 'Mezzé libanais, houmous, falafels et pain pita', description: 'Mezzés, chawarmas, grillades et spécialités libanaises à découvrir à Abidjan.' },
  { slug: 'fast-food', title: 'Fast-food', image: 'burger-card.webp', alt: 'Burger généreux garni de fromage et de légumes', description: 'Burgers, sandwichs et poulet frit des enseignes locales et internationales.' },
  { slug: 'italien', title: 'Pizza / Italien', image: 'pizza.webp', alt: 'Pizza artisanale sortant du four', description: 'Pizzas, pâtes et spécialités italiennes, à partager ou à savourer en solo.' },
  { slug: 'fruits-de-mer', title: 'Fruits de mer', image: 'poisson.webp', alt: 'Poisson et crevettes en sauce', description: 'Poissons, crevettes, langouste et spécialités marines, notamment côté lagune.' },
  { slug: 'europeenne', title: 'Cuisine française / européenne', image: 'croque.webp', alt: 'Croque doré servi sur une assiette', description: 'Bistrots, brasseries et plats des cuisines française et européenne.' },
  { slug: 'patisserie', title: 'Pâtisserie / Snacks / Café', image: 'patisserie.webp', alt: 'Croissants, pâtisserie aux fruits et café', description: 'Viennoiseries, gâteaux, snacks et boissons chaudes pour toutes les pauses.' },
];

let restaurantRecords = [];

const flavors = [
  ['Plats en sauce', 'plats-sauce.webp', 'Plat ivoirien généreux en sauce'],
  ['Poisson & crevettes', 'poisson.webp', 'Poisson braisé et crevettes'],
  ['Attiéké & poisson', 'attieke-poisson.webp', 'Attiéké servi avec du poisson braisé'],
  ['Riz & poisson', 'riz-poisson.webp', 'Riz accompagné de poisson'],
  ['Burgers généreux', 'burger-card.webp', 'Burger garni et généreux'],
  ['Pizzas gourmandes', 'pizza.webp', 'Pizza généreuse'],
  ['Poulet croustillant', 'poulet-sans-marque.webp', 'Poulet frit sans marque, servi avec frites et coleslaw'],
  ['Croques dorés', 'croque.webp', 'Croque doré au fromage'],
];

const photos = flavors.map((item) => item[1]);
const component = (tag, render) => {
  customElements.define(tag, class extends HTMLElement {
    connectedCallback() { if (!this.dataset.ready) { this.innerHTML = render(); this.dataset.ready = 'true'; } }
  });
};

component('top-info-bar', () => `
  <div class="topline"><div class="wrap topline-inner">
    <span>Votre repas préféré, en quelques clics.</span>
    <span class="topline-center">100 % restauration locale · Abidjan</span>
    <a href="#aide">Besoin d’aide ? <span aria-hidden="true">↗</span></a>
  </div></div>`);

component('site-header', () => `
  <header class="site-header"><div class="header-main wrap">
    <form class="searchbox" id="searchForm" role="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"></circle><path d="m16 16 4.2 4.2"></path></svg>
      <input id="searchInput" type="search" placeholder="Une envie, un restaurant…" aria-label="Rechercher une cuisine ou un restaurant" />
      <button aria-label="Rechercher" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"></path></svg></button>
    </form>
    <a class="brand" href="#accueil" aria-label="TonMenu, accueil"><img class="brand-logo-header" src="${asset('logo-header.png')}" alt="TonMenu" width="218" height="42" /></a>
    <div class="header-actions">
      <button class="address-button" data-modal="addressModal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg><span><small>ADRESSE DE LIVRAISON</small><b id="addressLabel">Choisir une adresse</b></span></button>
      <button class="icon-button user-icon" data-modal="accountModal" aria-label="Mon compte"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.8 21a7.2 7.2 0 0 1 14.4 0"></path></svg></button>
      <button class="icon-button cart-icon" data-modal="cartModal" aria-label="Mon panier, 0 article"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"></path><path d="M9 9V6a3 3 0 0 1 6 0v3"></path></svg><span class="cart-count">0</span></button>
    </div>
  </div></header>`);

component('main-nav', () => `
  <nav class="main-nav" aria-label="Navigation principale"><div class="nav-inner">
    <a class="active" href="#accueil">Accueil</a><a href="#restaurants">Restaurants</a><a href="#cuisines">Nos cuisines</a>
    <a href="#esprit">L’esprit TonMenu</a><a href="#comment">Comment ça marche</a><a href="#partenaires">Espace partenaire <span aria-hidden="true">↗</span></a>
  </div></nav>`);

component('hero-banner', () => `
  <section class="hero hero-composite" id="accueil" aria-labelledby="heroTitle">
    <img class="hero-composite-image" src="${asset('hero-exact.webp')}" alt="Poulet braisé, riz et alloco avec le slogan TonMenu : Le vrai goût de chez nous." width="1900" height="580" fetchpriority="high" />
    <div class="sr-only"><p>Chaud. Généreux. Tout simplement bon.</p><h1 id="heroTitle">Le vrai goût de chez nous.</h1><p>De l’alloco doré à la bonne braise du quartier, vos envies ont trouvé leur adresse. Les cuisines d’Abidjan, à votre porte.</p></div>
    <a class="hero-composite-link" href="#restaurants" aria-label="Découvrir les restaurants"></a>
  </section>`);

component('cuisine-grid', () => `
  <section class="categories section" id="cuisines"><div class="wrap">
    <p class="eyebrow center">CHAQUE ENVIE A SON MENU</p><h2 class="section-title">Qu’est-ce qui vous fait envie ?</h2>
    <div class="category-tools"><button class="button button-red compact" data-filter="all"><svg class="utensils-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v7m-3-7v4a3 3 0 0 0 6 0V3M6 10v11m9-18v18m0-18c3 2 4 5 4 9h-4"></path></svg> Toutes les cuisines <span class="pill-count">${restaurantRecords.length}</span></button><span class="muted small-text">10 catégories de restauration</span></div>
    <div class="category-grid" id="categoryGrid" role="group" aria-label="Catégories de restauration, faites défiler horizontalement">${categories.map((item) => `
      <button class="category-tile" type="button" data-category="${item.slug}" aria-pressed="false">
        <img src="${asset(item.image)}" alt="${item.alt}" width="108" height="108" loading="lazy" />
        <h3>${item.title}</h3><p>${item.description}</p><span class="category-status">${restaurantRecords.filter((restaurant) => restaurant.category === item.slug).length ? `${restaurantRecords.filter((restaurant) => restaurant.category === item.slug).length} restaurants` : 'Bientôt'}</span>
      </button>`).join('')}</div>
    <p class="no-categories" hidden>Aucune catégorie ne correspond à cette recherche.</p>
  </div></section>`);

component('promo-banners', () => `
  <section class="promo-cards section" aria-label="Nos cuisines à découvrir"><div class="wrap promo-card-grid">
    <a class="category-card category-yellow reveal" href="#saveurs"><div class="category-copy"><small>POUR LES GRANDES FAIMS</small><h3>Un burger.<br />Et du bonheur.</h3><span class="text-link">Explorer ↗</span></div><img src="${asset('burger.webp')}" alt="Burger généreux" loading="lazy" width="240" height="250" /></a>
    <a class="category-card category-charcoal reveal" href="#saveurs"><div class="category-copy"><small>LE GOÛT DE CHEZ NOUS</small><h3>Attiéké &amp; poisson.<br />Tout simplement bon.</h3><span class="text-link">Explorer ↗</span></div><img src="${asset('attieke-poisson.webp')}" alt="Attiéké et poisson" loading="lazy" width="240" height="250" /><span class="tiny-sticker">ÇA SENT<br />BON !</span></a>
    <a class="category-card category-red reveal" href="#saveurs"><div class="category-copy"><small>LES CLASSIQUES QU’ON AIME</small><h3>Nos plats en sauce.<br />Du goût à partager.</h3><span class="text-link">Explorer ↗</span></div><img src="${asset('plats-sauce.webp')}" alt="Plat en sauce" loading="lazy" width="240" height="250" /></a>
  </div></section>`);

function renderRestaurantGrid() {
  const count = restaurantRecords.length;
  const listings = count ? `<div class="restaurant-card-grid">${restaurantRecords.map((restaurant) => `
    <article class="restaurant-card" data-category="${escapeHtml(restaurant.category)}" data-rating="${Number(restaurant.ratingValue)||0}" data-eta="${Number(restaurant.eta)||0}" data-free="${restaurant.freeDelivery ? '1' : '0'}"><img src="${asset(validAsset(restaurant.image))}" alt="${escapeHtml(restaurant.name)}" loading="lazy" /><div><h3>${escapeHtml(restaurant.name)}</h3><p>${escapeHtml(restaurant.cuisine)}</p><div class="restaurant-meta"><span>★ ${escapeHtml(restaurant.rating)}</span><span>${Number(restaurant.eta)||0} min</span><span>${escapeHtml(restaurant.fee)}</span></div></div></article>`).join('')}</div>` : `
    <article class="empty-state" id="emptyState"><div class="empty-art"><img src="${asset('plats-sauce.webp')}" alt="Plat en sauce préparé localement" width="320" height="240" loading="lazy" /><span class="empty-sticker">BIENTÔT<br />À TABLE !</span></div>
      <div class="empty-copy"><p class="eyebrow">LES PREMIERS PARTENAIRES ARRIVENT</p><h3>Le quartier se met à table.</h3>
        <p id="emptyMessage">Nous préparons les premières bonnes adresses de Yopougon. Vous avez un restaurant ? Faites découvrir votre cuisine.</p>
        <a class="button button-red" href="#partenaires">Inscrire mon restaurant <span>↗</span></a>
      </div>
    </article>`;
  return `<section class="discover section" id="restaurants"><div class="wrap">
    <p class="eyebrow center">LES BONNES ADRESSES DU QUARTIER</p><h2 class="section-title">Vos prochaines découvertes</h2>
    <p class="section-subtitle">De vraies cuisines, tout près de chez vous.</p>
    <div class="discover-toolbar"><button class="restaurants-filter" type="button" data-filter="all">Tous les restaurants <span class="count-muted">${count}</span></button>
      <label class="sort-control"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-8 2v4"></path></svg><select aria-label="Trier les restaurants"><option>Recommandés</option><option>Mieux notés</option><option>Plus rapides</option><option>Livraison gratuite</option></select></label>
    </div>${listings}
  </div></section>`;
}
component('restaurant-grid', renderRestaurantGrid);

component('flavor-grid', () => `
  <section class="flavours section" id="saveurs"><div class="wrap">
    <p class="eyebrow center">LA GOURMANDISE PARLE TOUTES LES LANGUES</p><h2 class="section-title">Les saveurs qu’on aime</h2>
    <p class="section-subtitle">Des inspirations à retrouver selon les menus de nos partenaires.</p>
    <div class="flavour-grid">${flavors.map(([title, image, alt]) => `
      <a class="flavour-card reveal" href="#restaurants" data-flavor="${title}"><div class="food-photo"><img src="${asset(image)}" alt="${alt}" width="280" height="275" loading="lazy" /></div><small>Cuisine locale</small><h3>${title}</h3><span>Explorer les restaurants <b>→</b></span></a>`).join('')}</div>
    <p class="photo-note">Photos d’inspiration. Les plats disponibles sont ceux des menus partenaires.</p>
  </div></section>`);

component('marquee-band', () => {
  const phrase = `<span>DU GOÛT, PAS DE COMPLICATIONS</span><i aria-hidden="true">✳</i><span>UN QUARTIER À LA FOIS</span><i aria-hidden="true">✳</i><span>LES VRAIES SAVEURS D’ABIDJAN</span><i aria-hidden="true">✳</i>`;
  return `<div class="promise-bar" aria-label="Du goût, pas de complications. Un quartier à la fois. Les vraies saveurs d’Abidjan."><div class="marquee-track"><div class="marquee-group">${phrase}</div><div class="marquee-group" aria-hidden="true">${phrase}</div></div></div>`;
});

component('brand-story', () => `
  <section class="story section" id="esprit"><div class="wrap story-layout">
    <div class="story-art reveal"><img class="story-main" src="${asset('story-meal.webp')}" alt="Poisson et crevettes en sauce" width="520" height="360" loading="lazy" /><div class="story-burger"><img src="${asset('burger-card.webp')}" alt="Burger maison" width="140" height="180" loading="lazy" /></div></div>
    <div class="story-copy reveal"><p class="eyebrow">BIENVENUE CHEZ TONMENU</p><h2>Les bonnes cuisines<br />font les bons quartiers.</h2>
      <p>Une braise qui crépite, une recette qu’on se transmet, une adresse qu’on recommande aux amis. C’est cette cuisine-là qu’on veut rapprocher de vous.</p>
      <p>TonMenu commence à Yopougon, avec une idée simple : donner aux restaurants d’ici une place dans votre quotidien. Rien que de la restauration. Et beaucoup de gourmandise.</p>
      <a class="button button-red" href="#restaurants">Trouver ma prochaine adresse <span>→</span></a>
    </div>
  </div></section>`);

component('benefits-row', () => `
  <section class="how section" id="comment" aria-label="Comment fonctionne TonMenu"><div class="wrap how-grid">
    <article class="reveal"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 14h22v14H5zM3 14l3-8h20l3 8M10 28v-8h12v8M10 11h.1M16 11h.1M22 11h.1"></path></svg><h3>Une cuisine qui vous plaît</h3><p>Découvrez les restaurants<br />et leurs spécialités.</p></article>
    <article class="reveal"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 14h22l-2 14H7L5 14ZM3 14h26M12 9l8-5m-7 5 8-5"></path></svg><h3>Un menu à votre goût</h3><p>Choisissez vos plats<br />et composez votre panier.</p></article>
    <article class="reveal"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="6" width="22" height="22" rx="2"></rect><path d="M5 11h22M19 19h4"></path></svg><h3>Vos habitudes de paiement</h3><p>Choisissez votre opérateur.<br />Mobile Money simulé pour le moment.</p></article>
    <article class="reveal"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="8" cy="23" r="4"></circle><circle cx="25" cy="23" r="4"></circle><path d="m8 23 7-12 5 12H8Zm7-12h7m-2 0 5-5m-11 5 5 12"></path></svg><h3>Le quartier à votre porte</h3><p>Consultez le statut de préparation<br />depuis votre commande.</p></article>
  </div></section>`);

component('install-band', () => `
  <section class="app-promo" id="installation"><div class="wrap promo-layout">
    <div class="promo-copy reveal"><p class="eyebrow">L’APPÉTIT N’ATTEND PAS.</p><h2>Votre quartier.<br />Votre menu.<br /><strong>Dans votre poche.</strong></h2>
      <p>Gardez TonMenu sur votre écran d’accueil.<br />Pas de téléchargement dans un store, juste un clic.</p>
      <button class="button button-dark" id="installButton"><span aria-hidden="true">⇩</span> Installer TonMenu</button><small>PWA · Android, iPhone et ordinateur</small>
    </div>
    <img src="${asset('phone-food.webp')}" alt="Aperçu de l’application TonMenu sur téléphone" class="promo-art" width="460" height="430" loading="lazy" />
    <span class="round-badge" aria-label="Toujours à portée de main">TOUJOURS<br /><strong>à portée<br />de main.</strong></span>
  </div></section>`);

component('partner-cta', () => `
  <section class="partner section" id="partenaires"><div class="wrap partner-layout reveal"><div>
    <p class="eyebrow">VOTRE TALENT MÉRITE D’ÊTRE DÉCOUVERT</p><h2>Vous cuisinez. Le quartier se régale.</h2>
    <p>Un menu en ligne, des commandes et votre propre QR code.<br />Rejoignez TonMenu, simplement.</p>
  </div><a href="mailto:partenaires@tonmenu.ci" class="button button-red">Devenir partenaire <span>↗</span></a></div></section>`);

component('photo-strip', () => `
  <div class="photo-ribbon" role="group" aria-label="Quelques plats de nos cuisines partenaires">${photos.map((image) => `<img src="${asset(image)}" alt="" width="300" height="170" loading="lazy" />`).join('')}</div>`);

component('site-footer', () => `
  <footer class="site-footer" id="aide"><div class="wrap footer-grid">
    <div class="footer-brand"><a class="footer-logo" href="#accueil" aria-label="TonMenu, accueil"><img class="brand-logo-footer" src="${asset('logo-footer.png')}" alt="TonMenu" width="190" height="38" loading="lazy" /></a>
      <p>Les bonnes adresses d’ici.<br />Les saveurs qu’on aime.<br />Le quartier, en quelques clics.</p><p class="location"><span aria-hidden="true">⌖</span> Yopougon · Abidjan · Côte d’Ivoire</p>
    </div>
    <div><h3>À la carte</h3><a href="#cuisines">Maquis</a><a href="#cuisines">Grillades / Rôtisserie</a><a href="#cuisines">Attiéké &amp; Aloco</a><a href="#cuisines">Cuisine africaine (autre)</a></div>
    <div><h3>À vos côtés</h3><a href="#restaurants">Mes commandes</a><a href="#restaurants">Mes bonnes adresses</a><a href="#aide">Aide &amp; questions</a><a href="#partenaires">Espace partenaire</a><a href="/pro/courier.html">Devenir livreur</a></div>
    <div><h3>Un petit creux ?</h3><p>Votre prochain bon repas<br />n’est jamais bien loin.</p><a href="#installation" class="button button-red footer-button">Installer l’application <span aria-hidden="true">⇩</span></a><small>Sans compte pour commander.<br />Paiements simulés dans cette version.</small></div>
  </div><div class="wrap footer-bottom"><span>© 2026 TonMenu. Votre repas préféré, en quelques clics.</span><span>Orange Money · MTN MoMo · Moov Money</span></div></footer>`);

const toast = document.querySelector('#toast');
let toastTimer;
function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

let selectedCategory = 'all';
function selectCategory(slug, label) {
  selectedCategory = slug;
  document.querySelectorAll('.category-tile').forEach((button) => {
    const active = button.dataset.category === slug;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('selected', active);
  });
  const all = slug === 'all';
  document.querySelectorAll('.restaurant-card').forEach((card) => { card.hidden = !all && card.dataset.category !== slug; });
  const emptyMessage = document.querySelector('#emptyMessage');
  if (emptyMessage) emptyMessage.textContent = all
    ? 'Nous préparons les premières bonnes adresses de Yopougon. Vous avez un restaurant ? Faites découvrir votre cuisine.'
    : `Nous préparons les premières bonnes adresses pour ${label}. Vous avez un restaurant ? Faites découvrir votre cuisine.`;
  document.querySelector('#restaurants')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-modal]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.modal)?.showModal()));
document.querySelectorAll('.modal').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
document.querySelector('#addressForm')?.addEventListener('submit', (event) => {
  event.preventDefault(); const value = document.querySelector('#addressInput').value.trim(); if (!value) return;
  document.querySelector('#addressLabel').textContent = value; document.querySelector('#addressModal').close(); notify(`Adresse enregistrée : ${value}`);
});
document.querySelector('#searchForm')?.addEventListener('submit', (event) => {
  event.preventDefault(); const input = document.querySelector('#searchInput'); const query = input.value.trim().toLocaleLowerCase('fr');
  const matches = categories.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase('fr').includes(query));
  document.querySelectorAll('.category-tile').forEach((tile) => { tile.hidden = Boolean(query) && !matches.some((item) => item.slug === tile.dataset.category); });
  const noResults = document.querySelector('.no-categories'); if (noResults) noResults.hidden = !query || matches.length > 0;
  document.querySelector('#cuisines')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (query && matches.length === 0) notify(`Aucune cuisine trouvée pour « ${input.value.trim()} ».`);
});
document.querySelectorAll('[data-filter="all"]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.category-tile').forEach((tile) => { tile.hidden = false; });
  const noResults = document.querySelector('.no-categories'); if (noResults) noResults.hidden = true;
  selectCategory('all', '');
}));
document.querySelectorAll('.category-tile').forEach((button) => button.addEventListener('click', () => {
  const item = categories.find((category) => category.slug === button.dataset.category);
  if (item) selectCategory(item.slug, item.title);
}));
document.querySelectorAll('.restaurants-filter').forEach((button) => button.addEventListener('click', () => selectCategory('all', '')));
document.querySelector('.sort-control select')?.addEventListener('change', (event) => {
  const list = document.querySelector('.restaurant-card-grid');
  if (!list) return;
  const cards = [...list.children];
  const mode = event.currentTarget.value;
  cards.sort((a, b) => mode === 'Mieux notés' ? Number(b.dataset.rating) - Number(a.dataset.rating)
    : mode === 'Plus rapides' ? Number(a.dataset.eta) - Number(b.dataset.eta)
    : mode === 'Livraison gratuite' ? Number(b.dataset.free) - Number(a.dataset.free) : 0);
  cards.forEach((card) => list.append(card));
});
document.querySelectorAll('.flavour-card').forEach((card) => card.addEventListener('click', () => {
  const title = card.dataset.flavor; const related = categories.find((item) => item.title.toLocaleLowerCase('fr').includes(title.split(' ')[0].toLocaleLowerCase('fr')));
  if (related) selectCategory(related.slug, related.title); else { document.querySelector('#restaurants')?.scrollIntoView({ behavior: 'smooth' }); notify(`Les adresses « ${title} » arrivent bientôt.`); }
}));

document.querySelectorAll('.modal').forEach((dialog) => dialog.addEventListener('close', () => dialog.querySelector('form')?.reset()));

let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; });
document.querySelector('#installButton')?.addEventListener('click', async () => {
  if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; }
  else notify('Pour installer TonMenu, choisissez « Ajouter à l’écran d’accueil » dans le menu de votre navigateur.');
});

const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.08 }) : null;
document.querySelectorAll('.reveal').forEach((element) => revealObserver ? revealObserver.observe(element) : element.classList.add('is-visible'));

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

async function loadSharedRestaurants() {
  const apiBase = String(window.TONMENU_API_BASE_URL || '').replace(/\/+$/, '');
  if (!apiBase) return;
  try {
    const response = await fetch(`${apiBase}/api/restaurants`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const payload = await response.json();
    const allowedCategories = new Set(categories.map((item) => item.slug));
    restaurantRecords = (Array.isArray(payload.restaurants) ? payload.restaurants : []).map((r) => ({
      id: String(r.id || ''), name: String(r.name || ''), cuisine: String(r.cuisine || 'Cuisine locale'),
      category: allowedCategories.has(r.category) ? r.category : 'maquis', image: validAsset(r.image),
      ratingValue: Number(r.rating) || 0, rating: Number(r.rating) ? Number(r.rating).toFixed(1) : 'Nouveau',
      eta: Number(r.eta) || 25, fee: `${Number(r.delivery_fee) || 0} F`, freeDelivery: Boolean(r.free_delivery),
    }));
    const grid = document.querySelector('restaurant-grid');
    if (grid) {
      grid.innerHTML = renderRestaurantGrid();
      grid.querySelector('.restaurants-filter')?.addEventListener('click', () => selectCategory('all', ''));
      grid.querySelector('.sort-control select')?.addEventListener('change', (event) => {
        const list = grid.querySelector('.restaurant-card-grid'); if (!list) return;
        const cards = [...list.children], mode = event.currentTarget.value;
        cards.sort((a,b) => mode === 'Mieux notés' ? Number(b.dataset.rating)-Number(a.dataset.rating) : mode === 'Plus rapides' ? Number(a.dataset.eta)-Number(b.dataset.eta) : mode === 'Livraison gratuite' ? Number(b.dataset.free)-Number(a.dataset.free) : 0);
        cards.forEach(card => list.append(card));
      });
    }
    const total = restaurantRecords.length;
    document.querySelectorAll('.pill-count,.count-muted').forEach((el) => { el.textContent = String(total); });
    document.querySelectorAll('.category-tile').forEach((tile) => {
      const available = restaurantRecords.filter((r) => r.category === tile.dataset.category).length;
      const status = tile.querySelector('.category-status');
      if (status) status.textContent = available ? `${available} restaurant${available > 1 ? 's' : ''}` : 'Bientôt';
    });
  } catch (error) {
    console.warn('TonMenu API indisponible ; le contenu local reste affiché.', error);
  }
}
window.addEventListener('load', loadSharedRestaurants, { once: true });
