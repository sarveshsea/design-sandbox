import { SEEDED_NOISE_HASH } from "./shader-contract";

export const FULLSCREEN_VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 v_uv;

const vec2 POSITIONS[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

void main() {
  vec2 position = POSITIONS[gl_VertexID];
  v_uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const DITHER_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 out_color;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_ripple;
uniform float u_distortion;
uniform int u_mode;
uniform uint u_seed;

const float BAYER[16] = float[16](
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

uint mix_bits(uint value) {
  value ^= value >> ${SEEDED_NOISE_HASH.firstShift};
  value *= ${SEEDED_NOISE_HASH.firstMixMultiplier}u;
  value ^= value >> ${SEEDED_NOISE_HASH.secondShift};
  value *= ${SEEDED_NOISE_HASH.secondMixMultiplier}u;
  return value ^ (value >> ${SEEDED_NOISE_HASH.finalShift});
}

float seeded_noise(ivec2 pixel) {
  uint packed = uint(pixel.x) * ${SEEDED_NOISE_HASH.xMultiplier}u;
  packed ^= uint(pixel.y) * ${SEEDED_NOISE_HASH.yMultiplier}u;
  packed ^= u_seed * ${SEEDED_NOISE_HASH.seedMultiplier}u;
  return float(mix_bits(packed)) / ${SEEDED_NOISE_HASH.divisor}.0;
}

float ordered_threshold(ivec2 pixel) {
  int x = pixel.x - (pixel.x / 4) * 4;
  int y = pixel.y - (pixel.y / 4) * 4;
  return BAYER[y * 4 + x] / 16.0;
}

vec3 procedural_field(vec2 uv) {
  vec2 center = uv - 0.5;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float radius = length(vec2(center.x * aspect, center.y));
  float ripple = sin(radius * 42.0 - u_time * 2.4);
  vec2 direction = radius > 0.0001 ? center / radius : vec2(0.0);
  vec2 warped = uv + direction * ripple * 0.018 * u_ripple;
  warped.x += sin((warped.y + u_time * 0.08) * 18.0) * 0.025 * u_distortion;
  warped.y += cos((warped.x - u_time * 0.06) * 14.0) * 0.018 * u_distortion;

  float bands = 0.5 + 0.5 * sin((warped.x * 1.25 + warped.y) * 11.0);
  float rings = 0.5 + 0.5 * cos(length(warped - 0.5) * 31.0);
  float pulse = 0.5 + 0.5 * sin((warped.x - warped.y) * 9.0 + u_time * 0.35);

  return vec3(
    0.09 + bands * 0.72,
    0.12 + rings * 0.68,
    0.18 + pulse * 0.72
  );
}

void main() {
  vec3 field = procedural_field(v_uv);

  if (u_mode == 0) {
    out_color = vec4(field, 1.0);
    return;
  }

  float luminance = dot(field, vec3(0.2126, 0.7152, 0.0722));
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  float threshold = u_mode == 1
    ? ordered_threshold(pixel)
    : seeded_noise(pixel);
  float bit = step(threshold, luminance);
  vec3 ink = vec3(0.055, 0.065, 0.08);
  vec3 paper = vec3(0.91, 0.93, 0.89);
  vec3 accent = vec3(0.42, 0.58, 0.72);
  vec3 dithered = mix(ink, paper, bit);
  dithered = mix(dithered, accent, (1.0 - bit) * field.b * 0.16);

  out_color = vec4(dithered, 1.0);
}
`;
