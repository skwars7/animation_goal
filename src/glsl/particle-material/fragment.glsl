#define S smoothstep
uniform vec3 bg;
uniform vec3 color;
uniform float time;

varying float vOsc;

void main() {
    float l = 0.1 / length(gl_PointCoord - 0.5);

    float t = sin(time + vOsc * 30. ) * 0.5 + 0.5;
    l -= t;

    float c = S(0.5, 1., l);

    if (c <= 0.001) discard;

    gl_FragColor = vec4(color, c);
}
