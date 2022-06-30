import {Component} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import "./Visualize.css";


class Visualize extends Component {
    componentDidMount() {
        this.cvsWidth = window.innerWidth / 2;
        this.cvsHeight = window.innerHeight;

        this.simuRenderer = new THREE.WebGLRenderer();
        this.simuRenderer.setSize(this.cvsWidth, this.cvsHeight);
        this.twinRenderer = new THREE.WebGLRenderer();
        this.twinRenderer.setSize(this.cvsWidth, this.cvsHeight);

        this.simuContainer = document.getElementById("simuContainer");
        this.simuContainer.appendChild(this.simuRenderer.domElement);
        this.twinContainer = document.getElementById("twinContainer");
        this.twinContainer.appendChild(this.twinRenderer.domElement);

        this.simuScene = new THREE.Scene();
        this.simuScene.background = new THREE.Color(0xdcdcdc);
        this.twinScene = new THREE.Scene();
        this.twinScene.background = new THREE.Color(0xdcdcdc);

        this.simuCamera = new THREE.PerspectiveCamera(50, this.cvsWidth / this.cvsHeight);
        this.simuCameraControls = new OrbitControls(this.simuCamera, this.simuRenderer.domElement);
        this.twinCamera = new THREE.PerspectiveCamera(50, this.cvsWidth / this.cvsHeight);
        this.twinCameraControls = new OrbitControls(this.twinCamera, this.twinRenderer.domElement);

        this.robotCamera = new THREE.PerspectiveCamera(65, 1920 / 1080);
        this.robotCameraControls = new PointerLockControls(this.robotCamera, this.simuRenderer.domElement);
        this.robotCameraHelper = new THREE.CameraHelper(this.robotCamera);

        this.raycaster = new THREE.Raycaster();

        this.initSimuScene();
        this.initTwinScene();

        this.bindEvents();

        this.animate();
    }

    renderThree() {
        this.robotCameraHelper.visible = true;
        this.simuRenderer.setViewport(0, 0, this.cvsWidth, this.cvsHeight);
        this.simuRenderer.setScissor(0, 0, this.cvsWidth, this.cvsHeight);
        this.simuRenderer.render(this.simuScene, this.simuCamera);

        this.robotCameraHelper.visible = false;
        this.simuRenderer.setViewport(0, 0, 384, 216);
        this.simuRenderer.setScissor(0, 0, 384, 216);
        this.simuRenderer.render(this.simuScene, this.robotCamera);

        this.twinRenderer.render(this.twinScene, this.twinCamera);
    }

    animate() {
        const animateProxy = () => {
            requestAnimationFrame(animateProxy);

            this.simuCameraControls.update();
            this.twinCameraControls.update();

            if (this.robotCameraControls.isLocked) {
                this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
                this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
                this.direction.y = Number(this.moveUp) - Number(this.moveDown);
                this.direction.normalize();
                this.robotCameraControls.moveRight(this.direction.x);
                this.robotCameraControls.moveForward(this.direction.z);
                this.robotCameraControls.getObject().position.y += this.direction.y;
            }

            this.renderThree();
        }
        animateProxy();
    }

    onWindowResize() {
        this.cvsWidth = window.innerWidth / 2;
        this.cvsHeight = window.innerHeight;

        this.simuRenderer.setSize(this.cvsWidth, this.cvsHeight);
        this.twinRenderer.setSize(this.cvsWidth, this.cvsHeight);

        this.simuCamera.aspect = this.cvsWidth / this.cvsHeight;
        this.simuCamera.updateProjectionMatrix();
        this.twinCamera.aspect = this.cvsWidth / this.cvsHeight;
        this.twinCamera.updateProjectionMatrix();

        this.renderThree();
    }

    capture() {
        const point = this.robotCameraHelper.geometry.getAttribute("position").clone();
        point.applyMatrix4(this.robotCameraHelper.matrix);
        const quadUV = [];
        for (let i = 0; i < 4; i++) {
            const ori = new THREE.Vector3(point.getX(this.nearMap[i]),
                                          point.getY(this.nearMap[i]),
                                          point.getZ(this.nearMap[i]));
            const dir = new THREE.Vector3(point.getX(this.farMap[i]),
                                          point.getY(this.farMap[i]),
                                          point.getZ(this.farMap[i])).sub(ori).normalize();
            this.raycaster.set(ori, dir);
            const inter = this.raycaster.intersectObject(this.simuObject);
            if (inter.length > 0) {
                quadUV.push(inter[0]["uv"]);
            }
        }

        if (quadUV.length < 4) {
            alert("Incomplete camera constraints have only " + quadUV.length + " intersections.");
            return;
        }


    }

    onKeyPress(event) {
        switch (event.code) {
            case "KeyL":
                if (this.robotCameraControls.isLocked === false) {
                    this.robotCameraControls.lock();
                }
                break;
            case "Space":
                this.capture();
                break;
        }
    }

    onKeyDown(event) {
        switch (event.code) {
            case "KeyW":
                this.moveForward = true;
                break;
            case "KeyS":
                this.moveBackward = true;
                break;
            case "KeyA":
                this.moveLeft = true;
                break;
            case "KeyD":
                this.moveRight = true;
                break;
            case "KeyR":
                this.moveUp = true;
                break;
            case "KeyF":
                this.moveDown = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case "KeyW":
                this.moveForward = false;
                break;
            case "KeyS":
                this.moveBackward = false;
                break;
            case "KeyA":
                this.moveLeft = false;
                break;
            case "KeyD":
                this.moveRight = false;
                break;
            case "KeyR":
                this.moveUp = false;
                break;
            case "KeyF":
                this.moveDown = false;
                break;
        }
    }

    bindEvents() {
        window.addEventListener("resize", () => {this.onWindowResize();});
        document.addEventListener("keypress", (event) => {this.onKeyPress(event);});
        document.addEventListener("keydown", (event) => {this.onKeyDown(event);});
        document.addEventListener("keyup", (event) => {this.onKeyUp(event);});
    }

    initSimuScene() {
        this.simuRenderer.setScissorTest(true);

        this.simuCamera.position.set(450, 450, 450);

        this.robotCamera.position.set(40, 50, 90);
        this.robotCamera.lookAt(0, 50, 90);

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.direction = new THREE.Vector3();

        const scene = this.simuScene;

        this.nearMap = [];
        this.farMap = [];
        for (let i = 1; i < 5; i++) {
            this.nearMap.push(this.robotCameraHelper.pointMap["n" + i][0]);
            this.farMap.push(this.robotCameraHelper.pointMap["f" + i][0]);
        }
        scene.add(this.robotCameraHelper);

        const grid = new THREE.GridHelper(2000, 50);
        grid.material.transparent = true;
        grid.material.opacity = 0.2;
        scene.add(grid);

        const light = new THREE.DirectionalLight();
        light.position.set(100, 100, 0);
        scene.add(light);

        const loader = new OBJLoader();
        loader.load(
            "old/boeing1.obj",
            (object) => {
                object.position.set(0, 71, 0);
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material.map = new THREE.TextureLoader().load("boeing/wallhaven-v96gkp.jpg");
                    }
                });
                scene.add(object);
                this.simuObject = object;
            }
        );
    }

    initTwinScene() {
        this.twinCamera.position.set(450, 450, 450);

        const scene = this.twinScene;

        const grid = new THREE.GridHelper(2000, 50);
        grid.material.transparent = true;
        grid.material.opacity = 0.2;
        scene.add(grid);

        const light = new THREE.AmbientLight();
        light.intensity = 0.9;
        scene.add(light);

        const loader = new OBJLoader();
        loader.load(
            "old/boeing1.obj",
            (object) => {
                object.position.set(0, 71, 0);
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material.map = new THREE.TextureLoader().load("boeing/wallhaven-v96gkp.jpg");
                    }
                });
                scene.add(object);
            }
        );
    }

    render() {
        return(
            <div>
                <div id="simuContainer"></div>
                <div id="twinContainer"></div>
            </div>
        );
    }
}


export default Visualize;
