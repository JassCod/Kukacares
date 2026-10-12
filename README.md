# Kuka Cares — website

Redesigned single-page site for Kuka Cares (NDIS disability support, Western Australia).
Vite + three.js (3D glass hero) + GSAP ScrollTrigger + Lenis smooth scroll.

```bash
npm install
npm run dev      # local preview
npm run build    # outputs dist/
```

## Brand assets
- **Logo:** replace `public/assets/logo.svg` (used in the loader, nav and footer).
- **Photos / video:** see `public/assets/img/README.md`; missing files fall back to a branded gradient.
- **Colours:** edit the tokens at the top of `src/style.css` (`--brand`, `--brand-2`, …). The 3D scene reads the same variables.
