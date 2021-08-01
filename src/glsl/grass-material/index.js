import { ShaderMaterial, Clock, Vector3 } from "three";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

export default class CustomShaderMaterial extends ShaderMaterial {
  constructor(options) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true
    });

    this.clock = new Clock();
    this.sphere = options.sphereRef;
    this.spherePos = new Vector3();
    this.sphere.getWorldPosition(this.spherePos);

    this.uniforms = {
      time: { value: 0 },
      off: { value: 0 },
      bg: { value: options.background },
      maxDist: { value: options.maxDist },
      height: { value: options.height },
      spherePos: { value: this.spherePos },
      wave: { value: 0 }
    };
  }

  update() {
    this.sphere.getWorldPosition(this.spherePos);

    this.uniforms.time.value = this.clock.getElapsedTime();
    this.uniforms.off.value += 0.03;
  }
}
