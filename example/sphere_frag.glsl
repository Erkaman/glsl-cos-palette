precision mediump float;

varying vec3 vPosition;

uniform vec3 uAColor;
uniform vec3 uBColor;
uniform vec3 uCColor;
uniform vec3 uDColor;
uniform float uNoiseScale;
uniform float uSeed;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: cosPalette = require(../index.glsl)

float noise(vec3 s) {
    return snoise3(s) * 0.5 + 0.5; // scale to range [0,1]
}

float fbm( vec3 p) {
	float f = 0.0;
    f += 0.5000*noise( p ); p = p*2.02;
    f += 0.2500*noise( p ); p = p*2.03;
    f += 0.1250*noise( p ); p = p*2.01;
    f += 0.0625*noise( p );
    return f/0.9375;
}

void main() {
    float t = fbm(uNoiseScale*(vPosition + uSeed ) );

    vec3 tex = cosPalette(t, uAColor, uBColor, uCColor, uDColor );

    gl_FragColor = vec4(tex, 1.0);
}
