import * as THREE from 'three';
import { MinifigureData, SimActivity, PlacedBrick } from '../types.ts';
import { STUD_RADIUS, STUD_HEIGHT } from './legoGeometry.ts';
import { legoAudio } from '../audio/soundEffects.ts';
import { checkMinifigStep, getHighestSurfaceAt } from './collision.ts';

// Cache for procedural face textures
const faceTextureCache = new Map<string, THREE.CanvasTexture>();

function getFaceTexture(expression: string): THREE.CanvasTexture {
  if (faceTextureCache.has(expression)) {
    return faceTextureCache.get(expression)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fill yellow skin tone
  ctx.fillStyle = '#FFCD00';
  ctx.fillRect(0, 0, 256, 256);

  // Center coordinates for face print
  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  const centerX = 128;
  const eyeY = 110;

  if (expression === 'cool') {
    // Sunglasses
    ctx.fillStyle = '#111111';
    ctx.fillRect(80, 95, 36, 26);
    ctx.fillRect(140, 95, 36, 26);
    ctx.fillRect(116, 102, 24, 8);
    // Smile with smirk
    ctx.beginPath();
    ctx.arc(132, 160, 22, 0.1, Math.PI * 0.9);
    ctx.stroke();
  } else if (expression === 'sleepy') {
    // Closed happy eyes
    ctx.beginPath();
    ctx.arc(95, eyeY, 12, Math.PI, 0, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(161, eyeY, 12, Math.PI, 0, false);
    ctx.stroke();
    // Tiny yawning or resting mouth
    ctx.beginPath();
    ctx.arc(centerX, 165, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#662222';
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'surprised') {
    // Big round eyes
    ctx.beginPath();
    ctx.arc(95, eyeY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(161, eyeY, 10, 0, Math.PI * 2);
    ctx.fill();
    // O-mouth
    ctx.beginPath();
    ctx.arc(centerX, 165, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#661111';
    ctx.fill();
    ctx.stroke();
  } else {
    // Classic iconic happy Lego face
    // Left eye with white pupil highlight
    ctx.beginPath();
    ctx.arc(95, eyeY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(98, eyeY - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Right eye with white pupil highlight
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(161, eyeY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(164, eyeY - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Classic curved Lego smile
    ctx.strokeStyle = '#111111';
    ctx.beginPath();
    ctx.arc(centerX, 150, 32, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Cheek dimples
    ctx.beginPath();
    ctx.moveTo(88, 162);
    ctx.lineTo(84, 155);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(168, 162);
    ctx.lineTo(172, 155);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  faceTextureCache.set(expression, texture);
  return texture;
}

export class LegoMinifigureMesh {
  public group: THREE.Group;
  public data: MinifigureData;

  // Body parts for animation
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private headGroup: THREE.Group;
  private plumbob: THREE.Mesh;
  private thoughtSprite: THREE.Sprite;
  private speechTextureCanvas: HTMLCanvasElement;
  private speechTexture: THREE.CanvasTexture;

  private walkCycle: number = 0;
  private targetPosition: THREE.Vector3 | null = null;
  private isSelected: boolean = false;

  constructor(data: MinifigureData) {
    this.data = { ...data };
    this.group = new THREE.Group();
    this.group.name = `minifig_${data.id}`;
    this.group.position.set(data.position[0], data.position[1], data.position[2]);
    this.group.rotation.y = data.rotation;

    // Materials
    const yellowSkinMat = new THREE.MeshStandardMaterial({
      color: 0xFFCD00,
      roughness: 0.2,
      metalness: 0.05,
    });
    const torsoMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.outfitColor),
      roughness: 0.25,
      metalness: 0.05,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.pantsColor),
      roughness: 0.3,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(data.hairColor),
      roughness: 0.35,
      metalness: 0.05,
    });

    // 1. LEGS & HIPS
    const hipsGeom = new THREE.BoxGeometry(0.76, 0.2, 0.4);
    const hipsMesh = new THREE.Mesh(hipsGeom, pantsMat);
    hipsMesh.position.y = 0.65;
    this.group.add(hipsMesh);

    // Left Leg Group (hinge at hip)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.65, 0);
    const legGeom = new THREE.BoxGeometry(0.34, 0.6, 0.4);
    legGeom.translate(0, -0.3, 0);
    // Foot toe box
    const toeGeom = new THREE.BoxGeometry(0.34, 0.18, 0.18);
    toeGeom.translate(0, -0.51, 0.18);
    const leftLegMesh = new THREE.Mesh(legGeom, pantsMat);
    const leftToeMesh = new THREE.Mesh(toeGeom, pantsMat);
    this.leftLeg.add(leftLegMesh, leftToeMesh);
    this.group.add(this.leftLeg);

    // Right Leg Group
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(legGeom, pantsMat);
    const rightToeMesh = new THREE.Mesh(toeGeom, pantsMat);
    this.rightLeg.add(rightLegMesh, rightToeMesh);
    this.group.add(this.rightLeg);

    // 2. TORSO (Trapezoid shape: slightly wider at waist and shoulders)
    const torsoGeom = new THREE.CylinderGeometry(0.36, 0.42, 0.72, 4);
    torsoGeom.rotateY(Math.PI / 4);
    torsoGeom.scale(1.0, 1.0, 0.7);
    const torsoMesh = new THREE.Mesh(torsoGeom, torsoMat);
    torsoMesh.position.y = 1.12;
    this.group.add(torsoMesh);

    // Neck ring
    const neckGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16);
    const neckMesh = new THREE.Mesh(neckGeom, yellowSkinMat);
    neckMesh.position.y = 1.52;
    this.group.add(neckMesh);

    // 3. ARMS & HANDS
    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.46, 1.4, 0);
    const armGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.55, 12);
    armGeom.translate(0, -0.27, 0);
    const leftArmMesh = new THREE.Mesh(armGeom, torsoMat);
    // Yellow C-Hand
    const handGeom = new THREE.TorusGeometry(0.1, 0.04, 8, 16, Math.PI * 1.5);
    handGeom.rotateX(Math.PI / 2);
    handGeom.translate(0, -0.58, 0);
    const leftHandMesh = new THREE.Mesh(handGeom, yellowSkinMat);
    this.leftArm.add(leftArmMesh, leftHandMesh);
    this.group.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.46, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(armGeom, torsoMat);
    const rightHandMesh = new THREE.Mesh(handGeom, yellowSkinMat);
    this.rightArm.add(rightArmMesh, rightHandMesh);
    this.group.add(this.rightArm);

    // 4. HEAD & FACE
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.78, 0);

    const faceTex = getFaceTexture(data.faceExpression);
    const headMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.25,
      metalness: 0.02,
    });
    const headGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.42, 24);
    const headMesh = new THREE.Mesh(headGeom, headMat);
    // Orient texture to front
    headMesh.rotation.y = -Math.PI / 2;
    this.headGroup.add(headMesh);

    // Top Stud on head
    const topStudGeom = new THREE.CylinderGeometry(STUD_RADIUS * 0.9, STUD_RADIUS * 0.9, STUD_HEIGHT, 16);
    const topStudMesh = new THREE.Mesh(topStudGeom, yellowSkinMat);
    topStudMesh.position.y = 0.25;
    this.headGroup.add(topStudMesh);

    // Hair or Hat
    const hairMesh = this.createHairMesh(data.hairStyle, hairMat);
    this.headGroup.add(hairMesh);

    this.group.add(this.headGroup);

    // 5. THE SIMS PLUMBOB (The iconic spinning green diamond crystal above head!)
    const plumbobGeom = new THREE.OctahedronGeometry(0.2, 0);
    plumbobGeom.scale(0.8, 1.6, 0.8);
    const plumbobMat = new THREE.MeshStandardMaterial({
      color: 0x00FF44,
      emissive: 0x008822,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    this.plumbob = new THREE.Mesh(plumbobGeom, plumbobMat);
    this.plumbob.position.set(0, 2.5, 0);
    this.plumbob.visible = false;
    this.group.add(this.plumbob);

    // 6. THOUGHT / SPEECH BUBBLE (Sims-style floating comic bubble)
    this.speechTextureCanvas = document.createElement('canvas');
    this.speechTextureCanvas.width = 256;
    this.speechTextureCanvas.height = 128;
    this.speechTexture = new THREE.CanvasTexture(this.speechTextureCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.speechTexture,
      transparent: true,
      depthTest: false,
    });
    this.thoughtSprite = new THREE.Sprite(spriteMat);
    this.thoughtSprite.position.set(0, 2.8, 0);
    this.thoughtSprite.scale.set(1.4, 0.7, 1);
    this.thoughtSprite.visible = false;
    this.group.add(this.thoughtSprite);

    this.updateSpeechBubble();
  }

  private createHairMesh(style: string, mat: THREE.Material): THREE.Object3D {
    const hairGroup = new THREE.Group();
    if (style === 'cap') {
      // Baseball cap
      const capDome = new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMesh = new THREE.Mesh(capDome, mat);
      capMesh.position.y = 0.12;
      const visor = new THREE.BoxGeometry(0.4, 0.05, 0.3);
      visor.translate(0, 0.12, 0.35);
      const visorMesh = new THREE.Mesh(visor, mat);
      hairGroup.add(capMesh, visorMesh);
    } else if (style === 'helmet') {
      // Construction helmet
      const helmMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      const brimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), mat);
      brimMesh.position.y = 0.1;
      const crestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.6), mat);
      crestMesh.position.y = 0.32;
      hairGroup.add(helmMesh, brimMesh, crestMesh);
    } else if (style === 'chef') {
      // White chef toque
      const chefMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
      const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.15, 16), chefMat);
      bandMesh.position.y = 0.18;
      const puffMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.35, 16), chefMat);
      puffMesh.position.y = 0.42;
      hairGroup.add(bandMesh, puffMesh);
    } else {
      // Classic wavy swept Lego hair
      const hairBaseMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
        mat
      );
      hairBaseMesh.position.y = 0.12;
      const fringeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.2), mat);
      fringeMesh.position.set(0, 0.18, 0.24);
      fringeMesh.rotation.x = 0.3;
      hairGroup.add(hairBaseMesh, fringeMesh);
    }
    return hairGroup;
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.plumbob.visible = selected;
    if (selected) {
      legoAudio.playSimlish('happy');
    }
  }

  public moveTo(x: number, z: number) {
    this.targetPosition = new THREE.Vector3(x, this.group.position.y, z);
    this.data.currentActivity = 'walking';
  }

  public setActivity(activity: SimActivity, thoughtText?: string, thoughtIcon?: string) {
    this.data.currentActivity = activity;
    if (thoughtText && thoughtIcon) {
      this.data.thoughtBubble = {
        icon: thoughtIcon,
        text: thoughtText,
        expiresAt: performance.now() + 5000,
      };
      this.updateSpeechBubble();
    }
  }

  public updateSpeechBubble() {
    if (!this.data.thoughtBubble || performance.now() > this.data.thoughtBubble.expiresAt) {
      this.thoughtSprite.visible = false;
      return;
    }

    const ctx = this.speechTextureCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 128);

    // Draw speech bubble background
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(10, 10, 236, 90, 20);
    ctx.fill();
    ctx.stroke();

    // Little pointer tail
    ctx.beginPath();
    ctx.moveTo(118, 100);
    ctx.lineTo(128, 124);
    ctx.lineTo(138, 100);
    ctx.fill();
    ctx.stroke();

    // Text & Emoji
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.data.thoughtBubble.icon} ${this.data.thoughtBubble.text}`, 128, 62);

    this.speechTexture.needsUpdate = true;
    this.thoughtSprite.visible = true;
  }

  // Per-frame animation tick
  public update(delta: number, existingBricks?: PlacedBrick[]) {
    // 1. Plumbob spin & color pulse based on highest need
    if (this.isSelected) {
      this.plumbob.rotation.y += delta * 2.5;
      const minNeed = Math.min(
        this.data.needs.hunger,
        this.data.needs.energy,
        this.data.needs.fun,
        this.data.needs.social
      );
      const plumbobColor = minNeed > 60 ? 0x00FF44 : minNeed > 30 ? 0xFFBB00 : 0xFF2222;
      (this.plumbob.material as THREE.MeshStandardMaterial).color.setHex(plumbobColor);
      (this.plumbob.material as THREE.MeshStandardMaterial).emissive.setHex(plumbobColor);
    }

    // 2. Speech bubble timer check
    if (this.data.thoughtBubble && performance.now() > this.data.thoughtBubble.expiresAt) {
      this.data.thoughtBubble = undefined;
      this.thoughtSprite.visible = false;
    }

    // 3. Movement & Walking kinematics with Structure Collision Detection
    const currentPos = this.group.position;

    if (this.targetPosition) {
      const dist = currentPos.distanceTo(this.targetPosition);

      if (dist > 0.15) {
        // Rotate towards target
        const dx = this.targetPosition.x - currentPos.x;
        const dz = this.targetPosition.z - currentPos.z;
        const targetRot = Math.atan2(dx, dz);
        this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetRot, 8, delta);

        // Calculate candidate next step position
        const speed = 2.4;
        const moveDist = Math.min(dist, speed * delta);
        const candX = currentPos.x + Math.sin(targetRot) * moveDist;
        const candZ = currentPos.z + Math.cos(targetRot) * moveDist;

        // Check if there is a wall or obstacle structure blocking the step
        let canStep = true;
        let nextGroundY = currentPos.y;

        if (existingBricks && existingBricks.length > 0) {
          const stepCheck = checkMinifigStep(
            currentPos.x,
            currentPos.z,
            currentPos.y,
            candX,
            candZ,
            existingBricks,
            0.2
          );
          canStep = stepCheck.allowed;
          nextGroundY = stepCheck.targetY;
        }

        if (canStep) {
          currentPos.x = candX;
          currentPos.z = candZ;
          currentPos.y = THREE.MathUtils.damp(currentPos.y, nextGroundY, 14, delta);

          // Walk cycle leg & arm swing
          this.walkCycle += delta * 9;
          const legAngle = Math.sin(this.walkCycle) * 0.6;
          this.leftLeg.rotation.x = legAngle;
          this.rightLeg.rotation.x = -legAngle;
          this.leftArm.rotation.x = -legAngle * 0.8;
          this.rightArm.rotation.x = legAngle * 0.8;
        } else {
          // Blocked by structure (wall, furniture) - stop walking and don't pass through!
          this.targetPosition = null;
          this.data.currentActivity = 'idle';
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
          this.leftArm.rotation.x = 0;
          this.rightArm.rotation.x = 0;
          this.data.thoughtBubble = {
            icon: '🛑',
            text: 'Не могу пройти!',
            expiresAt: performance.now() + 3000,
          };
          this.updateSpeechBubble();
          legoAudio.playSimlish('chat');
        }
      } else {
        // Reached destination
        this.targetPosition = null;
        this.data.currentActivity = 'idle';
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
      }
    } else {
      // Ground clamping when standing / dancing / resting so Sim never falls through floors
      if (existingBricks && existingBricks.length > 0) {
        const groundY = getHighestSurfaceAt(currentPos.x, currentPos.z, existingBricks, 0.2);
        currentPos.y = THREE.MathUtils.damp(currentPos.y, groundY, 14, delta);
      }

      if (this.data.currentActivity === 'dancing') {
        // Dance animation!
        this.walkCycle += delta * 12;
        const baseY = existingBricks ? getHighestSurfaceAt(currentPos.x, currentPos.z, existingBricks, 0.2) : this.data.position[1];
        currentPos.y = baseY + Math.abs(Math.sin(this.walkCycle)) * 0.15;
        this.leftArm.rotation.x = Math.sin(this.walkCycle) * 1.2;
        this.rightArm.rotation.x = Math.cos(this.walkCycle) * 1.2;
        this.headGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.4;
      } else if (this.data.currentActivity === 'eating') {
        this.walkCycle += delta * 6;
        this.rightArm.rotation.x = -1.2 + Math.sin(this.walkCycle) * 0.3;
      } else if (this.data.currentActivity === 'sleeping') {
        this.headGroup.rotation.x = 0.4;
      } else {
        this.walkCycle += delta * 2;
        this.headGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.15;
      }
    }

    // 4. Update data position in sync
    this.data.position = [this.group.position.x, this.group.position.y, this.group.position.z];
    this.data.rotation = this.group.rotation.y;
  }
}
