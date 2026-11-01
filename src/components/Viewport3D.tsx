import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PlacedBrick, BrickType, ToolMode, MinifigureData } from '../types.ts';
import { BRICK_CATALOG, STUD_PITCH, BRICK_HEIGHT, PLATE_HEIGHT, getBrickGeometry, getLegoMaterial } from '../lego/legoGeometry.ts';
import { LegoMinifigureMesh } from '../lego/minifigure.ts';
import { LegoPhysicsWorld } from '../physics/physicsWorld.ts';
import { legoAudio } from '../audio/soundEffects.ts';
import { resolveSafeSnapHeight, checkBrickOverlap } from '../lego/collision.ts';

interface Viewport3DProps {
  bricks: PlacedBrick[];
  onAddBrick: (brick: PlacedBrick) => void;
  onRemoveBrick: (brickId: string) => void;
  selectedBrickType: BrickType;
  selectedColor: string;
  activeMode: ToolMode;
  brickRotation: number;
  physicsWorld: LegoPhysicsWorld;
  minifigures: MinifigureData[];
  selectedMinifigId: string | null;
  onSelectMinifig: (id: string | null) => void;
  onUpdateMinifig: (data: MinifigureData) => void;
  isSimulatingPhysics: boolean;
  followMinifig: boolean;
  cannonSpeed?: number;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  bricks,
  onAddBrick,
  onRemoveBrick,
  selectedBrickType,
  selectedColor,
  activeMode,
  brickRotation,
  physicsWorld,
  minifigures,
  selectedMinifigId,
  onSelectMinifig,
  onUpdateMinifig,
  isSimulatingPhysics,
  followMinifig,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Mesh registries
  const brickMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const minifigMeshMap = useRef<Map<string, LegoMinifigureMesh>>(new Map());
  const cannonballsList = useRef<THREE.Mesh[]>([]);

  // Preview Ghost Brick
  const ghostMeshRef = useRef<THREE.Mesh | null>(null);

  // Raycasting
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const snapTargetPos = useRef<THREE.Vector3 | null>(null);

  // Props refs to avoid stale closures in listeners
  const propsRef = useRef({
    bricks,
    onAddBrick,
    onRemoveBrick,
    selectedBrickType,
    selectedColor,
    activeMode,
    brickRotation,
    physicsWorld,
    minifigures,
    selectedMinifigId,
    onSelectMinifig,
    onUpdateMinifig,
    isSimulatingPhysics,
    followMinifig,
  });

  useEffect(() => {
    propsRef.current = {
      bricks,
      onAddBrick,
      onRemoveBrick,
      selectedBrickType,
      selectedColor,
      activeMode,
      brickRotation,
      physicsWorld,
      minifigures,
      selectedMinifigId,
      onSelectMinifig,
      onUpdateMinifig,
      isSimulatingPhysics,
      followMinifig,
    };
  });

  // INITIALIZE THREE.JS SCENE ON MOUNT
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // 1. Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 35, 90);
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    camera.position.set(14, 18, 22);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep above ground
    controls.minDistance = 2;
    controls.maxDistance = 80;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Lighting rig
    const sun = new THREE.DirectionalLight(0xFFF9E6, 2.2);
    sun.position.set(20, 35, 18);
    sun.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sun.shadow.mapSize.width = 2048;
      sun.shadow.mapSize.height = 2048;
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 100;
      const d = 25;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.0003;
      sun.shadow.normalBias = 0.02;
    }
    scene.add(sun);

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4A752C, 0.95);
    scene.add(hemiLight);

    // 6. Realistic Lego Baseplate Ground
    // Base infinite ground plane
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4C8C2B, // Vibrant natural lawn
      roughness: 0.8,
      metalness: 0.05,
    });
    const groundGeom = new THREE.PlaneGeometry(160, 160);
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.02;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    // Center Lego Studded Baseplate (32x32 studs)
    const plateGeom = new THREE.BoxGeometry(32 * STUD_PITCH, 0.2, 32 * STUD_PITCH);
    plateGeom.translate(0, 0.1, 0);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x009944,
      roughness: 0.3,
      metalness: 0.04,
    });
    const mainPlateMesh = new THREE.Mesh(plateGeom, plateMat);
    mainPlateMesh.receiveShadow = !isSoftwareGl;
    mainPlateMesh.name = 'lego_baseplate';
    scene.add(mainPlateMesh);

    // Visual grid studs on the plate
    const gridStudGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12);
    const gridInstanced = new THREE.InstancedMesh(gridStudGeom, plateMat, 32 * 32);
    gridInstanced.receiveShadow = !isSoftwareGl;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let x = 0; x < 32; x++) {
      for (let z = 0; z < 32; z++) {
        dummy.position.set(
          (x - 15.5) * STUD_PITCH,
          0.24,
          (z - 15.5) * STUD_PITCH
        );
        dummy.updateMatrix();
        gridInstanced.setMatrixAt(idx++, dummy.matrix);
      }
    }
    gridInstanced.instanceMatrix.needsUpdate = true;
    scene.add(gridInstanced);

    // 7. Ghost Preview Brick
    const ghostGeom = getBrickGeometry(BRICK_CATALOG[6]); // 2x4 default
    const ghostMat = getLegoMaterial('#FFCD00', true);
    const ghostMesh = new THREE.Mesh(ghostGeom, ghostMat);
    ghostMesh.visible = false;
    scene.add(ghostMesh);
    ghostMeshRef.current = ghostMesh;

    // 8. Animation & Render Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();

      // Update Cannon-es physics
      if (propsRef.current.isSimulatingPhysics) {
        propsRef.current.physicsWorld.update(delta);
      }

      // Update Minifigures animation & AI with obstacle collision and surface grounding
      minifigMeshMap.current.forEach((figMesh) => {
        figMesh.update(delta, propsRef.current.bricks);
      });

      // Keep camera above ground/structures
      if (camera.position.y < 0.6) {
        camera.position.y = 0.6;
      }

      // Update Cannonball meshes
      cannonballsList.current.forEach((ballMesh) => {
        const body = (ballMesh as unknown as { physicsBody?: { position: THREE.Vector3 } }).physicsBody;
        if (body) {
          ballMesh.position.copy(body.position);
        }
      });

      // Follow Camera for active Minifigure
      if (propsRef.current.followMinifig && propsRef.current.selectedMinifigId) {
        const activeFig = minifigMeshMap.current.get(propsRef.current.selectedMinifigId);
        if (activeFig) {
          const figPos = activeFig.group.position;
          const targetCam = new THREE.Vector3(
            figPos.x - Math.sin(activeFig.group.rotation.y) * 4,
            figPos.y + 2.8,
            figPos.z - Math.cos(activeFig.group.rotation.y) * 4
          );
          camera.position.lerp(targetCam, delta * 3);
          controls.target.lerp(new THREE.Vector3(figPos.x, figPos.y + 1.2, figPos.z), delta * 5);
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  // UPDATE GHOST BRICK WHEN TOOL / TYPE / ROTATION / COLOR CHANGES
  useEffect(() => {
    if (!ghostMeshRef.current) return;
    const { activeMode, selectedBrickType, selectedColor, brickRotation } = propsRef.current;

    if (activeMode !== 'build') {
      ghostMeshRef.current.visible = false;
      return;
    }

    const geom = getBrickGeometry(selectedBrickType);
    ghostMeshRef.current.geometry = geom;
    ghostMeshRef.current.material = getLegoMaterial(selectedColor, true);
    ghostMeshRef.current.rotation.y = brickRotation;
  }, [selectedBrickType, selectedColor, activeMode, brickRotation]);

  // SYNCHRONIZE BRICKS IN SCENE
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentMeshMap = brickMeshMap.current;

    // Track existing IDs
    const incomingIds = new Set(bricks.map((b) => b.id));

    // Remove obsolete meshes
    currentMeshMap.forEach((mesh, id) => {
      if (!incomingIds.has(id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        physicsWorld.removeBrick(id);
        currentMeshMap.delete(id);
      }
    });

    // Add or update bricks
    bricks.forEach((brick) => {
      let mesh = currentMeshMap.get(brick.id);
      const type = BRICK_CATALOG.find((b) => b.id === brick.typeId) || BRICK_CATALOG[0];

      if (!mesh) {
        const geom = getBrickGeometry(type);
        const mat = getLegoMaterial(brick.color);
        mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `brick_${brick.id}`;
        (mesh as unknown as { brickData: PlacedBrick }).brickData = brick;

        mesh.position.set(brick.position[0], brick.position[1], brick.position[2]);
        mesh.rotation.y = brick.rotation;

        scene.add(mesh);
        currentMeshMap.set(brick.id, mesh);

        // Register in Cannon-es physics world
        physicsWorld.registerBrick(brick, mesh, isSimulatingPhysics);
      } else {
        // If physics is not running, position matches static blueprint
        if (!isSimulatingPhysics) {
          mesh.position.set(brick.position[0], brick.position[1], brick.position[2]);
          mesh.rotation.y = brick.rotation;
        }
      }
    });
  }, [bricks, physicsWorld, isSimulatingPhysics]);

  // SYNCHRONIZE MINIFIGURES
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentMap = minifigMeshMap.current;

    const incomingIds = new Set(minifigures.map((m) => m.id));

    // Remove deleted minifigures
    currentMap.forEach((figMesh, id) => {
      if (!incomingIds.has(id)) {
        scene.remove(figMesh.group);
        currentMap.delete(id);
      }
    });

    // Add or update minifigures
    minifigures.forEach((data) => {
      let figMesh = currentMap.get(data.id);
      if (!figMesh) {
        figMesh = new LegoMinifigureMesh(data);
        scene.add(figMesh.group);
        currentMap.set(data.id, figMesh);
      } else {
        figMesh.data = { ...data };
        figMesh.updateSpeechBubble();
      }
      figMesh.setSelected(data.id === selectedMinifigId);
    });
  }, [minifigures, selectedMinifigId]);

  // POINTER MOVE & RAYCASTING FOR SNAP PREVIEW
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const { activeMode, selectedBrickType, brickRotation } = propsRef.current;
    if (activeMode !== 'build' || !ghostMeshRef.current) {
      if (ghostMeshRef.current) ghostMeshRef.current.visible = false;
      return;
    }

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const candidateMeshes: THREE.Object3D[] = [];
    brickMeshMap.current.forEach((m) => candidateMeshes.push(m));
    const baseplate = sceneRef.current.getObjectByName('lego_baseplate');
    if (baseplate) candidateMeshes.push(baseplate);

    const intersects = raycaster.current.intersectObjects(candidateMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;
      const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0);

      // Snap point calculation with side-face offset & anti-clipping
      let candX = point.x;
      let candZ = point.z;

      // If hitting a side face, push outward along the face normal so brick doesn't penetrate inside
      if (Math.abs(normal.x) > 0.5) {
        candX += normal.x * (STUD_PITCH * 0.5);
      }
      if (Math.abs(normal.z) > 0.5) {
        candZ += normal.z * (STUD_PITCH * 0.5);
      }

      const snapX = Math.round(candX / STUD_PITCH) * STUD_PITCH;
      const snapZ = Math.round(candZ / STUD_PITCH) * STUD_PITCH;

      // Automatically calculate safe non-penetrating Y height on top of existing structures
      let snapY = resolveSafeSnapHeight(
        snapX,
        snapZ,
        selectedBrickType.id,
        brickRotation,
        propsRef.current.bricks,
        0.2
      );

      // Verify no remaining 3D overlap with any brick
      const candidate: PlacedBrick = {
        id: 'temp_ghost',
        typeId: selectedBrickType.id,
        color: selectedColor,
        position: [snapX, snapY, snapZ],
        rotation: brickRotation,
      };

      let attempts = 0;
      while (checkBrickOverlap(candidate, propsRef.current.bricks) && attempts < 10) {
        snapY += 0.32; // step up by 1 plate until completely clear
        candidate.position[1] = snapY;
        attempts++;
      }

      snapTargetPos.current = new THREE.Vector3(snapX, snapY, snapZ);
      ghostMeshRef.current.position.set(snapX, snapY, snapZ);
      ghostMeshRef.current.rotation.y = brickRotation;
      ghostMeshRef.current.visible = true;
    } else {
      ghostMeshRef.current.visible = false;
      snapTargetPos.current = null;
    }
  };

  // POINTER CLICK / INTERACTION HANDLER
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only left click triggers action (middle / right drag camera)
    if (e.button !== 0) return;
    if (!cameraRef.current || !sceneRef.current) return;

    const {
      activeMode,
      selectedBrickType,
      selectedColor,
      brickRotation,
      onAddBrick,
      onRemoveBrick,
      physicsWorld,
      onSelectMinifig,
      minifigures,
      selectedMinifigId,
    } = propsRef.current;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // 1. BUILD MODE: Place brick
    if (activeMode === 'build') {
      if (snapTargetPos.current) {
        const newBrick: PlacedBrick = {
          id: `brick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          typeId: selectedBrickType.id,
          color: selectedColor,
          position: [snapTargetPos.current.x, snapTargetPos.current.y, snapTargetPos.current.z],
          rotation: brickRotation,
        };
        onAddBrick(newBrick);
        legoAudio.playSnap();
      }
      return;
    }

    // 2. SIMS MODE: Select or order Minifigure
    if (activeMode === 'sims') {
      // Check if clicked directly on a Minifigure
      const minifigGroups = Array.from(minifigMeshMap.current.values()).map((f) => f.group);
      const hits = raycaster.current.intersectObjects(minifigGroups, true);

      if (hits.length > 0) {
        // Find which minifig was clicked
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.name.startsWith('minifig_')) {
          obj = obj.parent;
        }
        if (obj) {
          const figId = obj.name.replace('minifig_', '');
          onSelectMinifig(figId);
          return;
        }
      }

      // If already selected a Minifigure, clicking on ground or brick commands them to walk there!
      if (selectedMinifigId) {
        const groundHits = raycaster.current.intersectObjects([
          sceneRef.current.getObjectByName('lego_baseplate')!,
          ...Array.from(brickMeshMap.current.values()),
        ], false);

        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          const figMesh = minifigMeshMap.current.get(selectedMinifigId);
          if (figMesh) {
            figMesh.moveTo(pt.x, pt.z);
            legoAudio.playSimlish('chat');
          }
        }
      }
      return;
    }

    // 3. PHYSICS & DESTRUCTION MODES
    if (activeMode === 'physics' || activeMode === 'destroy') {
      const allBrickMeshes = Array.from(brickMeshMap.current.values());
      const baseplate = sceneRef.current.getObjectByName('lego_baseplate');
      const candidates = baseplate ? [...allBrickMeshes, baseplate] : allBrickMeshes;
      const hits = raycaster.current.intersectObjects(candidates, false);

      if (hits.length > 0) {
        const hit = hits[0];

        if (activeMode === 'destroy') {
          // Brick separator delete tool
          const brickData = (hit.object as unknown as { brickData?: PlacedBrick }).brickData;
          if (brickData) {
            onRemoveBrick(brickData.id);
            legoAudio.playPop();
          }
        } else if (activeMode === 'physics') {
          // Cannon bowling shot straight from camera towards clicked point
          const camPos = cameraRef.current.position.clone();
          const targetDir = hit.point.clone().sub(camPos).normalize();
          const ballMesh = physicsWorld.shootCannonball(camPos, targetDir, 36);
          sceneRef.current.add(ballMesh);
          cannonballsList.current.push(ballMesh);
        }
      }
    }
  };

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-crosshair overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
