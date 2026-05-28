# Telecom Indoor Navigator

This project is a browser-based 3D indoor navigation prototype for the Telecom
Paris building. 

## Features

- 3D building viewer with orbit camera controls.
- Start and destination search with aliases, floor filters, keyboard navigation,
  and recent POIs.
- Navigation mesh based route calculation.
- Custom red route visualization and target marker.
- Animated green agent that follows the active route.
- Automatic and manual floor visibility controls.
- Interactive POI markers with hover and selected states.
- Route metrics: distance, floors, and estimated turns.
- Local route feedback: Clear, Confusing, Blocked.
- Modular code structure for easier maintenance.

## Requirements

- Node.js
- npm

## Run Locally

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

Do not open `index.html` directly with `file://`. The project loads GLB/GLTF
assets, so it should be served through a local or remote web server.

## Build

Create a production build:

```bash
npm run build
```

The output is written to:

```text
dist/
```

The Vite config copies the required `glb/` model assets into `dist/glb/` during
the build.

## Preview Production Build

After building, preview the production output locally:

```bash
npm run preview
```

Then open the URL printed by Vite.

## Project Structure

```text
.
|-- data/
|   `-- pois.js              # Floor metadata, POIs, feedback options
|-- glb/                     # Building, floor, door, and navmesh assets
|-- modules/
|   |-- assets.js            # GLB/GLTF loading and navmesh registration
|   |-- constants.js         # Shared constants
|   |-- feedback.js          # Local route feedback
|   |-- interaction.js       # Pointer picking and drag-safe clicks
|   |-- poiMarkers.js        # 3D POI pins and labels
|   |-- routing.js           # Route calculation, route drawing, agent movement
|   |-- scene.js             # Three.js scene, camera, renderer, controls
|   |-- searchController.js  # Start/destination search
|   |-- state.js             # Initial application state
|   `-- ui.js                # UI helpers and route panel rendering
|-- index.html               # App shell and controls
|-- main.js                  # Application entry point and module wiring
|-- styles.css               # UI styling
|-- vite.config.js           # Vite build and asset-copy config
`-- package.json             # Scripts and dependencies
```

## Navigation Data

Destinations are defined in `data/pois.js`:

```js
{
  id: 'ground-door',
  label: 'Ground Door',
  category: 'Entrance',
  floor: 1,
  aliases: ['door 3', 'ground floor door'],
  position: { x: 2.88, y: 0.006, z: -2.53 }
}
```

Add future rooms, elevators, stairs, exits, or services by adding new entries to
`pointsOfInterest`. For best results, each point should be placed on or close
to the navigation mesh.

## Route Feedback

The feedback controls are intentionally local-only for now. Records are stored
in `localStorage` under:

```text
telecom-route-feedback-v1
```

Future backend-backed feedback could aggregate blocked segments, confusing
routes, accessibility issues, and crowded areas into indoor quality maps.

## Asset Workflow

1. Model floors, doors, and walkable surfaces in Blender.
2. Export visible building assets as `.glb`.
3. Generate a navigation mesh in UPBGE, Blender tooling, or a Recast-based
   generator.
4. Export the navmesh as `glb/building_navmesh.gltf`.
5. Keep object names aligned with the entries in `data/pois.js`.
6. Run `npm run build` and confirm `dist/glb/` exists.
