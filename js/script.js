import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.0/examples/jsm/controls/OrbitControls.js";

// Setup da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color("#87ceeb"); // Céu azul
scene.fog = new THREE.Fog("#87ceeb", 10, 50);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Ligar sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Suavizar sombras
document.body.appendChild(renderer.domElement);

// Luzes
const ambientLight = new THREE.AmbientLight("#ffffff", 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight("#ffffff", 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
scene.add(dirLight);

// Chão
const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.MeshStandardMaterial({ color: "#57a639" });
const ground = new THREE.Mesh(planeGeo, planeMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// createSheepHead: cabeça low-poly (icosaedro, orelhas, olhos)
function createSheepHead() {
  const headGroup = new THREE.Group();

  // Materiais
  const blackMat = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    flatShading: true,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    flatShading: true,
  });

  // Cara
  const faceGeo = new THREE.IcosahedronGeometry(0.34, 0);
  const face = new THREE.Mesh(faceGeo, blackMat);
  face.position.set(0, -0.05, 0.25);
  face.scale.set(1, 1.6, 1.3);
  face.castShadow = true;
  headGroup.add(face);

  // Orelhas
  const createFlattenedCapsule = (radius, length, flatZ = 0.5) => {
    const grp = new THREE.Group();

    const cylGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      12,
      1,
      true
    );
    const cyl = new THREE.Mesh(cylGeo, blackMat);
    cyl.castShadow = true;
    grp.add(cyl);

    const sphereGeo = new THREE.SphereGeometry(radius, 12, 12);
    const top = new THREE.Mesh(sphereGeo, blackMat);
    top.position.y = length / 2;
    top.castShadow = true;
    grp.add(top);

    const bottom = new THREE.Mesh(sphereGeo, blackMat);
    bottom.position.y = -length / 2;
    bottom.castShadow = true;
    grp.add(bottom);

    grp.scale.set(1, 1, flatZ);
    return grp;
  };

  const earLeft = createFlattenedCapsule(0.065, 0.28, 0.35);
  earLeft.position.set(-0.24, 0.18, 0.32);
  earLeft.rotation.set(-Math.PI / 2.6, -0.7, Math.PI / 1.9);
  headGroup.add(earLeft);

  const earRight = createFlattenedCapsule(0.065, 0.28, 0.35);
  earRight.position.set(0.24, 0.18, 0.32);
  earRight.rotation.set(-Math.PI / 2.6, 0.7, -Math.PI / 1.9);
  headGroup.add(earRight);

  // Olhos
  const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const eyeWhiteL = new THREE.Mesh(eyeWhiteGeo, whiteMat);
  eyeWhiteL.position.set(-0.18, 0.08, 0.5);
  eyeWhiteL.scale.set(1, 1, 1);
  headGroup.add(eyeWhiteL);
  const eyeWhiteR = new THREE.Mesh(eyeWhiteGeo, whiteMat);
  eyeWhiteR.position.set(0.18, 0.08, 0.5);
  eyeWhiteR.scale.set(1, 1, 1);
  headGroup.add(eyeWhiteR);

  // Pupilas
  const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const pupilL = new THREE.Mesh(pupilGeo, blackMat);
  pupilL.position.set(-0.18, 0.06, 0.55);
  headGroup.add(pupilL);
  const pupilR = new THREE.Mesh(pupilGeo, blackMat);
  pupilR.position.set(0.18, 0.06, 0.55);
  headGroup.add(pupilR);

  // Pálpebras
  const eyelidRadius = 0.09;
  const eyelidGeo = new THREE.SphereGeometry(
    eyelidRadius,
    8,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const eyelidLeft = new THREE.Mesh(eyelidGeo, blackMat);
  eyelidLeft.position.set(-0.18, 0.09, 0.5);
  eyelidLeft.scale.set(1.15, 1.15, 1.15);
  eyelidLeft.castShadow = true;
  headGroup.add(eyelidLeft);

  const eyelidRight = new THREE.Mesh(eyelidGeo, blackMat);
  eyelidRight.position.set(0.18, 0.09, 0.5);
  eyelidRight.scale.set(1.15, 1.15, 1.15);
  eyelidRight.castShadow = true;
  headGroup.add(eyelidRight);

  return headGroup;
}

// Construção da ovelha
function createSheep() {
  const sheepGroup = new THREE.Group();

  // Materiais
  const woolMaterial = new THREE.MeshStandardMaterial({
    color: "#f5f5f5",
    flatShading: true,
    roughness: 0.9,
  });
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: "#2b2b2b",
    flatShading: true,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: "#000000",
    flatShading: true,
  });

  // Corpo
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 1.35;
  sheepGroup.add(bodyGroup);

  // Corpo principal (centro)
  const bodyGeo = new THREE.IcosahedronGeometry(1, 1);
  const body = new THREE.Mesh(bodyGeo, woolMaterial);
  body.castShadow = true;
  body.scale.set(1.2, 0.95, 1.5);
  bodyGroup.add(body);

  // Cabeça
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.35, 1.1);
  bodyGroup.add(headPivot);

  const head = createSheepHead();
  headPivot.add(head);

  // Rabo
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.2, -1.4);
  bodyGroup.add(tailPivot);

  // Ponta da cauda
  const tailGeo = new THREE.IcosahedronGeometry(0.28, 1);
  const tail = new THREE.Mesh(tailGeo, woolMaterial);
  tail.position.set(0, -0.05, -0.1);
  tail.scale.set(0.9, 1.1, 0.9);
  tail.castShadow = true;
  tailPivot.add(tail);

  // Pernas
  function createLeg(x, y, z) {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, y, z);

    // Coxa
    const upperLegGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.45, 8);
    const upperLeg = new THREE.Mesh(upperLegGeo, skinMaterial);
    upperLeg.position.y = -0.225;
    upperLeg.castShadow = true;
    legGroup.add(upperLeg);

    // Joelho
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.45, 0);
    legGroup.add(kneePivot);

    // Canela
    const lowerLegGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.35, 8);
    const lowerLeg = new THREE.Mesh(lowerLegGeo, skinMaterial);
    lowerLeg.position.y = -0.175;
    lowerLeg.castShadow = true;
    kneePivot.add(lowerLeg);

    // Casco
    const hoofGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
    const hoof = new THREE.Mesh(hoofGeo, skinMaterial);
    hoof.position.y = -0.41;
    hoof.castShadow = true;
    kneePivot.add(hoof);

    return { mesh: legGroup, knee: kneePivot };
  }

  // Adicionar as 4 pernas ao corpo
  const legFL = createLeg(-0.45, -0.45, 0.7);
  bodyGroup.add(legFL.mesh);
  const legFR = createLeg(0.45, -0.45, 0.7);
  bodyGroup.add(legFR.mesh);
  const legBL = createLeg(-0.45, -0.45, -0.7);
  bodyGroup.add(legBL.mesh);
  const legBR = createLeg(0.45, -0.45, -0.7);
  bodyGroup.add(legBR.mesh);

  // Referências para animação
  sheepGroup.userData = {
    legs: { FL: legFL, FR: legFR, BL: legBL, BR: legBR },
    head: headPivot,
    tail: tailPivot,
    body: bodyGroup,
  };

  return sheepGroup;
}

// Criar a Ovelha e adicionar à cena
const mySheep = createSheep();
scene.add(mySheep);

// --- 3. LOOP DE RENDERIZAÇÃO ---
function animate() {
  requestAnimationFrame(animate);

  // Rotação simples para veres o modelo 3D (Remove depois)
  // mySheep.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();

// Resize Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
