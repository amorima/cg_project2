import * as THREE from "https://esm.sh/three@0.160.0";

export class ShepherdDog {
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

  idle(timeScale) {
    this.walkCycle += 0.03 * timeScale;
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

  walk(timeScale) {
    this.walkCycle += 0.12 * timeScale;
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

  run(timeScale) {
    this.walkCycle += 0.25 * timeScale;
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

  update(faceDetected, dogTargetX, dogTargetZ, deltaTime) {
    const timeScale = deltaTime * 60;

    if (!faceDetected) {
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
      this.idle(timeScale);
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
    this.group.position.add(
      direction.multiplyScalar(this.currentSpeed * timeScale)
    );

    // Limitar à área
    const limitX = 45;
    const limitZMin = -45;
    const limitZMax = 20; // Manter à frente da câmara (z=25)

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
  }
}
