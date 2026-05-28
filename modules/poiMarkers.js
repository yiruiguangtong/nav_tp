import * as THREE from 'three';

export function createPoiMarkerController({ sceneContext, state, pointsOfInterest, toVector, getPoi }) {
  const { scene, renderer } = sceneContext;

  function createPoiMarkers() {
    pointsOfInterest.forEach((poi) => {
      const marker = new THREE.Group();
      marker.name = `Marker-${poi.id}`;
      marker.userData.poiId = poi.id;
      marker.position.copy(toVector(poi.position));

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 18, 18),
        new THREE.MeshBasicMaterial({ color: '#2563eb' })
      );
      pin.position.y = 0.28;

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12),
        new THREE.MeshBasicMaterial({ color: '#1d4ed8' })
      );
      stem.position.y = 0.14;

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.018, 8, 30),
        new THREE.MeshBasicMaterial({
          color: '#f97316',
          transparent: true,
          opacity: 0,
          depthTest: false
        })
      );
      halo.position.y = 0.3;
      halo.rotation.x = Math.PI / 2;
      halo.renderOrder = 6;

      const label = createLabelSprite(poi.label);
      label.position.y = 0.58;

      marker.add(halo, pin, stem, label);
      marker.userData.pin = pin;
      marker.userData.stem = stem;
      marker.userData.halo = halo;
      marker.userData.baseScale = 1;
      state.markerObjects.push(halo, pin, stem, label);
      state.poiMarkers.set(poi.id, marker);
      scene.add(marker);
    });

    updatePoiMarkerStates();
  }

  function createLabelSprite(text) {
    const font = '700 42px Inter, Arial, sans-serif';
    const paddingX = 24;
    const canvasHeight = 104;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;

    const textWidth = Math.ceil(context.measureText(text).width);
    canvas.width = Math.max(132, textWidth + paddingX * 2);
    canvas.height = canvasHeight;
    context.font = font;

    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#d9e0e8';
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    context.fillStyle = '#17202a';
    context.textBaseline = 'middle';
    context.fillText(text, paddingX, canvas.height / 2 + 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.88,
        depthTest: false
      })
    );
    const labelHeight = 0.42;
    sprite.scale.set((canvas.width / canvas.height) * labelHeight, labelHeight, 1);
    sprite.renderOrder = 5;
    return sprite;
  }

  function setHoveredPoi(poiId) {
    if (state.hoveredPoiId === poiId) {
      return;
    }

    state.hoveredPoiId = poiId;
    renderer.domElement.style.cursor = poiId ? 'pointer' : '';
    updatePoiMarkerStates();
  }

  function updatePoiMarkerStates() {
    state.poiMarkers.forEach((marker, poiId) => {
      const isHovered = poiId === state.hoveredPoiId;
      const isSelected = poiId === state.selectedPoiId;
      const scale = isSelected ? 1.34 : isHovered ? 1.2 : 1;
      const pinColor = isSelected ? '#dc2626' : isHovered ? '#f97316' : '#2563eb';
      const stemColor = isSelected ? '#991b1b' : isHovered ? '#c2410c' : '#1d4ed8';
      const haloOpacity = isSelected ? 0.9 : isHovered ? 0.65 : 0;

      marker.scale.setScalar(scale);
      marker.userData.pin.material.color.set(pinColor);
      marker.userData.stem.material.color.set(stemColor);
      marker.userData.halo.material.opacity = haloOpacity;
      marker.userData.halo.visible = haloOpacity > 0;
    });
  }

  function findPoiFromObject(object) {
    let current = object;

    while (current) {
      if (current.userData.poiId) {
        return getPoi(current.userData.poiId);
      }
      current = current.parent;
    }

    return null;
  }

  return {
    createPoiMarkers,
    setHoveredPoi,
    updatePoiMarkerStates,
    findPoiFromObject
  };
}
