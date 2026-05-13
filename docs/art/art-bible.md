# AI GUI — 2.5D 等轴测动漫办公室 Art Bible

> **版本:** 1.0
> **日期:** 2026-05-13
> **渲染引擎:** SVG + CSS（Electron 桌面应用）
> **场景:** 多 Agent 办公室可视化

---

## 1. Visual Identity Statement

### One-Line Visual Rule

**"Every element must read correctly at 40% opacity on a 200px-wide thumbnail — if silhouette alone cannot convey identity, the design has failed."**

### Supporting Principles

#### Principle 1: Silhouette-First Identity

> "When deciding whether to add a detail to a character, ask: does this change the silhouette? If no, it is optional; if yes, it is mandatory — and the six character silhouettes must be as distinct as chess pieces."

- **Boss** — Wider upper body (coat/shoulders), tallest. Inverted triangle, like a king piece.
- **PM** — Medium height, one arm gesturing (clipboard). Angular protrusion at arm height, like a bishop with a flag.
- **Developer** — Hunched posture, headphones arc over head. Rounded top with flat horizontal band, like a rook.
- **Designer** — Smaller frame, beret or asymmetrical hair. Small dome with off-center bump, like a pawn with personality.
- **Tester** — Medium height, magnifying glass or oversized glasses. Circular element near face, like a knight.
- **Worker** — Broadest lowest stance, hard-hat. Wide base with flat top, like a broad chess base.

Color is reinforcement, never the primary differentiator.

#### Principle 2: Depth Through Restrained Detail

> "When choosing between adding more shapes or refining existing ones, always refine — three well-placed gradient stops and one crisp shadow convey more material quality than twelve additional vector paths."

- Furniture gets material texture through CSS gradients on existing shapes, not additional SVG paths
- Each isometric surface gets exactly one tone (top/light, left/mid, right/shadow) — three tones per object
- Characters use flat color with one shadow zone per major area (hair, skin, clothing = two paths each)
- If an object needs more than 15 SVG elements, the design is wrong — simplify the form

#### Principle 3: Color-as-Structure

> "When selecting any color, it must serve one of three structural roles — identity (who/what), depth (where in space), or atmosphere (what mood). Decorative color serving none of these is forbidden."

### Constraint Card

| Constraint | Value | Rationale |
|---|---|---|
| Max SVG elements per scene | 3000 | Performance at 60fps |
| Max SVG file size | 80KB | Electron load time |
| Max elements per character | 15 | Silhouette > detail |
| Max elements per furniture | 12 | Depth through shading |
| Shading layers per surface | 2 (base + shadow) | Restrained detail |
| Identity accessories per role | 1 (mandatory) | Chess-piece clarity |
| Gradient stops per fill | 3 max | Material hint, not painting |
| Life tokens per desk area | 1–2 max | Warmth, not clutter |

### References

1. **Opus Magnum** — Isometric material rendering with flat-shaded planes. Take: one shadow face per component, color coding per type. Avoid: grim palette, pixel grid.
2. **Timo Meyer (Dribbble)** — Chibi proportions in isometric office. Take: 1:2 head-body ratio for characters, realistic furniture scale. Avoid: pastel-only palette, no-shadow aesthetic.
3. **Mega Man Legends / Tron Bonne** — Chibi role encoding. Take: one iconic accessory = role identity. Avoid: mechanical surface detail.
4. **Studio Ghibli interiors** (Poppy Hill, Wind Rises) — Warm livability. Take: 1-2 "life tokens" per area for warmth. Avoid: watercolor texture, organic brushwork.
5. **Figma Isometric System** — Production SVG technique. Take: shared gradient defs, separate limb paths for animation, color token consistency. Avoid: corporate palette, thin line accents.

---

## 2. Mood & Atmosphere

### Scene States

| State | Emotion | Lighting | Descriptors | Energy |
|-------|---------|----------|-------------|--------|
| **Idle (default)** | Calm productivity | Neutral-warm, even illumination, soft ambient | Serene, ordered, comfortable, quietly alive | Measured |
| **Working** | Focused engagement | Warm task-lighting from desk lamps, cool ambient | Concentrated, heads-down, industrious, humming | Measured-high |
| **Meeting** | Collaborative energy | Warm pool light over round table, softer periphery | Animated, connected, purposeful, collegiate | High |
| **Walking** | Purposeful movement | Dynamic — character carries own "presence light" (subtle warm glow) | Determined, flowing, alive, directional | Medium-high |
| **Approval pending** | Tension / anticipation | Warm scene with one cool-toned spotlight on boss + requester | Suspenseful, weighted, dramatic, decisive | High |
| **Approval granted** | Relief / celebration | Brief warm burst, golden highlight on approved character | Triumphant, released, bright, forward-moving | High-burst |
| **Approval rejected** | Disappointment / resolve | Cool wash over rejected character, scene returns to neutral | Somber, recalibrating, respectful, accepting | Low |

### Atmosphere per Theme

| Theme | Temperature | Contrast | Feel |
|-------|------------|----------|------|
| **Dark** | Warm-neutral (desks glow warm, ambient is cool-dark) | High — bright desk surfaces against dark background | Night office, cozy cocoon, focus mode |
| **Light** | Warm throughout (sunlit office) | Medium — surfaces naturally differentiated by light angle | Daytime open office, airy, professional |
| **Cyberpunk** | Cool-dominant with neon accents (cyan, magenta, amber) | Very high — neon against deep navy/black | After-hours tech office, futuristic, electric |

---

## 3. Shape Language

### Character Silhouette Philosophy

Characters read at thumbnail size through **three shape cues**: body mass distribution, headgear/accessory profile, and posture curve.

| Role | Body Shape | Head Profile | Posture |
|------|-----------|-------------|---------|
| Boss | Broad shoulders, taper down | Square jawline, neat hair | Upright, commanding |
| PM | Lean, angular | Oval, clean cut | Forward-leaning, alert |
| Developer | Medium, slightly hunched | Round, headphone band | Hunched toward screen |
| Designer | Petite, curved | Asymmetric (beret/tuft) | Slight tilt, creative lean |
| Tester | Athletic, medium | Round with glasses circles | Upright, scanning |
| Worker | Stocky, grounded | Flat-top (cap/hard hat) | Grounded stance |

### Environment Geometry

- **Dominant**: Angular isometric planes — clean 30° diagonals for furniture and walls
- **Subordinate**: Rounded elements for organic warmth — plant leaves, coffee cups, cushions
- **Ratio**: 80% angular / 20% rounded creates "structured office with human touches"
- **Floor**: Smooth diamond grid (angular), subdivided by warm-toned lines (structure)
- **Walls**: Clean triangular planes with one decorative element per wall section (not blank)

### Hero vs. Supporting Shapes

- **Hero** (eye draws to): Character silhouettes, glowing monitor screens, approval effect rings
- **Supporting** (recedes): Floor grid, wall planes, standard furniture bodies
- **Rule**: If two hero shapes overlap, reduce the smaller one's contrast by 50%

### UI Shape Grammar

UI overlays (info panel, approval dialog) use rounded rectangles with subtle elevation shadows — distinct from the angular isometric world but harmonious through shared accent color.

---

## 4. Color System

### Identity Palette (Character Role Colors — consistent across themes)

| Role | Hue | Hex | Meaning |
|------|-----|-----|---------|
| Boss | Warm red-indigo | #6366F1 | Authority, leadership |
| PM | Amber-gold | #F59E0B | Coordination, energy |
| Developer | Teal-green | #10B981 | Logic, building |
| Designer | Rose-pink | #EC4899 | Creativity, expression |
| Tester | Sky-blue | #3B82F6 | Analysis, precision |
| Worker | Violet | #8B5CF6 | Versatility, reliability |

### Semantic Colors

| Color | Meaning | Usage |
|-------|---------|-------|
| Green glow | Success, approved, completed | Approval granted ring, task completion |
| Amber glow | Warning, pending, caution | Approval pending ring, attention needed |
| Red glow | Error, rejected, danger | Approval rejected flash, error state |
| Blue pulse | Activity, processing, running | Walking trail, working indicator |

### Depth Colors (per theme — 3-plane system)

| Plane | Dark | Light | Cyberpunk |
|-------|------|-------|-----------|
| Top (lit) | Surface elevated | #f4f4f5 | #ffffff | #2d004d |
| Left (mid) | Surface base | #27272a | #e4e4e7 | #1f0035 |
| Right (shadow) | Surface shadow | #1a1a1d | #d1d5db | #150025 |

### Atmosphere Colors

| Element | Dark | Light | Cyberpunk |
|---------|------|-------|-----------|
| Floor | #27272a | #f4f4f5 | #1f0035 |
| Wall lit | #3f3f46 | #e4e4e7 | #2d004d |
| Wall shadow | #27272a | #d4d4d8 | #250048 |
| Window fill | #1e3a5f | #bfdbfe | #3b0764 |
| Plant | #4ADE80 | #22C55E | #00FFD5 |
| Screen glow | #0EA5E9 | #3B82F6 | #00FFD5 |
| Wood tone | #8B7355 | #C4A882 | #6B3FA0 |
| Metal tone | #6B7280 | #D1D5DB | #7C3AED |

### Colorblind Safety

- Role colors were selected with CVD simulation: all six hues span distinct regions of the color wheel
- Blue (tester) and green (developer) are the closest pair — backup: tester has glasses circles, developer has headphone band
- Amber (PM) and green (developer) — backup: PM has clipboard rectangle, developer has hunched posture
- Semantic colors always paired with shape: green glow = upward arrow ring, amber = pulsing ring, red = X flash

---

## 5. Character Design Direction

### Proportions (Q-chibi 1:2.5 head-body ratio)

| Part | Width | Height | Notes |
|------|-------|--------|-------|
| Head | 16 units | 16 units | Large, round, 40% of total height |
| Body | 14 units | 18 units | Compact torso with role-specific clothing shape |
| Legs | 6 units each | 14 units | Short, sturdy |
| Arms | 5 units each | 14 units | Separate paths for animation rotation |

### Per-Role Design

| Role | Hair | Clothing | Accessory | Distinguishing Feature |
|------|------|----------|-----------|----------------------|
| Boss | Short, neat side-part, dark | Blazer with wide shoulders, tie | Thermos in one hand | Broadest shoulders, tallest stance |
| PM | Clean short cut, brown | Shirt + vest combo | Clipboard/tablet rectangle | One arm extended with object |
| Developer | Messy/beanie, dark | Hoodie up, visible headphones band | Keyboard decal on hoodie | Headphone band silhouette |
| Designer | Long/ponytail OR beret | Scarf or cardigan | Paintbrush/pen behind ear | Asymmetric head profile |
| Tester | Sporty short cut | Track jacket / casual | Oversized round glasses | Two circle elements at face |
| Worker | Standard short cut | Plain polo/shirt | Hard hat or cap | Flat-top head, stocky base |

### Expression System (5 states)

| Expression | Eyes | Mouth | Eyebrows |
|-----------|------|-------|----------|
| Neutral | Open circles, white highlight dot | Small horizontal line | Neutral |
| Focused | Half-closed, slightly narrowed | Tight line | Slightly furrowed |
| Happy | Upward arcs (^_^) | Upward curve | Raised |
| Worried | Open circles + sweat drop | Wavy/zigzag | Raised, concerned |
| Thinking | One eye larger (looking sideways) | Small 'O' | One raised |

### Animation Target

Each character's SVG limbs are separate `<g>` groups with transform origins set for rotation:
- Arms: rotate from shoulder point
- Legs: rotate from hip point
- Head: translate Y for breathing, rotate for expressions

### LOD (Level of Detail)

- **Full zoom**: All details — clothing texture lines, accessory shapes, face features
- **Default zoom**: Silhouette + accessory + face features preserved, texture lines fade
- **Min zoom**: Silhouette + accessory only — face becomes a simple circle

---

## 6. Environment Design Language

### Architectural Style

- Modern minimalist office — clean lines, open floor plan
- Isometric projection with consistent 30° angles
- Rooms defined by floor diamond + two wall triangles (standard isometric room)

### Texture Philosophy

- **SVG gradients** for material hint, NOT bitmap textures
- Wood: 3-stop linear gradient (light edge → warm mid → dark edge)
- Metal: 2-stop with highlight reflection band
- Glass: Base fill + 2-stop radial gradient for reflection
- Fabric: Single fill with one shadow plane — no texture lines
- Screen: Emissive fill with animated content suggestion (gradient shift)

### Prop Density Rules

| Zone | Furniture Count | Life Tokens | Visual Weight |
|------|----------------|-------------|---------------|
| Workstation (per desk) | 3 (desk + monitor + chair) | 1–2 (plant/cup/photo) | Dense, productive |
| Meeting area | 1 (round table) + 6 (chairs) | 0–1 (whiteboard) | Open, communal |
| Lounge area | 2–3 (sofa + coffee table + plant) | 1–2 (books/cups) | Sparse, relaxed |
| Boss office | 2–3 (desk + chair + bookshelf) | 1–2 (award frame/diploma) | Personal, authoritative |

### Environmental Storytelling

- Each desk area subtly reflects the role sitting there (developer desk has dual monitors, designer desk has color swatches)
- Lounge area has a slightly wilted plant (office life)
- Meeting room whiteboard has faint marker marks
- Boss office has a larger window (status)

---

## 7. UI Visual Direction

### Overlay Panels

- **Info panel** (character click): Rounded rectangle, `bg-surface-elevated`, slide-up entrance
- **Approval dialog**: Full-width bottom bar with amber accent, slide-up animation
- **Add room button**: Floating action button, accent color, subtle pulse when idle

### Typography

- Character name labels: `fontSize="7"`, `fontWeight="600"`, `fontFamily="system-ui"`
- Room labels: `fontSize="11"`, low opacity, centered in floor diamond
- UI panel text: Standard Tailwind classes (`text-sm`, `text-xs`)

### Iconography

- In-world icons (activity rings, approval indicators): Simple geometric SVG — circles, arcs, lines
- No icon library in the isometric view — all icons are custom inline SVG matching the shape language

### Animation Feel

- UI panels: 200ms ease-out slide-up (matches `animate-slide-up`)
- View transitions: 180ms fade (matches `animate-view-in`)
- Approval effects: 300ms burst (glow ring expand + fade)
- No bouncy/spring animations in UI — measured and professional

---

## 8. Asset Standards

### SVG Production Rules

| Asset Type | Max Elements | Max File Size | Gradient Defs | Animation |
|-----------|-------------|---------------|---------------|-----------|
| Character (full) | 15 | 4KB | 3 shared | CSS transform/opacity only |
| Furniture piece | 12 | 3KB | 2 shared | None (static) |
| Room (floor + 2 walls) | 40 | 5KB | 1 shared | None |
| Effect (glow/trail) | 8 | 1KB | 0 | CSS opacity + transform |

### Naming Convention

```
iso-[type]-[variant].[ext]

Examples:
iso-character-boss.svg
iso-character-developer.svg
iso-furniture-desk.svg
iso-furniture-monitor.svg
iso-room-standard.svg
iso-room-boss.svg
iso-effect-glow-ring.svg
iso-effect-walk-trail.svg
```

### Shared Gradient Definitions

All gradients defined once in `<defs>` at the scene root:

```svg
<defs>
  <linearGradient id="wood-grain" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="var(--wood-light)" />
    <stop offset="50%" stop-color="var(--wood-mid)" />
    <stop offset="100%" stop-color="var(--wood-dark)" />
  </linearGradient>
  <linearGradient id="metal-shine" ...>
  <radialGradient id="screen-glow" ...>
</defs>
```

### Animation Implementation

- Transform origins set via CSS: `transform-origin: [shoulder/hip point]`
- State changes use CSS classes: `.anim-idle`, `.anim-working`, `.anim-walking`
- `requestAnimationFrame` drives timing, CSS handles interpolation
- No SVG SMIL animations (deprecated in some contexts)
- No JavaScript-driven per-frame path manipulation

### Performance Budgets

| Metric | Target | Hard Limit |
|--------|--------|-----------|
| Total SVG elements | 2000 | 3000 |
| IsoScene bundle | 60KB | 80KB |
| Render frame time | <8ms | <16ms |
| Gradient definitions | 10 | 15 |
| Animated elements per frame | 20 | 30 |

### Export Checklist

- [ ] All fills use CSS variables or theme-aware values
- [ ] No hardcoded hex colors on characters or furniture
- [ ] Animated limbs are separate `<g>` elements with correct transform origins
- [ ] Shared gradients referenced, not duplicated
- [ ] Each asset under element budget
- [ ] Tested in dark, light, and cyberpunk themes

---

## 9. Style Prohibitions

### Banned Patterns

1. **Realistic textures** — No bitmap patterns, noise, or photo textures. SVG gradients only.
2. **Thin decorative lines** — No 0.5px hairlines (invisible at small sizes). Minimum stroke 1px.
3. **Detailed hands/fingers** — Characters get mitten hands or simple circles. No finger articulation.
4. **Shadow blur** — No `feGaussianBlur` on animated elements (performance killer). Static shadow only.
5. **Rainbow gradients** — Every gradient must serve identity/depth/atmosphere. Decorative rainbow is banned.
6. **Text in graphics** — No text baked into SVG paths. Use `<text>` elements or HTML overlays.
7. **Realistic proportions** — No 1:6 head-body ratio. Q-chibi only.
8. **Uniform detail density** — Don't give every element the same level of detail. Hero shapes get more, supporting shapes get less.
9. **Theme-dependent character recognition** — Characters must be identifiable in ANY theme. If color is the only differentiator, the design fails.
10. **Animated gradients** — No `<animate>` on gradient stops. Performance budget does not allow it.

### Quality Gate

Before any asset is committed:
- [ ] Does it read at 40% opacity / 200px wide?
- [ ] Is the silhouette distinct from other assets of the same type?
- [ ] Does every color serve identity, depth, or atmosphere?
- [ ] Is element count within budget?
- [ ] Does it look correct in all three themes?
