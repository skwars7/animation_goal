#define S smoothstep

varying vec3 vColor;
varying float vDist;
varying float vLight;
varying float vProgress;

uniform float maxDist;
uniform vec3 bg;

void main() {
    vec3 color = vColor;
    color += vLight;

    float progress = S(.1, -0.1, vProgress * vProgress);
    float alpha = S(0.8, .0, pow(vDist / maxDist, 3.));

    color = mix(color, bg, 1. - alpha);

    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(color, vProgress);
}
