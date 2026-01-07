import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { ShepherdDog } from "./classes/ShepherdDog.js";
import { Sheep } from "./classes/Sheep.js";

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

// Estado global para ML5
let faceX = 0.5;
let faceY = 0.5;
let faceDetected = false;
let isScared = false;
let scaredTimer = 0;

// Posição do cão pastor (controlado pela cara)
let dogTargetX = 0;
let dogTargetZ = 0;

// Instância global do cão
let shepherdDog = null;

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
    shepherdDog.update(faceDetected, dogTargetX, dogTargetZ, deltaTime);
  }

  // Atualizar ovelhas passando o cão como referência
  sheepArray.forEach((sheep) => {
    sheep.update(sheepArray, shepherdDog, isScared, faceDetected, deltaTime);
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
