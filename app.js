'use strict';

const photos = [
  { src: 'assets/juegos.png', caption: 'Área infantil · imagen provisional' },
  { src: 'assets/jardin-comun.png', caption: 'Jardines y áreas comunes · imagen provisional' },
  { src: 'assets/jardin-residencial.png', caption: 'Jardín residencial · imagen provisional' },
  { src: 'assets/gimnasio.png', caption: 'Gimnasio · imagen provisional' },
  { src: 'assets/alberca.png', caption: 'Alberca · imagen provisional' }
];
const galleries = {
  development: photos,
  office: [{ src: 'assets/despacho.png', caption: 'FRAXEL Inmobiliaria · imagen del despacho' }]
};
// Sustituir estos valores al recibir las fichas definitivas. null significa dato pendiente.
const properties = [
  { id: 'casa-01', name: 'Modelo Residencial FRAXEL', location: 'Av. del Vidrio 11, Centro Urbano, 54760 Cuautitlán Izcalli, Méx.', image: 'assets/casa-modelo-fraxel.jpeg', photoIndex: 2, price: 1100000, area: 147, bedrooms: 2, bathrooms: 1 },
  { id: 'casa-02', name: 'Modelo Residencial FRAXEL', location: 'Av. del Vidrio 11, Centro Urbano, 54760 Cuautitlán Izcalli, Méx.', image: 'assets/casa-modelo-fraxel.jpeg', photoIndex: 1, price: 1100000, area: 147, bedrooms: 2, bathrooms: 1 },
  { id: 'casa-03', name: 'Modelo Residencial FRAXEL', location: 'Av. del Vidrio 11, Centro Urbano, 54760 Cuautitlán Izcalli, Méx.', image: 'assets/casa-modelo-fraxel.jpeg', photoIndex: 2, price: 1100000, area: 147, bedrooms: 2, bathrooms: 1 },
  { id: 'casa-04', name: 'Modelo Residencial FRAXEL', location: 'Av. del Vidrio 11, Centro Urbano, 54760 Cuautitlán Izcalli, Méx.', image: 'assets/casa-modelo-fraxel.jpeg', photoIndex: 1, price: 1100000, area: 147, bedrooms: 2, bathrooms: 1 }
];
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
document.querySelector('#load-map').addEventListener('click', () => {
  const frame = document.querySelector('.map-stage iframe');
  frame.src = frame.dataset.src;
  frame.hidden = false;
});
const grid = document.querySelector('#property-grid');
const filterForm = document.querySelector('#property-filters');
const filterError = document.querySelector('#filter-error');
const clearFilters = document.querySelector('#clear-filters');
const emptyState = document.querySelector('#empty-state');
const sortSelect = document.querySelector('#sort-properties');
const normalized = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
let activeCriteria = {};

function cardMarkup(property) {
  return `<article class="property-card" id="${property.id}">
    <button class="card-photo" type="button" data-gallery="development" data-photo="${property.photoIndex}" aria-label="Ampliar imagen provisional de ${property.name}">
      <img src="${property.image}" alt="Imagen provisional de jardín para la ficha ${property.name}" loading="lazy" width="400" height="250"><span class="card-badge">Ficha provisional</span>
    </button>
    <div class="card-body"><h3>${property.name}</h3><p class="card-price">${property.price === null ? 'Precio por confirmar' : money.format(property.price) + ' MXN'}</p>
      <dl class="card-meta"><div><dt>Superficie</dt><dd>${property.area === null ? 'Por confirmar' : property.area + ' m²'}</dd></div><div><dt>Habitaciones</dt><dd>${property.bedrooms ?? 'Por confirmar'}</dd></div><div><dt>Baños</dt><dd>${property.bathrooms ?? 'Por confirmar'}</dd></div></dl>
      <p class="card-description">Fotografía de referencia del desarrollo.</p><a class="card-contact" href="#contacto">Consultar información ↗</a>
    </div>
  </article>`;
}

function matchesCriteria(property) {
  const c = activeCriteria;
  const textMatches = !c.location || normalized(property.name + ' ' + property.location).includes(c.location);
  const numberMatches = [
    ['price', 'minPrice', (value, limit) => value >= limit],
    ['price', 'maxPrice', (value, limit) => value <= limit],
    ['area', 'minArea', (value, limit) => value >= limit],
    ['bedrooms', 'bedrooms', (value, limit) => value >= limit],
    ['bathrooms', 'bathrooms', (value, limit) => value >= limit]
  ].every(([field, criterion, compare]) => c[criterion] === undefined || (property[field] !== null && compare(property[field], c[criterion])));
  return textMatches && numberMatches;
}

function renderProperties() {
  const list = properties.filter(matchesCriteria).sort((a, b) => sortSelect.value === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  grid.innerHTML = list.map(cardMarkup).join('');
  const filtered = Object.values(activeCriteria).some(value => value !== '' && value !== undefined);
  clearFilters.hidden = !filtered;
  emptyState.hidden = list.length !== 0;
  grid.hidden = list.length === 0;
  document.querySelector('#result-count').textContent = `${list.length} ${list.length === 1 ? 'ficha provisional' : 'fichas provisionales'}`;
  document.querySelector('#empty-message').textContent = Object.keys(activeCriteria).some(key => key !== 'location' && activeCriteria[key] !== undefined)
    ? 'Los precios, las superficies y las características todavía están por confirmar. Puedes consultar todas las fichas mientras se completa esta información.'
    : 'Prueba con “Casa 01” o “FRAXEL”, o limpia los filtros para volver a ver las fichas.';
}

function resetFilters() {
  filterForm.reset();
  activeCriteria = {};
  filterError.hidden = true;
  renderProperties();
}

filterForm.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(filterForm);
  const criteria = { location: normalized(String(values.get('location') || '')) };
  for (const field of ['minPrice', 'maxPrice', 'minArea', 'bedrooms', 'bathrooms']) {
    const value = values.get(field);
    criteria[field] = value === '' ? undefined : Number(value);
  }
  if (criteria.minPrice !== undefined && criteria.maxPrice !== undefined && criteria.minPrice > criteria.maxPrice) {
    filterError.textContent = 'El presupuesto máximo debe ser mayor o igual al mínimo.';
    filterError.hidden = false;
    filterForm.elements.maxPrice.focus();
    return;
  }
  filterError.hidden = true;
  activeCriteria = criteria;
  renderProperties();
  document.querySelector('#desarrollo').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});
clearFilters.addEventListener('click', resetFilters);
document.querySelector('#reset-empty').addEventListener('click', resetFilters);
sortSelect.addEventListener('change', renderProperties);
renderProperties();

const viewer = document.querySelector('#image-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerCaption = document.querySelector('#viewer-caption');
const viewerPosition = document.querySelector('#viewer-position');
let currentGallery = [];
let currentPhoto = 0;
let opener = null;

function showPhoto() {
  const photo = currentGallery[currentPhoto];
  viewerImage.src = photo.src;
  viewerImage.alt = photo.caption;
  viewerCaption.textContent = photo.caption;
  viewerPosition.textContent = `${currentPhoto + 1} / ${currentGallery.length}`;
  const hasMultiple = currentGallery.length > 1;
  document.querySelector('.viewer-prev').hidden = !hasMultiple;
  document.querySelector('.viewer-next').hidden = !hasMultiple;
}

function stepPhoto(direction) {
  currentPhoto = (currentPhoto + direction + currentGallery.length) % currentGallery.length;
  showPhoto();
}

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-gallery]');
  if (!button) return;
  currentGallery = galleries[button.dataset.gallery];
  currentPhoto = Number(button.dataset.photo);
  opener = button;
  showPhoto();
  viewer.showModal();
  document.body.style.overflow = 'hidden';
});
document.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
document.querySelector('.viewer-prev').addEventListener('click', () => stepPhoto(-1));
document.querySelector('.viewer-next').addEventListener('click', () => stepPhoto(1));
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepPhoto(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(1); }
});
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('close', () => {
  document.body.style.overflow = '';
  if (opener?.isConnected) opener.focus({ preventScroll: true });
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
const siteHeader = document.querySelector('.site-header');
function updateHeader() {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  navigation.classList.toggle('is-open', expanded);
});
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const activeSections = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    navigation.querySelectorAll('a').forEach(link => {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-12% 0px -65% 0px' });
['inicio', 'desarrollo', 'nosotros', 'contacto'].forEach(id => activeSections.observe(document.getElementById(id)));

