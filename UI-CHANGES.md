# Ramp UI/UX refinement

Based on `main` at `31934a90c989e2f60e026934f49810b40c8c69d7`.

Mode: redesign with preservation. This is a technical calculator for architects, used at laptop and phone distances. Keep information density and the existing forms, with calmer surfaces and clearer input/result hierarchy. Design dials: variance 3, motion 2, density 7, assets 2, brand fidelity 9.

## Preserved

The existing inline Ramp icon and Pixel Studio credit, Vazirmatn font stack, blue accent family, light/dark themes, Persian/English interface, fixed RTL layout geometry, calculation formulas, compliance text, field IDs, local-storage keys, drawing geometry, history, and PDF/JPG/DXF/3D export implementations.

## Changes

- Bundle the exact pinned base source inside `index.html` as escaped JSON. Startup no longer needs raw.githubusercontent.com or jsDelivr. Existing source transformations and iframe initialization remain intact. Fonts and reference images can still require the network.
- Increase secondary-text contrast, label sizes, numeric readability, and touch controls; use restrained card surfaces, 20px corners and spacing, and a stronger result hierarchy.
- Move history to a dedicated row available to every ramp type. The parking-space label no longer competes with three history buttons.
- Clearly mark results and drawings as stale after inputs or ramp type change. Export is disabled until recalculation; the app keeps its explicit Calculate workflow.
- Show field-specific errors for empty, non-finite, or non-positive inputs; invalid submissions do not enter history. Enter in numeric inputs calculates.
- Add direct drawing/input navigation on small screens, selected-button semantics, named switches and unit selectors, visible focus, modal focus containment/restoration, and reduced-motion support.
- Translate export and history controls; describe drawings as belonging to the latest calculation. Remove insignificant trailing zeroes without reducing existing rounding precision.

Main palette: existing neutral surfaces, light-mode accent `#426fd4`, muted text `#59677e`; dark-mode accent `#89adff`, muted text `#acb9d2`. The original font stack and inline image assets remain. Layout spacing follows 4px increments; motion is limited to existing state feedback and optional scrolling.

## Verification

Run `npm ci && npm test` with Node 22.12+ (tested with Node 24).

The JSDOM regression check executes both the original source transformations and iframe initialization, including the UX layer, without fetching the base app. It covers startup, JavaScript parsing, reference calculations, stale-state export gating, invalid input, Enter, undo/redo, all ramp types, plan selection, localization, export-dialog initialization, and theme switching.

The existing published interface was visually inspected. JSDOM checks do not verify actual responsive layout, visual rendering, focus visibility, or downloaded CAD/PDF output. No cross-device browser acceptance run is claimed.

The highest-risk change is stale-state handling around history and unit conversion; covered by interaction checks. Changes are isolated in a branch for review. Reverting its commit restores the prior page. No production deployment is part of this branch.
