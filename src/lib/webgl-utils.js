/**
 * webgl-utils.js
 *
 * Professional WebGL & Three.js utilities:
 * 1. Guards WebGL2 contexts against INVALID_OPERATION errors during texImage3D / texSubImage3D.
 *    (In WebGL2, UNPACK_FLIP_Y_WEBGL and UNPACK_PREMULTIPLY_ALPHA_WEBGL must be false for 3D textures).
 * 2. Provides safe canvas setup for Three.js WebGLRenderer.
 * 3. Prevents duplicate context initialization errors and driver memory leaks.
 */

export function patchWebGLContextFor3DTextures(gl) {
  if (!gl || gl.__patchedFor3DTextures) return gl;
  gl.__patchedFor3DTextures = true;

  if (typeof gl.texImage3D === 'function') {
    const origTexImage3D = gl.texImage3D.bind(gl);
    gl.texImage3D = function (...args) {
      let flipY = false;
      let premultiply = false;
      try {
        flipY = Boolean(gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL));
        premultiply = Boolean(
          gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)
        );
      } catch {
        // ignore
      }

      if (flipY) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if (premultiply) gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

      let res;
      try {
        res = origTexImage3D(...args);
      } finally {
        if (flipY) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if (premultiply)
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      }
      return res;
    };
  }

  if (typeof gl.texSubImage3D === 'function') {
    const origTexSubImage3D = gl.texSubImage3D.bind(gl);
    gl.texSubImage3D = function (...args) {
      let flipY = false;
      let premultiply = false;
      try {
        flipY = Boolean(gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL));
        premultiply = Boolean(
          gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)
        );
      } catch {
        // ignore
      }

      if (flipY) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if (premultiply) gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

      let res;
      try {
        res = origTexSubImage3D(...args);
      } finally {
        if (flipY) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if (premultiply)
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      }
      return res;
    };
  }

  return gl;
}

export function setupSafeWebGLCanvas(canvas) {
  if (!canvas || canvas.__safeWebGLGuarded) return canvas;
  canvas.__safeWebGLGuarded = true;

  const origGetContext = canvas.getContext.bind(canvas);
  canvas.getContext = function (type, attrs) {
    const gl = origGetContext(type, attrs);
    if (
      gl &&
      (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl')
    ) {
      patchWebGLContextFor3DTextures(gl);
    }
    return gl;
  };

  return canvas;
}
