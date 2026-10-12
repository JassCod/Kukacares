import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/manrope';
import './style.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initScene } from './scene.js';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');
document.body.classList.add('is-loading');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

$('#year').textContent = new Date().getFullYear();

/* ---------- optional media (original photos / video slots) ---------- */
$$('img[data-optional-media]').forEach((img) => {
  const miss = () => img.classList.add('is-missing');
  if (img.complete && img.naturalWidth === 0) miss();
  img.addEventListener('error', miss);
});
const heroVideo = $('.hero__video');
heroVideo?.querySelector('source')?.addEventListener('error', () => heroVideo.remove());
heroVideo?.addEventListener('error', () => heroVideo.remove());

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduce });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  });
});

/* ---------- 3D hero ---------- */
const scene = initScene($('.hero__gl'));

/* ---------- split text ---------- */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-hidden', 'true');
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'char';
    s.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(s);
  }
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(' ');
}
$$('.hero__title .split').forEach(splitChars);
$$('[data-scrub-text]').forEach(splitWords);

/* ---------- preloader → intro ---------- */
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const counter = { v: 0 };
  tl.to(counter, {
    v: 100, duration: reduce ? 0.1 : 1.4, ease: 'power2.inOut',
    onUpdate: () => {
      $('.loader__count').textContent = Math.round(counter.v);
      $('.loader__bar span').style.width = counter.v + '%';
    },
  })
    .to('.loader__inner', { y: -30, opacity: 0, duration: 0.6, ease: 'power2.in' })
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
    .set('.loader', { display: 'none' })
    .add(() => { document.body.classList.remove('is-loading'); lenis.start(); })
    .from('.hero__title .char', {
      yPercent: 120, rotateX: -90, opacity: 0, filter: 'blur(12px)',
      stagger: 0.025, duration: 1.4, transformOrigin: '50% 100%',
    }, '-=0.5')
    .to('.hero .reveal-up', { opacity: 1, y: 0, stagger: 0.1, duration: 1.2 }, '-=1')
    .from('.nav', { opacity: 0, duration: 1.2, clearProps: 'opacity' }, '<')
    .from('.hero__title .shimmer', { yPercent: 110, opacity: 0, filter: 'blur(12px)', duration: 1.4 }, '<-0.4');
}
if (document.readyState === 'complete') intro();
else window.addEventListener('load', intro);
// safety: never trap the user behind the loader
setTimeout(() => { if (document.body.classList.contains('is-loading')) { gsap.set('.loader', { display: 'none' }); document.body.classList.remove('is-loading'); lenis.start(); gsap.set('.reveal-up', { opacity: 1, y: 0 }); } }, 6000);

/* ---------- rotating words ---------- */
const words = $$('.rotator b');
let wi = 0;
if (!reduce) setInterval(() => {
  const cur = words[wi];
  cur.classList.remove('is-active'); cur.classList.add('is-out');
  setTimeout(() => cur.classList.remove('is-out'), 800);
  wi = (wi + 1) % words.length;
  words[wi].classList.add('is-active');
}, 2400);

/* ---------- hero scroll exit ---------- */
ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
  onUpdate: (self) => scene.setScroll(self.progress),
});
gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.hero__card', { yPercent: -80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

/* ---------- nav hide/show + progress ---------- */
const nav = $('.nav');
let lastY = 0;
lenis.on('scroll', ({ scroll, limit }) => {
  nav.classList.toggle('is-scrolled', scroll > 40);
  nav.classList.toggle('is-hidden', scroll > lastY && scroll > 400 && !menu.classList.contains('is-open'));
  lastY = scroll;
  $('.progress span').style.transform = `scaleX(${limit ? scroll / limit : 0})`;
});
$$('main section[id]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top center', end: 'bottom center',
    onToggle: ({ isActive }) => {
      if (!isActive) return;
      $$('.nav__links a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + sec.id));
    },
  });
});

/* ---------- mobile menu ---------- */
const menu = $('.menu');
const burger = $('.nav__burger');
function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); }
burger.addEventListener('click', () => {
  const open = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  if (open) gsap.from('.menu > a', { y: 60, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out', delay: 0.15 });
});

/* ---------- generic reveals ---------- */
$$('.reveal-up').forEach((el) => {
  if (el.closest('.hero')) return;
  gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
});
$$('.split-words').forEach((el) => {
  splitWords(el);
  gsap.from(el.querySelectorAll('.word'), {
    yPercent: 100, opacity: 0, rotate: 4, stagger: 0.06, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

/* ---------- scrubbed word highlight ---------- */
$$('[data-scrub-text]').forEach((el) => {
  gsap.to(el.querySelectorAll('.word'), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 40%', scrub: true },
  });
});

/* ---------- parallax media ---------- */
$$('.parallax').forEach((el) => {
  const sp = parseFloat(el.dataset.speed || 0.1);
  gsap.to(el, { yPercent: sp * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  const img = el.querySelector('img');
  if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
});
$$('.media').forEach((m) => {
  gsap.from(m, { clipPath: 'inset(30% 10% 30% 10% round 28px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 90%' } });
});

/* ---------- marquee driven by scroll velocity ---------- */
(() => {
  const track = $('.marquee__track');
  const row = $('.marquee__row');
  let x = 0, dir = -1, extra = 0;
  lenis.on('scroll', ({ velocity }) => { extra = velocity * 0.6; if (velocity) dir = velocity > 0 ? -1 : 1; });
  gsap.ticker.add(() => {
    const w = row.offsetWidth;
    x += (dir * (reduce ? 0 : 1.2)) - Math.abs(extra) * (dir < 0 ? 1 : -1);
    extra *= 0.92;
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
})();

/* ---------- tunnel illusion ---------- */
(() => {
  const rings = $$('.tunnel__rings i');
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.tunnel', start: 'top top', end: 'bottom bottom', scrub: 1 } });
  rings.forEach((r, i) => {
    const z0 = -2600 + i * 230;
    tl.fromTo(r, { z: z0, rotate: i * 15, opacity: 0.4 }, { z: z0 + 3600, rotate: i * 15 + 120, opacity: 1, ease: 'none' }, 0);
  });
  tl.fromTo('.tunnel__word span:first-child', { scale: 0.4, opacity: 0, filter: 'blur(20px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.35 }, 0)
    .fromTo('.tunnel__word span:last-child', { scale: 2.4, opacity: 0, letterSpacing: '0.3em' }, { scale: 1, opacity: 1, letterSpacing: '-0.04em', ease: 'power2.out', duration: 0.4 }, 0.15)
    .fromTo('.tunnel__sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.2 }, 0.45)
    .to('.tunnel__word', { scale: 6, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0.7);
})();

/* ---------- values: horizontal pinned scroll ---------- */
ScrollTrigger.matchMedia({
  '(min-width: 861px)': () => {
    const track = $('.values__track');
    const dist = () => track.scrollWidth - (window.innerWidth - track.getBoundingClientRect().left) + window.innerWidth * 0.08;
    gsap.to(track, {
      x: () => -Math.max(0, dist()), ease: 'none',
      scrollTrigger: { trigger: '.values', pin: '.values__pin', start: 'top top', end: () => '+=' + Math.max(1, dist()), scrub: 1, invalidateOnRefresh: true },
    });
    $$('.value').forEach((v, i) => gsap.from(v, { rotateY: -25, z: -200, opacity: 0.2, transformPerspective: 1000, duration: 1, scrollTrigger: { trigger: '.values', start: 'top 60%' }, delay: i * 0.05 }));
  },
});

/* ---------- journey line draw ---------- */
gsap.to('.journey__line path', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.journey', start: 'top 70%', end: 'bottom 60%', scrub: true } });

/* ---------- gallery drift ---------- */
gsap.fromTo('.gallery__row', { x: 0 }, { x: () => -(($('.gallery__row').scrollWidth) - window.innerWidth) * 0.6, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });

/* ---------- footer giant text ---------- */
gsap.from('.footer__giant', { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

/* ---------- hover: tilt, spotlight, magnetic, cursor ---------- */
if (finePointer && !reduce) {
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = 'transform .15s ease-out';
      el.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(0)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transition = ''; el.style.transform = ''; });
  });

  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  const cursor = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const label = $('.cursor__label');
  const dX = gsap.quickTo(dot, 'x', { duration: 0.1 }), dY = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const rX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), rY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { cursor.classList.add('is-on'); dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button, [data-hover], input, select, textarea');
    cursor.classList.toggle('is-label', !!lab);
    cursor.classList.toggle('is-hover', !lab && !!hov);
    label.textContent = lab ? lab.dataset.cursor : '';
  });
}
document.addEventListener('pointermove', (e) => {
  const el = e.target.closest?.('.spotlight');
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
});

/* ---------- contact form → email client ---------- */
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const note = $('.form__note', f);
  if (!f.name.value.trim() || !f.email.checkValidity() || !f.email.value) {
    note.textContent = 'Please add your name and a valid email address.';
    return;
  }
  const body = `Name: ${f.name.value}\nEmail: ${f.email.value}\nPhone: ${f.phone.value}\nInterested in: ${f.service.value}\n\n${f.message.value}`;
  window.location.href = `mailto:contact@kukacares.com.au?subject=${encodeURIComponent('Website enquiry — ' + f.service.value)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Opening your email app… or call us free on 1800 585 222.';
});

window.addEventListener('load', () => ScrollTrigger.refresh());
