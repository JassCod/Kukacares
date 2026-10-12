# Kuka Cares — website

Editorial single-page site for Kuka Cares (NDIS disability support, Western Australia).
Vite + GSAP ScrollTrigger + Lenis smooth scroll.

```bash
npm install
npm run dev      # local preview
npm run build    # outputs dist/
```

## Brand assets
- **Logo:** replace `public/assets/logo.svg` (nav) and `logo-light.svg` (footer).
- **Photos / video:** see `public/assets/img/README.md`; missing files fall back to a branded gradient.
- **Colours:** edit the tokens at the top of `src/style.css` (`--brand`, `--brand-2`, …).
