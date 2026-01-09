import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { ShepherdDog } from "./classes/ShepherdDog.js";
import { Sheep } from "./classes/Sheep.js";
import { Terrain } from "./classes/Terrain.js";

const scene = new THREE.Scene();

// gradiente céu
const canvas = document.createElement("canvas");
canvas.width = 1;
canvas.height = 32;
const context = canvas.getContext("2d");
const gradient = context.createLinearGradient(0, 0, 0, 32);
gradient.addColorStop(0, "#4e84c4"); 
gradient.addColorStop(1, "#87ceeb");
context.fillStyle = gradient;
context.fillRect(0, 0, 1, 32);
const skyTexture = new THREE.CanvasTexture(canvas);
skyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTexture;

scene.fog = new THREE.Fog("#87ceeb", 30, 500);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-15, 19, 45);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight("#ffffff", 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight("#ffffff", 1.0);
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

const terrain = new Terrain(scene);
terrain.load().then(() => {
  console.log("Terreno carregado. Use tecla 9 para debug.");
});

const controls = new OrbitControls(camera, renderer.domElement);

let faceX = 0.5;
let faceY = 0.5;
let faceDetected = false;
let isScared = false;
let scaredTimer = 0;
let ml5Active = true;
let dogTargetX = 0;
let dogTargetZ = 0;
let shepherdDog = null;
let debugMode = false;
let cameraMode = "default";

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

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
      if (results.length > 0 && ml5Active) {
        // Ponto do nariz
        const nose = results[0].scaledMesh[1];

        // Robustez: Validar dimensões do vídeo
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 480;

        const targetFaceX = nose[0] / vW;
        const targetFaceY = nose[1] / vH;

        // Suavização (Lerp) para reduzir o tremor do nariz
        // 0.2 significa que movemos 20% em direção ao alvo a cada frame
        const lerpAmount = 0.2;
        faceX += (targetFaceX - faceX) * lerpAmount;
        faceY += (targetFaceY - faceY) * lerpAmount;

        faceDetected = true;

        // Transforma para coordenadas do mundo (posição alvo do cão)
        // (0.5 - faceX) cria o efeito de espelho correto: Nariz à direita -> Cão à direita
        dogTargetX = (0.5 - faceX) * 50;
        // Mapeia Y (0-1) para Z (-45 a 20) para manter o cão visível
        dogTargetZ = -45 + faceY * 65;
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
    if (error || !ml5Active) return;

    // Só reage a comandos relevantes
    if (results && results.length > 0) {
      const label = results[0].label.toLowerCase();
      const confidence = results[0].confidence;

      // Sons que assustam as ovelhas
      if (
        (label === "go" ||
          label === "no" ||
          label === "up" ||
          label === "stop") &&
        confidence > 0.75
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
        console.log("Voz detetada:", text);
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
    scaredTimer = 3;

    // Flash vermelho
    const flash = document.getElementById("flash-overlay");
    flash.style.opacity = "0.6";
    setTimeout(() => {
      flash.style.opacity = "0";
    }, 150);
  }
}

initML5();

let lastTime = performance.now();

// Loop de renderização
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (isScared) {
    scaredTimer -= deltaTime;
    if (scaredTimer <= 0) {
      isScared = false;
    }
  }

  // Atualizar cão pastor
  if (shepherdDog) {
    if (cameraMode === "firstPerson") {
      const timeScale = deltaTime * 60;
      const speed = 0.15;
      const rotationSpeed = 0.05;
      const oldPos = shepherdDog.group.position.clone();

      if (keys.ArrowUp) {
        const direction = new THREE.Vector3(
          Math.sin(shepherdDog.group.rotation.y),
          0,
          Math.cos(shepherdDog.group.rotation.y)
        );
        shepherdDog.group.position.add(
          direction.multiplyScalar(speed * timeScale)
        );
        shepherdDog.isMoving = true;
        shepherdDog.currentSpeed = speed;
      }

      if (keys.ArrowDown) {
        const direction = new THREE.Vector3(
          Math.sin(shepherdDog.group.rotation.y),
          0,
          Math.cos(shepherdDog.group.rotation.y)
        );
        shepherdDog.group.position.sub(
          direction.multiplyScalar(speed * 0.5 * timeScale)
        );
        shepherdDog.isMoving = true;
        shepherdDog.currentSpeed = speed * 0.5;
      }

      if (keys.ArrowLeft) {
        shepherdDog.group.rotation.y += rotationSpeed * timeScale;
      }

      if (keys.ArrowRight) {
        shepherdDog.group.rotation.y -= rotationSpeed * timeScale;
      }

      // Validar terreno para controlo manual
      if (terrain) {
        const moveCheck = terrain.canMoveTo(
          oldPos.x,
          oldPos.z,
          shepherdDog.group.position.x,
          shepherdDog.group.position.z
        );
        if (moveCheck.allowed) {
          shepherdDog.group.position.y = moveCheck.height;
        } else {
          shepherdDog.group.position.copy(oldPos);
        }
      }

      if (!keys.ArrowUp && !keys.ArrowDown) {
        shepherdDog.isMoving = false;
        shepherdDog.currentSpeed = 0;
      }

      // Limitar área
      const limitX = 45;
      const limitZMin = -45;
      const limitZMax = 20;
      shepherdDog.group.position.x = Math.max(
        -limitX,
        Math.min(limitX, shepherdDog.group.position.x)
      );
      shepherdDog.group.position.z = Math.max(
        limitZMin,
        Math.min(limitZMax, shepherdDog.group.position.z)
      );

      // Atualizar animação
      if (shepherdDog.isMoving) {
        if (keys.ArrowUp && shepherdDog.currentSpeed > 0.08) {
          shepherdDog.run(timeScale);
        } else {
          shepherdDog.walk(timeScale);
        }
      } else {
        shepherdDog.idle(timeScale);
      }

      // câmara à frente do cão
      const dogPos = shepherdDog.group.position;
      const dogRotation = shepherdDog.group.rotation.y;

      camera.position.set(
        dogPos.x + Math.sin(dogRotation) * -0.5,
        dogPos.y + 2.7,
        dogPos.z + Math.cos(dogRotation) * -0.5
      );

      camera.lookAt(
        dogPos.x + Math.sin(dogRotation) * 10,
        dogPos.y + 0.5,
        dogPos.z + Math.cos(dogRotation) * 10
      );
    } else {
      shepherdDog.update(
        faceDetected,
        dogTargetX,
        dogTargetZ,
        deltaTime,
        terrain
      );
    }
  }

  // atualizar ovelhas
  sheepArray.forEach((sheep) => {
    const dogActive = faceDetected || cameraMode === "firstPerson";
    sheep.update(
      sheepArray,
      shepherdDog,
      isScared,
      dogActive,
      deltaTime,
      terrain
    );
  });

  renderer.render(scene, camera);
}

animate();

// teclado
window.addEventListener("keydown", (event) => {
  if (
    event.key === "1" ||
    event.code === "Digit1" ||
    event.code === "Numpad1"
  ) {
    if (cameraMode === "default") {
      cameraMode = "firstPerson";
      ml5Active = false;
      faceDetected = false;
      controls.enabled = false;
    } else {
      cameraMode = "default";
      ml5Active = true;
      controls.enabled = true;
      camera.position.set(0, 15, 25);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }

  if (event.key === "9") {
    debugMode = !debugMode;
    console.log("Debug Mode:", debugMode ? "ATIVO" : "DESATIVO");
    if (shepherdDog) shepherdDog.toggleDebug(debugMode);
    sheepArray.forEach((sheep) => sheep.toggleDebug(debugMode));
    terrain.toggleDebug(debugMode);
  }

  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = false;
  }
});

// Resize Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
