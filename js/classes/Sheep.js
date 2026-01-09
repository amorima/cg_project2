import * as THREE from "https://esm.sh/three@0.160.0";

// conversão de graus para radianos
const rad = (degrees) => degrees * (Math.PI / 180);

// raios de influência do cão pastor
const DOG_INFLUENCE_RADIUS = 20;
const DOG_FEAR_RADIUS = 6;

export class Sheep {
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
    this.collisionTimer = 0;

    // anti-stuck
    this.stuckTimer = 0;
    this.lastPosition = new THREE.Vector3();
    this.movementThreshold = 0.1;
    this.ignoreCollision = false;
    this.ignoreCollisionTimer = 0;

    this.drawBody();
    this.drawHead();
    this.drawTail();
    this.drawLegs();
    this.createDebugVisuals();
  }

  createDebugVisuals() {
    this.debugGroup = new THREE.Group();
    this.debugGroup.visible = false;
    this.group.add(this.debugGroup);

    const collisionGeo = new THREE.SphereGeometry(4, 8, 8);
    const collisionMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    });
    this.debugCollision = new THREE.Mesh(collisionGeo, collisionMat);
    this.debugGroup.add(this.debugCollision);

    const fearGeo = new THREE.RingGeometry(0.5, 0.7, 8);
    fearGeo.rotateX(-Math.PI / 2);
    const fearMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    this.debugFear = new THREE.Mesh(fearGeo, fearMat);
    this.debugFear.visible = false;
    this.debugGroup.add(this.debugFear);
  }

  toggleDebug(show) {
    if (this.debugGroup) {
      this.debugGroup.visible = show;
    }
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

  walk(timeScale) {
    this.walkCycle += 0.06 * timeScale;

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

  idle(timeScale) {
    this.walkCycle += 0.02 * timeScale;

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

  run(timeScale) {
    this.walkCycle += 0.15 * timeScale;

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

  update(sheepArray, dog, isScared, faceDetected, deltaTime, terrain) {
    const timeScale = deltaTime * 60;

    // Gestão do timer de ignoreCollision
    if (this.ignoreCollision) {
      this.ignoreCollisionTimer -= deltaTime;
      if (this.ignoreCollisionTimer <= 0) {
        this.ignoreCollision = false;
        this.stuckTimer = 0;
      }
    }

    // Se colidiu recentemente, roda no lugar antes de tentar andar de novo
    if (this.collisionTimer > 0) {
      this.collisionTimer -= deltaTime;

      // Rodar suavemente para a nova direção
      let angleDiff = this.targetRotation - this.group.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.group.rotation.y += angleDiff * 0.1 * timeScale;

      this.walk(timeScale * 0.5); // Animação de passo no lugar

      // Manter altura correta
      if (terrain) {
        const h = terrain.getHeightAt(
          this.group.position.x,
          this.group.position.z
        );
        if (h !== null) this.group.position.y = h + 1.8;
      }
      return; // Não executa movimento de translação
    }

    const oldPos = this.group.position.clone();

    // Helper para verificar terreno
    const checkTerrain = () => {
      if (terrain) {
        const moveCheck = terrain.canMoveTo(
          oldPos.x,
          oldPos.z,
          this.group.position.x,
          this.group.position.z
        );

        // permitir movimento mesmo com colisão
        if (this.ignoreCollision) {
          if (moveCheck.allowed) {
            this.group.position.y = moveCheck.height + 1.8;
          } else {
            this.group.position.y = oldPos.y;
          }
          return;
        }

        if (moveCheck.allowed) {
          this.group.position.y = moveCheck.height + 1.8;
        } else {
          // Colisão detetada: reverte movimento E muda de direção
          this.group.position.copy(oldPos);

          // Roda entre 90 a 270 graus para fugir do obstáculo
          this.targetRotation += Math.PI / 2 + Math.random() * Math.PI;
          this.collisionTimer = 0.5;
        }
      }
    };

    if (isScared) {
      if (this.debugFear) this.debugFear.visible = true;
      this.fleeFromCenter(timeScale);
      this.run(timeScale);
      this.keepInBounds();
      checkTerrain();
      return;
    } else {
      if (this.debugFear) this.debugFear.visible = false;
    }

    // Se há cão, verificar distância
    if (dog && faceDetected) {
      const distToDog = this.group.position.distanceTo(dog.group.position);

      // Fugir do cão se estiver perto
      if (distToDog < DOG_INFLUENCE_RADIUS) {
        this.fleeFromDog(dog, distToDog, sheepArray, timeScale);

        if (distToDog < DOG_FEAR_RADIUS) {
          this.run(timeScale);
        } else {
          this.walk(timeScale);
        }
        this.keepInBounds();
        checkTerrain();
        return;
      }
    }

    if (this.isIdle) {
      this.idleTimer += timeScale;
      // Manter no chão mesmo idle
      if (terrain) {
        const h = terrain.getHeightAt(
          this.group.position.x,
          this.group.position.z
        );
        if (h !== null) this.group.position.y = h + 1.8;
      }

      if (this.idleTimer > this.idleDuration) {
        this.idleTimer = 0;
        this.idleDuration = 200 + Math.random() * 400;
        this.isIdle = false;
        this.headPivot.rotation.y = 0;
      }
      this.idle(timeScale);
    } else {
      this.avoidCollisions(sheepArray, timeScale);
      this.moveForward(timeScale);
      this.walk(timeScale);
      this.headPivot.rotation.y = 0;

      if (Math.random() < 0.002) {
        this.isIdle = true;
      }
      checkTerrain();
    }

    this.keepInBounds();

    // anti-stuck: detetar se está preso
    if (!this.isIdle) {
      const movedDistance = this.group.position.distanceTo(this.lastPosition);

      // Se moveu muito pouco (está a tentar mover mas não consegue)
      if (movedDistance < this.movementThreshold) {
        this.stuckTimer += deltaTime;

        // Se preso por mais de 1 segundo, ativar fallback
        if (this.stuckTimer > 1.0 && !this.ignoreCollision) {
          const limit = 20;
          const isAtBoundary =
            Math.abs(this.group.position.x) >= limit - 1 ||
            Math.abs(this.group.position.z) >= limit - 1;

          // Apenas ativar se não estiver nos limites do mapa
          if (!isAtBoundary) {
            this.ignoreCollision = true;
            this.ignoreCollisionTimer = 2.0;
            this.stuckTimer = 0;
          } else {
            // Nos limites: apenas resetar timer
            this.stuckTimer = 0;
          }
        }
      } else {
        // Moveu-se normalmente, resetar timer
        this.stuckTimer = 0;
      }

      this.lastPosition.copy(this.group.position);
    }
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

  avoidCollisions(sheepArray, timeScale) {
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

    this.group.rotation.y += angleDiff * this.turnSpeed * timeScale;
  }

  moveForward(timeScale) {
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(this.speed * timeScale));
  }

  keepInBounds() {
    const limit = 20;
    const pos = this.group.position;

    if (Math.abs(pos.x) > limit || Math.abs(pos.z) > limit) {
      const toCenter = new THREE.Vector3(-pos.x, 0, -pos.z).normalize();
      this.targetRotation = Math.atan2(toCenter.x, toCenter.z);
    }
  }

  fleeFromDog(dog, distToDog, sheepArray, timeScale) {
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
    this.group.rotation.y += angleDiff * 0.08 * timeScale;

    // Velocidade baseada na proximidade do cão
    const fleeSpeed = this.speed * (1 + urgency * 3);

    // Mover em frente
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(fleeSpeed * timeScale));
  }

  fleeFromCenter(timeScale) {
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
    this.group.rotation.y += angleDiff * 0.1 * timeScale;

    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);
    this.group.position.add(direction.multiplyScalar(0.15 * timeScale));
  }
}
