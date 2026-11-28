import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, part, vector } from './geometry';
import { grained } from './materials';

const hash = (n: number) => {
  const value = Math.sin(n * 127.1 + 18.23) * 43758.5453;
  return value - Math.floor(value);
};

export function softShadow(parent: T.Object3D, x: number, y: number, z: number, width: number, depth: number, opacity = .62) {
  const { context, texture } = canvasTexture(128, 128);
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 63);
  gradient.addColorStop(0, '#000');
  gradient.addColorStop(.42, '#000a');
  gradient.addColorStop(1, '#0000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const shadow = part(parent, new T.PlaneGeometry(width, depth), new T.MeshBasicMaterial({
    map: texture, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3,
  }), x, y, z);
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}

export function createCoast() {
  const coast = new T.Group();
  const stone = grained({ color: 0x28343a, roughness: .39, metalness: .16, clearcoat: .42 }, 41, .42);
  const forms: T.BufferGeometry[] = [];
  for (let i = 0; i < 51; i++) {
    const x = (hash(i * 4) - .61) * 30;
    const z = (hash(i * 4 + 1) - .66) * 30;
    if (Math.hypot(x, z) < 2.8) continue;
    const scale = .35 + hash(i * 4 + 2) ** 2 * 2.5;
    const geometry = new T.IcosahedronGeometry(1, 7);
    const point = geometry.getAttribute('position');
    for (let k = 0; k < point.count; k++) {
      const px = point.getX(k), py = point.getY(k), pz = point.getZ(k);
      const relief = .94 + .13 * Math.sin(px * 12 + i) * Math.cos(py * 11 + pz * 6)
        + .11 * Math.sin(pz * 26 + px * 8) * Math.cos(px * 16 + py * 3);
      point.setXYZ(k, px * relief, py * relief, pz * relief);
    }
    geometry.computeVertexNormals();
    geometry.scale(scale * 1.47, scale * .39, scale * .87);
    geometry.rotateY(hash(i * 4 + 3) * Math.PI);
    geometry.translate(x, -1.44 + scale * .12, z);
    forms.push(geometry);
  }
  part(coast, mergeGeometries(forms), stone);
  forms.forEach(geometry => geometry.dispose());
  const platform = part(coast, new T.IcosahedronGeometry(1, 17), stone, 0, -1.48, .06);
  platform.scale.set(2.46, .36, 1.72);
  platform.rotation.y = -.3;
  const peaks = new T.Group();
  coast.add(peaks);
  for (let i = 0; i < 7; i++) {
    const ridge = part(peaks, new T.IcosahedronGeometry(1, 2), stone, -12 - i * 1.4, -.9, -6 - i * 4.4);
    ridge.scale.set(5.1 + i * .12, 3.7 + .32 * i, 4.3);
    ridge.rotation.y = .55 + i * .16;
  }

  const surface = new T.PlaneGeometry(96, 96, 135, 135);
  surface.rotateX(-Math.PI / 2);
  const water = new T.ShaderMaterial({
    uniforms: { travel: { value: 0 } },
    vertexShader: `
      uniform float travel;
      varying vec3 world;
      void main() {
        vec3 p = position;
        float phase = p.z * 2.1 + sin(p.x * .67 + travel * 4.0) * .71;
        p.y += sin(phase + travel * 36.0) * .077 + sin(p.x * 2.5 + p.z * 4.0 - travel * 53.0) * .028;
        world = (modelMatrix * vec4(p, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }`,
    fragmentShader: `
      uniform float travel;
      varying vec3 world;
      float ripples(vec2 p) {
        return sin(p.y * 2.2 + sin(p.x * .77 + travel*2.6) * 1.1 + travel*30.0)
          + sin(p.x * 3.9 + p.y * 4.6 - travel*44.0)*.38
          + sin(p.x * 14.1 + p.y * 17.8 + travel*12.0)*.14;
      }
      void main() {
        float h = ripples(world.xz);
        vec3 normal = normalize(vec3(dFdx(h) * .65, .38, dFdy(h) * .65));
        vec3 eye = normalize(cameraPosition - world);
        float glint = pow(max(dot(reflect(-eye, normal), normalize(vec3(.38,.66,-.54))),0.0),6.0);
        float foam = smoothstep(1.24, 1.49, h) * (0.45 + 0.5*sin(world.x*3.6 + world.z*.65));
        float haze = smoothstep(5.0, 23.0, length(cameraPosition - world));
        vec3 water = mix(vec3(.025,.057,.073), vec3(.16,.25,.29), clamp(h*.2+.25,0.0,1.0));
        water += vec3(.98,.83,.68) * glint * .48 + vec3(.64,.79,.83) * foam;
        water = mix(water, vec3(.30,.35,.40), haze*.78);
        gl_FragColor = vec4(water,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  part(coast, surface, water, 0, -1.263, 0);
  softShadow(coast, 0, -1.112, 0, 3.9, 2.4, .64);
  return { coast, water };
}

export function createStudio() {
  const studio = new T.Group();
  const reflector = new Reflector(new T.PlaneGeometry(150, 125), {
    color: 0x2d3032, textureWidth: 640, textureHeight: 400, multisample: 0,
    shader: {
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 reflectionUv;
        varying vec3 world;
        void main() {
          world = (modelMatrix * vec4(position, 1.0)).xyz;
          reflectionUv = textureMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec4 reflectionUv;
        varying vec3 world;
        void main() {
          vec2 uv = reflectionUv.xy / reflectionUv.w;
          float distanceToCamera = length(world - cameraPosition);
          vec3 reflection = (texture2D(tDiffuse, uv).rgb * .4
            + texture2D(tDiffuse, uv + vec2(.003, .004)).rgb * .3
            + texture2D(tDiffuse, uv - vec2(.003, .004)).rgb * .3);
          float reflectivity = (1.0 - smoothstep(5.0, 19.0, distanceToCamera)) * .27;
          float grain = fract(sin(dot(floor(world.xz * 132.0), vec2(63.6,42.7))) * 43758.55);
          vec3 graphite = vec3(.037,.042,.045) * (.97 + grain * .06);
          gl_FragColor = vec4(graphite + reflection * reflectivity, 1.0 - smoothstep(10.0, 42.0, distanceToCamera));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  const reflectiveSurface = reflector.material as T.ShaderMaterial;
  reflectiveSurface.transparent = true;
  reflectiveSurface.depthWrite = false;
  reflector.renderOrder = -2;
  reflector.position.set(13, -1.22, 0);
  reflector.rotation.x = -Math.PI / 2;
  studio.add(reflector);

  const glows = new T.Group();
  studio.add(glows);
  for (const [x, y, z, angle, intensity] of [[-3, 2.8, -6.7, -.56, .44], [3, .6, -7.6, -.35, .33], [26, 3.3, -6.4, -.55, .20]]) {
    const { context, texture } = canvasTexture(56, 384);
    context.save();
    context.scale(.15, 1);
    const stretch = context.createRadialGradient(187, 192, 0, 187, 192, 190);
    stretch.addColorStop(0, '#f8844f');
    stretch.addColorStop(.52, '#813e2586');
    stretch.addColorStop(1, '#42241800');
    context.fillStyle = stretch;
    context.fillRect(0, 0, 380, 384);
    context.restore();
    const glow = part(glows, new T.PlaneGeometry(1.65, 11), new T.MeshBasicMaterial({
      map: texture, transparent: true, opacity: intensity, blending: T.AdditiveBlending, depthWrite: false,
    }), x, y, z);
    glow.rotation.z = angle;
  }

  const caseShadow = softShadow(studio, 0, -1.211, 0, 4.6, 3.2, .82);
  const neckShadow = softShadow(studio, 12.4, -1.21, 0, 30, 3.6, .36);
  const phoneShadow = softShadow(studio, 27.8, -1.211, 0, 6.1, 4.4, .42);
  return { studio, reflector, caseShadow, neckShadow, phoneShadow };
}

export function studioEnvironment(renderer: T.WebGLRenderer) {
  const room = new T.Scene();
  room.background = new T.Color(0x20242a);
  for (const [x, y, z, width, height, power, color] of [
    [-6, 6, 4, 6.6, 9, 8.2, 0xffeee1],
    [5.5, 4, -5, 1.45, 9.1, 12.8, 0xff985e],
    [0, 8.6, 0, 8, 3, 6, 0xf3f8ff],
    [5, 2, 5, 1.7, 7, 3.9, 0xd3e4f7],
    [-5, 1, -4, 2.3, 7.2, 2.7, 0xcddbec],
  ]) {
    const card = part(room, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({
      color: new T.Color(color).multiplyScalar(power),
      toneMapped: false,
    }), x, y, z);
    card.lookAt(vector(0, .3, 0));
  }
  const factory = new T.PMREMGenerator(renderer);
  const environment = factory.fromScene(room, .025, .1, 20, { size: 128 });
  factory.dispose();
  room.traverse(object => {
    if (object instanceof T.Mesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
  return environment;
}
