import "./styles.css";
import Scene from "./Scene";
import Layout from "./Layout";

const initApp = () => {
  window.layout = new Layout();
  window.scene = new Scene();
};

if (
  document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  initApp();
} else {
  document.addEventListener("DOMContentLoaded", initApp);
}
