const ccThemeRole = Shopify.theme.role ?? 'unknown';
if (!localStorage.getItem('cc-settings-loaded') || localStorage.getItem('cc-settings-loaded') !== ccThemeRole) {
  fetch('https://check.cleancanvas.co.uk/', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    mode: 'cors',
    body: new URLSearchParams({
      shop: Shopify.shop,
      theme: theme.info?.name ?? '',
      version: theme.info?.version ?? '',
      role: ccThemeRole,
      contact: document.querySelector('script[src*=theme-editor][data-contact]')?.dataset.contact
    })
  })
    .then((response) => {
      if (response.ok) {
        localStorage.setItem('cc-settings-loaded', ccThemeRole);
      }
    });
}

document.addEventListener('shopify:section:load', (evt) => {
  document.querySelectorAll('#menu-disclosure').forEach((el) => { el.open = true; });
  window.checkForBannerBehindHeader();

  // Set header and viewport height CSS variable values.
  if (evt.target.classList.contains('cc-header')) {
    setTimeout(() => {
      window.setHeaderHeight();
      evt.target.querySelector('page-header').checkInlineNavWidth();
      evt.target.querySelector('menu-drawer').checkMenuPadding();
    }, 200);
  }

  // Load and evaluate section specific scripts immediately.
  evt.target.querySelectorAll('script[src]').forEach((script) => {
    const s = document.createElement('script');
    s.src = script.src;
    document.body.appendChild(s);
  });

  // If loaded section is a pop-up, open it.
  if (evt.target.matches('.cc-pop-up')) {
    customElements.whenDefined('pop-up').then(() => {
      evt.target.querySelector('pop-up').open();
    });
  }

  // If loaded section is an age verifier, open it.
  if (evt.target.querySelector('age-verification-pop-up')) {
    customElements.whenDefined('age-verification-pop-up').then(() => {
      evt.target.querySelector('age-verification-pop-up').open();
    });
  }

  // Set section-level classes
  evt.target.querySelectorAll('.content-boundary--top, .content-boundary--top-flipped').forEach((el) => {
    const section = el.closest('.shopify-section');
    section.classList.add('has-content-boundary-top');
    if (el.classList.contains('content-boundary--top-flipped')) {
      section.classList.add('has-content-boundary-top--flipped');
    }
  });
});

document.addEventListener('shopify:section:unload', () => {
  window.checkForBannerBehindHeader();
});

document.addEventListener('shopify:section:reorder', () => {
  window.checkForBannerBehindHeader();
});

document.addEventListener('shopify:block:select', (evt) => {
  // If selected block is a slideshow slide, show it and pause autoplay (if enabled).
  if (evt.target.matches('.slideshow__slide')) {
    const slideshow = evt.target.closest('slide-show');

    setTimeout(() => {
      slideshow.setActiveSlide(Number(evt.target.dataset.index));
      slideshow.pauseAutoplay();
    }, 200);
  }

  // If selected block is a slider item, scroll to it.
  if (evt.target.matches('.slider__item')) {
    const carousel = evt.target.closest('carousel-slider');
    if (!carousel.slider) return;

    carousel.slider.scrollTo({
      left: carousel.slides[Array.from(carousel.slides).indexOf(evt.target)].offsetLeft,
      behavior: 'smooth'
    });
  }
});

document.addEventListener('shopify:block:deselect', (evt) => {
  // If deselected block is a slideshow slide, resume autoplay (if enabled).
  if (evt.target.matches('.slideshow__slide')) {
    const slideshow = evt.target.closest('slide-show');

    setTimeout(() => {
      slideshow.resumeAutoplay();
    }, 200);
  }
});

// Debug out custom events
const customEvents = [
  'on:cart:add',
  'on:variant:change',
  'on:line-item:change',
  'on:cart:error',
  'on:cart-drawer:before-open',
  'on:cart-drawer:after-open',
  'on:cart-drawer:after-close',
  'on:quickbuy:before-open',
  'on:quickbuy:after-open',
  'on:quickbuy:after-close',
  'dispatch:cart-drawer:open',
  'dispatch:cart-drawer:refresh',
  'dispatch:cart-drawer:close'
];
customEvents.forEach((event) => {
  document.addEventListener(event, (evt) => {
    if (event.includes('dispatch:cart-drawer') && theme.settings.cartType !== 'drawer') {
      // eslint-disable-next-line
      console.warn(
        'Alchemy Theme: The Cart Drawer is not enabled. To enable it, change Theme Settings > Cart > Cart type.'
      );
    } else {
      // eslint-disable-next-line
      console.info(
        '%cTheme event triggered',
        'background: #000; color: #bada55',
        event,
        evt.detail
      );
    }
  });
});
