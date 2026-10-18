# Promo material

Screenshots and a short trailer for promoting Fimbulvetr, captured from the game itself.

- `screenshots/*.png`: 1920×1080 (3× the 640×360 canvas), the title screen and ten regions.
- `trailer.mp4`: about 35 s, 1280×720, H.264, no sound. Eleven short scenes from Askdalr to Hrímfjöll, ending on a card with the URL.

## Regenerate

The script drives a `--mode test` build through the dev query string, so every shot is reproducible.

```sh
pnpm build:test && pnpm preview --port 4173 --strictPort &
pnpm promo              # both; or `pnpm promo screenshots` / `pnpm promo trailer`
```

It needs `ffmpeg` (with libx264) on the PATH for the trailer. `PW_CHROMIUM_PATH` points it at a preinstalled Chromium, `PROMO_URL` at another server and `PROMO_FONT` at the end-card font. Edit `SHOTS` and the scene list in `scripts/promo.mjs` to change what is captured.
