precision mediump float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;

uniform mat4 uProj;


void main() {
  gl_Position = uProj * vec4(aPosition, 0.0, 1.0);
  vUv = aUv;
}