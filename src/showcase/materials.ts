import * as T from 'three';
import { canvasTexture } from './geometry';

const microSurface = `
float surfaceHash(vec3 p) {
  p = fract(p * .3183099 + vec3(.17, .41, .73));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float surfaceNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 v = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(surfaceHash(i), surfaceHash(i+vec3(1,0,0)), v.x),
        mix(surfaceHash(i+vec3(0,1,0)), surfaceHash(i+vec3(1,1,0)), v.x), v.y),
    mix(mix(surfaceHash(i+vec3(0,0,1)), surfaceHash(i+vec3(1,0,1)), v.x),
        mix(surfaceHash(i+vec3(0,1,1)), surfaceHash(i+vec3(1,1,1)), v.x), v.y), v.z
  );
}
`;

export function grained(
  options: T.MeshPhysicalMaterialParameters,
  density: number,
  depth: number,
  direction = 1,
) {
  const material = new T.MeshPhysicalMaterial(options);
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vSurfacePoint;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePoint = position;',
    );
    shader.fragmentShader = 'varying vec3 vSurfacePoint;\n' + microSurface + shader.fragmentShader
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        vec3 grainPoint = vSurfacePoint * vec3(${(density / direction).toFixed(3)}, ${density.toFixed(3)}, ${density.toFixed(3)});
        float footprint = max(length(dFdx(grainPoint)), length(dFdy(grainPoint)));
        float grain = (surfaceNoise(grainPoint) - .5) * (1.0 - smoothstep(.85, 3.3, footprint));
        roughnessFactor = clamp(roughnessFactor + grain * ${(depth * 3.1).toFixed(3)}, .09, 1.0);
        diffuseColor.rgb *= 1.0 + grain * ${depth.toFixed(3)};
      `);
  };
  material.customProgramCacheKey = () => `surface:${density}:${depth}:${direction}`;
  return material;
}

export function radialBrush() {
  const { context, texture } = canvasTexture(512, 512);
  const size = 512;
  const pixels = context.createImageData(size, size);
  for (let i = 0; i < pixels.data.length / 4; i++) {
    const dx = i % size - size / 2;
    const dy = Math.floor(i / size) - size / 2;
    const angle = Math.atan2(dy, dx);
    const radius = Math.hypot(dx, dy);
    const highlight = Math.cos(angle - .85);
    const lobe = .55 + .45 * Math.cos(angle * 2 - 1.7);
    const brushing = Math.sin(radius * 2.35) * 2.5 + Math.sin(angle * 701) * 4 + Math.sin(angle * 318) * 2;
    const shade = 128 + 88 * lobe ** 1.55 + 26 * highlight + brushing;
    pixels.data.set([shade, shade, shade * .989, 255], i * 4);
  }
  context.putImageData(pixels, 0, 0);
  return texture;
}

export function atmosphere() {
  const uniforms = {
    zenith: { value: new T.Color(0x0b1014) },
    horizon: { value: new T.Color(0x546470) },
    glow: { value: new T.Color(0xff6d48) },
    strength: { value: .42 },
  };
  const material = new T.ShaderMaterial({
    uniforms, side: T.BackSide, depthWrite: false,
    vertexShader: `
      varying vec3 vWorldDirection;
      void main() {
        vWorldDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 zenith, horizon, glow;
      uniform float strength;
      varying vec3 vWorldDirection;
      void main() {
        vec3 ray = normalize(vWorldDirection);
        float haze = exp(-5.5 * abs(ray.y + .055));
        float backlight = pow(max(0.0, dot(ray, normalize(vec3(-.35,.13,-.95)))), 19.0);
        gl_FragColor = vec4(mix(zenith, horizon, haze * .77) + glow * backlight * strength, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new T.Mesh(new T.SphereGeometry(95, 28, 16), material);
  sky.frustumCulled = false;
  sky.renderOrder = -20;
  return { sky, uniforms };
}
