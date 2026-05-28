import * as THREE from 'three';
import { Pathfinding } from 'three-pathfinding';
import { FLOOR_COLOR, FLOOR_VISUALS, ZONE } from './constants.js';

export function createAssetController({
  sceneContext,
  state,
  floorDefinitions,
  setRouteEnabled,
  setStatus,
  setRouteStepText,
  updateFloorVisibility
}) {
  const { scene, loader, pathfinding } = sceneContext;

  async function bootstrap() {
    setRouteEnabled(false);
    setStatus('Loading assets', 'loading');

    const results = await Promise.allSettled([
      loadFloors(),
      loadDoors(),
      loadNavigationMesh()
    ]);
    const failures = results.filter((result) => result.status === 'rejected');

    updateFloorVisibility();

    if (!state.navReady) {
      setStatus('Navigation unavailable', 'error');
      setRouteStepText('Navigation mesh failed to load');
      console.error(failures.map((failure) => failure.reason));
      return;
    }

    setRouteEnabled(true);
    setStatus(failures.length > 0 ? 'Ready with missing assets' : 'Ready', 'ready');
  }

  async function loadFloors() {
    const results = await Promise.allSettled(
      floorDefinitions.map(async (floor) => {
        const gltf = await loadGltf(floor.url);
        const floorObject = gltf.scene.getObjectByName(floor.objectName) || gltf.scene;
        floorObject.name = floor.objectName;
        prepareFloorObject(floorObject, floor.id);
        state.floorObjects.set(floor.id, floorObject);
        state.pickableObjects.push(...collectMeshes(floorObject));
        scene.add(floorObject);
      })
    );

    const failures = results.filter((result) => result.status === 'rejected');
    failures.forEach((failure) => console.error(failure.reason));

    if (failures.length === floorDefinitions.length) {
      throw new Error('No floor models loaded');
    }
  }

  async function loadDoors() {
    const doorUrls = ['glb/door.glb', 'glb/door2.glb', 'glb/door3.glb'];
    const doorGroup = new THREE.Group();
    doorGroup.name = 'Doors';
    scene.add(doorGroup);

    const results = await Promise.allSettled(
      doorUrls.map(async (url) => {
        const gltf = await loadGltf(url);
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            node.material = cloneMaterial(node.material);
            state.pickableObjects.push(node);
          }
        });
        doorGroup.add(gltf.scene);
      })
    );

    results
      .filter((result) => result.status === 'rejected')
      .forEach((failure) => console.error(failure.reason));
  }

  async function loadNavigationMesh() {
    const gltf = await loadGltf('glb/building_navmesh.gltf');
    let navmesh = null;

    gltf.scene.traverse((node) => {
      if (!navmesh && node.isMesh && node.geometry) {
        navmesh = node;
      }
      if (node.isMesh) {
        const material = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        material.colorWrite = false;
        node.material = material;
        state.pickableObjects.push(node);
      }
    });

    if (!navmesh) {
      throw new Error('Navigation mesh not found');
    }

    scene.add(gltf.scene);
    pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
    state.navReady = true;
  }

  function loadGltf(url) {
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, (error) => reject(error));
    });
  }

  function prepareFloorObject(object, floorId) {
    object.traverse((node) => {
      if (!node.isMesh) {
        return;
      }

      node.material = cloneMaterial(node.material);
      node.userData.floorId = floorId;
      applyFloorMaterial(node.material);
      setMaterialOpacity(node.material, FLOOR_VISUALS.autoInactiveOpacity);
    });
  }

  return {
    bootstrap
  };
}

export function cloneMaterial(material) {
  if (Array.isArray(material)) {
    return material.map((item) => item.clone());
  }

  return material ? material.clone() : new THREE.MeshStandardMaterial({ color: '#d7dee8' });
}

export function collectMeshes(object) {
  const meshes = [];
  object.traverse((node) => {
    if (node.isMesh) {
      meshes.push(node);
    }
  });
  return meshes;
}

export function setMaterialOpacity(material, opacity) {
  if (Array.isArray(material)) {
    material.forEach((item) => setMaterialOpacity(item, opacity));
    return;
  }

  material.transparent = opacity < 1;
  material.opacity = opacity;
  material.depthWrite = opacity >= 1;
  material.polygonOffset = true;
  material.polygonOffsetFactor = 1;
  material.polygonOffsetUnits = 1;
}

function applyFloorMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => applyFloorMaterial(item));
    return;
  }

  if (material.color) {
    material.color.set(FLOOR_COLOR);
  }
  material.roughness = 0.78;
  material.metalness = 0.04;
  material.side = THREE.DoubleSide;
}
