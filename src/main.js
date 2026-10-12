import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/manrope';
import './style.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');
document.body.classList.add('is-loading');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

$('#year').textContent = new Date().getFullYear();

/* ---------- optional media: original photos drop into /assets/img ---------- */
$$('img[data-optional-media]').forEach((img) => {
  const miss = () => img.classList.add('is-missing');
  if (img.complete && img.naturalWidth === 0) miss();
  img.addEventListener('error', miss);
});

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduce });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

const menu = $('.menu');
const burger = $('.nav__burger');
function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); }
burger.addEventListener('click', () => {
  const open = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  open ? lenis.stop() : lenis.start();
  if (open) gsap.from('.menu > a', { yPercent: 100, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out', delay: 0.2 });
});

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    lenis.start();
    lenis.scrollTo(target, { offset: -70, duration: 1.6 });
  });
});

/* ---------- text splitting ---------- */
function splitWords(el) {
  // keeps inline <em> etc. by splitting text nodes only
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'word'; s.textContent = part; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'svg') walk(n);
    });
  };
  walk(el);
  return $$('.word', el);
}
$$('[data-scrub-text]').forEach(splitWords);

/* ---------- preloader → intro ---------- */
let introDone = false;
function intro() {
  if (introDone) return; introDone = true;
  const counter = { v: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.loader__word > *', { yPercent: 110, duration: 1, stagger: 0.1 })
    .to(counter, { v: 100, duration: reduce ? 0.1 : 1, ease: 'power2.inOut', onUpdate: () => { $('.loader__count').textContent = String(Math.round(counter.v)).padStart(2, '0'); } }, 0)
    .to('.loader__word > *', { yPercent: -110, duration: 0.7, stagger: 0.06, ease: 'power3.in' }, '+=0.15')
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.2')
    .set('.loader', { display: 'none' })
    .add(() => { document.body.classList.remove('is-loading'); lenis.start(); })
    .from('.hero__meta', { opacity: 0, y: -10, duration: 1 }, '-=0.6')
    .from('.hero__title .line__in', { yPercent: 110, rotate: 3, duration: 1.4, stagger: 0.12 }, '<')
    .to('.circled path', { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, '-=0.6')
    .from('.hero__grid > *', { y: 50, opacity: 0, duration: 1.2, stagger: 0.12 }, '-=1.4')
    .from('.arch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 18px 18px)', duration: 1.6, ease: 'expo.inOut' }, '<')
    .from('.badge', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.6)' }, '-=0.8');
}
if (document.readyState === 'complete') intro();
else window.addEventListener('load', intro);
setTimeout(intro, 2500);

/* ---------- rotating words ---------- */
const words = $$('.rotator b');
let wi = 0;
if (!reduce) setInterval(() => {
  const cur = words[wi];
  cur.classList.remove('is-active'); cur.classList.add('is-out');
  setTimeout(() => cur.classList.remove('is-out'), 700);
  wi = (wi + 1) % words.length;
  words[wi].classList.add('is-active');
}, 2400);

/* ---------- nav + progress ---------- */
const nav = $('.nav');
let lastY = 0;
lenis.on('scroll', ({ scroll, limit }) => {
  nav.classList.toggle('is-scrolled', scroll > 40);
  nav.classList.toggle('is-hidden', scroll > lastY && scroll > 500 && !menu.classList.contains('is-open'));
  lastY = scroll;
  $('.progress span').style.transform = `scaleX(${limit ? scroll / limit : 0})`;
});
$$('main section[id]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top center', end: 'bottom center',
    onToggle: ({ isActive }) => { if (isActive) $$('.nav__links a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + sec.id)); },
  });
});

/* ---------- section headers: rule draws in ---------- */
$$('.sec-head').forEach((h) => {
  const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top 88%' } });
  tl.from($('.sec-head__rule', h), { scaleX: 0, duration: 1.4, ease: 'expo.inOut' })
    .from([$('.sec-head__n', h), $('.sec-head__t', h)], { yPercent: 100, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out' }, 0.1);
});

/* ---------- line-by-line headline reveal ---------- */
$$('.split-lines').forEach((el) => {
  const ws = splitWords(el);
  gsap.from(ws, { yPercent: 110, opacity: 0, rotate: 4, stagger: 0.04, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
});

/* ---------- scrubbed statement ---------- */
$$('[data-scrub-text]').forEach((el) => {
  gsap.to($$('.word', el), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
});

/* ---------- generic reveals ---------- */
$$('.reveal').forEach((el) => {
  gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('.frame').forEach((f) => {
  gsap.from(f, { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: f, start: 'top 90%' } });
  const inner = f.querySelector('img, .frame__fallback span');
  if (inner) gsap.fromTo(inner, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
});
gsap.from('.svc', { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.svc-list', start: 'top 85%' } });
gsap.from('.value', { y: 50, opacity: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.values__grid', start: 'top 85%' } });
gsap.from('.facts b[data-count]', { textContent: 0, duration: 2, ease: 'power2.out', snap: { textContent: 1 }, scrollTrigger: { trigger: '.facts', start: 'top 90%' } });

/* ---------- hero: parallax out ---------- */
gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.arch img, .arch__fallback svg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

/* ---------- zoom-through typographic illusion ---------- */
(() => {
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.zoom', start: 'top top', end: 'bottom bottom', scrub: 1 } });
  $$('.zoom__circles i').forEach((c, i) => {
    tl.fromTo(c, { scale: 0.2 + i * 0.5, opacity: 0.25 }, { scale: 8 + i * 3, opacity: 0, ease: 'power1.in' }, 0);
  });
  tl.fromTo('.zoom__word span', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25 }, 0)
    .fromTo('.zoom__word em', { letterSpacing: '0.3em', opacity: 0 }, { letterSpacing: '-0.05em', opacity: 1, duration: 0.3 }, 0.1)
    .fromTo(['.zoom__kicker', '.zoom__sub'], { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.3)
    .to('.zoom__word', { scale: 9, opacity: 0, ease: 'power3.in', duration: 0.4, transformOrigin: '50% 38%' }, 0.6)
    .to(['.zoom__kicker', '.zoom__sub'], { opacity: 0, duration: 0.15 }, 0.6)
    .to('.zoom', { backgroundColor: '#f6f0e6', duration: 0.2 }, 0.8);
})();

/* ---------- footer giant ---------- */
gsap.from('.footer__giant', { yPercent: 50, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: true } });

/* ---------- hover: values ink-fill follows entry point ---------- */
$$('.value').forEach((v) => {
  v.addEventListener('pointerenter', (e) => {
    const r = v.getBoundingClientRect();
    v.style.setProperty('--x', `${e.clientX - r.left}px`);
    v.style.setProperty('--y', `${e.clientY - r.top}px`);
  });
});

/* ---------- cursor, magnetic buttons, service image preview ---------- */
if (finePointer && !reduce) {
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

  const preview = $('.preview');
  const px = gsap.quickTo(preview, 'x', { duration: 0.8, ease: 'power3' });
  const py = gsap.quickTo(preview, 'y', { duration: 0.8, ease: 'power3' });
  const PREVIEWS = [
    { name: 'Daily Living', bg: 'var(--emerald)', fg: 'var(--blush)' },
    { name: 'Nursing Care', bg: 'var(--coral)', fg: 'var(--paper)' },
    { name: 'Community', bg: 'var(--sun)', fg: 'var(--ink)' },
    { name: 'Daily Care', bg: 'var(--lilac)', fg: 'var(--ink)' },
    { name: 'NDIS Support', bg: 'var(--ink)', fg: 'var(--sun)' },
    { name: 'In-Home', bg: 'var(--blush)', fg: 'var(--emerald)' },
  ];
  const inner = $('.preview__inner');
  PREVIEWS.forEach((p, i) => {
    const s = document.createElement('div');
    s.className = 'preview__slide';
    s.style.background = p.bg; s.style.color = p.fg;
    s.innerHTML = `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"><circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="60"/><circle cx="100" cy="100" r="30"/></svg>
      <img src="/assets/img/service-${i + 1}.jpg" alt="" onerror="this.remove()" /><span>${p.name}</span>`;
    inner.appendChild(s);
  });
  const slides = $$('.preview__slide');

  window.addEventListener('pointermove', (e) => {
    cursor.classList.add('is-on');
    cx(e.clientX); cy(e.clientY); px(e.clientX + 40); py(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button, label, input, textarea');
    cursor.classList.toggle('is-label', !!lab);
    cursor.classList.toggle('is-hover', !lab && !!hov);
    label.textContent = lab ? lab.dataset.cursor : '';

    const pv = e.target.closest('[data-preview]');
    preview.classList.toggle('is-on', !!pv);
    if (pv) slides.forEach((s, i) => s.classList.toggle('is-active', i === Number(pv.dataset.preview)));
  });

  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- services rows link to contact ---------- */
$$('.svc').forEach((row) => row.addEventListener('click', () => {
  const name = row.querySelector('.svc__t').textContent;
  const radio = $$('.pills input').find((r) => r.value === name);
  if (radio) radio.checked = true;
  lenis.scrollTo('#contact', { offset: -70, duration: 1.6 });
}));

/* ---------- contact form → email client ---------- */
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const note = $('.form__note', f);
  if (!f.name.value.trim() || !f.email.value || !f.email.checkValidity()) {
    note.textContent = 'Please add your name and a valid email address.';
    return;
  }
  const service = f.service.value;
  const body = `Name: ${f.name.value}\nEmail: ${f.email.value}\nPhone: ${f.phone.value}\nInterested in: ${service}\n\n${f.message.value}`;
  window.location.href = `mailto:contact@kukacares.com.au?subject=${encodeURIComponent('Website enquiry: ' + service)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Opening your email app… or call us free on 1800 585 222.';
});

window.addEventListener('load', () => ScrollTrigger.refresh());
