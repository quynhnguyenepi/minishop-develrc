/* Mini Shop QA - shared behaviour. Plain ES5/ES2015, no dependencies. */
(function () {
  'use strict';

  var PRODUCTS = {
  "SHOE-001": {
    "name": "Runner Pro 1",
    "price": 89.0,
    "cat": "shoes",
    "slug": "shoes-1",
    "img": "Shoes1.jpg"
  },
  "SHOE-002": {
    "name": "Court Classic 2",
    "price": 79.0,
    "cat": "shoes",
    "slug": "shoes-2",
    "img": "Shoes2.jpeg"
  },
  "SHOE-010": {
    "name": "Street High 10",
    "price": 129.0,
    "cat": "shoes",
    "slug": "shoes-10",
    "img": "Shoes3.jpeg"
  },
  "BAG-001": {
    "name": "Quilted Crossbody",
    "price": 65.0,
    "cat": "bags",
    "slug": "bag-1",
    "img": "Bag1.jpeg"
  },
  "BAG-002": {
    "name": "Leather Satchel",
    "price": 95.0,
    "cat": "bags",
    "slug": "bag-2",
    "img": "Bag2.png"
  },
  "HAT-001": {
    "name": "NYC Baseball Cap",
    "price": 24.0,
    "cat": "hats",
    "slug": "hat-1",
    "img": "Hat1.jpg"
  }
};
  var CART_KEY = 'miniShopCart';
  var FREE_SHIPPING_MIN = 100;
  var SHIPPING_FLAT = 5;
  var params = new URLSearchParams(window.location.search);
  var base = document.body.getAttribute('data-root') || '';
  var discountRate = 0;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function money(n) { return '$' + n.toFixed(2); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  /* ---- Optimizely events (queue-safe: works before and after the snippet) ---- */
  function track(eventName, properties, tags) {
    window.optimizely = window.optimizely || [];
    var e = { type: 'event', eventName: eventName };
    if (properties) { e.properties = properties; }
    if (tags) { e.tags = tags; }
    window.optimizely.push(e);
    if (window.console && console.info) { console.info('[mini-shop] event', eventName, properties || '', tags || ''); }
  }

  /* ---- cart ---- */
  function loadCart() {
    try { var raw = localStorage.getItem(CART_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
  }
  function cartLine(sku, qty, variant) {
    var p = PRODUCTS[sku];
    return { sku: sku, name: p.name, price: p.price, qty: qty, variant: variant || '' };
  }
  function updateCartCount() {
    var n = loadCart().reduce(function (s, i) { return s + i.qty; }, 0);
    $$('#cart-count').forEach(function (el) { el.textContent = String(n); });
  }
  function addToCart(sku, qty, variant) {
    var cart = loadCart();
    var found = cart.filter(function (i) { return i.sku === sku && i.variant === variant; })[0];
    if (found) { found.qty += qty; } else { cart.push(cartLine(sku, qty, variant)); }
    saveCart(cart);
    updateCartCount();
    track('add_to_cart', { SKU: sku, Category: PRODUCTS[sku].cat });
    toast(PRODUCTS[sku].name + ' added to cart');
  }
  function totals(cart) {
    var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var discount = subtotal * discountRate;
    var after = subtotal - discount;
    var shipping = cart.length === 0 ? 0 : (after >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT);
    return { subtotal: subtotal, discount: discount, shipping: shipping, total: after + shipping };
  }
  function summaryHtml(t) {
    return '<dl class="totals">' +
      '<dt>Subtotal</dt><dd data-qa="subtotal">' + money(t.subtotal) + '</dd>' +
      (t.discount > 0 ? '<dt>Discount</dt><dd>-' + money(t.discount) + '</dd>' : '') +
      '<dt>Shipping</dt><dd>' + (t.shipping === 0 ? 'Free' : money(t.shipping)) + '</dd>' +
      '<dt class="grand">Total</dt><dd class="grand" data-qa="total">' + money(t.total) + '</dd></dl>';
  }

  function toast(msg) {
    var el = $('#toast'); if (!el) { return; }
    el.textContent = msg; el.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('is-visible'); }, 2200);
  }

  /* ---- seed cart for quick testing: ?seed=1 always resets the cart to two known items ---- */
  if (params.get('seed') === '1') {
    saveCart([cartLine('SHOE-001', 1, 'Size 42 / black'), cartLine('BAG-001', 1, 'One size / black')]);
  }

  /* ---- header / chrome ---- */
  function initChrome() {
    var promo = $('.promo-bar');
    if (promo) { promo.id = 'promo-' + Math.random().toString(36).slice(2, 8); } /* runtime-generated id (fragile selector on purpose) */
    var tg = $('#menu-toggle'), nav = $('#main-nav');
    if (tg && nav) {
      tg.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        tg.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var dbg = $('#debug-attrs');
    if (dbg) {
      var seg = readCookie('qa_segment');
      dbg.textContent = 'QA debug - segment attribute: ' + (seg || '(not set)') +
        '  |  ?segment=vip sets it, ?segment=clear removes it';
    }
    updateCartCount();
  }

  /* ---- delayed recommendations (default 2000 ms, override with ?recs_delay=6000) ---- */
  function initRecs() {
    var slot = $('#recs-slot'); if (!slot) { return; }
    var delay = parseInt(params.get('recs_delay'), 10);
    if (isNaN(delay) || delay < 0) { delay = 2000; }
    delay = Math.min(delay, 15000);
    var current = slot.getAttribute('data-current') || '';
    var root = slot.getAttribute('data-root') || '';
    setTimeout(function () {
      var keys = Object.keys(PRODUCTS).filter(function (k) { return k !== current; });
      var picks = current ? keys.slice(0, 3) : keys.slice(-3); /* home/category: show the last three so they differ from the featured grid */
      var items = picks.map(function (k) {
        var p = PRODUCTS[k];
        return '<li class="card"><a class="card-link" href="' + root + 'product/' + p.slug + '.html">' +
          '<img src="' + root + 'assets/' + p.img + '" alt="' + esc(p.name) + '" width="320" height="240">' +
          '<h3 class="card-title">' + esc(p.name) + '</h3></a><p class="card-price">' + money(p.price) + '</p></li>';
      }).join('');
      slot.innerHTML = '<section class="recs recs_k9d2f" data-qa="recs"><h2 class="recs-title">You may also like</h2>' +
        '<ul class="grid grid-3">' + items + '</ul></section>';
    }, delay);
  }

  /* ---- category: filter + sort (sorting reorders DOM nodes, so nth-child positions change) ---- */
  function initCategory() {
    var grid = $('#product-grid'); if (!grid) { return; }
    var items = $$('.card', grid), sortSel = $('#sort'), filter = 'all';
    function apply() {
      var sorted = items.slice(), s = sortSel.value;
      if (s === 'price-asc') { sorted.sort(function (a, b) { return Number(a.dataset.price) - Number(b.dataset.price); }); }
      if (s === 'price-desc') { sorted.sort(function (a, b) { return Number(b.dataset.price) - Number(a.dataset.price); }); }
      sorted.forEach(function (el) { grid.appendChild(el); });
      items.forEach(function (el) { el.hidden = !(filter === 'all' || el.dataset.cat === filter); });
    }
    $$('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        filter = chip.getAttribute('data-filter');
        $$('.chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        apply();
      });
    });
    var wanted = params.get('sort');
    if (wanted === 'price-asc' || wanted === 'price-desc') { sortSel.value = wanted; }
    sortSel.addEventListener('change', apply);
    apply();
  }

  /* ---- product page ---- */
  function initProduct() {
    var btn = $('#add-to-cart'); if (!btn) { return; }
    var sku = document.body.getAttribute('data-sku');
    var swatches = $$('.swatch'), color = 'black';
    function setColor(c) {
      color = c;
      swatches.forEach(function (s) {
        var on = s.getAttribute('data-color') === c;
        s.classList.toggle('is-selected', on);
        s.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $('#color-label').textContent = c.charAt(0).toUpperCase() + c.slice(1);
    }
    var wanted = (params.get('color') || '').toLowerCase();
    if (swatches.some(function (s) { return s.getAttribute('data-color') === wanted; })) { setColor(wanted); }
    swatches.forEach(function (s) { s.addEventListener('click', function () { setColor(s.getAttribute('data-color')); }); });
    function handler() {
      var qty = Math.max(1, Math.min(9, parseInt($('#qty').value, 10) || 1));
      addToCart(sku, qty, $('#size').value + ' / ' + color);
    }
    btn.addEventListener('click', handler);
    var sticky = $('#sticky-atc'); if (sticky) { sticky.addEventListener('click', handler); }
  }

  /* ---- cart + saved cart ---- */
  function renderCart() {
    var root = $('#cart-root'); if (!root) { return; }
    var cart = loadCart();
    if (cart.length === 0) {
      root.innerHTML = '<p class="empty" data-qa="cart-empty">Your cart is empty. <a href="' + base + 'category.html">Continue shopping</a></p>';
      return;
    }
    var rows = cart.map(function (i, idx) {
      return '<tr data-idx="' + idx + '"><td><strong>' + esc(i.name) + '</strong><br><small>' + esc(i.variant) + '</small></td>' +
        '<td>' + money(i.price) + '</td>' +
        '<td><button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity">&minus;</button>' +
        ' <span class="qty">' + i.qty + '</span> ' +
        '<button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity">+</button></td>' +
        '<td>' + money(i.price * i.qty) + '</td>' +
        '<td><button type="button" class="link-btn" data-act="remove">Remove</button></td></tr>';
    }).join('');
    root.innerHTML = '<table class="cart-table"><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Line total</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="cart-foot" id="cart-summary">' + summaryHtml(totals(cart)) +
      '<a class="btn btn-primary btn-lg" id="checkout-link" data-qa="checkout-link" href="' + base + 'checkout.html">Proceed to checkout</a></div>';
  }
  function initCart() {
    var root = $('#cart-root'); if (!root) { return; }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) { return; }
      var tr = b.closest('tr'), idx = Number(tr.getAttribute('data-idx')), cart = loadCart(), act = b.getAttribute('data-act');
      if (act === 'inc') { cart[idx].qty = Math.min(9, cart[idx].qty + 1); }
      if (act === 'dec') { cart[idx].qty = Math.max(1, cart[idx].qty - 1); }
      if (act === 'remove') { cart.splice(idx, 1); }
      saveCart(cart); updateCartCount(); renderCart();
    });
    var df = $('#discount-form');
    if (df) {
      df.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = $('#discount-code').value.trim().toUpperCase(), msg = $('#discount-msg');
        if (code === 'COMEBACK10') { discountRate = 0.1; msg.textContent = '10% discount applied.'; }
        else { discountRate = 0; msg.textContent = 'Invalid code.'; }
        renderCart();
      });
    }
    renderCart();
  }

  /* ---- checkout ---- */
  function initCheckout() {
    var form = $('#checkout-form'); if (!form) { return; }
    var cart = loadCart(), box = $('#order-summary');
    box.innerHTML = '<h2>Order summary</h2>' + (cart.length === 0
      ? '<p class="empty">Your cart is empty. <a href="category.html">Continue shopping</a></p>'
      : '<ul class="summary-lines">' + cart.map(function (i) {
          return '<li><span>' + esc(i.name) + ' &times; ' + i.qty + '</span><span>' + money(i.price * i.qty) + '</span></li>';
        }).join('') + '</ul>' + summaryHtml(totals(cart)));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, msg = $('#checkout-msg');
      function check(id, test, text) {
        var el = $('#' + id), err = $('#' + id + '-error'), valid = test(el.value.trim());
        err.textContent = valid ? '' : text;
        el.setAttribute('aria-invalid', valid ? 'false' : 'true');
        if (!valid) { ok = false; }
      }
      check('co-name', function (v) { return v.length > 1; }, 'Please enter your full name.');
      check('co-email', function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }, 'Please enter a valid email.');
      check('co-address', function (v) { return v.length > 3; }, 'Please enter your address.');
      check('co-city', function (v) { return v.length > 1; }, 'Please enter your city.');
      var current = loadCart();
      if (current.length === 0) { msg.textContent = 'Your cart is empty. Add ?seed=1 to the URL to pre-fill it.'; return; }
      if (!ok) { msg.textContent = 'Please fix the highlighted fields.'; return; }
      var t = totals(current), orderId = 'ORDER-' + String(Date.now()).slice(-6);
      track('form_success');
      track('purchase', null, { revenue: Math.round(t.total * 100) });
      saveCart([]); updateCartCount();
      $('#checkout-layout').innerHTML = '<section class="confirmation" data-qa="order-confirmation"><h2>Thank you!</h2>' +
        '<p>Demo order <strong>' + orderId + '</strong> placed. Total ' + money(t.total) + '. Nothing was sent or charged.</p>' +
        '<a class="btn btn-primary" href="category.html">Keep shopping</a></section>';
    });
  }

  /* ---- newsletter ---- */
  function initNewsletter() {
    var f = $('#newsletter-form'); if (!f) { return; }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#newsletter-email').value.trim(), m = $('#newsletter-msg');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { m.textContent = 'Please enter a valid email.'; return; }
      m.textContent = 'Thanks! (demo: nothing was sent)';
      track('newsletter_signup');
      f.reset();
    });
  }

  initChrome(); initRecs(); initCategory(); initProduct(); initCart(); initCheckout(); initNewsletter();
})();
