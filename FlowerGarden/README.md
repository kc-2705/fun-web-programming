# Interactive Garden

Plant a garden with your mouse or finger and watch it live through the day and night. Built with plain HTML, CSS, SVG and JavaScript: no libraries, no build step. Open `index.html` and it runs.

## What you can do

- **Plant** by clicking or tapping. The higher you click, the taller the flower.
- **Six flowers:** daisy, tulip, sunflower, rose, lavender and blossom, or a surprise mix. Stems draw themselves, leaves pop out and petals unfurl.
- **Water** a flower to make it grow, or **make it rain** so the whole garden grows.
- **Day and night:** the sky moves through sunrise, day, sunset and night (a full day takes about 2½ minutes), or you can hold it at one time. Stars, the moon and fireflies come out at night and the flowers glow.
- **Visitors:** butterflies and bees fly between your flowers during the day.
- **Sound:** soft chimes when a flower blooms, a gentle background chord and rain sounds, all generated in the browser with the Web Audio API.
- **Keep and share:** the garden saves itself in the browser, **Save a picture** downloads a PNG, and **Share** copies a link that rebuilds your garden for anyone who opens it.
- **Undo** and **Clear** (with a confirmation).
- A **how-to-play** screen on start, keyboard shortcuts, touch support, and reduced motion when the device asks for it.

## Keyboard

| Key | Action |
| --- | --- |
| 1–6 | Choose a flower |
| W | Watering can |
| R | Rain |
| T | Time of day |
| M | Sound on or off |
| S | Save a picture |
| Ctrl + Z | Undo |
| ? | Help |

## How it works

- Each flower is an SVG group drawn around its own base. Shapes are plain attributes, and all motion (stem drawing, petals unfurling, swaying) is CSS animation, so a saved picture shows the finished flowers.
- The sky color, sun and moon positions come from one value for the time of day, blended between color stops on every animation frame.
- The share link packs each flower into a few numbers (type, position, height, color, size, bend) and encodes them in the URL.
- The PNG export builds a standalone SVG of the scene, draws it onto a canvas and downloads it.

The first version of this project is kept in `original/`.

Built by Kavya Immanni.
