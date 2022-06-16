import {Component} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {load} from "three/examples/jsm/libs/opentype.module";
import {FirstPersonControls} from "three/examples/jsm/controls/FirstPersonControls";
import Stats from "three/examples/jsm/libs/stats.module";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls";

class Visualize extends Component {
    componentDidMount() {
        this.initScene();
    }

    initScene() {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        const container = document.getElementById("container");
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xeeeeee);

        const sceneCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
        sceneCamera.position.set(-10.8, 10.6, 2.7);

        const robotCamera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 200);
        robotCamera.position.set(3, 2, 3);
        const robotCamHelper = new THREE.CameraHelper(robotCamera);
        scene.add(robotCamHelper);

        function render() {
            renderer.setViewport(
                Math.floor(window.innerWidth*0),
                Math.floor(window.innerHeight*0),
                Math.floor(window.innerWidth*1),
                Math.floor(window.innerHeight*1)
            );
            renderer.setScissor(
                Math.floor(window.innerWidth*0),
                Math.floor(window.innerHeight*0),
                Math.floor(window.innerWidth*1),
                Math.floor(window.innerHeight*1)
            );
            renderer.setScissorTest(true);
            renderer.render(scene, sceneCamera);

            renderer.setViewport(
                Math.floor(window.innerWidth*0),
                Math.floor(window.innerHeight*0),
                Math.floor(window.innerWidth*0.3),
                Math.floor(window.innerHeight*0.3)
            );
            renderer.setScissor(
                Math.floor(window.innerWidth*0),
                Math.floor(window.innerHeight*0),
                Math.floor(window.innerWidth*0.3),
                Math.floor(window.innerHeight*0.3)
            );
            renderer.setScissorTest(true);
            renderer.render(scene, robotCamera);
        }

        const sceneCamControls = new OrbitControls(sceneCamera, renderer.domElement);
        const clock = new THREE.Clock();
        let stats = new Stats();
        container.appendChild(stats.dom);

        const robotCamControls = new PointerLockControls(robotCamera, renderer.domElement);
        const onKeyPress = (event) => {
            switch (event.code) {
                case 'KeyL':
                    if (robotCamControls.isLocked === false) {
                        robotCamControls.lock();
                    }
                    break;
            }
        }
        document.addEventListener('keypress', onKeyPress);
        let moveForward = false;
        let moveBackward = false;
        let moveLeft = false;
        let moveRight = false;
        let moveUp = false;
        let moveDown = false;
        const direction = new THREE.Vector3();
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'KeyW':
                    moveForward = true;
                    break;
                case 'KeyA':
                    moveLeft = true;
                    break;
                case 'KeyS':
                    moveBackward = true;
                    break;
                case 'KeyD':
                    moveRight = true;
                    break
                case 'KeyR':
                    moveUp = true;
                    break
                case 'KeyF':
                    moveDown = true;
                    break
            }
        }
        const onKeyUp = (event) => {
            switch (event.code) {
                case 'KeyW':
                    moveForward = false;
                    break;
                case 'KeyA':
                    moveLeft = false;
                    break;
                case 'KeyS':
                    moveBackward = false;
                    break;
                case 'KeyD':
                    moveRight = false;
                    break
                case 'KeyR':
                    moveUp = false;
                    break
                case 'KeyF':
                    moveDown = false;
                    break
            }
        }
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        const grid = new THREE.GridHelper(100, 50, 0x444444, 0x888888);
        grid.material.opacity = 0.2;
        grid.material.depthWrite = false;
        grid.material.transparent = true;
        scene.add(grid);

        const light = new THREE.PointLight(0xffffff, 1);
        light.position.set( -20, 10, 30);
        scene.add(light);

        const loader = new GLTFLoader().setPath('boeing/');
        loader.load('boeing-737-300-plane-1.gltf', (gltf) => {
            const texture = new THREE.TextureLoader().load('boeing/wallhaven-v96gkp.jpg', (texture) => {
                texture.encoding = THREE.sRGBEncoding;
                texture.flipY = false;
                texture.needsUpdate = true;
                const material = new THREE.MeshLambertMaterial({map: texture});
                gltf.scene.children[0].material = material;
                gltf.scene.children[0].material.needsUpdate = true;
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissive = child.material.color;
                        child.material.emissiveMap = child.material.map;
                    }
                });
            });
            scene.add(gltf.scene);
            render();
        });



        function animate() {
            requestAnimationFrame(animate);
            sceneCamControls.update();

            if (robotCamControls.isLocked) {
                direction.z = Number(moveForward) - Number(moveBackward);
                direction.x = Number(moveRight) - Number(moveLeft);
                direction.y = Number(moveUp) - Number(moveDown);
                direction.normalize();

                robotCamControls.moveRight(direction.x * 0.1);
                robotCamControls.moveForward(direction.z * 0.1);
                robotCamControls.getObject().position.y += direction.y * 0.1;
            }

            render();
            stats.update();
        }

        animate();

        function onWindowResize() {
            sceneCamera.aspect = window.innerWidth / window.innerHeight;
            sceneCamera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            render();
        }

        window.addEventListener('resize', onWindowResize);

        let changeFocus = true;

        function onDocumentMouseDown(event) {
            changeFocus = false;
        }
        function onDocumentMouseUp(event) {
            changeFocus = true;
        }

        document.addEventListener('mousedown', onDocumentMouseDown);
        document.addEventListener('mouseup', onDocumentMouseUp);
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
