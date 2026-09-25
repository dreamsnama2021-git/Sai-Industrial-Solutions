/* Sai Industrial Solutions — homepage behaviour (no dependencies) */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG — where enquiries go. Fill ONE of these when you're ready:
       endpoint : URL that accepts a JSON POST (your backend / form service)
       whatsapp : number with country code, digits only, e.g. '919876543210'
     If both are empty the forms run in DEMO mode: nothing is sent, the
     payload is only logged to the browser console.
     ------------------------------------------------------------------ */
  var CONFIG = { endpoint: '', whatsapp: '' };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header ---------- */
  var header = $('#siteHeader');
  function onScroll() { header.classList.toggle('is-sticky', window.scrollY > 120); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var nav = $('#mainNav');
  var navToggle = $('#navToggle');
  function isMobileNav() { return window.getComputedStyle(navToggle).display !== 'none'; }
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  navToggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
  $$('.has-sub > a', nav).forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!isMobileNav()) return;
      e.preventDefault();
      a.parentElement.classList.toggle('is-open');
    });
  });
  $$('a', nav).forEach(function (a) {
    a.addEventListener('click', function () {
      if (isMobileNav() && !a.parentElement.classList.contains('has-sub')) setNav(false);
    });
  });
  window.addEventListener('resize', function () { if (!isMobileNav()) setNav(false); });

  /* ---------- Info side panel ---------- */
  var panel = $('#infoPanel');
  var overlay = $('#overlay');
  function setPanel(open) {
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    overlay.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    if (open) $('#infoClose').focus(); else $('#infoBtn').focus();
  }
  $('#infoBtn').addEventListener('click', function () { setPanel(true); });
  $('#infoClose').addEventListener('click', function () { setPanel(false); });
  overlay.addEventListener('click', function () { setPanel(false); });
  $$('[data-enquire]', panel).forEach(function (b) { b.addEventListener('click', function () { setPanel(false); }); });

  /* ---------- Modals (enquiry + video) ---------- */
  var lastFocus = null;
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function openModal(modal, focusSel) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    var target = (focusSel && $(focusSel, modal)) || $(FOCUSABLE, modal);
    if (target) target.focus();
  }
  function closeModal(modal) {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    if (modal.id === 'videoModal') $('#videoSlot').innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('.modal').forEach(function (modal) {
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) closeModal(modal); });
    $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', function () { closeModal(modal); }); });
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = $$(FOCUSABLE, modal).filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('.modal').forEach(function (m) { if (!m.hidden) closeModal(m); });
    if (panel.classList.contains('is-open')) setPanel(false);
    if (nav.classList.contains('is-open')) setNav(false);
  });

  /* ---------- Enquiry ---------- */
  var enquiryModal = $('#enquiryModal');
  var enquiryForm = $('#enquiryForm');
  var eqNote = $('#eqNote');

  function showNote(el, msg, ok) {
    el.textContent = msg;
    el.hidden = false;
    el.classList.toggle('form-note--ok', !!ok);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-enquire]');
    if (!btn) return;
    var product = btn.getAttribute('data-product') || '';
    var catSection = btn.closest('[data-cat-name]');
    var catName = catSection ? catSection.getAttribute('data-cat-name') : '';
    var select = $('#eqProduct');
    var nameField = $('#eqProductName');
    eqNote.hidden = true;
    select.value = '';
    // try an exact match first (homepage category buttons pass the category name directly)
    $$('option', select).forEach(function (o) { if (o.textContent.trim() === product) select.value = o.textContent; });
    // otherwise fall back to the category this product card lives in
    if (!select.value && catName) {
      $$('option', select).forEach(function (o) { if (o.textContent.trim() === catName) select.value = o.textContent; });
    }
    // a specific product name (not just the category) is tracked separately
    if (nameField) nameField.value = (product && product !== select.value) ? product : '';
    openModal(enquiryModal, '#eqName');
  });

  function send(payload, summary) {
    if (CONFIG.endpoint) {
      return fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return 'sent'; });
    }
    if (CONFIG.whatsapp) {
      window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(summary), '_blank', 'noopener');
      return Promise.resolve('whatsapp');
    }
    console.info('[SIS demo mode] Not sent — set CONFIG in assets/js/main.js', payload);
    return Promise.resolve('demo');
  }

  function markInvalid(field, bad) { field.classList.toggle('is-invalid', bad); field.setAttribute('aria-invalid', String(bad)); }

  enquiryForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = enquiryForm.elements;
    var nameBad = !f.name.value.trim();
    var phoneBad = f.phone.value.replace(/\D/g, '').length < 7;
    var emailBad = f.email.value.trim() !== '' && !/^\S+@\S+\.\S+$/.test(f.email.value.trim());
    markInvalid(f.name, nameBad); markInvalid(f.phone, phoneBad); markInvalid(f.email, emailBad);
    if (nameBad || phoneBad || emailBad) {
      showNote(eqNote, 'Please enter your name, a valid phone number' + (emailBad ? ' and a valid email.' : '.'), false);
      (nameBad ? f.name : phoneBad ? f.phone : f.email).focus();
      return;
    }
    var payload = {
      name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), company: f.company.value.trim(),
      product: f.product.value, productName: f.productName ? f.productName.value.trim() : '',
      quantity: f.quantity.value.trim(), message: f.message.value.trim(), page: location.href
    };
    var summary = 'New product enquiry\n' +
      'Name: ' + payload.name + '\nPhone: ' + payload.phone +
      (payload.email ? '\nEmail: ' + payload.email : '') + (payload.company ? '\nCompany: ' + payload.company : '') +
      (payload.productName ? '\nItem: ' + payload.productName : '') +
      (payload.product ? '\nCategory: ' + payload.product : '') + (payload.quantity ? '\nQuantity: ' + payload.quantity : '') +
      (payload.message ? '\nDetails: ' + payload.message : '');
    send(payload, summary).then(function (mode) {
      if (mode === 'demo') {
        showNote(eqNote, 'Demo mode: the form works but is not connected to email/WhatsApp yet, so nothing was sent.', false);
      } else {
        showNote(eqNote, 'Thank you! Your enquiry has been sent. We will contact you shortly.', true);
        enquiryForm.reset();
      }
    }).catch(function () {
      showNote(eqNote, 'Sorry, something went wrong. Please try again or call us.', false);
    });
  });

  /* ---------- Newsletter ---------- */
  var nl = $('#newsletter');
  nl.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = $('#nlNote');
    var input = $('#nlEmail');
    if (!/^\S+@\S+\.\S+$/.test(input.value.trim())) { showNote(note, 'Please enter a valid email address.', false); input.focus(); return; }
    send({ type: 'newsletter', email: input.value.trim() }, 'Newsletter signup: ' + input.value.trim()).then(function (mode) {
      if (mode === 'demo') showNote(note, 'Demo mode: not connected yet, nothing was saved.', false);
      else { showNote(note, 'Thanks for subscribing!', true); nl.reset(); }
    }).catch(function () { showNote(note, 'Something went wrong. Please try again.', false); });
  });

  /* ---------- Contact page message form (contact.html) ---------- */
  var contactForm = $('#contactForm');
  if (contactForm) {
    var cfNote = $('#cfNote');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = contactForm.elements;
      var nameBad = !f.name.value.trim();
      var phoneBad = f.phone.value.replace(/\D/g, '').length < 7;
      var emailBad = f.email.value.trim() !== '' && !/^\S+@\S+\.\S+$/.test(f.email.value.trim());
      markInvalid(f.name, nameBad); markInvalid(f.phone, phoneBad); markInvalid(f.email, emailBad);
      if (nameBad || phoneBad || emailBad) {
        showNote(cfNote, 'Please enter your name, a valid phone number' + (emailBad ? ' and a valid email.' : '.'), false);
        (nameBad ? f.name : phoneBad ? f.phone : f.email).focus();
        return;
      }
      var payload = {
        type: 'contact', name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(),
        subject: f.subject.value.trim(), message: f.message.value.trim(), page: location.href
      };
      var summary = 'New contact message\n' +
        'Name: ' + payload.name + '\nPhone: ' + payload.phone +
        (payload.email ? '\nEmail: ' + payload.email : '') + (payload.subject ? '\nSubject: ' + payload.subject : '') +
        (payload.message ? '\nMessage: ' + payload.message : '');
      send(payload, summary).then(function (mode) {
        if (mode === 'demo') {
          showNote(cfNote, 'Demo mode: the form works but is not connected to email/WhatsApp yet, so nothing was sent.', false);
        } else {
          showNote(cfNote, 'Thank you! Your message has been sent. We will get back to you shortly.', true);
          contactForm.reset();
        }
      }).catch(function () {
        showNote(cfNote, 'Sorry, something went wrong. Please try again or call us.', false);
      });
    });
  }

  /* ---------- Video lightbox (only on pages that have it) ---------- */
  var playBtn = $('#playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      var src = playBtn.getAttribute('data-video');
      var slot = $('#videoSlot');
      if (!src) {
        slot.innerHTML = '<div class="video-empty"><p>Company video coming soon.<br><small>Add the video link in the <code>data-video</code> attribute of the play button.</small></p></div>';
      } else if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
        slot.innerHTML = '<video class="video-frame" src="' + src + '" controls autoplay playsinline></video>';
      } else {
        slot.innerHTML = '<iframe class="video-frame" src="' + src + '" title="Company video" allow="autoplay; fullscreen" allowfullscreen></iframe>';
      }
      openModal($('#videoModal'), '[data-close]');
    });
  }

  /* ---------- Product search filter (products.html) ---------- */
  var searchInput = $('#productSearch');
  if (searchInput) {
    var searchCount = $('#productSearchCount');
    var searchEmpty = $('#searchEmpty');
    var searchClear = $('#searchClear');
    var allCards = $$('.prow-card[data-name]');
    var catSections = $$('.cat-section[data-cat]');

    function runSearch() {
      var q = searchInput.value.trim().toLowerCase();
      var shown = 0;
      allCards.forEach(function (card) {
        var match = !q || card.getAttribute('data-name').indexOf(q) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      catSections.forEach(function (sec) {
        var anyVisible = $$('.prow-card', sec).some(function (c) { return !c.hidden; });
        sec.hidden = !anyVisible;
      });
      if (searchCount) searchCount.textContent = q ? (shown + (shown === 1 ? ' product found' : ' products found')) : '';
      if (searchEmpty) searchEmpty.hidden = !(q && shown === 0);
    }
    searchInput.addEventListener('input', runSearch);
    if (searchClear) searchClear.addEventListener('click', function () { searchInput.value = ''; runSearch(); searchInput.focus(); });
  }

  /* ---------- Sub-category filters (products.html) ---------- */
  $$('.subcat-grid').forEach(function (grid) {
    var catId = grid.getAttribute('data-subcat-group');
    var target = document.querySelector('.cat-grid[data-subcat-target="' + catId + '"]');
    if (!target) return;
    var cards = $$('.subcat-card', grid);
    function setFilter(sub) {
      $$('.prow-card', target).forEach(function (item) {
        item.hidden = !(sub === 'all' || item.getAttribute('data-subcat') === sub);
      });
      cards.forEach(function (c) {
        c.classList.toggle('is-active', c.getAttribute('data-subcat-filter') === sub);
      });
    }
    cards.forEach(function (c) {
      c.addEventListener('click', function () { setFilter(c.getAttribute('data-subcat-filter')); });
    });
    grid.setSubcatFilter = setFilter;
  });
  $$('[data-subcat-jump]').forEach(function (a) {
    a.addEventListener('click', function () {
      var parts = a.getAttribute('data-subcat-jump').split(':');
      var grid = document.querySelector('.subcat-grid[data-subcat-group="' + parts[0] + '"]');
      if (grid && grid.setSubcatFilter) grid.setSubcatFilter(parts[1]);
    });
  });

  /* ---------- Category pill hover dropdowns (products.html) ---------- */
  $$('.cat-pill-link[data-pill-drop]').forEach(function (link) {
    var drop = document.querySelector('.cat-pill__drop[data-pill-drop-menu="' + link.getAttribute('data-pill-drop') + '"]');
    if (!drop) return;
    var closeTimer = null;
    function open() {
      clearTimeout(closeTimer);
      var r = link.getBoundingClientRect();
      drop.style.top = (r.bottom + 8) + 'px';
      drop.style.left = r.left + 'px';
      drop.classList.add('is-open');
    }
    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { drop.classList.remove('is-open'); }, 150);
    }
    link.addEventListener('mouseenter', open);
    link.addEventListener('focus', open);
    link.addEventListener('mouseleave', scheduleClose);
    drop.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
    drop.addEventListener('mouseleave', scheduleClose);
    drop.addEventListener('focusout', scheduleClose);
  });

  /* ---------- Floating category side-nav (products.html) ---------- */
  var catSide = $('#catSide');
  var catNavBar = $('.cat-nav');
  if (catSide && catNavBar) {
    var catSideLinks = $$('a', catSide);
    function onCatScroll() {
      var barBottom = catNavBar.getBoundingClientRect().bottom;
      catSide.classList.toggle('is-visible', barBottom < 0);
    }
    window.addEventListener('scroll', onCatScroll, { passive: true });
    window.addEventListener('resize', onCatScroll);
    onCatScroll();

    var catSections2 = $$('.cat-section[id]');
    if ('IntersectionObserver' in window && catSections2.length) {
      var catIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          catSideLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      catSections2.forEach(function (sec) { catIO.observe(sec); });
    }
  }

  /* ---------- Back-to-top button ---------- */
  var backTop = $('#backTop');
  if (backTop) {
    window.addEventListener('scroll', function () { backTop.hidden = window.scrollY < 800; }, { passive: true });
    backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  }

  /* ---------- Testimonials carousel (auto + manual) ---------- */
  var testiTrack = $('#testiTrack');
  if (testiTrack) {
    var testiCards = $$('.tcard', testiTrack);
    var testiDotsWrap = $('#testiDots');
    var testiPrev = $('#testiPrev');
    var testiNext = $('#testiNext');
    var testiTimer = null;
    var testiActive = 0;
    var testiDots = [];

    if (testiDotsWrap) {
      testiCards.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        b.addEventListener('click', function () { scrollToCard(i); restartAuto(); });
        testiDotsWrap.appendChild(b);
      });
      testiDots = $$('button', testiDotsWrap);
    }

    function cardStep() { return testiCards[0].getBoundingClientRect().width + 22; /* matches gap in CSS */ }
    function updateDots() { testiDots.forEach(function (d, idx) { d.classList.toggle('is-active', idx === testiActive); }); }
    function scrollToCard(i) {
      testiActive = (i + testiCards.length) % testiCards.length;
      testiTrack.scrollTo({ left: testiActive * cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
      updateDots();
    }
    function syncActiveFromScroll() {
      var i = Math.round(testiTrack.scrollLeft / cardStep());
      testiActive = Math.max(0, Math.min(testiCards.length - 1, i));
      updateDots();
    }
    function next() { scrollToCard(testiActive + 1); }
    function prev() { scrollToCard(testiActive - 1); }
    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      testiTimer = setInterval(function () {
        if (testiActive >= testiCards.length - 1) scrollToCard(0); else next();
      }, 4500);
    }
    function stopAuto() { if (testiTimer) { clearInterval(testiTimer); testiTimer = null; } }
    function restartAuto() { stopAuto(); startAuto(); }

    testiNext.addEventListener('click', function () { next(); restartAuto(); });
    testiPrev.addEventListener('click', function () { prev(); restartAuto(); });
    testiTrack.addEventListener('mouseenter', stopAuto);
    testiTrack.addEventListener('mouseleave', startAuto);
    testiTrack.addEventListener('touchstart', stopAuto, { passive: true });
    testiTrack.addEventListener('touchend', function () { setTimeout(startAuto, 3000); }, { passive: true });
    var testiScrollDebounce;
    testiTrack.addEventListener('scroll', function () {
      clearTimeout(testiScrollDebounce);
      testiScrollDebounce = setTimeout(syncActiveFromScroll, 80);
    }, { passive: true });

    // The dark backdrop (#testiBack) lives outside the width-capped .container so it can
    // bleed to the true viewport edge (not just the 1200px container) on wide screens.
    // Its vertical position/height can't be pinned with plain CSS without going out of
    // sync whenever .testi__text's height changes (align-items:center reflow), so it's
    // measured from the actual rendered cards+dots here instead of guessed in CSS.
    var testiBack = document.getElementById('testiBack');
    var testiCarousel = testiTrack.closest('.testi__carousel');
    var testiSection = testiTrack.closest('.testi');
    function syncTestiBack() {
      if (!testiBack || !testiCarousel || !testiSection) return;
      var pad = 58;
      var sectionTop = testiSection.getBoundingClientRect().top;
      // testiCarousel's own top edge is where the arrows sit (its padding-top only
      // pushes the .tcard row down, it doesn't move the carousel's own top) — so the
      // topmost real content is the arrows, not the cards. Give it the same `pad`
      // breathing room as the bottom gets below the dots, measuring from that true
      // top, not from testiCarousel's box edge (which would leave zero room above
      // the arrows and look lopsided against the dots' padded bottom).
      var arrowsTop = testiTrack.closest('.testi__carousel').querySelector('.testi__arrows').getBoundingClientRect().top;
      var bottomEl = testiDotsWrap || testiTrack;
      var contentBottom = bottomEl.getBoundingClientRect().bottom;
      var top = (arrowsTop - sectionTop) - pad;
      var height = (contentBottom - sectionTop + pad) - top;
      testiBack.style.top = top + 'px';
      testiBack.style.height = height + 'px';
    }
    var testiResizeDebounce;
    window.addEventListener('resize', function () {
      clearTimeout(testiResizeDebounce);
      testiResizeDebounce = setTimeout(syncTestiBack, 120);
    });
    // .tcard/.testi__text are also `.reveal` elements: they sit transform:translateY(26px)
    // until scrolled into view, so a sync taken before that (e.g. on initial page load,
    // long before the user scrolls this far) measures the wrong, pre-animation position.
    // Re-sync once more shortly after the section actually enters the viewport.
    if ('IntersectionObserver' in window && testiSection) {
      var testiBackIO = new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { setTimeout(syncTestiBack, 850); obs.disconnect(); }
      }, { threshold: 0.1 });
      testiBackIO.observe(testiSection);
    }
    // Belt-and-braces: web fonts swapping in (Teko/Poppins) or the page's `load` event
    // (images finishing above this section) can both reflow .testi__text's height and
    // silently shift .testi__carousel within the align-items:center row *after* the
    // syncs above already ran. Re-measure a few more times rather than trust one pass.
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { syncTestiBack(); }); }
    window.addEventListener('load', function () { setTimeout(syncTestiBack, 50); });
    [200, 700, 1600].forEach(function (ms) { setTimeout(syncTestiBack, ms); });

    updateDots();
    syncTestiBack();
    startAuto();
  }

  /* ---------- Reveal, progress bars, counters ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = target; return; }
    var start = null, dur = 1700;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var watch = $$('.reveal, .skills, .counters');
  if (!('IntersectionObserver' in window)) {
    watch.forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  } else {
    $$('[data-count]').forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        if (el.classList.contains('counters')) $$('[data-count]', el).forEach(countUp);
        io.unobserve(el);
      });
    }, { threshold: 0.15 });
    watch.forEach(function (el) { io.observe(el); });
  }
})();
