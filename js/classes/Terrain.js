import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0); // Sempre a apontar para baixo
    this.loaded = false;

    // Lista de malhas que contam como obstáculos/chão
    this.collidableMeshes = [];
  }

  load() {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        "./assets/3D/the_river.glb",
        (gltf) => {
          this.model = gltf.scene;

          // Configurar sombras e identificar meshes
          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              this.collidableMeshes.push(child);
            }
          });

          // Ajustar escala gigantesca para compensar o tamanho original minúsculo
          const scale = 20; // Ajustado conforme feedback
          this.model.scale.set(scale, scale, scale);

          this.scene.add(this.model);
          this.loaded = true;
          console.log("Terreno carregado com sucesso!");
          resolve(this.model);
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% carregado");
        },
        (error) => {
          console.error("Erro ao carregar o terreno:", error);
          reject(error);
        }
      );
    });
  }

  /**
   * Obtém a altura do terreno na posição (x, z)
   * @param {number} x
   * @param {number} z
   * @returns {number|null} A altura (y) ou null se não houver terreno
   */
  getHeightAt(x, z) {
    if (!this.loaded) return 0;

    // Origem do raio muito alta para garantir que apanha montanhas altas
    this.raycaster.ray.origin.set(x, 500, z);

    // Intercetar com todas as meshes do modelo
    const intersects = this.raycaster.intersectObjects(
      this.collidableMeshes,
      false
    );

    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return null; // Buraco ou fora do mapa
  }

  /**
   * Verifica se a posição futura é válida (não é parede/árvore/buraco)
   */
  canMoveTo(currentX, currentZ, nextX, nextZ) {
    if (!this.loaded) return { allowed: true, height: 0 };

    const currentHeight = this.getHeightAt(currentX, currentZ);
    const nextHeight = this.getHeightAt(nextX, nextZ);

    // Se saiu do mapa (null) - Impedir movimento
    if (nextHeight === null) {
      return { allowed: false, height: currentHeight || 0 };
    }

    // Se a posição atual não estava no mapa (inicio do jogo), aceitar a nova
    if (currentHeight === null) {
      return { allowed: true, height: nextHeight };
    }

    const diff = nextHeight - currentHeight;

    // Ajustar tolerância baseada na escala atual
    // Permitir subir desníveis maiores (ex: colinas) mas bloquear paredes
    if (diff > 2.0 || diff < -3.0) {
      return { allowed: false, height: currentHeight };
    }

    return { allowed: true, height: nextHeight };
  }
}
