         document.addEventListener('DOMContentLoaded', function () {
            var parentPillMap = {
               'kids-birthday': 'birthday',
               'custom-request': 'birthday',
               'betty-confetti': 'birthday',
               'car-boot': 'birthday',
               'home': 'birthday',
               'hotel': 'birthday',
               'university': 'birthday',
               'workplace': 'birthday',
               'anniversary-choice': 'anniversary',
               'anniversary-home': 'anniversary',
               'anniversary-hotel': 'anniversary',
               'anniversary-car': 'anniversary',
               'occasion-choice': 'surprise',
               'hall': 'surprise',
               'valentine': 'surprise',
               'baby-shower': 'surprise',
               'proposal': 'surprise',
               'christmas': 'festival',
               'new-year': 'festival',
               'easter': 'festival'
            };
            var quickLinkConfig = {
               all: {
                  title: 'All Quick Links',
                  links: [
                     { label: 'Birthday Custom Request', href: 'booking.html' },
                     { label: 'Kids Birthday', filter: 'kids-birthday' },
                     { label: 'Betty And Confetti', filter: 'betty-confetti' },
                     { label: 'Car Boot', filter: 'car-boot' },
                     { label: 'Surprise At University', filter: 'university' },
                     { label: 'Surprise At Workplace', filter: 'workplace' },
                     { label: 'Anniversary Custom Request', href: 'booking.html' },
                     { label: 'Anniversary At Home', filter: 'anniversary-home' },
                     { label: 'Anniversary Car Boot', filter: 'anniversary-car' },
                     { label: 'Occasion Custom Request', href: 'booking.html' },
                     { label: 'Valentine\'s Day', filter: 'valentine' },
                     { label: 'Baby Shower', filter: 'baby-shower' },
                     { label: 'Proposal', filter: 'proposal' },
                     { label: 'Christmas', filter: 'christmas' },
                     { label: 'New Year', filter: 'new-year' },
                     { label: 'Easter', filter: 'easter' }
                  ]
               },
                birthday: {
                   title: 'Birthday Quick Links',
                   links: [
                      { label: 'Custom Request', href: 'booking.html' },
                      { label: 'Kids Birthday', filter: 'kids-birthday' },
                      { label: 'Betty And Confetti', filter: 'betty-confetti' },
                      { label: 'Car Boot', filter: 'car-boot' },
                      { label: 'Surprise At University', filter: 'university' },
                      { label: 'Surprise At Workplace', filter: 'workplace' }
                   ]
                },
               anniversary: {
                  title: 'Anniversary Quick Links',
                  links: [
                     { label: 'Custom Request', href: 'booking.html' },
                     { label: 'Decoration At Home', filter: 'anniversary-home' },
                     { label: 'Car Boot Decoration', filter: 'anniversary-car' }
                  ]
               },
               surprise: {
                  title: 'Your Occasion Quick Links',
                  links: [
                     { label: 'Custom Request', href: 'booking.html' },
                     { label: 'Valentine\'s Day', filter: 'valentine' },
                     { label: 'Baby Shower', filter: 'baby-shower' },
                     { label: 'Proposal', filter: 'proposal' }
                  ]
               },
               festival: {
                  title: 'Festival Quick Links',
                  links: [
                     { label: 'Christmas Decorations', filter: 'christmas' },
                     { label: 'New Year', filter: 'new-year' },
                     { label: 'Easter', filter: 'easter' }
                  ]
               }
            };
            function getUrlFilter() {
               var params = new URLSearchParams(window.location.search);
               return params.get('filter') || 'all';
            }
            function normalizeFilter(value) {
               var normalized = (value || 'all').toString().trim().toLowerCase();
               return normalized || 'all';
            }
            function getParentCategory(filter) {
               var normalized = normalizeFilter(filter);
               if (document.querySelector('.filter-pill[data-filter="' + normalized + '"]')) {
                  return normalized;
               }
               return parentPillMap[normalized] || 'all';
            }
            function renderQuickLinks(filter) {
               var container = document.querySelector('.package-subfilter-links');
               var title = document.querySelector('.package-subfilter-title');
               var wrap = document.querySelector('.package-subfilter-wrap');
               if (!container || !title || !wrap) {
                  return;
               }
               var normalized = normalizeFilter(filter);
               var parentCategory = getParentCategory(normalized);
               if (parentCategory === 'all') {
                  wrap.classList.add('d-none');
                  container.innerHTML = '';
                  return;
               }
               wrap.classList.remove('d-none');
               var config = quickLinkConfig[parentCategory] || quickLinkConfig.all;
               title.textContent = config.title;
               container.innerHTML = '';
               config.links.forEach(function (item) {
                  var link = document.createElement('a');
                  link.className = 'package-subfilter-link';
                  link.textContent = item.label;
                  if (item.filter) {
                     link.href = 'packages.html?filter=' + encodeURIComponent(item.filter);
                     link.dataset.filter = item.filter;
                     if (item.filter === normalized) {
                        link.classList.add('active');
                     }
                  } else {
                     link.href = item.href || '#';
                     link.classList.add('is-booking');
                  }
                  container.appendChild(link);
               });
            }
            function setActiveFilter(filter) {
               var activeFilter = getParentCategory(filter);
               document.querySelectorAll('.filter-pill').forEach(function (pill) {
                  pill.classList.toggle('active', pill.dataset.filter === activeFilter);
               });
            }
            function showPackages(filter) {
               var cards = document.querySelectorAll('.package-card-item');
               var visibleCount = 0;
               var normalized = normalizeFilter(filter);
               cards.forEach(function (card) {
                  var category = normalizeFilter(card.dataset.category);
                  var audience = (card.dataset.audience || '').split(',').map(function (value) {
                     return normalizeFilter(value);
                  }).filter(Boolean);
                  var tags = (card.dataset.tags || '').split(',').map(function (value) {
                     return normalizeFilter(value);
                  }).filter(Boolean);
                  var visible = normalized === 'all' || category === normalized || audience.indexOf(normalized) !== -1 || tags.indexOf(normalized) !== -1;
                  card.style.display = visible ? 'block' : 'none';
                  if (visible) {
                     visibleCount += 1;
                  }
               });
               var noResults = document.querySelector('.no-results');
               if (noResults) {
                  noResults.classList.toggle('d-none', visibleCount > 0);
               }
            }
            function normalizeImagePath(value) {
               return (value || '').toString().trim();
            }
            function imageComparable(value) {
               return normalizeImagePath(value).split('?')[0].toLowerCase();
            }
            function hashString(value) {
               var text = (value || '').toString();
               var hash = 0;
               for (var i = 0; i < text.length; i += 1) {
                  hash = ((hash << 5) - hash) + text.charCodeAt(i);
                  hash |= 0;
               }
               return Math.abs(hash);
            }
            function getSecondaryImageForCard(card, primarySrc) {
               var explicit = normalizeImagePath(card.dataset.packageImage2 || card.dataset.packageImageAlt || '');
               if (explicit) {
                  return explicit;
               }
               var category = normalizeFilter(card.dataset.category);
               var pools = {
                  birthday: ['images/birthday_demo.jpg', 'images/bandc20.jpg', 'images/car_boot1.png', 'images/Nemo_inspired.jpg'],
                  anniversary: ['images/anniversary_demo.jpeg', 'images/At_home2.jpg', 'images/At_home3.jpg', 'images/At_home1.jpg'],
                  surprise: ['images/propose_1.jpg', 'images/val_2.jpg', 'images/baby_shower2.jpg', 'images/propose_3.jpg'],
                  festival: ['images/christmas_demo.jpeg', 'images/festive6.jpeg', 'images/festive7.jpeg', 'images/festive5.jpeg'],
                  all: ['images/demo1.jpeg', 'images/demo2.jpeg', 'images/demo.jpeg', 'images/banner-img1.png']
               };
               var pool = pools[category] || pools.all;
               var seed = hashString(card.dataset.packageId || card.dataset.packageName || primarySrc || category);
               for (var offset = 0; offset < pool.length; offset += 1) {
                  var candidate = pool[(seed + offset) % pool.length];
                  if (imageComparable(candidate) !== imageComparable(primarySrc)) {
                     return candidate;
                  }
               }
               return pool[0] || '';
            }
            function getEffectivePackagePrice(card) {
               if (!card) {
                  return 0;
               }
               var base = Number(card.dataset.packageBasePrice || 0);
               var price = Number(card.dataset.packagePrice || 0);
               var effectivePrice = 0;
               if (Number.isFinite(base) && base > 0) {
                  effectivePrice = base;
               } else if (Number.isFinite(price) && price > 0) {
                  effectivePrice = price;
               } else {
                  var priceLabel = card.querySelector('.package-price');
                  effectivePrice = Number((priceLabel ? priceLabel.textContent : '').replace(/[^0-9.]/g, '')) || 0;
               }
               return effectivePrice;
            }
            function isSingleSlidePriceTier(card) {
               var effectivePrice = getEffectivePackagePrice(card);
               return effectivePrice > 0 && effectivePrice <= 149;
            }
            function isPremiumSecondSlideTier(card) {
               var effectivePrice = getEffectivePackagePrice(card);
               return effectivePrice >= 150;
            }
            function isHomeTrendingPackageCard(card) {
               return !!(card && card.closest('[data-home-trending]'));
            }
            function getPackageSlideImages(card, primarySrc) {
               var images = [];
               var seen = Object.create(null);
               function pushImage(src) {
                  var clean = normalizeImagePath(src);
                  if (!clean) {
                     return;
                  }
                  var key = imageComparable(clean);
                  if (!key || seen[key]) {
                     return;
                  }
                  seen[key] = true;
                  images.push(clean);
               }
               pushImage(primarySrc);
               if (isHomeTrendingPackageCard(card)) {
                  return images;
               }
               if (isSingleSlidePriceTier(card)) {
                  return images;
               }
               if (isPremiumSecondSlideTier(card) && !isHomeTrendingPackageCard(card)) {
                  pushImage('images/why_betty.png');
               }
               pushImage(card.dataset.packageImage2 || card.dataset.packageImageAlt || '');
               pushImage(card.dataset.packageImage3 || '');
               if (images.length < 2) {
                  pushImage(getSecondaryImageForCard(card, images[0] || primarySrc));
               }
               return images;
            }
            function setPackageMediaSlide(media, index) {
               var slides = media.querySelectorAll('.package-media-slide');
               var dots = media.querySelectorAll('.package-media-dot');
               var total = slides.length;
               if (!total) {
                  return;
               }
               var next = ((index % total) + total) % total;
               media.dataset.mediaSlideIndex = String(next);
               slides.forEach(function (slide, slideIndex) {
                  slide.classList.toggle('is-active', slideIndex === next);
               });
               dots.forEach(function (dot, dotIndex) {
                  var isActive = dotIndex === next;
                  dot.classList.toggle('is-active', isActive);
                  dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
               });
            }
            function initPackageMediaSwipe(media) {
               var touchStartX = 0;
               var touchStartY = 0;
               var touchCurrentX = 0;
               var touchCurrentY = 0;
               var isTracking = false;
               var swipeThreshold = 42;
               function rememberSwipe() {
                  media.dataset.lastSwipeAt = String(Date.now());
               }
               media.addEventListener('touchstart', function (event) {
                  if (event.touches.length !== 1 || event.target.closest('.package-media-nav, .package-media-dots, .package-media-dot, .package-label')) {
                     isTracking = false;
                     return;
                  }
                  touchStartX = event.touches[0].clientX;
                  touchStartY = event.touches[0].clientY;
                  touchCurrentX = touchStartX;
                  touchCurrentY = touchStartY;
                  isTracking = true;
               }, { passive: true });
               media.addEventListener('touchmove', function (event) {
                  if (!isTracking || event.touches.length !== 1) {
                     return;
                  }
                  touchCurrentX = event.touches[0].clientX;
                  touchCurrentY = event.touches[0].clientY;
               }, { passive: true });
               media.addEventListener('touchend', function () {
                  if (!isTracking) {
                     return;
                  }
                  isTracking = false;
                  var deltaX = touchCurrentX - touchStartX;
                  var deltaY = touchCurrentY - touchStartY;
                  if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
                     return;
                  }
                  var current = Number(media.dataset.mediaSlideIndex || 0);
                  setPackageMediaSlide(media, deltaX < 0 ? current + 1 : current - 1);
                  rememberSwipe();
               }, { passive: true });
               media.addEventListener('touchcancel', function () {
                  isTracking = false;
               }, { passive: true });
            }
            function wasRecentPackageMediaSwipe(media) {
               return !!media && Date.now() - Number(media.dataset.lastSwipeAt || 0) < 450;
            }
            function initPackageMediaSlider() {
               document.querySelectorAll('.package-card .package-media').forEach(function (media) {
                  if (media.dataset.sliderReady === '1') {
                     return;
                  }
                  var card = media.closest('.package-card');
                  var primaryImage = media.querySelector('img');
                  if (!card || !primaryImage) {
                     return;
                  }
                  var primarySrc = normalizeImagePath(primaryImage.getAttribute('src'));
                  if (!primarySrc) {
                     primarySrc = getSecondaryImageForCard(card, '');
                     if (!primarySrc) {
                        return;
                     }
                     primaryImage.setAttribute('src', primarySrc);
                  }
                  var slideImages = getPackageSlideImages(card, primarySrc);
                  card.dataset.packageSlideImages = JSON.stringify(slideImages);
                  if (slideImages.length < 2) {
                     media.dataset.sliderReady = '1';
                     return;
                  }
                  var primaryAlt = primaryImage.getAttribute('alt') || (card.dataset.packageName || 'Package image');
                  var track = document.createElement('div');
                  track.className = 'package-media-track';
                  slideImages.forEach(function (imageSrc, imageIndex) {
                     var slide = document.createElement('div');
                     slide.className = 'package-media-slide' + (imageIndex === 0 ? ' is-active' : '');
                     if (imageIndex === 0) {
                        slide.appendChild(primaryImage);
                     } else {
                        var extraImg = document.createElement('img');
                        extraImg.src = imageSrc;
                        extraImg.alt = primaryAlt + ' view ' + (imageIndex + 1);
                        extraImg.loading = 'lazy';
                        slide.appendChild(extraImg);
                     }
                     track.appendChild(slide);
                  });
                  media.insertBefore(track, media.firstChild);

                  var navPrev = document.createElement('button');
                  navPrev.type = 'button';
                  navPrev.className = 'package-media-nav is-prev';
                  navPrev.setAttribute('aria-label', 'Previous image');
                  navPrev.textContent = '<';
                  var navNext = document.createElement('button');
                  navNext.type = 'button';
                  navNext.className = 'package-media-nav is-next';
                  navNext.setAttribute('aria-label', 'Next image');
                  navNext.textContent = '>';
                  media.appendChild(navPrev);
                  media.appendChild(navNext);

                  var dots = document.createElement('div');
                  dots.className = 'package-media-dots';
                  for (var i = 0; i < slideImages.length; i += 1) {
                     var dot = document.createElement('button');
                     dot.type = 'button';
                     dot.className = 'package-media-dot' + (i === 0 ? ' is-active' : '');
                     dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
                     dot.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
                     (function (dotIndex) {
                        dot.addEventListener('click', function (event) {
                           event.preventDefault();
                           event.stopPropagation();
                           setPackageMediaSlide(media, dotIndex);
                        });
                     })(i);
                     dots.appendChild(dot);
                  }
                  media.appendChild(dots);

                  navPrev.addEventListener('click', function (event) {
                     event.preventDefault();
                     event.stopPropagation();
                     var current = Number(media.dataset.mediaSlideIndex || 0);
                     setPackageMediaSlide(media, current - 1);
                  });
                  navNext.addEventListener('click', function (event) {
                     event.preventDefault();
                     event.stopPropagation();
                     var current = Number(media.dataset.mediaSlideIndex || 0);
                     setPackageMediaSlide(media, current + 1);
                  });
                  [navPrev, navNext, dots].forEach(function (element) {
                     element.addEventListener('click', function (event) {
                        event.stopPropagation();
                     });
                  });

                  initPackageMediaSwipe(media);
                  media.dataset.mediaSlideIndex = '0';
                  media.dataset.sliderReady = '1';
               });
            }
            function parseJsonArray(value) {
               if (!value) {
                  return [];
               }
               try {
                  var parsed = JSON.parse(value);
                  return Array.isArray(parsed) ? parsed : [];
               } catch (error) {
                  return [];
               }
            }
            function getPackageDisplayName(card) {
               if (!card) {
                  return '';
               }
               var titleNode = card.querySelector('.package-card-top h3, h3');
               var titleText = titleNode ? titleNode.textContent.trim() : '';
               return titleText || card.dataset.packageName || 'Package';
            }
            function ensurePackageGalleryCloseBehavior(galleryModal) {
               if (!galleryModal || typeof window.jQuery === 'undefined' || galleryModal.dataset.outsideCloseReady === '1') {
                  return;
               }
               galleryModal.addEventListener('click', function (event) {
                  if (event.target.closest('.package-gallery-close')) {
                     window.jQuery(galleryModal).modal('hide');
                     return;
                  }
                  if (event.target.closest('#packages_lightbox_slider img, .carousel-control-prev, .carousel-control-next, .modal-header .close')) {
                     return;
                  }
                  window.jQuery(galleryModal).modal('hide');
               });
               document.addEventListener('click', function (event) {
                  if (!galleryModal.classList.contains('show')) {
                     return;
                  }
                  if (!event.target.classList.contains('modal-backdrop')) {
                     return;
                  }
                  window.jQuery(galleryModal).modal('hide');
               });
               galleryModal.dataset.outsideCloseReady = '1';
            }
            var packageDetailFallbacks = {
               'finding-nemo-inspired-package': {
                  addons: [
                     { name: 'Grass flooring', price: 20 },
                     { name: 'Personalised name sign', price: 25 },
                     { name: 'LED number display', price: 20 },
                     { name: 'BettyVerse branded signage', price: 20 },
                     { name: 'Cake plinth display', price: 25 },
                     { name: 'Extra balloon styling', price: 30 },
                     { name: 'Photographer', price: 60 }
                  ]
               },
               'sofia-the-first-inspired': {
                  addons: [
                     { name: 'Personalised name sign', price: 25 },
                     { name: 'LED number display', price: 20 },
                     { name: 'Candy cart styling', price: 35 },
                     { name: 'Cake plinth display', price: 25 },
                     { name: 'Private photographer', price: 60 }
                  ]
               },
               'mickey-mouse-themed-package': {
                  addons: [
                     { name: 'Personalised name sign', price: 25 },
                     { name: 'Additional LED numbers', price: 15 },
                     { name: 'Cake plinth display', price: 25 },
                     { name: 'Extra balloon styling', price: 30 },
                     { name: 'Themed party favours setup', price: 40 },
                     { name: 'Private photographer', price: 80 }
                  ]
               },
               'spider-man-themed-package': {
                  addons: [
                     { name: 'Personalised name sign', price: 25 },
                     { name: 'Additional LED numbers', price: 15 },
                     { name: 'Cake plinth display', price: 25 },
                     { name: 'Extra balloon styling', price: 30 },
                     { name: 'Themed party favours setup', price: 40 },
                     { name: 'Private photographer', price: 80 }
                  ]
               },
               'betty-confetti-hoop-essentials': {
                  addons: [
                     { name: 'Happy Birthday Foil Balloon', price: 10 },
                     { name: 'Custom Name Decal (on hoop)', price: 15 },
                     { name: 'Extra Balloon Clusters (fuller look)', price: 15 },
                     { name: 'LED Lights (warm glow)', price: 15 }
                  ]
               },
               'betty-confetti-neon-luxe-arch': {
                  addons: [
                     { name: 'Custom Name Neon Sign', price: 30 },
                     { name: 'Ceiling drop down balloon', price: 15 }
                  ]
               },
               'car-boot-luxe-boot-reveal': {
                  addons: [
                     { name: 'Personalized photo prints', price: 30 },
                     { name: 'Premium gift wrapping', price: 25 },
                     { name: 'Extra florals or balloons', price: 45 }
                  ]
               },
               'anniversary-home-intimate-living-room-experience': {
                  addons: [
                     { name: 'Flower bouquet', price: 50 },
                     { name: 'Custom message sign', price: 30 },
                     { name: 'Extra balloons', price: 45 }
                  ]
               },
               'anniversary-home-luxe-bedscape': {
                  addons: [
                     { name: 'Neon signage', price: 50 },
                     { name: 'Fresh florals', price: 50 },
                     { name: 'Personalized message balloons', price: 30 }
                  ]
               },
               'valentine-cupids-luxury-suite': {
                  addons: [
                     { name: 'Custom-made acrylic cake box', price: 35 },
                     { name: 'Personalized name vinyl on balloons', price: 25 },
                     { name: 'Chilled bottle of premium Champagne', price: 60 },
                     { name: 'Heart-shaped chocolate truffle box', price: 20 }
                  ]
               },
               'christmas-dummy-1': {
                  addons: [
                     { name: 'Larger tree upgrade', price: 70 },
                     { name: 'Custom colour theme', price: 50 },
                     { name: 'Fireplace styling', price: 60 },
                     { name: 'Extra decor pieces', price: 40 }
                  ]
               }
            };
            function getPackageDetailFallback(card) {
               if (!card) {
                  return {};
               }
               return packageDetailFallbacks[card.dataset.packageId || ''] || {};
            }
            function collectPackageDetailData(card) {
               var displayName = getPackageDisplayName(card);
               var fallback = getPackageDetailFallback(card);
               var overview = card.querySelector('.package-details-overview');
               var summaryNode = overview ? overview.querySelector('.package-summary') : card.querySelector('.package-summary');
               var highlightsNode = overview ? overview.querySelector('.package-highlights') : card.querySelector('.package-highlights');
               var images = parseJsonArray(card.dataset.packageSlideImages);
               var addons = Array.prototype.slice.call(card.querySelectorAll('.package-addon-input')).map(function (input) {
                  return {
                     name: input.dataset.addonName || 'Add-on',
                     price: Number(input.dataset.addonPrice || 0)
                  };
               }).filter(function (addon) {
                  return addon.name;
               });
               if (!images.length && card.dataset.packageImage) {
                  images = [card.dataset.packageImage];
               }
               return {
                  id: card.dataset.packageId || '',
                  name: displayName || card.dataset.packageName || 'Package',
                  category: card.dataset.packageCategory || '',
                  price: Number(card.dataset.packageFinalPrice || card.dataset.packagePrice || card.dataset.packageBasePrice || 0),
                  basePrice: Number(card.dataset.packageBasePrice || card.dataset.packagePrice || 0),
                  addonTotal: Number(card.dataset.packageAddonTotal || 0),
                  selectedAddons: parseSelectedAddons(card),
                  image: card.dataset.packageImage || (images[0] || ''),
                  images: images,
                  summary: card.dataset.packageSummary || (summaryNode ? summaryNode.textContent.trim() : ''),
                  highlights: highlightsNode ? Array.prototype.slice.call(highlightsNode.querySelectorAll('li')).map(function (item) {
                     return item.textContent.trim();
                  }).filter(Boolean) : [],
                  addons: addons.length ? addons : (fallback.addons || [])
               };
            }
            function openPackageDetailPage(card) {
               if (!card) {
                  return;
               }
               var detailData = collectPackageDetailData(card);
               try {
                  window.localStorage.setItem('bettyverse-selected-package', JSON.stringify(detailData));
               } catch (error) {
                  // Navigation still works; the detail page will show its fallback state.
               }
               window.location.href = 'package-detail.html?id=' + encodeURIComponent(detailData.id);
            }
            function initPackageDetailNavigation() {
               document.querySelectorAll('.package-card').forEach(function (card) {
                  card.addEventListener('click', function (event) {
                     if (event.target.closest('.package-media-nav, .package-media-dots, .package-media-dot, .add-cart, .package-addon-input, .package-addon-option')) {
                        return;
                     }
                     var swipedMedia = event.target.closest('.package-media');
                     if (wasRecentPackageMediaSwipe(swipedMedia)) {
                        event.preventDefault();
                        return;
                     }
                     event.preventDefault();
                     openPackageDetailPage(card);
                  });
                  card.querySelectorAll('.package-media, .package-card-front, .package-label').forEach(function (element) {
                     element.setAttribute('tabindex', '0');
                     element.addEventListener('keydown', function (event) {
                        if (event.key !== 'Enter' && event.key !== ' ') {
                           return;
                        }
                        event.preventDefault();
                        openPackageDetailPage(card);
                     });
                  });
               });
            }
            function initPackageLightboxModal() {
               if (typeof window.jQuery === 'undefined') {
                  return;
               }
               var modal = document.getElementById('packages_lightbox');
               var title = document.getElementById('packages_lightbox_title');
               var slider = document.getElementById('packages_lightbox_slider');
               var sliderInner = slider ? slider.querySelector('.carousel-inner') : null;
               if (!modal || !slider || !sliderInner) {
                  return;
               }
               var $modal = window.jQuery(modal);
               var $slider = window.jQuery(slider);
               $slider.carousel({
                  interval: false,
                  ride: false,
                  pause: true,
                  wrap: true
               });
               ensurePackageGalleryCloseBehavior(modal);
               function renderSlides(images, packageName) {
                  sliderInner.innerHTML = '';
                  images.forEach(function (src, index) {
                     var item = document.createElement('div');
                     item.className = 'carousel-item' + (index === 0 ? ' active' : '');
                     var img = document.createElement('img');
                     img.className = 'd-block w-100';
                     img.src = src;
                     img.alt = (packageName || 'Package') + ' image ' + (index + 1);
                     item.appendChild(img);
                     sliderInner.appendChild(item);
                  });
                  if (title) {
                     title.textContent = packageName || 'Package Gallery';
                  }
               }
               document.querySelectorAll('.package-card .package-media').forEach(function (media) {
                  media.addEventListener('click', function (event) {
                     if (event.target.closest('.package-media-nav, .package-media-dots, .package-media-dot, .package-label')) {
                        return;
                     }
                     if (wasRecentPackageMediaSwipe(media)) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                     }
                     event.preventDefault();
                     event.stopPropagation();
                     var card = media.closest('.package-card');
                     if (!card) {
                        return;
                     }
                     var packageName = getPackageDisplayName(card);
                     var images = parseJsonArray(card.dataset.packageSlideImages);
                     if (!images.length) {
                        var fallbackSrc = normalizeImagePath(card.dataset.packageImage || '');
                        if (fallbackSrc) {
                           images = [fallbackSrc];
                        }
                     }
                     if (!images.length) {
                        return;
                     }
                     renderSlides(images, packageName);
                     $modal.one('shown.bs.modal', function () {
                        $slider.carousel(0);
                     });
                     $modal.modal('show');
                  });
               });
            }
            function initPackageDetailOverlay() {
               var overlay = document.createElement('div');
               overlay.className = 'package-detail-overlay';
               overlay.setAttribute('aria-hidden', 'true');
               overlay.innerHTML =
                  '<div class="package-detail-backdrop" data-detail-close></div>' +
                  '<section class="package-detail-panel" role="dialog" aria-modal="true" aria-labelledby="package_detail_title" aria-describedby="package_detail_summary">' +
                     '<button class="package-detail-close" type="button" data-detail-close aria-label="Close package details">&times;</button>' +
                     '<div class="package-detail-layout">' +
                        '<div class="package-detail-gallery">' +
                           '<button class="package-detail-image-button" type="button" data-detail-gallery aria-label="Open package image gallery">' +
                              '<img data-detail-image src="" alt="">' +
                           '</button>' +
                           '<div class="package-detail-thumbs" data-detail-thumbs aria-label="Package images"></div>' +
                        '</div>' +
                        '<div class="package-detail-content">' +
                           '<span class="package-detail-category" data-detail-category></span>' +
                           '<h3 id="package_detail_title" data-detail-title>Package details</h3>' +
                           '<div class="package-detail-price" data-detail-price>&pound;0</div>' +
                           '<div id="package_detail_summary" class="package-detail-overview" data-detail-overview></div>' +
                           '<div class="package-detail-addons" data-detail-addons-wrap>' +
                              '<p class="package-details-title">Select optional add-ons</p>' +
                              '<div class="package-addon-list" data-detail-addons></div>' +
                              '<div class="package-addon-summary"><span>Add-on total</span><strong data-detail-addon-total>&pound;0</strong></div>' +
                           '</div>' +
                        '</div>' +
                     '</div>' +
                     '<div class="package-detail-actions">' +
                        '<button class="details-toggle" type="button" data-detail-close>Close</button>' +
                        '<button class="add-cart" type="button" data-add-to-cart data-detail-add-cart>Add to Cart</button>' +
                     '</div>' +
                  '</section>';
               document.body.appendChild(overlay);

               var panel = overlay.querySelector('.package-detail-panel');
               var title = overlay.querySelector('[data-detail-title]');
               var category = overlay.querySelector('[data-detail-category]');
               var price = overlay.querySelector('[data-detail-price]');
               var image = overlay.querySelector('[data-detail-image]');
               var imageButton = overlay.querySelector('[data-detail-gallery]');
               var thumbs = overlay.querySelector('[data-detail-thumbs]');
               var overview = overlay.querySelector('[data-detail-overview]');
               var content = overlay.querySelector('.package-detail-content');
               var addonWrap = overlay.querySelector('[data-detail-addons-wrap]');
               var addonList = overlay.querySelector('[data-detail-addons]');
               var addonTotal = overlay.querySelector('[data-detail-addon-total]');
               var addButton = overlay.querySelector('[data-detail-add-cart]');
               var activeImages = [];
               var activeImageIndex = 0;
               var previousFocus = null;

               function getFocusableElements() {
                  return Array.prototype.slice.call(overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(function (element) {
                     return element.offsetParent !== null || element === document.activeElement;
                  });
               }
               function openDetailGallery(startIndex) {
                  var galleryModal = document.getElementById('packages_lightbox');
                  var galleryTitle = document.getElementById('packages_lightbox_title');
                  var gallerySlider = document.getElementById('packages_lightbox_slider');
                  var galleryInner = gallerySlider ? gallerySlider.querySelector('.carousel-inner') : null;
                  if (!galleryModal || !gallerySlider || !galleryInner || typeof window.jQuery === 'undefined' || !activeImages.length) {
                     return;
                  }
                  galleryInner.innerHTML = '';
                  activeImages.forEach(function (src, index) {
                     var item = document.createElement('div');
                     item.className = 'carousel-item' + (index === startIndex ? ' active' : '');
                     var galleryImage = document.createElement('img');
                     galleryImage.className = 'd-block w-100';
                     galleryImage.src = src;
                     galleryImage.alt = (title.textContent || 'Package') + ' image ' + (index + 1);
                     item.appendChild(galleryImage);
                     galleryInner.appendChild(item);
                  });
                  if (galleryTitle) {
                     galleryTitle.textContent = title.textContent || 'Package Gallery';
                  }
                  ensurePackageGalleryCloseBehavior(galleryModal);
                  window.jQuery(galleryModal).one('shown.bs.modal', function () {
                     window.jQuery(gallerySlider).carousel(startIndex || 0);
                  });
                  window.jQuery(galleryModal).modal('show');
               }
               function setActiveDetailImage(index) {
                  if (!activeImages.length) {
                     return;
                  }
                  activeImageIndex = Math.max(0, Math.min(index, activeImages.length - 1));
                  image.src = activeImages[activeImageIndex];
                  image.alt = (title.textContent || 'Package') + ' image ' + (activeImageIndex + 1);
                  thumbs.querySelectorAll('.package-detail-thumb').forEach(function (thumb, thumbIndex) {
                     var isActive = thumbIndex === activeImageIndex;
                     thumb.classList.toggle('is-active', isActive);
                     thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                  });
               }
               function renderDetailImages(card) {
                  activeImages = parseJsonArray(card.dataset.packageSlideImages);
                  if (!activeImages.length && card.dataset.packageImage) {
                     activeImages = [card.dataset.packageImage];
                  }
                  thumbs.innerHTML = '';
                  activeImages.forEach(function (src, index) {
                     var thumb = document.createElement('button');
                     thumb.type = 'button';
                     thumb.className = 'package-detail-thumb';
                     thumb.setAttribute('aria-label', 'Show image ' + (index + 1));
                     thumb.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
                     var thumbImage = document.createElement('img');
                     thumbImage.src = src;
                     thumbImage.alt = '';
                     thumb.appendChild(thumbImage);
                     thumb.addEventListener('click', function () {
                        setActiveDetailImage(index);
                     });
                     thumbs.appendChild(thumb);
                  });
                  overlay.classList.toggle('has-single-image', activeImages.length < 2);
                  setActiveDetailImage(0);
               }
               function syncDetailTotals(card) {
                  updateCardPriceWithAddons(card);
                  price.textContent = formatPounds(Number(card.dataset.packageFinalPrice || card.dataset.packagePrice || 0));
                  addonTotal.textContent = formatPounds(Number(card.dataset.packageAddonTotal || 0));
               }
               function renderDetailAddons(card) {
                  addonList.innerHTML = '';
                  card.querySelectorAll('.package-addon-option').forEach(function (option) {
                     var sourceInput = option.querySelector('.package-addon-input');
                     var clone = option.cloneNode(true);
                     var cloneInput = clone.querySelector('.package-addon-input');
                     if (!sourceInput || !cloneInput) {
                        return;
                     }
                     cloneInput.checked = sourceInput.checked;
                     cloneInput.addEventListener('change', function () {
                        sourceInput.checked = cloneInput.checked;
                        sourceInput.dispatchEvent(new Event('change', { bubbles: true }));
                        syncDetailTotals(card);
                     });
                     addonList.appendChild(clone);
                  });
                  addonWrap.hidden = addonList.children.length === 0;
               }
               function renderDetailOverview(card) {
                  var sourceOverview = card.querySelector('.package-details-overview');
                  overview.innerHTML = '';
                  if (sourceOverview) {
                     overview.appendChild(sourceOverview.cloneNode(true));
                     return;
                  }
                  if (card.dataset.packageSummary) {
                     var summary = document.createElement('p');
                     summary.className = 'package-summary';
                     summary.textContent = card.dataset.packageSummary;
                     overview.appendChild(summary);
                  }
               }
               function closeDetailOverlay() {
                  overlay.classList.remove('is-open');
                  overlay.setAttribute('aria-hidden', 'true');
                  document.body.classList.remove('package-detail-open');
                  if (previousFocus && typeof previousFocus.focus === 'function') {
                     previousFocus.focus();
                  }
               }
               function openDetailOverlay(card, trigger) {
                  if (!card) {
                     return;
                  }
                  previousFocus = trigger || document.activeElement;
                  var displayName = getPackageDisplayName(card);
                  card.dataset.packageName = displayName || card.dataset.packageName || '';
                  title.textContent = displayName || 'Package details';
                  category.textContent = card.dataset.packageCategory || '';
                  addButton.dataset.packageSourceId = card.dataset.packageId || '';
                  addButton.textContent = 'Add to Cart';
                  addButton.classList.remove('is-added');
                  addButton.dataset.defaultLabel = 'Add to Cart';
                  renderDetailImages(card);
                  renderDetailOverview(card);
                  renderDetailAddons(card);
                  syncDetailTotals(card);
                  overlay.setAttribute('aria-hidden', 'false');
                  overlay.classList.add('is-open');
                  document.body.classList.add('package-detail-open');
                  panel.scrollTop = 0;
                  if (content) {
                     content.scrollTop = 0;
                  }
                  window.requestAnimationFrame(function () {
                     var firstFocus = overlay.querySelector('.package-detail-close');
                     if (firstFocus) {
                        firstFocus.focus();
                     }
                  });
               }
               overlay.addEventListener('click', function (event) {
                  if (event.target.closest('[data-detail-close]')) {
                     event.preventDefault();
                     closeDetailOverlay();
                  }
               });
               overlay.addEventListener('keydown', function (event) {
                  if (!overlay.classList.contains('is-open')) {
                     return;
                  }
                  if (event.key === 'Escape') {
                     event.preventDefault();
                     closeDetailOverlay();
                     return;
                  }
                  if (event.key !== 'Tab') {
                     return;
                  }
                  var focusable = getFocusableElements();
                  if (!focusable.length) {
                     return;
                  }
                  var first = focusable[0];
                  var last = focusable[focusable.length - 1];
                  if (event.shiftKey && document.activeElement === first) {
                     event.preventDefault();
                     last.focus();
                  } else if (!event.shiftKey && document.activeElement === last) {
                     event.preventDefault();
                     first.focus();
                  }
               });
               imageButton.addEventListener('click', function () {
                  openDetailGallery(activeImageIndex);
               });
               document.querySelectorAll('.package-card').forEach(function (card) {
                  card.addEventListener('click', function (event) {
                     if (event.target.closest('.package-media-nav, .package-media-dots, .package-media-dot')) {
                        return;
                     }
                     event.preventDefault();
                     openDetailOverlay(card, event.currentTarget);
                  });
                  card.querySelectorAll('.package-media, .package-card-front, .package-label').forEach(function (element) {
                     element.setAttribute('tabindex', '0');
                     element.addEventListener('keydown', function (event) {
                        if (event.key !== 'Enter' && event.key !== ' ') {
                           return;
                        }
                        event.preventDefault();
                        openDetailOverlay(card, element);
                     });
                  });
               });
            }
            function setCardDetailsState(card, expanded, immediate) {
               if (!card) {
                  return;
               }
               var toggle = card.querySelector('.details-toggle');
               var details = card.querySelector('.package-details');
               if (!toggle || !details) {
                  return;
               }

               card.classList.toggle('is-expanded', expanded);
               toggle.textContent = expanded ? 'Close' : 'Details';
               toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                details.setAttribute('aria-hidden', expanded ? 'false' : 'true');

               if (immediate) {
                  details.classList.toggle('is-open', expanded);
                  details.style.maxHeight = expanded ? 'none' : '0px';
                  return;
               }

               if (expanded) {
                  details.classList.add('is-open');
                  details.style.maxHeight = details.scrollHeight + 'px';
                  return;
               }

               if (details.style.maxHeight === 'none' || !details.style.maxHeight) {
                  details.style.maxHeight = details.scrollHeight + 'px';
               }
               window.requestAnimationFrame(function () {
                  details.classList.remove('is-open');
                  details.style.maxHeight = '0px';
               });
            }
            function initPackageDetailsToggle() {
               function collapseOtherCards(activeCard) {
                  document.querySelectorAll('.package-card.is-expanded').forEach(function (otherCard) {
                     if (otherCard === activeCard) {
                        return;
                     }
                     setCardDetailsState(otherCard, false, false);
                  });
               }

               document.querySelectorAll('.package-card').forEach(function (card, index) {
                  var toggle = card.querySelector('.details-toggle');
                  var addToCartButton = card.querySelector('.add-cart');
                  var details = card.querySelector('.package-details');
                  var ratingScore = card.dataset.packageRating || '';
                  if (!toggle || !details) {
                     return;
                  }
                  if (!ratingScore) {
                     var ratingSeed = hashString((card.dataset.packageId || card.dataset.packageName || String(index)) + '|rating');
                     var normalizedRating = (ratingSeed % 2401) / 2400; // 0..1
                     var computedRating = 4.1 + (normalizedRating * 0.9); // 4.1..5.0
                     ratingScore = computedRating.toFixed(1);
                     card.dataset.packageRating = ratingScore;
                  }
                  if (addToCartButton) {
                     addToCartButton.textContent = 'Add to Cart';
                     addToCartButton.setAttribute('aria-label', 'Add to cart');
                  }
                  if (!card.querySelector('.package-rating')) {
                     var front = document.createElement('div');
                     front.className = 'package-card-front';
                     var rating = document.createElement('div');
                     rating.className = 'package-rating';
                     var numericRating = Number(ratingScore);
                     if (!Number.isFinite(numericRating)) {
                        numericRating = 4.8;
                     }
                     if (numericRating < 0) {
                        numericRating = 0;
                     }
                     if (numericRating > 5) {
                        numericRating = 5;
                     }
                     var starsHtml = '';
                     var starIndex = 0;
                     for (starIndex = 0; starIndex < 5; starIndex += 1) {
                        var starFill = numericRating - starIndex;
                        if (starFill < 0) {
                           starFill = 0;
                        }
                        if (starFill > 1) {
                           starFill = 1;
                        }
                        starsHtml +=
                           '<span class="package-rating-star">' +
                              '<i class="fa fa-star-o" aria-hidden="true"></i>' +
                              '<span class="package-rating-star-fill" style="width:' + (starFill * 100).toFixed(2) + '%;">' +
                                 '<i class="fa fa-star" aria-hidden="true"></i>' +
                              '</span>' +
                           '</span>';
                     }
                     rating.setAttribute('aria-label', numericRating.toFixed(1) + ' out of 5 stars');
                     rating.innerHTML =
                        '<span class="package-rating-stars" aria-hidden="true">' +
                           starsHtml +
                        '</span>' +
                        '<span>' + numericRating.toFixed(1) + '</span>';
                     card.insertBefore(front, card.querySelector('.package-summary'));
                     front.appendChild(card.querySelector('.package-card-top'));
                     front.appendChild(rating);
                     front.appendChild(card.querySelector('.package-actions'));
                  }
                  if (!details.id) {
                     details.id = 'package-details-' + (index + 1);
                  }
                  var summaryBlock = card.querySelector('.package-summary');
                  var highlightsBlock = card.querySelector('.package-highlights');
                  if ((summaryBlock || highlightsBlock) && !details.querySelector('.package-details-overview')) {
                     var detailsOverview = document.createElement('div');
                     detailsOverview.className = 'package-details-overview';
                     if (summaryBlock) {
                        detailsOverview.appendChild(summaryBlock);
                     }
                     if (highlightsBlock) {
                        detailsOverview.appendChild(highlightsBlock);
                     }
                     var detailsTitle = details.querySelector('.package-details-title');
                     if (detailsTitle) {
                        details.insertBefore(detailsOverview, detailsTitle);
                     } else {
                        details.appendChild(detailsOverview);
                     }
                  }
                  var topRow = card.querySelector('.package-card-top');
                  var priceTag = topRow ? topRow.querySelector('.package-price') : null;
                  var ratingBlock = card.querySelector('.package-rating');
                  if (topRow && priceTag && ratingBlock && !card.querySelector('.package-meta-grid')) {
                     var metaGrid = document.createElement('div');
                     metaGrid.className = 'package-meta-grid';
                     topRow.insertAdjacentElement('afterend', metaGrid);
                     metaGrid.appendChild(priceTag);
                     metaGrid.appendChild(ratingBlock);
                  }
                  toggle.classList.remove('details-toggle--inline');
                  toggle.setAttribute('aria-controls', details.id);
                  setCardDetailsState(card, false, true);
                  details.addEventListener('transitionend', function (event) {
                     if (event.propertyName !== 'max-height') {
                        return;
                     }
                     if (details.classList.contains('is-open')) {
                        details.style.maxHeight = 'none';
                     }
                  });
                  toggle.addEventListener('click', function (event) {
                     event.preventDefault();
                     event.stopPropagation();
                     return;
                     var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                     if (!isExpanded) {
                        collapseOtherCards(card);
                     }
                     setCardDetailsState(card, !isExpanded, false);
                  });
                  card.addEventListener('click', function (event) {
                     return;
                     if (event.target.closest('.package-actions, .package-details, .package-label')) {
                        return;
                     }
                     var isExpanded = card.classList.contains('is-expanded');
                     if (!isExpanded) {
                        collapseOtherCards(card);
                     }
                     setCardDetailsState(card, !isExpanded, false);
                  });
                  card.querySelectorAll('.package-addon-input, .package-addon-option, .add-cart').forEach(function (element) {
                     element.addEventListener('click', function (event) {
                        event.stopPropagation();
                     });
                  });
               });
            }
            function updateUrl(filter) {
               var url = new URL(window.location);
               if (filter === 'all') {
                  url.searchParams.delete('filter');
               } else {
                  url.searchParams.set('filter', filter);
               }
               window.history.replaceState({}, '', url);
            }
            function applyFilter(filter) {
               var normalized = normalizeFilter(filter);
               setActiveFilter(normalized);
               showPackages(normalized);
               updateUrl(normalized);
               renderQuickLinks(normalized);
            }
            function formatPounds(value) {
               var amount = Number(value || 0);
               var fixed = amount.toFixed(2);
               if (fixed.slice(-3) === '.00') {
                  return '\u00A3' + fixed.slice(0, -3);
               }
               return '\u00A3' + fixed;
            }
            function parseSelectedAddons(card) {
               var inputs = card.querySelectorAll('.package-addon-input:checked');
               return Array.prototype.slice.call(inputs).map(function (input) {
                  var addonPrice = Number(input.dataset.addonPrice || 0);
                  return {
                     name: input.dataset.addonName || 'Add-on',
                     price: Number.isFinite(addonPrice) ? addonPrice : 0
                  };
               });
            }
            function getCardBasePrice(card) {
               var explicitBase = Number(card.dataset.packageBasePrice || 0);
               if (explicitBase > 0) {
                  return explicitBase;
               }
               var fromData = Number(card.dataset.packagePrice || 0);
               if (fromData > 0) {
                  return fromData;
               }
               var priceLabel = card.querySelector('.package-price');
               if (!priceLabel) {
                  return 0;
               }
               return Number((priceLabel.textContent || '').replace(/[^0-9.]/g, '')) || 0;
            }
            function updateCardPriceWithAddons(card) {
               var basePrice = getCardBasePrice(card);
               var selectedAddons = parseSelectedAddons(card);
               var addonTotal = selectedAddons.reduce(function (total, addon) {
                  return total + (Number(addon.price) || 0);
               }, 0);
               var finalPrice = basePrice + addonTotal;
               var priceTag = card.querySelector('.package-price');
               var addonTotalTag = card.querySelector('.package-addon-total');
               card.dataset.packageBasePrice = basePrice.toFixed(2);
               card.dataset.packageAddonTotal = addonTotal.toFixed(2);
               card.dataset.packageFinalPrice = finalPrice.toFixed(2);
               card.dataset.packagePrice = finalPrice.toFixed(2);
               card.dataset.packageSelectedAddons = JSON.stringify(selectedAddons);
               if (priceTag) {
                  priceTag.textContent = formatPounds(finalPrice);
               }
               if (addonTotalTag) {
                  addonTotalTag.textContent = formatPounds(addonTotal);
               }
            }
            function initPackageAddonSelection() {
               document.querySelectorAll('.package-card').forEach(function (card) {
                  var basePrice = getCardBasePrice(card);
                  card.dataset.packageBasePrice = basePrice.toFixed(2);
                  card.dataset.packageAddonTotal = '0.00';
                  card.dataset.packageSelectedAddons = '[]';
                  card.querySelectorAll('.package-addon-input').forEach(function (input) {
                     input.addEventListener('input', function () {
                        updateCardPriceWithAddons(card);
                     });
                     input.addEventListener('change', function () {
                        updateCardPriceWithAddons(card);
                     });
                  });
                  updateCardPriceWithAddons(card);
               });
            }
            function initWhyFooterTyping() {
               var target = document.querySelector('.why-panel-footer em');
               if (!target) {
                  return;
               }
               var phraseItems = [
                  { text: 'Unforgettable Memories', color: '#c76b00' },
                  { text: 'Beautiful Surprises', color: '#2f7a43' },
                  { text: 'Elegant Celebrations', color: '#1f1f1f' },
                  { text: 'Meaningful Moments', color: '#c3466f' },
                  { text: 'Premium Experiences', color: '#6f1f32' }
               ];
               var current = target.textContent.trim() || phraseItems[0].text;
               if (!phraseItems.some(function (item) { return item.text === current; })) {
                  phraseItems.unshift({ text: current, color: '#6f1f32' });
               }
               function findItemByText(text) {
                  var match = phraseItems[0];
                  for (var i = 0; i < phraseItems.length; i += 1) {
                     if (phraseItems[i].text === text) {
                        match = phraseItems[i];
                        break;
                     }
                  }
                  return match;
               }
               var phraseItem = findItemByText(current);
               var phrase = phraseItem.text;
               var charIndex = 0;
               var isDeleting = false;
               target.style.color = phraseItem.color;
               target.textContent = '';
               function pickNextPhrase() {
                  var candidates = phraseItems.filter(function (item) {
                     return item.text !== phrase;
                  });
                  return candidates[Math.floor(Math.random() * candidates.length)];
               }
               function tick() {
                  target.classList.toggle('is-deleting', isDeleting);
                  target.classList.remove('is-paused');
                  if (isDeleting) {
                     charIndex = Math.max(0, charIndex - 1);
                  } else {
                     charIndex = Math.min(phrase.length, charIndex + 1);
                  }
                  target.textContent = phrase.slice(0, charIndex);
                  var delay = isDeleting ? (34 + Math.floor(Math.random() * 28)) : (56 + Math.floor(Math.random() * 34));
                  if (!isDeleting && charIndex === phrase.length) {
                     target.classList.add('is-paused');
                     delay = 1200 + Math.floor(Math.random() * 700);
                     isDeleting = true;
                  } else if (isDeleting && charIndex === 0) {
                     phraseItem = pickNextPhrase();
                     phrase = phraseItem.text;
                     target.style.color = phraseItem.color;
                     isDeleting = false;
                     target.classList.add('is-paused');
                     delay = 220 + Math.floor(Math.random() * 180);
                  }
                  window.setTimeout(tick, delay);
               }
               window.setTimeout(tick, 120);
            }
            document.querySelectorAll('.filter-pill').forEach(function (pill) {
               pill.addEventListener('click', function () {
                  applyFilter(this.dataset.filter);
               });
            });
            var quickLinksContainer = document.querySelector('.package-subfilter-links');
            if (quickLinksContainer) {
               quickLinksContainer.addEventListener('click', function (event) {
                  var quickLink = event.target.closest('.package-subfilter-link[data-filter]');
                  if (!quickLink) {
                     return;
                  }
                  event.preventDefault();
                  applyFilter(quickLink.dataset.filter);
               });
            }
            initPackageMediaSlider();
            initPackageDetailsToggle();
            initPackageAddonSelection();
            initPackageDetailNavigation();
            initWhyFooterTyping();
            applyFilter(normalizeFilter(getUrlFilter()));
         });
      
