export function getUi() {
  return {
    appPanel: document.getElementById('appPanel'),
    panelToggle: document.getElementById('panelToggle'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    startInput: document.getElementById('startInput'),
    startResults: document.getElementById('startResults'),
    clearStartButton: document.getElementById('clearStartButton'),
    destinationInput: document.getElementById('destinationInput'),
    destinationResults: document.getElementById('destinationResults'),
    clearDestinationButton: document.getElementById('clearDestinationButton'),
    routeButton: document.getElementById('routeButton'),
    resetViewButton: document.getElementById('resetViewButton'),
    clearRouteButton: document.getElementById('clearRouteButton'),
    distanceValue: document.getElementById('distanceValue'),
    floorValue: document.getElementById('floorValue'),
    waypointValue: document.getElementById('waypointValue'),
    routeSteps: document.getElementById('routeSteps'),
    feedbackRow: document.getElementById('feedbackRow'),
    feedbackCount: document.getElementById('feedbackCount'),
    floorButtons: Array.from(document.querySelectorAll('[data-floor]'))
  };
}

export function setStatus(ui, text, tone = 'ready') {
  ui.statusText.textContent = text;
  ui.statusDot.dataset.tone = tone;
}

export function setRouteEnabled(ui, enabled) {
  ui.routeButton.disabled = !enabled;
}

export function clearRoutePanel(ui) {
  ui.distanceValue.textContent = '--';
  ui.floorValue.textContent = '--';
  ui.waypointValue.textContent = '--';
  setRouteStepText(ui, 'No route selected');
}

export function setRouteStepText(ui, text) {
  replaceRouteSteps(ui, [text]);
}

export function replaceRouteSteps(ui, steps) {
  ui.routeSteps.replaceChildren(
    ...steps.map((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      return item;
    })
  );
}

export function renderRoutePanel(ui, { label, points, getPathDistance, getFloorSequence, getFloorChanges, floorForY, floorLabel, floorShortLabel }) {
  const distance = getPathDistance(points);
  const floors = getFloorSequence(points);
  const turns = Math.max(0, points.length - 2);

  ui.distanceValue.textContent = `${distance.toFixed(1)} u`;
  ui.floorValue.textContent = floors.map((floor) => floorShortLabel(floor)).join(' -> ');
  ui.waypointValue.textContent = String(turns);

  const steps = [`Start on ${floorLabel(floorForY(points[0].y))}`];
  const floorChanges = getFloorChanges(points);

  if (floorChanges.length > 0) {
    floorChanges.forEach((change) => {
      steps.push(`Take connector to ${floorLabel(change.to)}`);
    });
  }

  steps.push(`Follow highlighted route to ${label}`);
  replaceRouteSteps(ui, steps);
}

export function setPanelCollapsed(ui, state, collapsed) {
  state.panelCollapsed = collapsed;
  ui.appPanel.dataset.collapsed = String(collapsed);
  ui.panelToggle.setAttribute('aria-expanded', String(!collapsed));
  ui.panelToggle.setAttribute(
    'aria-label',
    collapsed ? 'Expand navigation panel' : 'Collapse navigation panel'
  );
}

export function togglePanel(ui, state) {
  setPanelCollapsed(ui, state, !state.panelCollapsed);
}

export function expandPanel(ui, state) {
  if (state.panelCollapsed) {
    setPanelCollapsed(ui, state, false);
  }
}
