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

// Função para converter graus em radianos
function rad(degrees) {
  return degrees * (Math.PI / 180);
}

// Classe Sheep com articulações para animação de andar
class Sheep {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.y = 1.8;

    this.woolMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      flatShading: true,
    });
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaf8b,
      roughness: 1,
      flatShading: true,
    });
    this.darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4b4553,
      roughness: 1,
      flatShading: true,
    });

    this.walkCycle = 0;

    this.drawBody();
    this.drawHead();
    this.drawTail();
    this.drawLegs();
  }

  drawBody() {
    this.bodyGroup = new THREE.Group();
    const bodyGeometry = new THREE.IcosahedronGeometry(1.7, 0);
    const body = new THREE.Mesh(bodyGeometry, this.woolMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    this.bodyGroup.add(body);
    this.group.add(this.bodyGroup);
  }

  drawHead() {
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 0.65, 1.6);
    this.headPivot.rotation.x = rad(-20);
    this.bodyGroup.add(this.headPivot);

    const foreheadGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.7);
    const forehead = new THREE.Mesh(foreheadGeometry, this.skinMaterial);
    forehead.castShadow = true;
    forehead.receiveShadow = true;
    forehead.position.y = -0.15;
    this.headPivot.add(forehead);

    const faceGeometry = new THREE.CylinderGeometry(0.5, 0.15, 0.4, 4, 1);
    const face = new THREE.Mesh(faceGeometry, this.skinMaterial);
    face.castShadow = true;
    face.receiveShadow = true;
    face.position.y = -0.65;
    face.rotation.y = rad(45);
    this.headPivot.add(face);

    // Cabelo com vários icosaedros
    const woolPositions = [
      { x: 0, y: 0.15, z: 0.2, scale: 0.45 },
      { x: -0.25, y: 0.1, z: 0.15, scale: 0.35 },
      { x: 0.25, y: 0.1, z: 0.15, scale: 0.35 },
      { x: -0.4, y: 0.1, z: 0.05, scale: 0.30 },
      { x: 0.4, y: 0.1, z: 0.05, scale: 0.30 },
    ];

    woolPositions.forEach((pos) => {
      const woolGeo = new THREE.IcosahedronGeometry(pos.scale, 0);
      const woolMesh = new THREE.Mesh(woolGeo, this.woolMaterial);
      woolMesh.position.set(pos.x, pos.y, pos.z);
      woolMesh.castShadow = true;
      woolMesh.receiveShadow = true;
      this.headPivot.add(woolMesh);
    });

    const rightEyeGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.06, 6);
    const rightEye = new THREE.Mesh(rightEyeGeometry, this.darkMaterial);
    rightEye.castShadow = true;
    rightEye.receiveShadow = true;
    rightEye.position.set(0.35, -0.48, 0.33);
    rightEye.rotation.set(rad(130.8), 0, rad(-45));
    this.headPivot.add(rightEye);

    const leftEye = rightEye.clone();
    leftEye.position.x = -rightEye.position.x;
    leftEye.rotation.z = -rightEye.rotation.z;
    this.headPivot.add(leftEye);

    const rightEarGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.3);
    rightEarGeometry.translate(0, -0.25, 0);
    this.rightEar = new THREE.Mesh(rightEarGeometry, this.skinMaterial);
    this.rightEar.castShadow = true;
    this.rightEar.receiveShadow = true;
    this.rightEar.position.set(0.35, -0.12, -0.07);
    this.rightEar.rotation.set(rad(20), 0, rad(50));
    this.headPivot.add(this.rightEar);

    this.leftEar = this.rightEar.clone();
    this.leftEar.position.x = -this.rightEar.position.x;
    this.leftEar.rotation.z = -this.rightEar.rotation.z;
    this.headPivot.add(this.leftEar);
  }

  drawTail() {
    this.tailPivot = new THREE.Group();
    this.tailPivot.position.set(0, 0.2, -1.6);
    this.tailPivot.rotation.x = rad(30);
    this.bodyGroup.add(this.tailPivot);

    const tailGeo = new THREE.IcosahedronGeometry(0.35, 0);
    const tail = new THREE.Mesh(tailGeo, this.woolMaterial);
    tail.position.y = -0.15;
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.tailPivot.add(tail);
  }

  drawLegs() {
    const createLeg = () => {
      const legGeo = new THREE.CylinderGeometry(0.25, 0.18, 1.1, 4);
      legGeo.translate(0, -0.55, 0);
      const leg = new THREE.Mesh(legGeo, this.darkMaterial);
      leg.castShadow = true;
      leg.receiveShadow = true;
      return leg;
    };

    this.frontRightLeg = createLeg();
    this.frontRightLeg.position.set(0.7, -0.8, 0.5);
    this.bodyGroup.add(this.frontRightLeg);

    this.frontLeftLeg = createLeg();
    this.frontLeftLeg.position.set(-0.7, -0.8, 0.5);
    this.bodyGroup.add(this.frontLeftLeg);

    this.backRightLeg = createLeg();
    this.backRightLeg.position.set(0.7, -0.8, -0.5);
    this.bodyGroup.add(this.backRightLeg);

    this.backLeftLeg = createLeg();
    this.backLeftLeg.position.set(-0.7, -0.8, -0.5);
    this.bodyGroup.add(this.backLeftLeg);
  }

  walk() {
    this.walkCycle += 0.06;

    const hipSwing = Math.sin(this.walkCycle) * 0.3;

    this.frontRightLeg.rotation.x = hipSwing;
    this.frontLeftLeg.rotation.x = -hipSwing;
    this.backRightLeg.rotation.x = -hipSwing;
    this.backLeftLeg.rotation.x = hipSwing;

    const bodyBob = Math.sin(this.walkCycle * 2) * 0.08;
    this.bodyGroup.position.y = bodyBob;

    const headBob = Math.sin(this.walkCycle * 2) * 0.06;
    this.headPivot.rotation.x = rad(-20) + headBob;

    const earFlap = Math.sin(this.walkCycle * 1.5) * 0.15;
    this.rightEar.rotation.z = rad(50) + earFlap;
    this.leftEar.rotation.z = rad(-50) - earFlap;

    const tailWag = Math.sin(this.walkCycle * 1.2) * 0.25;
    this.tailPivot.rotation.z = tailWag;
    this.tailPivot.rotation.x = rad(30) + Math.sin(this.walkCycle * 0.8) * 0.1;
  }
}

// Criar a Ovelha e adicionar à cena
const mySheep = new Sheep();
scene.add(mySheep.group);

// Loop de renderização
function animate() {
  requestAnimationFrame(animate);

  mySheep.walk();

  renderer.render(scene, camera);
}

animate();

// Resize Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
