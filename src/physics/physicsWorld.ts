import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { PlacedBrick, BrickType } from '../types.ts';
import { BRICK_CATALOG, STUD_PITCH } from '../lego/legoGeometry.ts';
import { legoAudio } from '../audio/soundEffects.ts';

export class LegoPhysicsWorld {
  public world: CANNON.World;
  public brickBodies = new Map<string, CANNON.Body>();
  private brickMeshMap = new Map<string, THREE.Mesh>();
  public groundBody: CANNON.Body;
  public isRunning: boolean = false;
  public gravityY: number = -9.82;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, this.gravityY, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    (this.world.solver as CANNON.GSSolver).iterations = 20;

    // Plastic Lego contact material
    const plasticMat = new CANNON.Material('plastic');
    const groundMat = new CANNON.Material('ground');

    const contactMat = new CANNON.ContactMaterial(plasticMat, groundMat, {
      friction: 0.6,
      restitution: 0.18, // Realistic plastic bounce without sinking
    });
    contactMat.contactEquationStiffness = 1e8;
    contactMat.contactEquationRelaxation = 3;

    const plasticContact = new CANNON.ContactMaterial(plasticMat, plasticMat, {
      friction: 0.5,
      restitution: 0.2,
    });
    plasticContact.contactEquationStiffness = 1e8;
    plasticContact.contactEquationRelaxation = 3;

    this.world.addContactMaterial(contactMat);
    this.world.addContactMaterial(plasticContact);

    // Thick solid ground box (eliminates tunneling through infinite plane)
    const groundShape = new CANNON.Box(new CANNON.Vec3(100, 1, 100));
    this.groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    this.groundBody.addShape(groundShape);
    this.groundBody.position.set(0, -1, 0); // Top of ground box sits exactly at Y = 0
    this.world.addBody(this.groundBody);
  }

  // Register a brick mesh and create its Cannon-es rigid body
  public registerBrick(brick: PlacedBrick, mesh: THREE.Mesh, isDynamic: boolean = false) {
    const type = BRICK_CATALOG.find((b: BrickType) => b.id === brick.typeId) || BRICK_CATALOG[0];
    const halfW = (type.width * STUD_PITCH) / 2;
    const halfH = type.height / 2;
    const halfD = (type.depth * STUD_PITCH) / 2;

    const shape = new CANNON.Box(new CANNON.Vec3(halfW, halfH, halfD));
    const mass = isDynamic ? (type.width * type.depth * 0.2) : 0;

    const body = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(
        brick.position[0],
        brick.position[1] + halfH,
        brick.position[2]
      ),
    });

    body.quaternion.setFromEuler(0, brick.rotation, 0);

    // Collision audio
    body.addEventListener('collide', (e: { contact: { getImpactVelocityAlongNormal: () => number } }) => {
      const vel = Math.abs(e.contact.getImpactVelocityAlongNormal());
      if (vel > 1.2) {
        legoAudio.playBrickImpact(Math.min(1.0, vel / 8));
      }
    });

    this.world.addBody(body);
    this.brickBodies.set(brick.id, body);
    this.brickMeshMap.set(brick.id, mesh);
  }

  // Unregister a brick
  public removeBrick(brickId: string) {
    const body = this.brickBodies.get(brickId);
    if (body) {
      this.world.removeBody(body);
      this.brickBodies.delete(brickId);
    }
    this.brickMeshMap.delete(brickId);
  }

  // Set all bricks dynamic (simulate physics) or static (build mode)
  public setAllDynamic(dynamic: boolean) {
    this.isRunning = dynamic;
    this.brickBodies.forEach((body) => {
      if (dynamic) {
        const volume = (body.shapes[0] as CANNON.Box).halfExtents;
        body.mass = volume.x * volume.z * 1.5;
        body.type = CANNON.Body.DYNAMIC;
        body.updateMassProperties();
        body.wakeUp();
      } else {
        body.mass = 0;
        body.type = CANNON.Body.STATIC;
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.updateMassProperties();
      }
    });
  }

  // Launch cannon / wrecking ball
  public shootCannonball(origin: THREE.Vector3, direction: THREE.Vector3, speed: number = 32): THREE.Mesh {
    legoAudio.playCannon();

    const radius = 0.5;
    const sphereShape = new CANNON.Sphere(radius);
    const sphereBody = new CANNON.Body({
      mass: 8, // heavy bowling-ball style
      shape: sphereShape,
      position: new CANNON.Vec3(origin.x, origin.y, origin.z),
    });

    const shootVel = direction.clone().multiplyScalar(speed);
    sphereBody.velocity.set(shootVel.x, shootVel.y, shootVel.z);
    this.world.addBody(sphereBody);

    // Make surrounding bricks dynamic so they react
    this.setAllDynamic(true);

    // Create Three.js mesh for visual
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.2,
      })
    );
    mesh.castShadow = true;
    mesh.position.copy(origin);

    // Self cleanup after 8 seconds
    setTimeout(() => {
      this.world.removeBody(sphereBody);
    }, 8000);

    // Bind update hook onto mesh
    (mesh as unknown as { physicsBody: CANNON.Body }).physicsBody = sphereBody;
    return mesh;
  }

  // TNT explosion at point
  public explode(center: THREE.Vector3, power: number = 25, radius: number = 10) {
    legoAudio.playExplosion();
    this.setAllDynamic(true);

    this.brickBodies.forEach((body) => {
      const dist = body.position.distanceTo(new CANNON.Vec3(center.x, center.y, center.z));
      if (dist < radius && dist > 0.05) {
        const factor = (1 - dist / radius) * power;
        const dir = new CANNON.Vec3(
          body.position.x - center.x,
          body.position.y - center.y + 0.5, // upward kick
          body.position.z - center.z
        );
        dir.normalize();

        body.applyImpulse(
          new CANNON.Vec3(dir.x * factor, dir.y * factor * 1.5, dir.z * factor),
          body.position
        );

        // Add random tumbling spin
        body.angularVelocity.set(
          (Math.random() - 0.5) * factor,
          (Math.random() - 0.5) * factor,
          (Math.random() - 0.5) * factor
        );
      }
    });
  }

  // Earthquake tremor
  public earthquake(intensity: number = 8) {
    this.setAllDynamic(true);
    this.brickBodies.forEach((body) => {
      body.applyImpulse(
        new CANNON.Vec3(
          (Math.random() - 0.5) * intensity,
          Math.random() * intensity * 0.8,
          (Math.random() - 0.5) * intensity
        ),
        body.position
      );
    });
  }

  // Advance physics simulation
  public update(delta: number) {
    if (!this.isRunning) return;

    // Sub-stepping to completely eliminate tunneling through surfaces
    const clampedDelta = Math.min(delta, 0.1);
    this.world.step(1 / 60, clampedDelta, 5);

    // Hard boundary floor check to ensure zero bricks ever fall through structures or void
    this.brickBodies.forEach((body) => {
      const box = body.shapes[0] as CANNON.Box;
      const halfH = box && box.halfExtents ? box.halfExtents.y : 0.48;
      const groundFloorY = halfH + 0.005;

      if (body.position.y < groundFloorY) {
        body.position.y = groundFloorY;
        if (body.velocity.y < 0) {
          body.velocity.y = 0;
        }
      }
    });

    // Synchronize Three.js meshes with Cannon rigid bodies
    this.brickBodies.forEach((body, id) => {
      const mesh = this.brickMeshMap.get(id);
      if (mesh) {
        mesh.position.copy(body.position as unknown as THREE.Vector3);
        mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
      }
    });
  }

  // Clear all
  public clear() {
    this.brickBodies.forEach((body) => {
      this.world.removeBody(body);
    });
    this.brickBodies.clear();
    this.brickMeshMap.clear();
    this.isRunning = false;
  }
}
