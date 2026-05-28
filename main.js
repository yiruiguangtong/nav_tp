import { feedbackOptions, floorDefinitions, pointsOfInterest } from './data/pois.js';
import { DEFAULT_START_ID } from './modules/constants.js';
import { createAssetController } from './modules/assets.js';
import { createFeedbackController } from './modules/feedback.js';
import { createInteractionController } from './modules/interaction.js';
import { createPoiMarkerController } from './modules/poiMarkers.js';
import { createRoutingController } from './modules/routing.js';
import { createSceneContext, handleResize, resetView, startRenderLoop } from './modules/scene.js';
import { createSearchController, readRecentPoiIds } from './modules/searchController.js';
import { createInitialState } from './modules/state.js';
import {
  clearRoutePanel,
  expandPanel,
  getUi,
  renderRoutePanel,
  setRouteEnabled,
  setRouteStepText,
  setStatus,
  togglePanel
} from './modules/ui.js';

const sceneRoot = document.getElementById('sceneRoot');
const ui = getUi();
const state = createInitialState(readRecentPoiIds(pointsOfInterest));
const sceneContext = createSceneContext(sceneRoot);

let searchController;
let feedbackController;
let poiMarkerController;

const routingController = createRoutingController({
  sceneContext,
  state,
  ui,
  floorDefinitions,
  setStatus: (text, tone) => setStatus(ui, text, tone),
  setFeedbackEnabled: (enabled) => feedbackController.setFeedbackEnabled(enabled),
  setRouteStepText: (text) => setRouteStepText(ui, text),
  clearRoutePanel: () => clearRoutePanel(ui),
  renderRoutePanel: (label, points) => renderRoutePanel(ui, {
    label,
    points,
    getPathDistance: routingController.getPathDistance,
    getFloorSequence: routingController.getFloorSequence,
    getFloorChanges: routingController.getFloorChanges,
    floorForY: routingController.floorForY,
    floorLabel: routingController.floorLabel,
    floorShortLabel: routingController.floorShortLabel
  }),
  getSearchController: () => searchController,
  updatePoiMarkerStates: () => poiMarkerController.updatePoiMarkerStates()
});

feedbackController = createFeedbackController({
  ui,
  state,
  feedbackOptions,
  setStatus: (text, tone) => setStatus(ui, text, tone),
  getFloorSequence: routingController.getFloorSequence,
  getPathDistance: routingController.getPathDistance
});

poiMarkerController = createPoiMarkerController({
  sceneContext,
  state,
  pointsOfInterest,
  toVector: routingController.toVector,
  getPoi
});

searchController = createSearchController({
  ui,
  state,
  pointsOfInterest,
  floorDefinitions,
  floorLabel: routingController.floorLabel,
  floorShortLabel: routingController.floorShortLabel,
  getPoi,
  setAgentPosition: routingController.setAgentPosition,
  clearRoute: routingController.clearRoute,
  setStatus: (text, tone) => setStatus(ui, text, tone),
  routeToPoi: routingController.routeToPoi,
  routeFromControls,
  setHoveredPoi: poiMarkerController.setHoveredPoi,
  updatePoiMarkerStates: poiMarkerController.updatePoiMarkerStates,
  expandPanel: () => expandPanel(ui, state)
});

const assetController = createAssetController({
  sceneContext,
  state,
  floorDefinitions,
  setRouteEnabled: (enabled) => setRouteEnabled(ui, enabled),
  setStatus: (text, tone) => setStatus(ui, text, tone),
  setRouteStepText: (text) => setRouteStepText(ui, text),
  updateFloorVisibility: routingController.updateFloorVisibility
});

const interactionController = createInteractionController({
  sceneContext,
  state,
  findPoiFromObject: poiMarkerController.findPoiFromObject,
  routeToPoi: routingController.routeToPoi,
  routeToPoint: routingController.routeToPoint,
  setHoveredPoi: poiMarkerController.setHoveredPoi
});

searchController.populateControls();
feedbackController.populateFeedbackControls();
routingController.setAgentPosition(getPoi(DEFAULT_START_ID).position);
clearRoutePanel(ui);
feedbackController.updateFeedbackCount();
poiMarkerController.createPoiMarkers();
assetController.bootstrap();
startRenderLoop(sceneContext, routingController.moveAgent);

window.addEventListener('resize', () => handleResize(sceneContext));
sceneContext.renderer.domElement.addEventListener('pointerdown', interactionController.handlePointerDown);
sceneContext.renderer.domElement.addEventListener('pointermove', interactionController.handlePointerMove);
sceneContext.renderer.domElement.addEventListener('pointerup', interactionController.handlePointerUp);
sceneContext.renderer.domElement.addEventListener('pointerleave', () => poiMarkerController.setHoveredPoi(null));
ui.panelToggle.addEventListener('click', () => togglePanel(ui, state));
ui.routeButton.addEventListener('click', routeFromControls);
ui.startInput.addEventListener('input', searchController.handleStartInput);
ui.startInput.addEventListener('focus', searchController.handleStartFocus);
ui.startInput.addEventListener('keydown', searchController.handleStartKeydown);
ui.clearStartButton.addEventListener('pointerdown', searchController.handleClearStartPointerDown);
ui.destinationInput.addEventListener('input', searchController.handleDestinationInput);
ui.destinationInput.addEventListener('focus', searchController.handleDestinationFocus);
ui.destinationInput.addEventListener('keydown', searchController.handleDestinationKeydown);
ui.clearDestinationButton.addEventListener('pointerdown', searchController.handleClearDestinationPointerDown);
document.addEventListener('pointerdown', searchController.handleDocumentPointerDown);
ui.resetViewButton.addEventListener('click', () => resetView(sceneContext));
ui.clearRouteButton.addEventListener('click', () => routingController.clearRoute({ clearDestination: true }));
ui.floorButtons.forEach((button) => {
  button.addEventListener('click', () => routingController.setFloorMode(button.dataset.floor));
});

function routeFromControls() {
  expandPanel(ui, state);

  if (!state.navReady) {
    setStatus(ui, 'Navigation still loading', 'loading');
    return;
  }

  searchController.applyStartSelection();

  const poi = searchController.findPoiByInput(ui.destinationInput.value);
  if (!poi) {
    setStatus(ui, 'Choose a destination', 'error');
    setRouteStepText(ui, 'Destination not found');
    searchController.showDestinationResults();
    return;
  }

  routingController.routeToPoi(poi);
}

function getPoi(id) {
  return pointsOfInterest.find((poi) => poi.id === id);
}
