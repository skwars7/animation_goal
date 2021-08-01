import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Vector3,
  Mesh,
  ConeBufferGeometry,
  MeshBasicMaterial,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  InstancedBufferAttribute,
  Color,
  MathUtils,
  SphereBufferGeometry,
  PlaneBufferGeometry,
  Raycaster,
  Vector2,
  Points
} from "three";

import gsap from "gsap";
import NiceColorPalette from "nice-color-palettes/200";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GrassMaterial from "./glsl/grass-material";
import FloorMaterial from "./glsl/floor-material";
import ParticleMaterial from "./glsl/particle-material";
import { pick, getPos } from "./utils";

const debug = false;
const delta = 1 / 60;

const height = 0.3;
const palettes = [6, 14, 15, 20, 40, 51, 57, 61, 66, 129, 135, 169];
const pickedPalette = pick(palettes);
const pal = NiceColorPalette[pickedPalette];

const BG = new Color(pal[0]);
const wispColor =
  pickedPalette === 135 ? new Color(0x703cfb) : new Color("white");

const palette = [
  new Color(pal[1]),
  new Color(pal[2]),
  new Color(pal[3]),
  new Color(pal[4])
];

export default class Stage {
  constructor() {
    this.$canvas = document.getElementById("stage");

    this.setup();
  }

  setup() {
    this.initVariables();

    this.createScene();
    this.setupDebug();
    this.setupMeshes();
    gsap.ticker.add(() => this.render());

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.onResize());
    document.addEventListener("mousemove", (e) => this.onPointerMove(e));
    document.addEventListener("touchmove", (e) => this.onPointerMove(e));

    document.addEventListener("mousedown", (e) => this.onPointerDown(e));
    document.addEventListener("touchstart", (e) => this.onPointerDown(e));

    document.addEventListener("mouseup", (e) => this.onPointerUp(e));
    document.addEventListener("touchend", (e) => this.onPointerUp(e));
  }

  createScene() {
    const { W, H, PR } = window.layout;
    const fov = 50;

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(fov, W / H, 0.1, 10);

    this.camera.position.set(0, 2, 3.5);
    this.camera.lookAt(new Vector3());

    this.renderer = new WebGLRenderer({
      canvas: this.$canvas,
      antialias: false
    });

    this.renderer.setClearColor(BG);
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(PR);
    this.renderer.autoClear = false;
  }

  setupDebug() {
    if (!debug) return;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableKeys = false;
    this.controls.maxPolarAngle = Math.PI / 2.3;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 6;
    this.controls.update();
  }

  initVariables() {
    this.isDown = false;
    this.elapsedTime = 0;
    this.mouse = new Vector2();
    this.Ray = new Raycaster();
  }

  setupMeshes() {
    /* Particles
        --------------------------------------------------------- */

    const partGeo = new InstancedBufferGeometry();
    const pCount = 20;
    const pOff = 4;

    const pOffsets = [];
    const pDelays = [];
    const pOsc = [];
    const pSizes = [];

    for (let x = 0; x < pCount; x++) {
      for (let z = 0; z < pCount; z++) {
        const offX =
          Math.sin((x / pCount) * Math.PI * 2) * pOff * 0.5 * Math.random();
        const offY =
          Math.sin((x / pCount) * Math.PI) * pOff * 0.5 * Math.random();
        const offZ =
          Math.cos((z / pCount) * Math.PI * 2) * pOff * 0.5 * Math.random();

        pOffsets.push(offX, offY, offZ);
        pDelays.push(Math.random());
        pOsc.push(Math.random());
        pSizes.push(Math.random() * 0.2 + 0.1);
      }
    }

    partGeo.setAttribute("position", new Float32BufferAttribute([0, 0, 0], 3));
    partGeo.setAttribute(
      "aOffset",
      new InstancedBufferAttribute(new Float32Array(pOffsets), 3)
    );
    partGeo.setAttribute(
      "aDelay",
      new InstancedBufferAttribute(new Float32Array(pDelays), 1)
    );
    partGeo.setAttribute(
      "aOsc",
      new InstancedBufferAttribute(new Float32Array(pOsc), 1)
    );
    partGeo.setAttribute(
      "size",
      new InstancedBufferAttribute(new Float32Array(pSizes), 1)
    );

    this.particles = new Points(
      partGeo,
      new ParticleMaterial({
        color: wispColor
      })
    );
    this.particles.layers.set(1);
    this.particles.frustumCulled = false;

    this.scene.add(this.particles);

    /* Ball
        --------------------------------------------------------- */

    this.ball = new Mesh(
      new SphereBufferGeometry(0.1, 16, 16),
      new MeshBasicMaterial({ color: wispColor })
    );
    this.ball.frustumCulled = false;

    this.floor = new Mesh(
      new PlaneBufferGeometry(10, 10),
      new FloorMaterial({
        background: BG,
        sphereRef: this.ball
      })
    );
    this.floor.frustumCulled = false;

    /* Grass
        --------------------------------------------------------- */

    const size = 0.1;
    const amt = 50;
    const spacing = 5;
    const off = 0.02;
    const maxDist = 3;

    const spine = [];
    const translations = [];
    const colors = [];
    const scaleInfluence = [];

    const coneGeometry = new ConeBufferGeometry(height / 15, height, 16, 64);
    const { position } = coneGeometry.attributes;

    const mat = new GrassMaterial({
      background: BG,
      maxDist: maxDist,
      height: height,
      sphereRef: this.ball
    });

    // Progress through the shape
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      const p = (y + height / 2) / height;

      spine.push(p);
    }

    for (let z = 0; z < amt; z++) {
      for (let x = 0; x < amt; x++) {
        const nx = x / amt + size / 2 - 0.5 + MathUtils.randFloat(-off, off);
        const nz = -size / 2 + 0.5 - z / amt + MathUtils.randFloat(-off, off);
        const c = pick(palette);

        translations.push(nx * spacing, 0, nz * spacing);
        colors.push(c.r, c.g, c.b);
        scaleInfluence.push(Math.random());
      }
    }

    const coneInstance = new InstancedBufferGeometry().copy(coneGeometry);
    coneInstance.setAttribute("progress", new Float32BufferAttribute(spine, 1));
    coneInstance.setAttribute(
      "aTranslation",
      new InstancedBufferAttribute(new Float32Array(translations), 3)
    );
    coneInstance.setAttribute(
      "aColor",
      new InstancedBufferAttribute(new Float32Array(colors), 3)
    );
    coneInstance.setAttribute(
      "aInfluence",
      new InstancedBufferAttribute(new Float32Array(scaleInfluence), 1)
    );

    this.grass = new InstancedMesh(coneInstance, mat, amt ** 2);
    this.grass.position.y += height;
    this.grass.frustumCulled = false;
    this.grass.instanceMatrix.needsUpdate = true;

    this.floor.rotation.x = Math.PI / -2;
    this.floor.position.y = height * 0.5;

    this.scene.add(this.grass);
    this.scene.add(this.ball);
    this.scene.add(this.floor);
  }

  /* Handelrs
    --------------------------------------------------------- */

  onResize() {
    const { W, H } = window.layout;

    this.renderer.setSize(W, H);

    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  }

  onPointerMove(e) {
    e.preventDefault();
    const { W, H } = window.layout;
    const { x, y } = getPos(e);

    // Point a ray to the floor
    this.mouse.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    this.Ray.setFromCamera(this.mouse, this.camera);

    const intersect = this.Ray.intersectObject(this.floor);

    if (intersect.length === 0) return;

    const { point, uv } = intersect[0];

    gsap.to(this.ball.position, {
      duration: 1,
      x: point.x,
      z: point.z
    });

    gsap.to(this.floor.material.uniforms.spherePos.value, {
      duration: 1,
      x: uv.x,
      y: uv.y
    });
  }

  onPointerDown(e) {
    this.isDown = true;
    gsap.to(this.ball.position, {
      y: 1,
      ease: "power4.out"
    });
  }

  onPointerUp(e) {
    const foo = { value: 0 };

    gsap.to(foo, 1.2, {
      value: Math.PI * 2,
      ease: "expo.out",
      overwrite: true,
      onUpdate: () => {
        this.grass.material.uniforms.wave.value = Math.sin(foo.value) * 0.4;
      }
    });

    gsap.to(this.ball.position, 0.2, {
      y: 0.3,
      ease: "power4.out",
      overwrite: true,
      onComplete: () => {
        this.isDown = false;
      }
    });
  }

  /* Actions
    --------------------------------------------------------- */

  render() {
    const { renderer: R } = this;

    this.update();
    R.clear();

    this.camera.layers.set(0);
    R.render(this.scene, this.camera);
    R.clearDepth();

    this.camera.layers.set(1);
    R.render(this.scene, this.camera);
  }

  /* Values
    --------------------------------------------------------- */

  update() {
    this.grass.material.update();
    this.particles.material.update();

    if (this.isDown) return;

    this.elapsedTime += delta;

    gsap.to(this.ball.position, {
      y: Math.sin(this.elapsedTime * 1.3) * 0.1 + height * 0.5 + 0.4
    });
  }
}
