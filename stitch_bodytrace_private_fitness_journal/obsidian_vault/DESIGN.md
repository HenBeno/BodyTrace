# Design System Strategy: The Private Vault

## 1. Overview & Creative North Star

**Creative North Star: "The Digital Sanctuary"**

This design system rejects the frantic, high-energy tropes of traditional fitness applications. Instead of gamification and loud neon accents, we embrace a "Quiet, Secure, and Professional" philosophy. The experience is designed to feel like a high-end, private archival tool—a digital vault where the user's progress is treated with the same reverence as a curated gallery.

To move beyond the "template" look, this system utilizes **Intentional Asymmetry** and **Tonal Depth**. We prioritize breathing room over information density. By leveraging sophisticated layering and an editorial typographic hierarchy, we create a sense of professional permanence. The layout should never feel "built"; it should feel "composed."

---

## 2. Color & Surface Philosophy

The palette is rooted in the depth of `surface` (#0e0e0e), using a sophisticated range of charcoals and muted teals to imply security without the weight of traditional "dark mode" cliches.

### The "No-Line" Rule

**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning or containment.
Structure is defined through:

- **Tonal Shifts:** Placing a `surface-container-low` object against a `surface` background.
- **Negative Space:** Using the spacing scale to create mental boundaries.
- **Glassmorphism:** Using `surface-variant` with a 60% opacity and 20px backdrop-blur to define floating modules.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers. Hierarchy is achieved by "stacking" container tiers:

1.  **Base Layer:** `surface` (#0e0e0e) – The foundation.
2.  **Sectional Layer:** `surface-container-low` (#131313) – Large grouping areas.
3.  **Active Component:** `surface-container` (#191a1a) or `surface-container-high` (#1f2020) – For cards and interactive modules.
4.  **Floating Elements:** Use `surface-bright` (#2b2c2c) with low-opacity shadows for elements that require immediate attention.

### The "Glass & Signature" Texture

To provide visual "soul," avoid flat teal blocks. Instead, main CTAs should utilize a subtle linear gradient from `primary` (#accbde) to `primary-container` (#2c4a5a) at a 135-degree angle. This adds a metallic, high-end "vault" sheen that feels intentional and premium.

---

## 3. Typography: The Editorial Voice

We use a dual-font strategy to balance authority with utility.

- **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` and `headline-md` with tight letter-spacing (-0.02em) to create an authoritative, editorial feel.
- **Body & Labels (Inter):** The workhorse. Inter provides maximum legibility for progress metrics and data entry.

**Hierarchy as Identity:**
Large, offset `display-sm` headlines should be used to anchor pages, often placed with asymmetrical padding (e.g., 40px left, 80px right) to break the rigid grid and make the journal feel like a custom-designed book.

---

## 4. Elevation & Depth

We eschew traditional drop shadows in favor of **Tonal Layering** and **Ambient Light.**

- **The Layering Principle:** Depth is "inner-out." An inner container should always be lighter than its parent (e.g., a `surface-container-highest` card sitting within a `surface-container-low` page).
- **Ambient Shadows:** If a floating state is required (e.g., a camera shutter button), use a 32px blur with 6% opacity. The shadow color must be sampled from `surface-tint` (#accbde) to mimic the way light catches fine materials.
- **The Ghost Border:** For accessibility in high-density areas, use `outline-variant` (#484848) at **10% opacity**. This creates a "suggestion" of a boundary without interrupting the visual flow.

---

## 5. Components

### Buttons & Interaction

- **Primary:** Gradient fill (`primary` to `primary-container`), white text (`on_primary`). Radius: `md` (0.375rem).
- **Secondary:** Surface-only. No border. Use `secondary_container` background with `on_secondary_container` text.
- **The Precise Camera Trigger:** A `surface_container_highest` outer ring with a `primary` inner circle. High tactile feedback; no shadows; defined solely by tonal contrast.

### The Progress Vault (Cards)

- **Rules:** No dividers. Separation is achieved through 24px vertical padding and shifting from `surface` to `surface-container-low`.
- **Content:** Metrics use `title-lg` for the value and `label-sm` (uppercase, 0.05em tracking) for the descriptor.

### Data Inputs

- **Quiet Fields:** Inputs should not have background colors by default. Use a simple `outline-variant` (at 20% opacity) bottom-border only. On focus, transition to a `primary` bottom-border (2px) and a subtle `surface-container-low` background fade-in.

### Specialized Components

- **Privacy Shield:** A specialized chip using `tertiary_container` with `on_tertiary` text to indicate "Local-Only" or "Encrypted" status.
- **Timeline Nodes:** Instead of lines, use vertical spacing and small `primary` dots to connect entries, creating a minimalist "trace" of the body's evolution.

---

## 6. Do’s and Don’ts

### Do:

- **Embrace Asymmetry:** Align headlines to the left but place action buttons in the bottom-right "thumb zone" to create a modern, editorial rhythm.
- **Use Micro-Transitions:** When a surface changes color on hover, use a 300ms linear-out-slow-in easing to mimic the feeling of a heavy vault door opening.
- **Respect the Data:** In a fitness journal, the photo is the hero. Use `surface-container-lowest` as a "frame" for images to make them pop against the UI.

### Don’t:

- **Don't use pure black (#000):** Except for the absolute lowest background layers. Pure black feels "dead"; our `surface` (#0e0e0e) retains a microscopic amount of warmth.
- **Don't use "Gym-Bro" language:** Use "Evolution" instead of "Gains," "Consistency" instead of "Streak," and "Log" instead of "Crush."
- **Don't use Dividers:** If you feel the need for a line, increase the `gap` or change the `surface` tier instead. Lines are a sign of a failed spatial hierarchy.
