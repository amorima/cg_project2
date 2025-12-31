import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// Setup da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color("#87ceeb");
scene.fog = new THREE.Fog("#87ceeb", 30, 150);

const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
camera.position.set(0, 15, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

// Estado global para ML5
let faceX = 0.5;
let faceY = 0.5;
let faceDetected = false;
let isScared = false;
let scaredTimer = 0;

// Posição do cão pastor (controlado pela cara)
let dogTargetX = 0;
let dogTargetZ = 0;

// Raio de influência do cão sobre as ovelhas
const DOG_INFLUENCE_RADIUS = 12;
const DOG_FEAR_RADIUS = 6;

// Classe do Cão Pastor
class ShepherdDog {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);

    // Materiais
    this.furMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      flatShading: true,
    });
    this.lightFurMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2691e,
      roughness: 0.9,
      flatShading: true,
    });
    this.whiteFurMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8dc,
      roughness: 0.9,
      flatShading: true,
    });
    this.noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f1810,
      roughness: 0.5,
      flatShading: true,
    });
    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      flatShading: true,
    });
    this.tongueMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.8,
      flatShading: true,
    });

    this.walkCycle = 0;
    this.isMoving = false;
    this.currentSpeed = 0;
    this.targetRotation = 0;

    this.drawBody();
    this.drawHead();
    this.drawTail();
    this.drawLegs();
  }

  drawBody() {
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 1.2;

    // Corpo simplificado (cápsula única)
    const bodyGeo = new THREE.CapsuleGeometry(0.7, 1.5, 4, 8);
    const body = new THREE.Mesh(bodyGeo, this.furMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    this.bodyGroup.add(body);

    this.group.add(this.bodyGroup);
  }

  drawHead() {
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 0.3, 1.3);
    this.bodyGroup.add(this.headPivot);

    // Cabeça principal
    const headGeo = new THREE.SphereGeometry(0.55, 8, 6);
    const head = new THREE.Mesh(headGeo, this.furMaterial);
    head.scale.set(1, 0.9, 1);
    head.castShadow = true;
    this.headPivot.add(head);

    // Focinho
    const snoutGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
    const snout = new THREE.Mesh(snoutGeo, this.lightFurMaterial);
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, -0.1, 0.5);
    snout.castShadow = true;
    this.headPivot.add(snout);

    // Nariz
    const noseGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const nose = new THREE.Mesh(noseGeo, this.noseMaterial);
    nose.position.set(0, -0.05, 0.8);
    this.headPivot.add(nose);

    // Olhos
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.position.set(0.22, 0.1, 0.35);
    this.headPivot.add(rightEye);

    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.position.set(-0.22, 0.1, 0.35);
    this.headPivot.add(leftEye);

    // Brilho dos olhos
    const eyeShineGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeShineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });

    const rightShine = new THREE.Mesh(eyeShineGeo, eyeShineMat);
    rightShine.position.set(0.24, 0.12, 0.42);
    this.headPivot.add(rightShine);

    const leftShine = new THREE.Mesh(eyeShineGeo, eyeShineMat);
    leftShine.position.set(-0.2, 0.12, 0.42);
    this.headPivot.add(leftShine);

    // Orelhas
    const earGeo = new THREE.ConeGeometry(0.18, 0.4, 4);

    this.rightEar = new THREE.Mesh(earGeo, this.furMaterial);
    this.rightEar.position.set(0.35, 0.4, 0);
    this.rightEar.rotation.set(0, 0, -0.3);
    this.rightEar.castShadow = true;
    this.headPivot.add(this.rightEar);

    this.leftEar = new THREE.Mesh(earGeo, this.furMaterial);
    this.leftEar.position.set(-0.35, 0.4, 0);
    this.leftEar.rotation.set(0, 0, 0.3);
    this.leftEar.castShadow = true;
    this.headPivot.add(this.leftEar);

    // Língua (visível quando corre)
    this.tongue = new THREE.Group();
    const tongueGeo = new THREE.BoxGeometry(0.12, 0.02, 0.3);
    const tongueMesh = new THREE.Mesh(tongueGeo, this.tongueMaterial);
    tongueMesh.position.z = 0.15;
    this.tongue.add(tongueMesh);
    this.tongue.position.set(0, -0.25, 0.55);
    this.tongue.rotation.x = 0.3;
    this.tongue.visible = false;
    this.headPivot.add(this.tongue);
  }

  drawTail() {
    this.tailPivot = new THREE.Group();
    this.tailPivot.position.set(0, 0.2, -1.2);
    this.bodyGroup.add(this.tailPivot);

    // Cauda curvada
    const tailGeo = new THREE.CapsuleGeometry(0.12, 0.6, 4, 6);
    const tail = new THREE.Mesh(tailGeo, this.furMaterial);
    tail.position.y = 0.35;
    tail.rotation.x = -0.3;
    tail.castShadow = true;
    this.tailPivot.add(tail);

    // Ponta da cauda (branca)
    const tailTipGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const tailTip = new THREE.Mesh(tailTipGeo, this.whiteFurMaterial);
    tailTip.position.y = 0.7;
    this.tailPivot.add(tailTip);
  }

  drawLegs() {
    const createLeg = () => {
      // Cria uma perna cilíndrica
      const legGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.9, 6);
      legGeo.translate(0, -0.45, 0);
      const leg = new THREE.Mesh(legGeo, this.furMaterial);
      leg.castShadow = true;
      leg.receiveShadow = true;
      return leg;
    };

    this.frontRightLeg = createLeg();
    this.frontRightLeg.position.set(0.35, -0.2, 0.6);
    this.bodyGroup.add(this.frontRightLeg);

    this.frontLeftLeg = createLeg();
    this.frontLeftLeg.position.set(-0.35, -0.2, 0.6);
    this.bodyGroup.add(this.frontLeftLeg);

    this.backRightLeg = createLeg();
    this.backRightLeg.position.set(0.35, -0.2, -0.6);
    this.bodyGroup.add(this.backRightLeg);

    this.backLeftLeg = createLeg();
    this.backLeftLeg.position.set(-0.35, -0.2, -0.6);
    this.bodyGroup.add(this.backLeftLeg);
  }

  idle() {
    this.walkCycle += 0.03;
    this.tongue.visible = false;

    // Pernas paradas
    this.frontRightLeg.rotation.x = 0;
    this.frontLeftLeg.rotation.x = 0;
    this.backRightLeg.rotation.x = 0;
    this.backLeftLeg.rotation.x = 0;

    // Corpo estável
    this.bodyGroup.position.y = 1.2;

    // Cabeça com leve movimento
    this.headPivot.rotation.x = Math.sin(this.walkCycle * 0.5) * 0.05;

    // Orelhas atentas
    const earTwitch = Math.sin(this.walkCycle * 2) * 0.1;
    this.rightEar.rotation.z = -0.3 + earTwitch;
    this.leftEar.rotation.z = 0.3 - earTwitch;

    // Cauda abanando suavemente
    this.tailPivot.rotation.x = -0.5 + Math.sin(this.walkCycle) * 0.2;
    this.tailPivot.rotation.z = Math.sin(this.walkCycle * 1.5) * 0.3;
  }

  walk() {
    this.walkCycle += 0.12;
    this.tongue.visible = false;

    const legSwing = Math.sin(this.walkCycle) * 0.4;

    this.frontRightLeg.rotation.x = legSwing;
    this.frontLeftLeg.rotation.x = -legSwing;
    this.backRightLeg.rotation.x = -legSwing;
    this.backLeftLeg.rotation.x = legSwing;

    // Corpo com leve balanço
    this.bodyGroup.position.y = 1.2 + Math.sin(this.walkCycle * 2) * 0.05;

    // Cabeça acompanha
    this.headPivot.rotation.x = Math.sin(this.walkCycle * 2) * 0.08;

    // Orelhas em movimento
    const earBounce = Math.sin(this.walkCycle * 2) * 0.15;
    this.rightEar.rotation.z = -0.3 + earBounce;
    this.leftEar.rotation.z = 0.3 - earBounce;

    // Cauda abanando
    this.tailPivot.rotation.x = -0.3;
    this.tailPivot.rotation.z = Math.sin(this.walkCycle * 2) * 0.5;
  }

  run() {
    this.walkCycle += 0.25;
    this.tongue.visible = true;

    const legSwing = Math.sin(this.walkCycle) * 0.7;

    this.frontRightLeg.rotation.x = legSwing;
    this.frontLeftLeg.rotation.x = -legSwing * 0.8;
    this.backRightLeg.rotation.x = -legSwing * 0.8;
    this.backLeftLeg.rotation.x = legSwing;

    // Corpo com mais movimento
    this.bodyGroup.position.y = 1.2 + Math.sin(this.walkCycle * 2) * 0.12;
    this.bodyGroup.rotation.x = Math.sin(this.walkCycle * 2) * 0.05;

    // Língua a balançar
    this.tongue.rotation.z = Math.sin(this.walkCycle * 3) * 0.2;

    // Orelhas para trás
    this.rightEar.rotation.x = 0.3;
    this.leftEar.rotation.x = 0.3;
    this.rightEar.rotation.z = -0.5 + Math.sin(this.walkCycle * 2) * 0.2;
    this.leftEar.rotation.z = 0.5 - Math.sin(this.walkCycle * 2) * 0.2;

    // Cauda esticada
    this.tailPivot.rotation.x = 0.2;
    this.tailPivot.rotation.z = Math.sin(this.walkCycle * 3) * 0.4;
  }

  update() {
    if (!faceDetected) {
      this.idle();
      return;
    }

    // Calcular direção e distância ao alvo
    const dx = dogTargetX - this.group.position.x;
    const dz = dogTargetZ - this.group.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Se está perto do alvo, ficar parado
    if (distance < 0.5) {
      this.isMoving = false;
      this.currentSpeed = 0;
      this.idle();
      return;
    }

    this.isMoving = true;

    // Rodar suavemente para o alvo
    this.targetRotation = Math.atan2(dx, dz);
    let angleDiff = this.targetRotation - this.group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.group.rotation.y += angleDiff * 0.08;

    // Velocidade baseada na distância
    const targetSpeed = Math.min(0.15, distance * 0.03);
    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.1;

    // Mover em frente
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(this.currentSpeed));

    // Limitar à área
    const limit = 45;
    this.group.position.x = Math.max(
      -limit,
      Math.min(limit, this.group.position.x)
    );
    this.group.position.z = Math.max(
      -limit,
      Math.min(limit, this.group.position.z)
    );

    // Animação baseada na velocidade
    if (this.currentSpeed > 0.08) {
      this.run();
    } else {
      this.walk();
    }
  }
}

// Instância global do cão
let shepherdDog = null;

// Classe Sheep com articulações para animação de andar
class Sheep {
  constructor(x, z, isGrazing = false) {
    this.group = new THREE.Group();
    this.group.position.set(x, 1.8, z);
    this.group.rotation.y = Math.random() * Math.PI * 2;

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

    this.walkCycle = Math.random() * Math.PI * 2;
    this.isIdle = isGrazing;
    this.speed = 0.02 + Math.random() * 0.02;
    this.turnSpeed = 0.02;
    this.targetRotation = this.group.rotation.y;
    this.idleTimer = 0;
    this.idleDuration = 200 + Math.random() * 400;

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

    const woolPositions = [
      { x: 0, y: 0.15, z: 0.2, scale: 0.45 },
      { x: -0.25, y: 0.1, z: 0.15, scale: 0.35 },
      { x: 0.25, y: 0.1, z: 0.15, scale: 0.35 },
      { x: -0.4, y: 0.1, z: 0.05, scale: 0.3 },
      { x: 0.4, y: 0.1, z: 0.05, scale: 0.3 },
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

  idle() {
    this.walkCycle += 0.02;

    // Pernas paradas
    this.frontRightLeg.rotation.x = 0;
    this.frontLeftLeg.rotation.x = 0;
    this.backRightLeg.rotation.x = 0;
    this.backLeftLeg.rotation.x = 0;

    // Corpo estável
    this.bodyGroup.position.y = 0;

    // Cabeça em posição normal
    this.headPivot.rotation.x = rad(-20);

    // Orelhas relaxadas com movimento suave
    const earFlap = Math.sin(this.walkCycle * 0.5) * 0.05;
    this.rightEar.rotation.z = rad(50) + earFlap;
    this.leftEar.rotation.z = rad(-50) - earFlap;

    // Cauda calma
    const tailWag = Math.sin(this.walkCycle * 0.4) * 0.08;
    this.tailPivot.rotation.z = tailWag;
    this.tailPivot.rotation.x = rad(30);
  }

  run() {
    this.walkCycle += 0.15;

    const hipSwing = Math.sin(this.walkCycle) * 0.5;

    this.frontRightLeg.rotation.x = hipSwing;
    this.frontLeftLeg.rotation.x = -hipSwing;
    this.backRightLeg.rotation.x = -hipSwing;
    this.backLeftLeg.rotation.x = hipSwing;

    const bodyBob = Math.sin(this.walkCycle * 2) * 0.15;
    this.bodyGroup.position.y = bodyBob;

    const headBob = Math.sin(this.walkCycle * 2) * 0.1;
    this.headPivot.rotation.x = rad(-30) + headBob;

    const earFlap = Math.sin(this.walkCycle * 2) * 0.3;
    this.rightEar.rotation.z = rad(70) + earFlap;
    this.leftEar.rotation.z = rad(-70) - earFlap;

    const tailWag = Math.sin(this.walkCycle * 2) * 0.4;
    this.tailPivot.rotation.z = tailWag;
  }

  update(sheepArray, dog) {
    if (isScared) {
      this.fleeFromCenter();
      this.run();
      this.keepInBounds();
      return;
    }

    // Se há cão, verificar distância
    if (dog && faceDetected) {
      const distToDog = this.group.position.distanceTo(dog.group.position);

      // Fugir do cão se estiver perto
      if (distToDog < DOG_INFLUENCE_RADIUS) {
        this.fleeFromDog(dog, distToDog, sheepArray);

        if (distToDog < DOG_FEAR_RADIUS) {
          this.run();
        } else {
          this.walk();
        }
        this.keepInBounds();
        return;
      }
    }

    if (this.isIdle) {
      this.idleTimer++;
      if (this.idleTimer > this.idleDuration) {
        this.idleTimer = 0;
        this.idleDuration = 200 + Math.random() * 400;
        this.isIdle = false;
        this.headPivot.rotation.y = 0;
      }
      this.idle();
    } else {
      this.avoidCollisions(sheepArray);
      this.moveForward();
      this.walk();
      this.headPivot.rotation.y = 0;

      if (Math.random() < 0.002) {
        this.isIdle = true;
      }
    }

    this.keepInBounds();
  }

  moveTowardsTarget(sheepArray) {
    // Evita colisão com outras ovelhas
    let avoidDirection = null;
    for (const other of sheepArray) {
      if (other === this) continue;
      const dist = this.group.position.distanceTo(other.group.position);
      if (dist < 3) {
        avoidDirection = new THREE.Vector3()
          .subVectors(this.group.position, other.group.position)
          .normalize();
        break;
      }
    }

    // Se há colisão, desviar
    if (avoidDirection) {
      this.targetRotation = Math.atan2(avoidDirection.x, avoidDirection.z);
      let angleDiff = this.targetRotation - this.group.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.group.rotation.y += angleDiff * 0.1;

      const direction = new THREE.Vector3(0, 0, 1);
      direction.applyQuaternion(this.group.quaternion);
      this.group.position.add(direction.multiplyScalar(this.speed));
      return;
    }

    // Vai para o ponto alvo
    const toTarget = new THREE.Vector3(
      targetWorldX - this.group.position.x,
      0,
      targetWorldZ - this.group.position.z
    );

    const distance = toTarget.length();

    // Se já está perto do alvo, ficar idle
    if (distance < 5) {
      this.idle();
      return;
    }

    // Rodar em direção ao alvo
    this.targetRotation = Math.atan2(toTarget.x, toTarget.z);

    let angleDiff = this.targetRotation - this.group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    this.group.rotation.y += angleDiff * 0.05;

    // Mover em frente
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(this.speed * 1.5));
  }

  avoidCollisions(sheepArray) {
    // Verificar distância a outras ovelhas
    for (const other of sheepArray) {
      if (other === this) continue;

      const dist = this.group.position.distanceTo(other.group.position);

      if (dist < 4) {
        // Calcular direção de fuga
        const away = new THREE.Vector3()
          .subVectors(this.group.position, other.group.position)
          .normalize();

        this.targetRotation = Math.atan2(away.x, away.z);
        break;
      }
    }

    // Rotação suave em direção ao target
    let angleDiff = this.targetRotation - this.group.rotation.y;

    // Normalizar ângulo entre -PI e PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    this.group.rotation.y += angleDiff * this.turnSpeed;
  }

  moveForward() {
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(this.speed));
  }

  keepInBounds() {
    const limit = 20;
    const pos = this.group.position;

    if (Math.abs(pos.x) > limit || Math.abs(pos.z) > limit) {
      const toCenter = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();
      this.targetRotation = Math.atan2(toCenter.x, toCenter.z);
    }
  }

  fleeFromDog(dog, distToDog, sheepArray) {
    // Direção oposta ao cão
    const fleeDir = new THREE.Vector3()
      .subVectors(this.group.position, dog.group.position)
      .normalize();

    // Adicionar força de coesão com outras ovelhas próximas
    const cohesion = new THREE.Vector3();
    const separation = new THREE.Vector3();
    let neighborCount = 0;

    for (const other of sheepArray) {
      if (other === this) continue;
      const dist = this.group.position.distanceTo(other.group.position);

      // Coesão: mover-se para perto das outras ovelhas
      if (dist < 8) {
        cohesion.add(other.group.position);
        neighborCount++;
      }

      // Separação: evitar colisões
      if (dist < 3) {
        const pushAway = new THREE.Vector3()
          .subVectors(this.group.position, other.group.position)
          .normalize()
          .multiplyScalar((3 - dist) / 3);
        separation.add(pushAway);
      }
    }

    // Calcular vetor de coesão
    if (neighborCount > 0) {
      cohesion.divideScalar(neighborCount);
      cohesion.sub(this.group.position);
      cohesion.normalize();
      cohesion.multiplyScalar(0.3);
    }

    // Combinar forças: fugir do cão + coesão + separação
    const urgency = 1 - distToDog / DOG_INFLUENCE_RADIUS;
    const finalDir = fleeDir
      .clone()
      .multiplyScalar(1 + urgency)
      .add(cohesion)
      .add(separation.multiplyScalar(0.5))
      .normalize();

    // Rodar suavemente
    this.targetRotation = Math.atan2(finalDir.x, finalDir.z);
    let angleDiff = this.targetRotation - this.group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.group.rotation.y += angleDiff * 0.08;

    // Velocidade baseada na proximidade do cão
    const fleeSpeed = this.speed * (1 + urgency * 3);

    // Mover em frente
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(fleeSpeed));
  }

  fleeFromCenter() {
    const fleeDir = new THREE.Vector3(
      this.group.position.x,
      0,
      this.group.position.z
    ).normalize();
    if (fleeDir.length() < 0.1) {
      fleeDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    }

    this.targetRotation = Math.atan2(fleeDir.x, fleeDir.z);
    const angleDiff = this.targetRotation - this.group.rotation.y;
    this.group.rotation.y += angleDiff * 0.1;

    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(0.15));
  }
}

// Criar rebanho de ovelhas
const sheepArray = [];
const numSheep = 12;

for (let i = 0; i < numSheep; i++) {
  const x = (Math.random() - 0.5) * 30;
  const z = (Math.random() - 0.5) * 30;
  const isGrazing = Math.random() > 0.5;
  const sheep = new Sheep(x, z, isGrazing);
  sheepArray.push(sheep);
  scene.add(sheep.group);
}

// Criar cão pastor
shepherdDog = new ShepherdDog();
shepherdDog.group.position.set(0, 0, 15);
scene.add(shepherdDog.group);

// Inicializar webcam e ml5
async function initML5() {
  const video = document.getElementById("webcam");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    video.srcObject = stream;
    await video.play();

    // Usa facemesh para obter ponto do nariz
    const facemesh = ml5.facemesh(video, () => {});

    facemesh.on("face", (results) => {
      if (results.length > 0) {
        // Ponto do nariz
        const nose = results[0].scaledMesh[1];
        const noseX = nose[0];
        const noseY = nose[1];

        faceX = noseX / video.videoWidth;
        faceY = noseY / video.videoHeight;
        faceDetected = true;

        // Transforma para coordenadas do mundo (posição alvo do cão)
        dogTargetX = (0.5 - faceX) * 50;
        dogTargetZ = (0.75 - faceY) * 90;
      } else {
        faceDetected = false;
      }
    });

    initSpeechRecognition();
  } catch (error) {
    console.log("Webcam não disponível:", error);
  }
}

function initSpeechRecognition() {
  // Deteta sons
  const classifier = ml5.soundClassifier(
    "SpeechCommands18w",
    { probabilityThreshold: 0.75 },
    () => {
      classifier.classify(gotResult);
    }
  );

  function gotResult(error, results) {
    if (error) return;

    // Só reage a comandos relevantes
    if (results && results.length > 0) {
      const label = results[0].label.toLowerCase();
      const confidence = results[0].confidence;

      // Sons que assustam as ovelhas
      if (
        (label === "go" ||
          label === "no" ||
          label === "up" ||
          label === "wow") &&
        confidence > 0.85
      ) {
        triggerScare();
      }
    }
  }

  // Backup por reconhecimento de voz
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "pt-PT";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.toLowerCase();
        if (
          text.includes("boo") ||
          text.includes("bu") ||
          text.includes("uh")
        ) {
          triggerScare();
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.log("Erro de reconhecimento:", event.error);
      }
    };

    recognition.onend = () => {
      setTimeout(() => recognition.start(), 100);
    };

    try {
      recognition.start();
    } catch (e) {}
  }
}

function triggerScare() {
  if (!isScared) {
    isScared = true;
    scaredTimer = 180;

    // Flash vermelho
    const flash = document.getElementById("flash-overlay");
    flash.style.opacity = "0.6";
    setTimeout(() => {
      flash.style.opacity = "0";
    }, 150);
  }
}

initML5();

// Loop de renderização
function animate() {
  requestAnimationFrame(animate);

  if (isScared) {
    scaredTimer--;
    if (scaredTimer <= 0) {
      isScared = false;
    }
  }

  // Atualizar cão pastor
  if (shepherdDog) {
    shepherdDog.update();
  }

  // Atualizar ovelhas passando o cão como referência
  sheepArray.forEach((sheep) => {
    sheep.update(sheepArray, shepherdDog);
  });

  renderer.render(scene, camera);
}

animate();

// Resize Handler
window.addEventListener("resize", () => {
  // Manter aspect ratio 16:9
  camera.aspect = 16 / 9;
  camera.updateProjectionMatrix();

  // Calcular tamanho do renderer para 16:9
  let width = window.innerWidth;
  let height = window.innerWidth / (16 / 9);

  if (height > window.innerHeight) {
    height = window.innerHeight;
    width = window.innerHeight * (16 / 9);
  }

  renderer.setSize(width, height);
});
