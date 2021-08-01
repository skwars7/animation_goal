varying vec2 vUv;

void main() { 
    vec4 pos = vec4(position, 1.);
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * pos;
}
