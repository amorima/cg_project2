import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { ShepherdDog } from "./classes/ShepherdDog.js";
import { Sheep } from "./classes/Sheep.js";
import { Terrain } from "./classes/Terrain.js";

const scene = new THREE.Scene();

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

const listener = new THREE.AudioListener();
camera.add(listener);

const backgroundSound = new THREE.Audio(listener);
backgroundSound.setVolume(0.5);

const audioLoader = new THREE.AudioLoader();
audioLoader.load("assets/sound/background.mp3", function (buffer) {
  backgroundSound.setBuffer(buffer);
  backgroundSound.setLoop(true);
  backgroundSound.play();
});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Botão de Mute
const muteBtn = document.createElement("button");
muteBtn.textContent = "🔊";
Object.assign(muteBtn.style, {
  position: "absolute",
  top: "20px",
  right: "20px",
  zIndex: "1000",
  background: "none",
  border: "none",
  color: "white",
  fontSize: "30px",
  cursor: "pointer",
});
document.body.appendChild(muteBtn);

muteBtn.addEventListener("click", () => {
  const isMuted = backgroundSound.getVolume() === 0;
  backgroundSound.setVolume(isMuted ? 0.5 : 0);
  muteBtn.textContent = isMuted ? "🔊" : "🔇";
});

// Botão de Microfone
const micBtn = document.createElement("button");
micBtn.textContent = "🎙️";
Object.assign(micBtn.style, {
  position: "absolute",
  top: "20px",
  right: "70px",
  zIndex: "1000",
  background: "none",
  border: "none",
  color: "white",
  fontSize: "30px",
  cursor: "pointer",
});
document.body.appendChild(micBtn);

let audioRecognitionActive = true;
let audioRecognizer = null;
let audioCallback = null;

micBtn.addEventListener("click", () => {
  audioRecognitionActive = !audioRecognitionActive;
  micBtn.textContent = audioRecognitionActive ? "🎙️" : "🚫";
  console.log(
    "[Audio] Microfone:",
    audioRecognitionActive ? "ATIVO" : "DESATIVADO"
  );

  if (!audioRecognitionActive && audioRecognizer) {
    audioRecognizer.stopListening();
  } else if (audioRecognitionActive && audioRecognizer) {
    audioRecognizer.listen(audioCallback, {
      includeSpectrogram: true,
      probabilityThreshold: 0.5,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.5,
    });
  }
});

const ambientLight = new THREE.AmbientLight("#ffffff", 0.9);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight("#ffffff", 4.5);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.bias = -0.0005;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
scene.add(dirLight);

const terrain = new Terrain(scene);
terrain.load().then(() => {});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

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
let appState = "intro";
let transitionStartTime = 0;
const transitionDuration = 2.0;
const startSpherical = new THREE.Spherical();
const endSpherical = new THREE.Spherical();
const defaultCamPos = new THREE.Vector3(-15, 19, 45);
let introAngle = 0;

// Globais para raycasting (navegação vídeo)
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersectionPoint = new THREE.Vector3();

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

shepherdDog = new ShepherdDog();
shepherdDog.group.position.set(0, 0, 15);
scene.add(shepherdDog.group);

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
    const facemesh = ml5.facemesh(video, () => {
      if (appState === "intro") {
        setTimeout(() => {
          appState = "transition";
          transitionStartTime = performance.now();

          startSpherical.setFromVector3(camera.position);
          endSpherical.setFromVector3(defaultCamPos);

          // Ajustar o ângulo final para garantir a rotação mais curta (evita piruetas)
          while (endSpherical.theta - startSpherical.theta > Math.PI)
            endSpherical.theta -= Math.PI * 2;
          while (endSpherical.theta - startSpherical.theta < -Math.PI)
            endSpherical.theta += Math.PI * 2;
        }, 1000);
      }
    });

    facemesh.on("face", (results) => {
      if (results.length > 0 && ml5Active) {
        const nose = results[0].scaledMesh[1];

        // Validar dimensões do vídeo
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 480;

        const targetFaceX = nose[0] / vW;
        const targetFaceY = nose[1] / vH;

        // Suavização (lerp) para reduzir o tremor do nariz
        const lerpAmount = 0.2;
        faceX += (targetFaceX - faceX) * lerpAmount;
        faceY += (targetFaceY - faceY) * lerpAmount;

        faceDetected = true;

        // Converter coordenadas do vídeo para NDC (Normalized Device Coordinates)
        // (1 - faceX) cria o efeito de espelho horizontal, intuitivo para webcam
        const ndcX = (1 - faceX) * 2 - 1;
        const ndcY = -(faceY * 2 - 1); // Inverter Y (vídeo é top-down, 3D é bottom-up)

        raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);

        // Projetar o raio no chão para encontrar o ponto exato no mundo 3D
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
          dogTargetX = intersectionPoint.x;
          dogTargetZ = intersectionPoint.z;
        }
      } else {
        faceDetected = false;
      }
    });

    initTeachableMachine();
  } catch (error) {}
}

async function initTeachableMachine() {
  try {
    // Construir URL absoluta baseada na localização atual
    const baseURL =
      window.location.origin +
      window.location.pathname.replace(/\/[^/]*$/, "/");
    const URL = baseURL + "assets/teachable-machine/";

    // Criar o reconhecedor de áudio
    const checkpointURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    const recognizer = speechCommands.create(
      "BROWSER_FFT",
      undefined,
      checkpointURL,
      metadataURL
    );

    // Garantir que o modelo está carregado
    await recognizer.ensureModelLoaded();

    const classLabels = recognizer.wordLabels();
    console.log("[Audio] Sistema ativo. Classes:", classLabels);

    // Guardar recognizer globalmente
    audioRecognizer = recognizer;

    // Definir callback de áudio
    audioCallback = (result) => {
      if (!audioRecognitionActive) return;

      const scores = result.scores;

      // Encontrar a classe com maior probabilidade
      let maxScore = 0;
      let maxIndex = 0;
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] > maxScore) {
          maxScore = scores[i];
          maxIndex = i;
        }
      }

      const predictedClass = classLabels[maxIndex];

      // Debug de áudio
      console.log(`[Audio] ${predictedClass}: ${(maxScore * 100).toFixed(1)}%`);

      // Verificar se NÃO é "Background Noise" E ultrapassa 97%
      if (
        maxScore > 0.9 &&
        predictedClass !== "Background Noise" &&
        predictedClass !== "_background_noise_"
      ) {
        console.log("🔊 SOM DETETADO! Ativando triggerScare()...");
        triggerScare();
        console.log("isScared:", isScared, "| scaredTimer:", scaredTimer);
      }
    };

    // Iniciar reconhecimento contínuo
    recognizer.listen(audioCallback, {
      includeSpectrogram: true,
      probabilityThreshold: 0.5, // Reduzido de 0.75 para 0.5
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.5,
    });
  } catch (error) {
    console.error("[Audio] Erro ao inicializar:", error);
  }
}

function triggerScare() {
  console.log("[Audio] triggerScare() chamado! isScared antes:", isScared);
  if (!isScared) {
    isScared = true;
    scaredTimer = 3;
    console.log("[Audio] Ovelhas agora estão assustadas por 3 segundos");

    const flash = document.getElementById("flash-overlay");
    flash.style.opacity = "0.6";
    setTimeout(() => {
      flash.style.opacity = "0";
    }, 150);
  }
}

let lastTime = performance.now();

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

      // Câmara à frente do cão
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

  // Atualizar ovelhas
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

  if (appState === "intro") {
    introAngle += deltaTime * 0.2;
    camera.position.x = Math.sin(introAngle) * 130;
    camera.position.z = Math.cos(introAngle) * 130;
    camera.position.y = 90;
    camera.lookAt(0, 0, 0);
  } else if (appState === "transition") {
    const t = Math.min(
      (currentTime - transitionStartTime) / (transitionDuration * 1000),
      1
    );
    // Ease in-out
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const radius = THREE.MathUtils.lerp(
      startSpherical.radius,
      endSpherical.radius,
      ease
    );
    const phi = THREE.MathUtils.lerp(
      startSpherical.phi,
      endSpherical.phi,
      ease
    );
    const theta = THREE.MathUtils.lerp(
      startSpherical.theta,
      endSpherical.theta,
      ease
    );

    camera.position.setFromSphericalCoords(radius, phi, theta);
    camera.lookAt(0, 0, 0);

    if (t >= 1) {
      appState = "active";
      if (cameraMode === "default") {
        controls.enabled = true;
      }
    }
  }

  renderer.render(scene, camera);
}

animate();

// Inicia o ML5 com um atraso para garantir que a animação de introdução começa suavemente.
// O carregamento do ML5 é pesado e bloqueia a thread principal momentaneamente.
setTimeout(initML5, 2000);

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

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
