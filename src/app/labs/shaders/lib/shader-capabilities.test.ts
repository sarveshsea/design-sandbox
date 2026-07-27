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
    const nativeUnknown = Object.defineProperty(
      {},
      "drawingBufferColorSpace",
      {
        configurable: true,
        get: () => "rec2020",
        set: () => undefined,
      },
    );
    const rejected = Object.defineProperty({}, "drawingBufferColorSpace", {
      configurable: true,
      get: () => "srgb",
      set: () => {
        throw new TypeError("unsupported");
      },
    });
    const rejectedUnknown = Object.defineProperty(
      {},
      "drawingBufferColorSpace",
      {
        configurable: true,
        get: () => "rec2020",
        set: () => {
          throw new TypeError("unsupported");
        },
      },
    );

    expect(applyDrawingBufferColorSpace(native, "display-p3")).toEqual({
      support: "native",
      applied: "display-p3",
    });
    expect(applyDrawingBufferColorSpace(nativeUnknown, "display-p3")).toEqual({
      support: "native",
      applied: null,
    });
    expect(applyDrawingBufferColorSpace(rejected, "display-p3")).toEqual({
      support: "rejected",
      applied: "srgb",
    });
    expect(
      applyDrawingBufferColorSpace(rejectedUnknown, "display-p3"),
    ).toEqual({
      support: "rejected",
      applied: null,
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
        renderer: "Unknown GPU",
        vendor: "Google Inc.",
        unmasked: true,
      }),
    ).toBe("unknown");
    expect(
      classifyRenderer({
        renderer: "ANGLE Metal Renderer: Apple M3 Pro",
        vendor: "Google Inc. (Apple)",
        unmasked: true,
      }),
    ).toBe("hardware");
  });
});
