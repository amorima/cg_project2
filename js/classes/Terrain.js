import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0);
    this.loaded = false;
    this.collidableMeshes = [];
    this.debugGroup = new THREE.Group();
    this.debugGroup.visible = false;
    this.scene.add(this.debugGroup);
  }

  load() {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        "./assets/3D/the_river.glb",
        (gltf) => {
          this.model = gltf.scene;

          this.model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              this.collidableMeshes.push(child);

              if (child.geometry) {
                child.geometry.computeVertexNormals();
              }

              if (child.material) {
                child.material.flatShading = false;
                child.material.needsUpdate = true;

                [
                  "map",
                  "normalMap",
                  "roughnessMap",
                  "metalnessMap",
                  "aoMap",
                ].forEach((key) => {
                  if (child.material[key]) {
                    child.material[key].anisotropy = 16;
                    child.material[key].minFilter =
                      THREE.LinearMipmapLinearFilter;
                    child.material[key].magFilter = THREE.LinearFilter;
                    child.material[key].needsUpdate = true;
                  }
                });

                if (child.material.map) {
                  child.material.map.colorSpace = THREE.SRGBColorSpace;
                }

                if (!child.material.color) {
                  child.material.color = new THREE.Color(0xffffff);
                }

                child.material.metalness = child.material.metalness || 0;
                child.material.roughness =
                  child.material.roughness !== undefined
                    ? child.material.roughness
                    : 1;
              }
            }
          });

          const scale = 20;
          this.model.scale.set(scale, scale, scale);

          this.scene.add(this.model);
          this.loaded = true;
          resolve(this.model);
        },
        undefined,
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

    this.raycaster.ray.origin.set(x, 500, z);
    const intersects = this.raycaster.intersectObjects(
      this.collidableMeshes,
      false
    );

    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return null;
  }

  canMoveTo(currentX, currentZ, nextX, nextZ) {
    if (!this.loaded) return { allowed: true, height: 0 };

    const currentHeight = this.getHeightAt(currentX, currentZ);
    const nextHeight = this.getHeightAt(nextX, nextZ);

    if (nextHeight === null) {
      return { allowed: false, height: currentHeight || 0 };
    }

    if (currentHeight === null) {
      return { allowed: true, height: nextHeight };
    }

    const diff = nextHeight - currentHeight;
    const distance = Math.sqrt(
      (nextX - currentX) ** 2 + (nextZ - currentZ) ** 2
    );

    // Ignorar pequenas variações de altura
    if (Math.abs(diff) < 2.5) {
      return { allowed: true, height: nextHeight };
    }

    const slope = distance > 0 ? Math.abs(diff) / distance : 0;

    if (slope > 8.0 || diff > 12.0 || diff < -12.0) {
      return { allowed: false, height: currentHeight };
    }

    return { allowed: true, height: nextHeight };
  }

  toggleDebug(show) {
    if (this.debugGroup) {
      this.debugGroup.visible = show;
    }
  }

  visualizeCollisionPoint(x, z, allowed) {
    if (!this.debugGroup.visible) return;

    const height = this.getHeightAt(x, z);
    if (height === null) return;

    const markerGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({
      color: allowed ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.6,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(x, height + 0.5, z);
    this.debugGroup.add(marker);

    setTimeout(() => {
      this.debugGroup.remove(marker);
      markerGeo.dispose();
      markerMat.dispose();
    }, 2000);
  }
}
