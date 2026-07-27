# Shader lab source and license policy

The `/labs/shaders` implementation is an original composition built from
standard rendering and image-processing concepts.

- external shader code copied: no
- external media copied: no
- external product partnership implied: no
- procedural scene and Canvas fallback authored for this repository: yes

## Learning and specification sources

- [The Book of Shaders](https://thebookofshaders.com/) provides learning
  material for coordinate systems, uniforms, procedural fields, and shader
  debugging. No source from the book is embedded.
- [Khronos WebGL registry](https://registry.khronos.org/webgl/) defines WebGL
  behavior and extensions used by the capability and timing evidence.
- [W3C WGSL](https://www.w3.org/TR/WGSL/) informs the documented future adapter.
  The current implementation is WebGL2 and GLSL ES 3.
- [xxHash](https://github.com/Cyan4973/xxHash) is the origin of the public
  32-bit prime constants used by the seeded spatial-noise mixer. Its BSD
  2-Clause attribution is reproduced in `NOTICE`.

The 4×4 Bayer threshold matrix and Rec. 709 luminance weights are standard
mathematical and color-science definitions. The repository does not claim
ownership of those definitions.

## Evidence boundary

- A seeded spatial-noise sample is deterministic for fixed pixel coordinates
  and seed.
- An animated frame is time-dependent and is never labeled deterministic.
- A static frame fixes shader time at zero and may be repeat-checked.
- `EXT_disjoint_timer_query_webgl2` evidence is labeled GPU draw-pass duration,
  not full-frame or presentation time.
- Request-animation-frame intervals are labeled animation-frame cadence.
- Display P3 is assessed only when the native drawing-buffer property exists,
  accepts the request, and reports it as the effective color space.
- Color accuracy and power consumption stay unassessed without calibrated or
  instrumented evidence.
