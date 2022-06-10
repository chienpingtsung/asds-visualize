import {Component} from "react";
import * as THREE from "three";

class Visualize extends Component {
    componentDidMount() {
        this.initScene();
    }

    initScene() {
        const container = document.getElementById("container");

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera();

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        animate();
    }

    render() {
        return(
            <div>
                <div id="container"></div>
            </div>
        );
    }
}

export default Visualize;
