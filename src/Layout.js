export default class Layout {
  constructor() {
    this.onResize();

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      this.onResize();
    });
    window.addEventListener(
      "wheel",
      (e) => {
        this.onScroll(e);
      },
      { passive: false }
    );
  }

  onResize() {
    this.isMobile = window.matchMedia("(max-width: 767px)").matches;

    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.PR = Math.min(window.devicePixelRatio, 2 || 1);
  }

  onScroll(e) {
    e.preventDefault();
  }
}
