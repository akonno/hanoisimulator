// src/three/hanoiThree.ts
// Last Modified: 2025/12/22 20:08:40
// Copyright (C) 2024-2025 KONNO Akihisa <konno@researchers.jp>

// Three.js view layer for Hanoi Simulator (scene/camera/renderer + meshes + textures + lifecycle)

import * as THREE from "three";

type Disposable = { dispose: () => void };

/**
 * Track and dispose resources deterministically.
 * - Materials and geometries are tracked explicitly.
 * - Textures can be tracked too (including later-loaded textures).
 */
class ResourceTracker {
  private resources = new Set<Disposable>();
  private textures = new Set<THREE.Texture>();

  track<T extends Disposable>(res: T): T {
    this.resources.add(res);
    return res;
  }

  trackTexture(tex: THREE.Texture): THREE.Texture {
    this.textures.add(tex);
    return tex;
  }

  disposeAll(): void {
    // Dispose non-texture first
    for (const r of this.resources) {
      try {
        r.dispose();
      } catch {
        // ignore
      }
    }
    this.resources.clear();

    // Dispose textures separately (avoid double-dispose by using a Set)
    for (const t of this.textures) {
      try {
        t.dispose();
      } catch {
        // ignore
      }
    }
    this.textures.clear();
  }
}

export type HanoiThreeOptions = {
  /** Number of discs to create initially */
  numDiscs: number;

  /** Background assets base url; default uses Vite BASE_URL */
  baseUrl?: string;

  /** Renderer antialias */
  antialias?: boolean;

  /** If you want screenshot without forced render, set preserveDrawingBuffer true (slower). */
  preserveDrawingBuffer?: boolean;
};

export type HanoiLayout = {
  pillarDistance: number;
  pillarHeight: number;
  pillarDiameter: number;
  discThickness: number;
  hoverHeight: number;
};

export class HanoiThree {
  // three core
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;

  // layout constants (match current App.vue values as closely as possible)
  public readonly layout: HanoiLayout;

  // objects
  private readonly envTracker = new ResourceTracker();
  private readonly discTracker = new ResourceTracker();
  private readonly textureLoader = new THREE.TextureLoader();

  private container: HTMLElement | null = null;

  private skyMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;

  private pillarMeshes: THREE.Mesh[] = [];
  private discMeshes: THREE.Mesh[] = [];

  // shared materials (some are shared; keep references)
    private skyMaterial: THREE.MeshBasicMaterial | null = null;
    private groundMaterial: THREE.MeshLambertMaterial | null = null;
    private pillarMaterial: THREE.MeshLambertMaterial | null = null;
    private discTexture: THREE.Texture | null = null;
    private discTexturePromise: Promise<THREE.Texture | null> | null = null;

  // state
  private baseUrl: string;
  private disposed = false;

  constructor(options: HanoiThreeOptions) {
    const {
      numDiscs,
      baseUrl = (import.meta as any).env?.BASE_URL ?? "/",
      antialias = true,
      preserveDrawingBuffer = false,
    } = options;

    this.baseUrl = baseUrl;

    this.scene = new THREE.Scene();

    const cameraZ = 0.35 * numDiscs > 6 ? 0.35 * numDiscs : 6;
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    this.camera.position.set(0, 1, cameraZ);
    // this.camera.lookAt(0, 0.5, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias,
      preserveDrawingBuffer,
    });

    // These match the "feel" of your existing code; adjust if App.vue differs.
    const largestDiscRadius = 0.4 + 0.1 * (numDiscs - 1);
    const discThickness = 0.2;
    this.layout = {
      pillarDistance: 2 * largestDiscRadius + 0.2 > 3.2 ? 2 * largestDiscRadius + 0.2 : 3.2,
      pillarHeight: (numDiscs + 2) * discThickness >= 3.0 ? (numDiscs + 2) * discThickness : 3.0,
      pillarDiameter: 0.2,
      discThickness: discThickness,
      hoverHeight: 1.3,
    };

    this.initLights();
    this.initEnvironment();
    this.setNumDiscs(numDiscs);
  }

  /**
   * Mount renderer canvas into container and set initial size.
   * You can call resize() right after mount if you compute width/height elsewhere.
   */
  mount(container: HTMLElement): void {
    this.ensureNotDisposed();
    this.container = container;
    container.appendChild(this.renderer.domElement);
  }

  /**
   * Resize renderer & update camera.
   * (App.vue currently computes width from controllerBox.scrollWidth and height = width * 9/16)
   */
  resize(width: number, height: number): void {
    this.ensureNotDisposed();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Render one frame.
   */
  render(): void {
    this.ensureNotDisposed();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Take screenshot (forces render once if preserveDrawingBuffer is false).
   * Returns a data URL (png).
   */
  screenshot(): string {
    this.ensureNotDisposed();
    // Ensure latest frame
    this.render();
    return this.renderer.domElement.toDataURL("image/png");
  }

  /**
   * Access disc meshes for external animation logic (App.vue / engine).
   */
  getDiscs(): readonly THREE.Mesh[] {
    return this.discMeshes;
  }

  /**
   * Helper for animation: set disc position directly.
   */
  setDiscPosition(discId: number, x: number, y: number, z = 0): void {
    this.ensureNotDisposed();
    const d = this.discMeshes[discId];
    if (!d) return;
    d.position.set(x, y, z);
  }

  /**
   * Rebuild discs (geometries/materials) to match new disc count.
   * This keeps pillars/environment intact.
   */
  setNumDiscs(numDiscs: number): void {
    this.ensureNotDisposed();
    this.clearDiscs();

    const discColors = [
      0xe69f00, 0x56b4e9, 0x009e73, 0xf0e442, 0x0072b2, 0xd55e00, 0xcc79a7,
    ];

    for (let i = 0; i < numDiscs; ++i) {
      const radius = 0.4 + 0.1 * i;

      const geometry = this.discTracker.track(
        new THREE.CylinderGeometry(radius, radius, this.layout.discThickness, 32)
      );

      const material = this.discTracker.track(
        new THREE.MeshLambertMaterial({ map: this.discTexture, color: discColors[i % discColors.length] })
      );

      const d = new THREE.Mesh(geometry, material);

      // Initial placement: all on left pillar, stacked.
      d.position.x = -this.layout.pillarDistance;
      d.position.y =
        -0.5 * this.layout.pillarHeight +
        this.layout.discThickness * (numDiscs - i - 1 + 0.5);
      d.position.z = 0;

      this.scene.add(d);
      this.discMeshes.push(d);
    }
  }

  /**
   * Dispose everything (renderer + GPU resources + DOM canvas).
   * Call this from onBeforeUnmount().
   */
  dispose(): void {
    if (this.disposed) return;

    // Remove meshes from scene first
    for (const d of this.discMeshes) this.scene.remove(d);
    this.discMeshes = [];

    for (const p of this.pillarMeshes) this.scene.remove(p);
    this.pillarMeshes = [];

    if (this.skyMesh) this.scene.remove(this.skyMesh);
    if (this.groundMesh) this.scene.remove(this.groundMesh);

    // Dispose tracked resources (geometries/materials/textures)
    this.envTracker.disposeAll();
    this.discTracker.disposeAll();

    // Force WebGL context loss + renderer dispose
    try {
      this.renderer.forceContextLoss();
    } catch {
      // ignore
    }
    try {
      this.renderer.dispose();
    } catch {
      // ignore
    }

    // Remove canvas from DOM
    try {
      const canvas = this.renderer.domElement;
      canvas.remove();
    } catch {
      // ignore
    }

    this.container = null;
    this.disposed = true;
  }

  // ------------------------
  // Internal setup
  // ------------------------

  private initLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(10, 4, 10);
    this.scene.add(dir);
  }

  private initEnvironment(): void {
    // Sky (inward sphere)
    const skyGeometry = this.envTracker.track(new THREE.PlaneGeometry(5000, 5000));
    const skyMaterial = this.envTracker.track(
      new THREE.MeshBasicMaterial({ color: 0xaecbe8 })
    );
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.y = 15.0;
    sky.rotation.x = Math.PI / 2 - 0.016;
    this.scene.add(sky);

    this.skyMesh = sky;
    this.skyMaterial = skyMaterial;

    this.loadTexture(this.assetUrl("textures/skytile1.png"), (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 8);
      skyMaterial.map = tex;
      skyMaterial.color = new THREE.Color(0xffffff);
      skyMaterial.needsUpdate = true;
    });

    // Ground
    const groundGeometry = this.envTracker.track(new THREE.PlaneGeometry(5000, 2200));
    const groundMaterial = this.envTracker.track(
      new THREE.MeshLambertMaterial({ color: 0xc2c2c2 })
    );
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5 * this.layout.pillarHeight - 0.05;
    this.scene.add(ground);

    this.groundMesh = ground;
    this.groundMaterial = groundMaterial;

    this.loadTexture(
      this.assetUrl("textures/PavingStones128/PavingStones128_1K-JPG_Color.jpg"),
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2500, 1100);
        groundMaterial.map = tex;
        groundMaterial.color = new THREE.Color(0xffffff);
        groundMaterial.needsUpdate = true;
      }
    );

    // Pillars
    const pillarGeometry = this.envTracker.track(
      new THREE.CylinderGeometry(
        0.5 * this.layout.pillarDiameter,
        0.5 * this.layout.pillarDiameter,
        this.layout.pillarHeight,
        16
      )
    );

    const pillarMaterial = this.envTracker.track(
      new THREE.MeshLambertMaterial({ color: 0x41342e })
    );
    this.pillarMaterial = pillarMaterial;

    for (let i = -1; i <= 1; ++i) {
      const p = new THREE.Mesh(pillarGeometry, pillarMaterial);
      p.position.x += this.layout.pillarDistance * i;
      this.scene.add(p);
      this.pillarMeshes.push(p);
    }

    this.loadTexture(
      this.assetUrl("textures/Wood051/Wood051_1K-JPG_Color.jpg"),
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 1);
        pillarMaterial.map = tex;
        pillarMaterial.color = new THREE.Color(0xcfcfcf);
        pillarMaterial.needsUpdate = true;
      }
    );

    // Load disc surface texture asynchronously
    this.discTexturePromise = this.loadTextureAsync(
      this.assetUrl("textures/Travertine009/Travertine009_1K-JPG_Color.jpg")
    ).then((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      this.discTexture = tex;
      this.envTracker.trackTexture(tex);

      // 既に生成済みディスクにも後付け反映（重要）
      for (const d of this.discMeshes) {
        const mat = d.material as THREE.MeshLambertMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
      }

      return tex;
    }).catch(() => null);

  }

  // ------------------------
  // Disc management
  // ------------------------
  private clearDiscs(): void {
    for (const d of this.discMeshes) this.scene.remove(d);

    this.discTracker.disposeAll();
    this.discMeshes = [];
  }

  // ------------------------
  // Utility functions for texture loading
  // ------------------------
  private loadTexture(url: string, onLoad: (tex: THREE.Texture) => void): void {
    this.ensureNotDisposed();
    this.textureLoader.load(
      url,
      (tex) => {
        if (this.disposed) {
          // If loaded after dispose, immediately dispose texture to avoid leak.
          try {
            tex.dispose();
          } catch {
            // ignore
          }
          return;
        }
        this.envTracker.trackTexture(tex);
        onLoad(tex);
      },
      undefined,
      () => {
        // ignore errors (leave material without map)
      }
    );
  }

  private loadTextureAsync(url: string): Promise<THREE.Texture> {
    // NOTE: this function does NOT track texture.
    // Caller must trackTexture(tex) after resolve if needed.
    this.ensureNotDisposed();
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (tex) => {
          if (this.disposed) {
            try { tex.dispose(); } catch {}
            reject(new Error("disposed while loading texture"));
            return;
          }
          resolve(tex);
        },
        undefined,
        (err) => reject(err ?? new Error("texture load failed"))
      );
    });
  }

  // ------------------------
  // Other utilities
  // ------------------------
  private assetUrl(relPath: string): string {
    // Normalize baseUrl + relPath (relPath should not start with '/')
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}${relPath}`;
  }

  private ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error("HanoiThree: instance is already disposed.");
    }
  }

  /**
   * Very small utility used by older code paths.
   */
  static isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  }
}
