import * as THREE from "https://unpkg.com/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.0/examples/jsm/controls/OrbitControls.js";

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

// Posição alvo onde as ovelhas se vão juntar (coordenadas do mundo)
let targetWorldX = 0;
let targetWorldZ = 0;

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

  update(sheepArray) {
    if (isScared) {
      this.fleeFromCenter();
      this.run();
      this.keepInBounds();
      return;
    }

    // Se cara detetada, mover em direção à posição alvo
    if (faceDetected) {
      this.moveTowardsTarget(sheepArray);
      this.walk();
      this.keepInBounds();
      return;
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

        // Transforma para coordenadas do mundo
        targetWorldX = (0.5 - faceX) * 40;
        targetWorldZ = (faceY - 0.5) * 30;
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

  sheepArray.forEach((sheep) => {
    sheep.update(sheepArray);
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
