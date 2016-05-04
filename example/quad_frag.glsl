precision mediump float;

varying vec2 vUv;

uniform vec3 uAColor;
uniform vec3 uBColor;
uniform vec3 uCColor;
uniform vec3 uDColor;

#pragma glslify: cosPalette = require(../index.glsl)

void main() {
  gl_FragColor = vec4(cosPalette(vUv.x, uAColor, uBColor, uCColor, uDColor ), 1.0 );

}