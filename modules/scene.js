import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pathfinding } from 'three-pathfinding';

export function createSceneContext(sceneRoot) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eef2f6');
  scene.fog = new THREE.Fog('#eef2f6', 34, 140);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 500);
  camera.position.set(8, 10, 14);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.setAttribute('aria-label', '3D Telecom Paris indoor navigation map');
  sceneRoot.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.minDistance = 3;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, 2, -3);
  controls.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c1d1, 0.95));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(-8, 14, 7);
  scene.add(keyLight);

  const grid = new THREE.GridHelper(24, 24, 0xaeb9c8, 0xd2dae5);
  grid.position.y = -0.02;
  scene.add(grid);

  const agentGroup = new THREE.Group();
  const agentBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.48, 24),
    new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.56 })
  );
  agentBody.position.y = 0.24;
  const agentNose = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.34, 24),
    new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.5 })
  );
  agentNose.position.set(0, 0.38, 0.27);
  agentNose.rotation.x = Math.PI / 2;
  agentGroup.add(agentBody, agentNose);
  scene.add(agentGroup);

  return {
    scene,
    camera,
    renderer,
    controls,
    loader: new GLTFLoader(),
    pathfinding: new Pathfinding(),
    clock: new THREE.Clock(),
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    agentGroup
  };
}

export function handleResize({ renderer, camera }) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function resetView({ camera, controls }) {
  camera.position.set(8, 10, 14);
  controls.target.set(0, 2, -3);
  controls.update();
}

export function startRenderLoop({ clock, controls, renderer, scene, camera }, onFrame) {
  function animate() {
    const delta = clock.getDelta();
    onFrame(delta);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
