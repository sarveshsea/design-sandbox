import { describe, expect, it } from "vitest";

import {
  applyDrawingBufferColorSpace,
  classifyRenderer,
} from "./shader-capabilities";

describe("shader capability evidence", () => {
  it("does not synthesize a drawingBufferColorSpace property when unsupported", () => {
    const context = {};

    expect(applyDrawingBufferColorSpace(context, "display-p3")).toEqual({
      support: "unsupported",
      applied: null,
    });
    expect(context).not.toHaveProperty("drawingBufferColorSpace");
  });

  it("reports native, rejected, and effective color-space states separately", () => {
    const native = { drawingBufferColorSpace: "srgb" };
    const rejected = Object.defineProperty({}, "drawingBufferColorSpace", {
      configurable: true,
      get: () => "srgb",
      set: () => {
        throw new TypeError("unsupported");
      },
    });

    expect(applyDrawingBufferColorSpace(native, "display-p3")).toEqual({
      support: "native",
      applied: "display-p3",
    });
    expect(applyDrawingBufferColorSpace(rejected, "display-p3")).toEqual({
      support: "rejected",
      applied: "srgb",
    });
  });

  it("requires positive unmasked evidence before classifying hardware", () => {
    expect(
      classifyRenderer({
        renderer: "WebKit WebGL",
        vendor: "WebKit",
        unmasked: false,
      }),
    ).toBe("unknown");
    expect(
      classifyRenderer({
        renderer: "ANGLE Vulkan SwiftShader",
        vendor: "Google Inc.",
        unmasked: true,
      }),
    ).toBe("software");
    expect(
      classifyRenderer({
        renderer: "ANGLE Metal Renderer: Apple M3 Pro",
        vendor: "Google Inc. (Apple)",
        unmasked: true,
      }),
    ).toBe("hardware");
  });
});
