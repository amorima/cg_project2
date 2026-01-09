import * as THREE from "https://esm.sh/three@0.160.0";

export class ShepherdDog {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);

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

    const infGeo = new THREE.SphereGeometry(12, 16, 16);
    const infMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    this.debugInfluence = new THREE.Mesh(infGeo, infMat);
    this.debugGroup.add(this.debugInfluence);

    const fearGeo = new THREE.SphereGeometry(6, 16, 16);
    const fearMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      wireframe: true,
    });
    this.debugFear = new THREE.Mesh(fearGeo, fearMat);
    this.debugGroup.add(this.debugFear);
  }

  toggleDebug(show) {
    if (this.debugGroup) {
      this.debugGroup.visible = show;
    }
  }

  drawBody() {
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 1.2;

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

    const headGeo = new THREE.SphereGeometry(0.55, 8, 6);
    const head = new THREE.Mesh(headGeo, this.furMaterial);
    head.scale.set(1, 0.9, 1);
    head.castShadow = true;
    this.headPivot.add(head);

    const snoutGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
    const snout = new THREE.Mesh(snoutGeo, this.lightFurMaterial);
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, -0.1, 0.5);
    snout.castShadow = true;
    this.headPivot.add(snout);

    const noseGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const nose = new THREE.Mesh(noseGeo, this.noseMaterial);
    nose.position.set(0, -0.05, 0.8);
    this.headPivot.add(nose);

    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.position.set(0.22, 0.1, 0.35);
    this.headPivot.add(rightEye);

    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.position.set(-0.22, 0.1, 0.35);
    this.headPivot.add(leftEye);

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

    const tailGeo = new THREE.CapsuleGeometry(0.12, 0.6, 4, 6);
    const tail = new THREE.Mesh(tailGeo, this.furMaterial);
    tail.position.y = 0.35;
    tail.rotation.x = -0.3;
    tail.castShadow = true;
    this.tailPivot.add(tail);

    const tailTipGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const tailTip = new THREE.Mesh(tailTipGeo, this.whiteFurMaterial);
    tailTip.position.y = 0.7;
    this.tailPivot.add(tailTip);
  }

  drawLegs() {
    const createLeg = () => {
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

  idle(timeScale = 1) {
    this.walkCycle += 0.03 * timeScale;
    this.tongue.visible = false;

    this.frontRightLeg.rotation.x = 0;
    this.frontLeftLeg.rotation.x = 0;
    this.backRightLeg.rotation.x = 0;
    this.backLeftLeg.rotation.x = 0;

    this.bodyGroup.position.y = 1.2;

    this.headPivot.rotation.x = Math.sin(this.walkCycle * 0.5) * 0.05;

    const earTwitch = Math.sin(this.walkCycle * 2) * 0.05;
    this.rightEar.rotation.z = -0.25 + earTwitch;
    this.leftEar.rotation.z = 0.25 - earTwitch;

    this.tailPivot.rotation.x = -0.5 + Math.sin(this.walkCycle) * 0.2;
    this.tailPivot.rotation.z = Math.sin(this.walkCycle * 1.5) * 0.3;
  }

  walk(timeScale = 1) {
    this.walkCycle += 0.12 * timeScale;
    this.tongue.visible = false;

    const legSwing = Math.sin(this.walkCycle) * 0.4;

    this.frontRightLeg.rotation.x = legSwing;
    this.frontLeftLeg.rotation.x = -legSwing;
    this.backRightLeg.rotation.x = -legSwing;
    this.backLeftLeg.rotation.x = legSwing;

    this.bodyGroup.position.y = 1.2 + Math.sin(this.walkCycle * 2) * 0.05;

    this.headPivot.rotation.x = Math.sin(this.walkCycle * 2) * 0.08;

    const earBounce = Math.sin(this.walkCycle * 2) * 0.08;
    this.rightEar.rotation.z = -0.25 + earBounce;
    this.leftEar.rotation.z = 0.25 - earBounce;

    this.tailPivot.rotation.x = -0.3;
    this.tailPivot.rotation.z = Math.sin(this.walkCycle * 2) * 0.5;
  }

  run(timeScale = 1) {
    this.walkCycle += 0.25 * timeScale;
    this.tongue.visible = true;

    const legSwing = Math.sin(this.walkCycle) * 0.7;

    this.frontRightLeg.rotation.x = legSwing;
    this.frontLeftLeg.rotation.x = -legSwing * 0.8;
    this.backRightLeg.rotation.x = -legSwing * 0.8;
    this.backLeftLeg.rotation.x = legSwing;

    this.bodyGroup.position.y = 1.2 + Math.sin(this.walkCycle * 2) * 0.12;
    this.bodyGroup.rotation.x = Math.sin(this.walkCycle * 2) * 0.05;

    this.tongue.rotation.z = Math.sin(this.walkCycle * 3) * 0.2;

    this.rightEar.rotation.x = 0.1;
    this.leftEar.rotation.x = 0.1;
    this.rightEar.rotation.z = -0.2 + Math.sin(this.walkCycle * 2) * 0.1;
    this.leftEar.rotation.z = 0.2 - Math.sin(this.walkCycle * 2) * 0.1;

    this.tailPivot.rotation.x = 0.2;
    this.tailPivot.rotation.z = Math.sin(this.walkCycle * 3) * 0.4;
  }

  update(faceDetected, dogTargetX, dogTargetZ, deltaTime, terrain) {
    const timeScale = deltaTime * 60;

    // timer de ignoreCollision
    if (this.ignoreCollision) {
      this.ignoreCollisionTimer -= deltaTime;
      if (this.ignoreCollisionTimer <= 0) {
        this.ignoreCollision = false;
        this.stuckTimer = 0;
        console.log("Cão: Colisões reativadas");
      }
    }

    if (!faceDetected) {
      this.idle(timeScale);
      return;
    }

    const dx = dogTargetX - this.group.position.x;
    const dz = dogTargetZ - this.group.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Se está perto do alvo, ficar parado
    if (distance < 0.5) {
      this.isMoving = false;
      this.currentSpeed = 0;
      this.idle(timeScale);

      // Manter no chão mesmo idle
      if (terrain) {
        const y = terrain.getHeightAt(
          this.group.position.x,
          this.group.position.z
        );
        if (y !== null) this.group.position.y = y;
      }
      return;
    }

    this.isMoving = true;

    // Rodar suavemente para o alvo
    this.targetRotation = Math.atan2(dx, dz);
    let angleDiff = this.targetRotation - this.group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.group.rotation.y += angleDiff * 0.08 * timeScale;

    // Velocidade baseada na distância
    const targetSpeed = Math.min(0.15, distance * 0.03);
    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.1 * timeScale;

    // Mover em frente
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.group.quaternion);

    const moveAmount = this.currentSpeed * timeScale;
    const newPos = this.group.position
      .clone()
      .add(direction.multiplyScalar(moveAmount));

    // Verificar terreno
    if (terrain) {
      const moveCheck = terrain.canMoveTo(
        this.group.position.x,
        this.group.position.z,
        newPos.x,
        newPos.z
      );

      // Se ignoreCollision está ativo, permitir movimento
      if (this.ignoreCollision) {
        this.group.position.copy(newPos);
        if (moveCheck.allowed) {
          this.group.position.y = moveCheck.height;
        }
      } else if (moveCheck.allowed) {
        this.group.position.copy(newPos);
        this.group.position.y = moveCheck.height;
      } else {
        this.currentSpeed = 0;
      }
    } else {
      this.group.position.add(direction.multiplyScalar(moveAmount));
    }

    // Limitar à área
    const limitX = 45;

    const limitZMin = -45;
    const limitZMax = 20;

    this.group.position.x = Math.max(
      -limitX,
      Math.min(limitX, this.group.position.x)
    );
    this.group.position.z = Math.max(
      limitZMin,
      Math.min(limitZMax, this.group.position.z)
    );

    // Animação baseada na velocidade
    if (this.currentSpeed > 0.08) {
      this.run(timeScale);
    } else {
      this.walk(timeScale);
    }

    // Sistema anti-stuck: detetar se está preso
    if (this.isMoving) {
      const movedDistance = this.group.position.distanceTo(this.lastPosition);

      // Se moveu muito pouco
      if (movedDistance < this.movementThreshold) {
        this.stuckTimer += deltaTime;

        // Se preso por mais de 1 segundo, ativar fallback
        if (this.stuckTimer > 1.0 && !this.ignoreCollision) {
          const limitX = 45;
          const limitZMin = -45;
          const limitZMax = 20;
          const isAtBoundary =
            Math.abs(this.group.position.x) >= limitX - 1 ||
            this.group.position.z <= limitZMin + 1 ||
            this.group.position.z >= limitZMax - 1;

          // Apenas ativar se NÃO estiver nos limites
          if (!isAtBoundary) {
            console.log("Cão preso! Desativando colisões por 2 segundos...");
            this.ignoreCollision = true;
            this.ignoreCollisionTimer = 2.0;
            this.stuckTimer = 0;
          } else {
            this.stuckTimer = 0;
          }
        }
      } else {
        this.stuckTimer = 0;
      }

      this.lastPosition.copy(this.group.position);
    }
  }
}
