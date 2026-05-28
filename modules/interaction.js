export function createInteractionController({
  sceneContext,
  state,
  findPoiFromObject,
  routeToPoi,
  routeToPoint,
  setHoveredPoi
}) {
  const { renderer, raycaster, pointer } = sceneContext;

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    state.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      at: performance.now()
    };
  }

  function handlePointerMove(event) {
    const poi = getPoiFromPointer(event);
    setHoveredPoi(poi ? poi.id : null);
  }

  function handlePointerUp(event) {
    if (!state.pointerStart) {
      return;
    }

    const moveDistance = Math.hypot(event.clientX - state.pointerStart.x, event.clientY - state.pointerStart.y);
    const elapsed = performance.now() - state.pointerStart.at;
    state.pointerStart = null;

    if (moveDistance > 6 || elapsed > 500) {
      return;
    }

    pickScene(event);
  }

  function pickScene(event) {
    const hits = getSceneHits(event, [...state.markerObjects, ...state.pickableObjects]);

    if (!hits.length) {
      return;
    }

    const poi = findPoiFromObject(hits[0].object);
    if (poi) {
      routeToPoi(poi);
      return;
    }

    routeToPoint(hits[0].point);
  }

  function getPoiFromPointer(event) {
    const hits = getSceneHits(event, state.markerObjects);

    if (!hits.length) {
      return null;
    }

    return findPoiFromObject(hits[0].object);
  }

  function getSceneHits(event, objects) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, cameraOrThrow());
    return raycaster.intersectObjects(objects, true);
  }

  function cameraOrThrow() {
    if (!sceneContext.camera) {
      throw new Error('Scene camera is unavailable');
    }

    return sceneContext.camera;
  }

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
}
