import * as THREE from 'three';
import { FLOOR_CHANGE_MARGIN, FLOOR_VISUALS, MOVE_SPEED, ZONE } from './constants.js';
import { setMaterialOpacity } from './assets.js';

export function createRoutingController({
  sceneContext,
  state,
  ui,
  floorDefinitions,
  setStatus,
  setFeedbackEnabled,
  setRouteStepText,
  clearRoutePanel,
  renderRoutePanel,
  getSearchController,
  updatePoiMarkerStates
}) {
  const { scene, pathfinding, agentGroup } = sceneContext;

  function routeToPoi(poi) {
    ui.destinationInput.value = poi.label;
    state.selectedDestinationId = poi.id;
    state.selectedPoiId = poi.id;
    getSearchController().rememberRecentPoi(poi.id);
    getSearchController().hideDestinationResults();
    updatePoiMarkerStates();
    findRoute(toVector(poi.position), poi.label);
  }

  function routeToPoint(point) {
    state.selectedPoiId = null;
    updatePoiMarkerStates();
    findRoute(point, 'Selected point');
  }

  function findRoute(target, label) {
    if (!state.navReady) {
      setStatus('Navigation still loading', 'loading');
      return;
    }

    clearRoute({ keepPanel: true });

    const start = agentGroup.position.clone();
    const groupId = pathfinding.getGroup(ZONE, start);

    if (groupId === null || groupId === undefined) {
      setStatus('Start is off route', 'error');
      setRouteStepText('Move the start point onto the navigation mesh');
      return;
    }

    const closestStart = pathfinding.getClosestNode(start, ZONE, groupId);
    if (!closestStart) {
      setStatus('Start not reachable', 'error');
      setRouteStepText('No reachable node near the start');
      return;
    }

    let nextPath = pathfinding.findPath(closestStart.centroid, target, ZONE, groupId);

    if (!nextPath || nextPath.length === 0) {
      const closestTarget = pathfinding.getClosestNode(target, ZONE, groupId);
      if (closestTarget) {
        nextPath = pathfinding.findPath(closestStart.centroid, closestTarget.centroid, ZONE, groupId);
      }
    }

    if (!nextPath || nextPath.length === 0) {
      setStatus('No route found', 'error');
      setRouteStepText(`No route to ${label}`);
      return;
    }

    state.navPath = nextPath.map((point) => point.clone());
    state.routePoints = compactPoints([start, closestStart.centroid.clone(), ...state.navPath]);
    state.routeLabel = label;

    drawRoute(state.routePoints, state.routePoints[state.routePoints.length - 1]);
    renderRoutePanel(label, state.routePoints);
    setFeedbackEnabled(true);
    setStatus(`Routing to ${label}`, 'ready');
  }

  function compactPoints(points) {
    return points.filter((point, index) => index === 0 || point.distanceTo(points[index - 1]) > 0.03);
  }

  function drawRoute(points, target) {
    clearRouteArtifacts();

    if (points.length > 1) {
      const elevatedPoints = points.map((point) => point.clone().add(new THREE.Vector3(0, 0.08, 0)));
      const curve = new THREE.CatmullRomCurve3(elevatedPoints);
      const geometry = new THREE.TubeGeometry(curve, Math.max(8, elevatedPoints.length * 8), 0.035, 8, false);
      const material = new THREE.MeshBasicMaterial({ color: '#dc2626' });
      state.pathObject = new THREE.Mesh(geometry, material);
      state.pathObject.name = 'ActiveRoute';
      state.pathObject.renderOrder = 4;
      scene.add(state.pathObject);
    }

    const marker = new THREE.Group();
    marker.name = 'TargetMarker';
    marker.position.copy(target).add(new THREE.Vector3(0, 0.12, 0));

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.025, 10, 36),
      new THREE.MeshBasicMaterial({ color: '#dc2626' })
    );
    ring.rotation.x = Math.PI / 2;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 18, 18),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );

    marker.add(ring, dot);
    state.targetObject = marker;
    scene.add(marker);
  }

  function clearRoute(options = {}) {
    clearRouteArtifacts();
    state.navPath = [];
    state.routePoints = [];
    state.routeLabel = '';
    setFeedbackEnabled(false);

    if (options.clearDestination) {
      ui.destinationInput.value = '';
      state.selectedDestinationId = '';
      state.selectedPoiId = null;
      updatePoiMarkerStates();
      getSearchController().refreshDestinationResults();
    }

    if (!options.keepPanel) {
      clearRoutePanel();
    }
  }

  function clearRouteArtifacts() {
    disposeSceneObject(state.pathObject);
    disposeSceneObject(state.targetObject);
    state.pathObject = null;
    state.targetObject = null;
  }

  function disposeSceneObject(object) {
    if (!object) {
      return;
    }

    scene.remove(object);
    object.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        disposeMaterial(node.material);
      }
    });
  }

  function disposeMaterial(material) {
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
      return;
    }

    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
  }

  function moveAgent(delta) {
    if (!state.navPath.length) {
      return;
    }

    const target = state.navPath[0];
    const offset = target.clone().sub(agentGroup.position);
    const distance = offset.length();

    if (distance > 0.035) {
      const step = Math.min(distance, MOVE_SPEED * delta);
      offset.normalize();
      agentGroup.position.add(offset.multiplyScalar(step));
      agentGroup.rotation.y = Math.atan2(offset.x, offset.z);
    } else {
      agentGroup.position.copy(target);
      state.navPath.shift();

      if (!state.navPath.length) {
        setStatus('Arrived', 'ready');
      }
    }

    updateActiveFloor();
  }

  function updateActiveFloor() {
    const nextFloor = floorForY(agentGroup.position.y, state.activeFloor);

    if (nextFloor === state.activeFloor) {
      return;
    }

    state.activeFloor = nextFloor;
    if (state.floorMode === 'auto') {
      updateFloorVisibility();
    }
  }

  function setAgentPosition(position) {
    agentGroup.position.copy(toVector(position));
    state.activeFloor = floorForY(agentGroup.position.y, state.activeFloor);
    updateFloorVisibility();
  }

  function setFloorMode(floor) {
    state.floorMode = floor === 'auto' ? 'auto' : Number(floor);
    updateFloorVisibility();
  }

  function updateFloorVisibility() {
    const selectedFloor = state.floorMode === 'auto' ? state.activeFloor : state.floorMode;

    state.floorObjects.forEach((object, floorId) => {
      const isSelected = floorId === selectedFloor;
      const opacity = isSelected
        ? FLOOR_VISUALS.activeOpacity
        : state.floorMode === 'auto'
          ? FLOOR_VISUALS.autoInactiveOpacity
          : FLOOR_VISUALS.manualInactiveOpacity;

      object.visible = true;
      object.traverse((node) => {
        if (node.isMesh) {
          setMaterialOpacity(node.material, opacity);
        }
      });
    });

    ui.floorButtons.forEach((button) => {
      const pressed = button.dataset.floor === String(state.floorMode);
      const autoActive = state.floorMode === 'auto' && button.dataset.floor === String(selectedFloor);
      button.setAttribute('aria-pressed', String(pressed));
      button.dataset.autoActive = String(autoActive);
    });
  }

  function getPathDistance(points) {
    return points.reduce((total, point, index) => {
      if (index === 0) {
        return total;
      }
      return total + point.distanceTo(points[index - 1]);
    }, 0);
  }

  function getFloorSequence(points) {
    return points.reduce((floors, point) => {
      const floor = floorForY(point.y);
      if (floors[floors.length - 1] !== floor) {
        floors.push(floor);
      }
      return floors;
    }, []);
  }

  function getFloorChanges(points) {
    const sequence = getFloorSequence(points);
    const changes = [];

    for (let index = 1; index < sequence.length; index += 1) {
      changes.push({
        from: sequence[index - 1],
        to: sequence[index]
      });
    }

    return changes;
  }

  function floorForY(y, currentFloorId = null) {
    const currentFloor = floorDefinitions.find((item) => item.id === currentFloorId);

    if (
      currentFloor &&
      y >= currentFloor.minY - FLOOR_CHANGE_MARGIN &&
      y < currentFloor.maxY + FLOOR_CHANGE_MARGIN
    ) {
      return currentFloor.id;
    }

    const floor = floorDefinitions.find((item) => y >= item.minY && y < item.maxY);
    if (floor) {
      return floor.id;
    }

    return floorDefinitions.reduce((closestFloor, candidate) => {
      const closestCenter = (closestFloor.minY + closestFloor.maxY) / 2;
      const candidateCenter = (candidate.minY + candidate.maxY) / 2;
      return Math.abs(y - candidateCenter) < Math.abs(y - closestCenter) ? candidate : closestFloor;
    }, floorDefinitions[0]).id;
  }

  function floorLabel(id) {
    const floor = floorDefinitions.find((item) => item.id === id);
    return floor ? floor.label : `Floor ${id}`;
  }

  function floorShortLabel(id) {
    const floor = floorDefinitions.find((item) => item.id === id);
    return floor ? floor.shortLabel : String(id);
  }

  function toVector(position) {
    if (position.isVector3) {
      return position.clone();
    }

    return new THREE.Vector3(position.x, position.y, position.z);
  }

  return {
    routeToPoi,
    routeToPoint,
    findRoute,
    clearRoute,
    moveAgent,
    setAgentPosition,
    setFloorMode,
    updateFloorVisibility,
    getPathDistance,
    getFloorSequence,
    getFloorChanges,
    floorForY,
    floorLabel,
    floorShortLabel,
    toVector
  };
}
