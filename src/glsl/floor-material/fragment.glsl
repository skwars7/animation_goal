#define S smoothstep
uniform vec3 bg;
uniform vec2 spherePos;

varying vec2 vUv;

void main() {
    vec3 col = vec3(0);
    float l = length(vUv - spherePos);
    float c = S(0.5 / 7., 0., l);

    col = (bg + (bg * 0.3));

    c *= S(0.5, 0.4, length(vUv - 0.5));

    if (c <= 0.01) discard;

    gl_FragColor = vec4(col, c);
}
