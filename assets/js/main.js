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
  var CONFIG = { endpoint: '', whatsapp: '', mailto: 'mail@s-industrialsolutions.com', web3formsKey: '', formsubmit: 'mail@s-industrialsolutions.com' };
  /* formsubmit : no signup/key needed (formsubmit.co). Forms are emailed straight to this address.
                  The FIRST submission ever sends a one-time "activate this form" email to it; click
                  the link once and every later enquiry arrives in the inbox. Clear it to disable. */
  /* web3formsKey : free access key from https://web3forms.com (sent to the inbox you register).
                    When set, enquiry/contact forms are delivered straight to that inbox with no
                    email app needed; when empty, the forms fall back to opening the visitor's
                    email app (mailto). */
  /* mailto : enquiry / contact forms open the visitor's email app with the message
             pre-filled and addressed here (used when `endpoint` is empty).
     The floating WhatsApp button is a plain link and does not use CONFIG. */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Background slider (hero + page banners) ---------- */
  $$('.bg-slider').forEach(function (slider) {
    var slides = $$('.bg-slider__slide', slider);
    if (slides.length < 2 || reduceMotion) return;
    var section = slider.closest('section');
    var contentSlides = section ? $$('.hero__slide-content', section) : [];
    var i = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    if (i < 0) i = 0;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      if (contentSlides[i]) contentSlides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
      if (contentSlides[i]) contentSlides[i].classList.add('is-active');
    }, 5000);
  });

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
  $$('.nav__cta [data-enquire]', nav).forEach(function (b) { b.addEventListener('click', function () { setNav(false); }); });
  window.addEventListener('resize', function () { if (!isMobileNav()) setNav(false); });

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
    function viaMailto() {
      var subject = payload.type === 'contact'
        ? 'Website message' + (payload.subject ? ': ' + payload.subject : '') + ' - ' + payload.name
        : 'Website enquiry' + ((payload.productName || payload.product) ? ': ' + (payload.productName || payload.product) : '') + ' - ' + payload.name;
      window.location.href = 'mailto:' + CONFIG.mailto + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary);
      return Promise.resolve('mailto');
    }
    if (CONFIG.endpoint) {
      return fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return 'sent'; });
    }
    if (CONFIG.web3formsKey) {
      var isContact = payload.type === 'contact';
      var body = {
        access_key: CONFIG.web3formsKey,
        subject: (isContact ? 'Website message' : 'Website enquiry') + ' - ' + payload.name,
        from_name: 'Sai Industrial Solutions website',
        name: payload.name,
        phone: payload.phone,
        message: summary
      };
      if (payload.email) body.email = payload.email;
      return fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.success) throw new Error((j && j.message) || 'send failed');
        return 'sent';
      });
    }
    if (CONFIG.formsubmit) {
      var fsContact = payload.type === 'contact';
      var fsBody = {
        _subject: (fsContact ? 'Website message' : 'Website enquiry') + ((!fsContact && (payload.productName || payload.product)) ? ': ' + (payload.productName || payload.product) : '') + ' - ' + payload.name,
        _template: 'table',
        _captcha: 'false'
      };
      // one clean row per field (empty fields are left out)
      function put(k, v) { if (v) fsBody[k] = v; }
      put('Name', payload.name);
      put('Phone', payload.phone);
      put('Email', payload.email);
      if (fsContact) {
        put('Subject', payload.subject);
        put('Message', payload.message);
      } else {
        put('Company', payload.company);
        put('Category', payload.product);
        put('Item', payload.productName);
        put('Quantity', payload.quantity);
        put('Details', payload.message);
      }
      put('Page', payload.page);
      if (payload.email) fsBody._replyto = payload.email;
      return fetch('https://formsubmit.co/ajax/' + CONFIG.formsubmit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(fsBody)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j || (j.success !== true && j.success !== 'true')) throw new Error((j && j.message) || 'send failed');
        return 'sent';
      }).catch(function (err) {
        // delivery service unavailable / not activated yet: never lose the enquiry, open the visitor's email app instead
        console.warn('[SIS] FormSubmit failed, falling back to the email app:', err && err.message);
        return viaMailto();
      });
    }
    if (CONFIG.mailto) return viaMailto();
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
      } else if (mode === 'mailto') {
        showNote(eqNote, 'Your email app is opening with your enquiry ready. Please press Send there. If nothing opens, email us at ' + CONFIG.mailto + '.', true);
        enquiryForm.reset();
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
  if (nl) nl.addEventListener('submit', function (e) {
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
        } else if (mode === 'mailto') {
          showNote(cfNote, 'Your email app is opening with your message ready. Please press Send there. If nothing opens, email us at ' + CONFIG.mailto + '.', true);
          contactForm.reset();
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

  var catNavBar = $('.cat-nav');

  /* ---------- Floating category side-nav (products.html) ---------- */
  var catSides = $$('.cat-side');
  var catSecAll = $$('.cat-section');
  var catFab = $('#catFab');
  function setCatSheet(open) {
    catSides.forEach(function (n) { n.classList.toggle('is-open', open); });
    if (catFab) catFab.setAttribute('aria-expanded', String(open));
  }
  if (catFab) {
    catFab.addEventListener('click', function () { setCatSheet(catFab.getAttribute('aria-expanded') !== 'true'); });
    catSides.forEach(function (n) {
      $$('a', n).forEach(function (a) { a.addEventListener('click', function () { setCatSheet(false); }); });
    });
    document.addEventListener('click', function (e) {
      if (catFab.getAttribute('aria-expanded') === 'true' && !e.target.closest('#catFab, .cat-side')) setCatSheet(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setCatSheet(false); });
  }
  if (catSides.length && catNavBar) {
    function onCatScroll() {
      var barBottom = catNavBar.getBoundingClientRect().bottom;
      var lastCat = catSecAll[catSecAll.length - 1];
      var pastCats = lastCat && lastCat.getBoundingClientRect().bottom < window.innerHeight * 0.4;
      var show = barBottom < 0 && !pastCats;
      catSides.forEach(function (n) { n.classList.toggle('is-visible', show); });
      if (catFab) catFab.classList.toggle('is-visible', show);
      if (!show) setCatSheet(false);
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
          catSides.forEach(function (n) {
            $$('a', n).forEach(function (a) {
              a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
            });
          });
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      catSections2.forEach(function (sec) { catIO.observe(sec); });
    }
  }

  /* ---------- WhatsApp greeting bubble: appears first after ~3.5 s, then again every 5-10 minutes ---------- */
  (function initWaBubble() {
    var wa = $('.whatsapp-float');
    if (!wa) return;
    var KEY = 'sisWaBubbleNext';
    var FIRST = 3500, MIN = 5 * 60 * 1000, MAX = 10 * 60 * 1000, VISIBLE = 15000;
    var memNext = 0, showTimer = null, hideTimer = null;
    function getNext() {
      try { var v = parseInt(localStorage.getItem(KEY), 10); if (!isNaN(v)) return v; } catch (e) { /* storage blocked */ }
      return memNext;
    }
    function setNext(t) {
      memNext = t;
      try { localStorage.setItem(KEY, String(t)); } catch (e) { /* storage blocked */ }
    }
    var bubble = document.createElement('div');
    bubble.className = 'wa-bubble';
    bubble.hidden = true;
    bubble.innerHTML =
      '<a class="wa-bubble__link" target="_blank" rel="noopener"><strong>Hello, How may I help you?</strong><span>Chat with us on WhatsApp</span></a>' +
      '<button class="wa-bubble__close" type="button" aria-label="Dismiss">&times;</button>';
    bubble.querySelector('a').href = wa.href;
    document.body.appendChild(bubble);
    function hide() {
      clearTimeout(hideTimer);
      bubble.classList.remove('is-in');
      bubble.hidden = true;
    }
    function schedule() {
      clearTimeout(showTimer);
      var next = getNext();
      var wait = next > Date.now() ? Math.max(next - Date.now(), FIRST) : FIRST;
      showTimer = setTimeout(show, wait);
    }
    function show() {
      bubble.hidden = false;
      setTimeout(function () { bubble.classList.add('is-in'); }, 20);
      setNext(Date.now() + MIN + Math.floor(Math.random() * (MAX - MIN)));
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, VISIBLE);
      schedule(); // comes back after the next 5-10 minute gap
    }
    bubble.querySelector('button').addEventListener('click', hide);
    bubble.querySelector('a').addEventListener('click', hide);
    schedule();
  })();

  /* ---------- Chat assistant: built-in FAQ bot (no external service, nothing is sent anywhere) ---------- */
  var ENABLE_WEB_CHAT = false; // the on-site FAQ bot is switched off: chat now happens on WhatsApp (see the greeting bubble below)
  (function initChatBot() {
    if (!ENABLE_WEB_CHAT || $('#chatBot')) return;
    var PHONE_1 = '+971502008078', PHONE_2 = '+971503842949';
    var EMAIL = 'mail@s-industrialsolutions.com';
    var WA = 'https://wa.me/971508964745?text=' + encodeURIComponent('Hi, I would like to know more about your products.');
    var CATS = [
      { id: 'pulleys-belts', name: 'Pulleys, Bushes & Belts', ex: 'Taper Lock, Pilot Bore, Timing Belt and Wire Rope pulleys, V belts, timing and conveyor belts, taper lock and QD bushes',
        kw: ['pulley', 'belt', 'bush', 'timing', 'conveyor', 'taper lock', 'qd '] },
      { id: 'couplings', name: 'Couplings', ex: 'Disc, Flexible, Gear, Pin & Bush, Jaw, HRC, Rotex, Grid and Tyre couplings',
        kw: ['coupling', 'gear coupling', 'jaw', 'rotex', 'hrc', 'sureflex', 'disc coupling', 'tyre', 'grid'] },
      { id: 'motors-gearbox', name: 'Motors & Gear Box', ex: 'foot and flange mounted motors, shaft mounted and flange mounted gearboxes',
        kw: ['motor', 'gearbox', 'gear box', 'shaft mounted', 'flange mounted', 'worm gearbox', 'reducer'] },
      { id: 'sprockets-chains', name: 'Sprockets & Chains', ex: 'simple, duplex and triplex sprockets, roller and attachment chains',
        kw: ['sprocket', 'chain', 'duplex', 'triplex', 'roller chain'] },
      { id: 'gears-shafts', name: 'Gears & Shafts', ex: 'helical, spur, worm and spiral bevel gears, pinion and rack, spline and machine shafts',
        kw: ['gear', 'shaft', 'spline', 'rack', 'pinion', 'worm', 'bevel', 'spur', 'helical', 'herringbone'] },
      { id: 'seals-rubber', name: 'Seals & Customised Rubber Products', ex: 'mechanical seals, oil seals, O rings, V rings, seal kits, rubber mounts and rubber impellers',
        kw: ['seal', 'o ring', 'o-ring', 'oring', 'rubber', 'viton', 'nbr', 'v ring', 'mount', 'impeller', 'gasket'] },
      { id: 'fasteners', name: 'Fasteners', ex: 'bolts, nuts, washers, studs, U bolts, eye bolts and circlips',
        kw: ['bolt', 'nut', 'washer', 'stud', 'screw', 'fastener', 'circlip', 'u bolt', 'eye bolt'] },
      { id: 'metals', name: 'Ferrous & Non-Ferrous Metals', ex: 'angle, flat, hexagon, round and square bars, sheets and nylon bushes and sheets',
        kw: ['metal', 'steel', 'stainless', 'bar', 'sheet', 'angle', 'nylon', 'ferrous', 'aluminium', 'aluminum', 'brass', 'copper'] }
    ];

    function fmt(p) { return p.replace(/^\+971(\d{2})(\d{3})(\d{4})$/, '+971 $1 $2 $3'); }
    function norm(s) { return ' ' + String(s).toLowerCase().replace(/[^a-z0-9ऀ-ॿ&\- ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
    function has(t, words) { for (var i = 0; i < words.length; i++) { if (t.indexOf(words[i]) !== -1) return true; } return false; }

    function findCategory(t) {
      var best = null, bestScore = 0;
      CATS.forEach(function (c) {
        var score = 0;
        c.kw.forEach(function (k) { if (t.indexOf(k) !== -1) score += k.length; });
        if (score > bestScore) { bestScore = score; best = c; }
      });
      return best;
    }

    var MAIN_CHIPS = [
      { label: 'Our products', q: 'products' },
      { label: 'Get a quote', q: 'quote' },
      { label: 'Services', q: 'services' },
      { label: 'Contact & hours', q: 'contact' },
      { label: 'WhatsApp', type: 'link', href: WA, ext: true }
    ];
    var HELP_BTNS = [
      { label: 'Send an enquiry', type: 'enquire' },
      { label: 'WhatsApp us', type: 'link', href: WA, ext: true },
      { label: 'Call ' + fmt(PHONE_1), type: 'link', href: 'tel:' + PHONE_1 }
    ];

    function reply(text) {
      var t = norm(text);
      var cat = findCategory(t);
      if (cat) {
        return {
          text: 'Yes, we supply ' + cat.name + ': ' + cat.ex + '. For price and availability please send us the size, quantity and brand and we will send a quote.',
          buttons: [
            { label: 'View ' + cat.name, type: 'link', href: 'products.html#' + cat.id },
            { label: 'Get a quote', type: 'enquire', product: cat.name }
          ]
        };
      }
      if (has(t, [' hi ', ' hello ', ' hey ', ' hii ', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'salam', 'assalam'])) {
        return { text: 'Hello! Welcome to Sai Industrial Solutions. How can I help you today?', buttons: MAIN_CHIPS };
      }
      if (has(t, [' thanks', ' thank you', 'shukriya', 'dhanyavad', ' thx '])) {
        return { text: 'You are welcome! Is there anything else I can help you with?', buttons: MAIN_CHIPS };
      }
      if (has(t, ['hour', 'timing', 'open', 'close', 'working', 'kab', 'samay', 'sunday'])) {
        return { text: 'We are open Monday to Saturday, 9:00 to 18:30. You can also send an enquiry any time and we will reply on the next working day.', buttons: [{ label: 'Send an enquiry', type: 'enquire' }, { label: 'WhatsApp us', type: 'link', href: WA, ext: true }] };
      }
      if (has(t, ['address', 'location', 'where', 'office', 'map', 'visit', 'kahan', 'pata', 'sharjah'])) {
        return { text: 'Our address: Sharjah Media City, Sharjah, UAE.', buttons: [{ label: 'Open the map', type: 'link', href: 'contact.html' }, { label: 'Open in Google Maps', type: 'link', href: 'https://www.google.com/maps/search/?api=1&query=Sharjah+Media+City+Sharjah+UAE', ext: true }] };
      }
      if (has(t, ['phone', 'call', 'number', 'contact', 'email', 'mail', 'talk', 'speak', 'baat', 'sampark'])) {
        return { text: 'You can reach us on ' + fmt(PHONE_1) + ' or ' + fmt(PHONE_2) + ', or by email at ' + EMAIL + '. We are available Mon to Sat, 9:00 to 18:30.',
          buttons: [{ label: 'Call now', type: 'link', href: 'tel:' + PHONE_1 }, { label: 'WhatsApp us', type: 'link', href: WA, ext: true }, { label: 'Email us', type: 'link', href: 'mailto:' + EMAIL }] };
      }
      if (has(t, ['whatsapp', 'whats app', 'wa.me'])) {
        return { text: 'Sure, you can chat with our team on WhatsApp.', buttons: [{ label: 'Open WhatsApp', type: 'link', href: WA, ext: true }] };
      }
      if (has(t, ['quote', 'quotation', 'price', 'rate', 'cost', 'enquiry', 'inquiry', 'order', 'buy', 'purchase', 'kimat', 'daam', 'bhav', 'kharid'])) {
        return { text: 'Prices depend on the size, quantity and brand. Tell us what you need through the enquiry form and our team will reply with the right solution and the best quote.', buttons: [{ label: 'Send an enquiry', type: 'enquire' }, { label: 'WhatsApp us', type: 'link', href: WA, ext: true }] };
      }
      if (has(t, ['service', 'sourcing', 'support', 'supply', 'custom', 'manufactur', 'technical', 'help me choose'])) {
        return { text: 'We offer three services: Custom Sourcing (share the specification and we source or manufacture it), Industrial Supply (stock for regular and bulk needs) and Technical Support (help choosing the right product).', buttons: [{ label: 'See our services', type: 'link', href: 'services.html' }, { label: 'Send an enquiry', type: 'enquire' }] };
      }
      if (has(t, ['deliver', 'dispatch', 'shipping', 'shipment', 'courier', 'how long'])) {
        return { text: 'Once your quote is confirmed we arrange delivery. Please share your location and quantity in the enquiry so we can confirm the timing.', buttons: [{ label: 'Send an enquiry', type: 'enquire' }] };
      }
      if (has(t, ['brand', 'skf', 'fag', 'timken', 'gates', 'ntn', 'nsk', 'bosch', 'abb', 'genuine', 'original', 'quality'])) {
        return { text: 'We stock, trade and supply genuine parts from leading global manufacturers such as SKF, FAG, Timken, Gates, NTN, NSK, Bosch, ABB and more. Tell us the brand you need.', buttons: [{ label: 'Send an enquiry', type: 'enquire' }] };
      }
      if (has(t, ['about', 'who are you', 'company', 'since', 'stockist', 'trader', 'kaun'])) {
        return { text: 'Sai Industrial Solutions is a stockist, trader and customised manufacturer of power transmission products and precision-engineered components, serving industries across the UAE.', buttons: [{ label: 'About us', type: 'link', href: 'about.html' }, { label: 'Our products', type: 'ask', q: 'products' }] };
      }
      if (has(t, ['product', 'catalog', 'categor', 'item', 'what do you', 'what you', 'kya milta', 'range', 'sell'])) {
        return { text: 'We have 8 product categories. Tap one to see the products, or type the item you need.',
          buttons: CATS.map(function (c) { return { label: c.name, type: 'link', href: 'products.html#' + c.id }; }) };
      }
      return { text: 'Sorry, I could not find an answer to that. Our team can help you directly:', buttons: HELP_BTNS };
    }

    /* ----- UI ----- */
    var ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    var ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    var ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

    var root = document.createElement('div');
    root.id = 'chatBot';
    root.innerHTML =
      '<button class="chatbot__launcher" id="chatLauncher" type="button" aria-label="Open chat assistant" aria-expanded="false" aria-controls="chatPanel">' + ICON_CHAT + '</button>' +
      '<section class="chatbot__panel" id="chatPanel" role="dialog" aria-label="Sai Assistant chat" hidden>' +
        '<header class="chatbot__head"><span class="chatbot__avatar">' + ICON_CHAT + '</span>' +
          '<div><strong>Sai Assistant</strong><small>Ask about products, quotes and contact</small></div>' +
          '<button class="chatbot__close" id="chatClose" type="button" aria-label="Close chat">' + ICON_CLOSE + '</button></header>' +
        '<div class="chatbot__log" id="chatLog" role="log" aria-live="polite"></div>' +
        '<form class="chatbot__form" id="chatForm" autocomplete="off">' +
          '<label class="sr-only" for="chatInput">Type your question</label>' +
          '<input id="chatInput" type="text" placeholder="Type your question…" maxlength="200">' +
          '<button type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '</section>';
    document.body.appendChild(root);

    var launcher = $('#chatLauncher'), panel = $('#chatPanel'), log = $('#chatLog'), form = $('#chatForm'), input = $('#chatInput');
    var started = false;

    function scrollDown() { log.scrollTop = log.scrollHeight; }
    function addUser(text) {
      var d = document.createElement('div'); d.className = 'chatbot__msg chatbot__msg--user'; d.textContent = text; log.appendChild(d); scrollDown();
    }
    function makeButton(b) {
      var el;
      if (b.type === 'link') {
        el = document.createElement('a'); el.href = b.href;
        if (b.ext) { el.target = '_blank'; el.rel = 'noopener'; }
      } else {
        el = document.createElement('button'); el.type = 'button';
        if (b.type === 'enquire') { el.setAttribute('data-enquire', ''); if (b.product) el.setAttribute('data-product', b.product); }
        if (b.type === 'ask') { el.addEventListener('click', function () { ask(b.label, b.q); }); }
      }
      el.className = 'chatbot__chip';
      el.textContent = b.label;
      if (b.q && b.type !== 'ask' && b.type !== 'link' && b.type !== 'enquire') { el.addEventListener('click', function () { ask(b.label, b.q); }); }
      el.addEventListener('click', function () { if (b.type === 'enquire' || (b.type === 'link' && !b.ext && b.href.indexOf('tel:') !== 0 && b.href.indexOf('mailto:') !== 0)) setOpen(false); });
      return el;
    }
    function addBot(text, buttons, delay) {
      var typing = document.createElement('div'); typing.className = 'chatbot__msg chatbot__msg--bot chatbot__typing'; typing.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(typing); scrollDown();
      setTimeout(function () {
        log.removeChild(typing);
        var d = document.createElement('div'); d.className = 'chatbot__msg chatbot__msg--bot';
        var p = document.createElement('p'); p.textContent = text; d.appendChild(p);
        if (buttons && buttons.length) {
          var wrap = document.createElement('div'); wrap.className = 'chatbot__chips';
          buttons.forEach(function (b) { wrap.appendChild(makeButton(b)); });
          d.appendChild(wrap);
        }
        log.appendChild(d); scrollDown();
      }, delay == null ? 450 : delay);
    }
    function ask(label, q) {
      addUser(label);
      var r = reply(q || label);
      addBot(r.text, r.buttons);
    }
    function setOpen(open) {
      panel.hidden = !open;
      root.classList.toggle('is-open', open);
      launcher.setAttribute('aria-expanded', String(open));
      launcher.setAttribute('aria-label', open ? 'Close chat assistant' : 'Open chat assistant');
      if (open) {
        if (!started) {
          started = true;
          addBot('Hi! I am Sai Assistant. How can I help you today? You can ask in English or Hindi (Hinglish).', MAIN_CHIPS, 250);
        }
        setTimeout(function () { if (window.innerWidth > 767) input.focus(); }, 50);
      }
    }
    launcher.addEventListener('click', function () { setOpen(panel.hidden); });
    $('#chatClose').addEventListener('click', function () { setOpen(false); launcher.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); launcher.focus(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      ask(v);
    });
  })();

  /* ---------- Back-to-top button ---------- */
  var backTop = $('#backTop');
  if (backTop) {
    var siteFooter = $('.footer');
    function updateBackTop() {
      backTop.hidden = window.scrollY < 800;
      if (backTop.hidden || !siteFooter) return;
      // over the dark footer the navy button disappears, so swap its colours (gold) there
      var onFooter = backTop.getBoundingClientRect().bottom > siteFooter.getBoundingClientRect().top;
      backTop.classList.toggle('is-on-dark', onFooter);
    }
    window.addEventListener('scroll', updateBackTop, { passive: true });
    window.addEventListener('resize', updateBackTop);
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
