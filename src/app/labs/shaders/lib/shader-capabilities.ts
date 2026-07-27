import type { OutputColorSpace, RendererClassification } from "./shader-contract";

interface ColorSpaceContext {
  drawingBufferColorSpace?: string;
}

interface RendererIdentity {
  renderer: string;
  vendor: string;
  unmasked: boolean;
}

export function applyDrawingBufferColorSpace(
  context: object,
  requested: OutputColorSpace,
) {
  if (!("drawingBufferColorSpace" in context)) {
    return { support: "unsupported" as const, applied: null };
  }

  const colorContext = context as ColorSpaceContext;
  try {
    colorContext.drawingBufferColorSpace = requested;
    const reported = colorContext.drawingBufferColorSpace;
    const applied: OutputColorSpace | null =
      reported === "display-p3" || reported === "srgb"
        ? reported
        : null;
    return { support: "native" as const, applied };
  } catch {
    const reported = colorContext.drawingBufferColorSpace;
    const applied: OutputColorSpace | null =
      reported === "display-p3" || reported === "srgb"
        ? reported
        : null;
    return { support: "rejected" as const, applied };
  }
}

export function classifyRenderer({
  renderer,
  vendor,
  unmasked,
}: RendererIdentity): RendererClassification {
  const identity = `${vendor} ${renderer}`;
  if (/swiftshader|llvmpipe|softpipe|software rasterizer|software/i.test(identity)) {
    return "software";
  }
  if (!unmasked || /webkit webgl|webgl renderer|unknown/i.test(identity)) {
    return "unknown";
  }
  return "hardware";
}
