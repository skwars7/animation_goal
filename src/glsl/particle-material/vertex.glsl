uniform float time;

attribute float size;
attribute float aDelay;
attribute float aOsc;
attribute vec3 aOffset;

varying float vOsc;


void main() {
    vec3 pos = position + aOffset;
    vOsc = aOsc;

    pos.y += sin(time * 0.1 * aDelay) * (0.1 + aOsc * 0.01);
    pos.x += cos(time * 0.05 * aDelay) * (0.1 + aOsc * 0.01);


    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    gl_PointSize = size * ( 300.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;
}
