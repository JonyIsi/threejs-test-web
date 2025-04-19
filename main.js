import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

// 场景设置
const scene = new THREE.Scene();


// 创建透视摄像机
// 参数: 视野角度(FOV), 宽高比, 近裁剪面, 远裁剪面
let camera = new THREE.PerspectiveCamera(17.06, window.innerWidth / window.innerHeight, 0.1, 1000);
// 设置摄像机位置 (x, y, z)
camera.position.set(0, -15.7, 177.04);
// 设置摄像机旋转角度 (x, y, z) 单位:弧度
camera.rotation.set(0.0976, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;  // 曝光度设置
renderer.shadowMap.enabled = true;  // 启用阴影
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // 使用柔和阴影
renderer.physicallyCorrectLights = true;  // 使用物理正确的光照计算
document.body.appendChild(renderer.domElement);

// 加载环境贴图
new EXRLoader().load('peppermint-powerplant-2_2K_2776bb05-fdf5-4fa2-8ae0-bw.exr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    // 创建PMREMGenerator来处理HDR贴图
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    const renderTarget = pmremGenerator.fromEquirectangular(texture);
    const envMap = renderTarget.texture;
    
    // 应用贴图
    scene.environment = envMap;  // 保留环境反射
    // 不设置背景，保持透明
    
    // 清理
    pmremGenerator.dispose();
    texture.dispose();
});

// 创建点光源
const areaLight = new THREE.PointLight(0xFFFFFF, 200, 400, 1.5);  // 颜色, 强度, 距离, 衰减
areaLight.position.set(-60, 30, 10);

// 设置阴影参数
areaLight.castShadow = true;
areaLight.shadow.radius = 10;  // 增加阴影模糊度
areaLight.shadow.mapSize.set(8000, 8000);
areaLight.shadow.camera.near = 0.1;
areaLight.shadow.camera.far = 50;
areaLight.shadow.bias = -0.002;  // 调整阴影偏移


scene.add(areaLight);

// 创建第二个点光源（底部补光）
const bottomLight = new THREE.PointLight(0xFFFFFF, 10, 400, 1.5);  // 颜色, 强度, 距离, 衰减
bottomLight.position.set(0, -20, 0);  

// 设置阴影参数
bottomLight.castShadow = false;
bottomLight.shadow.radius = 10;  // 增加阴影模糊度
bottomLight.shadow.mapSize.set(2048, 2048);
bottomLight.shadow.camera.near = 0.1;
bottomLight.shadow.camera.far = 50;
bottomLight.shadow.bias = -0.002;  // 调整阴影偏移

scene.add(bottomLight);


// 控制器设置
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 200;  // 最小距离
controls.maxDistance = 500; // 最大距离
controls.enableZoom = false; // 禁用滚轮缩放
controls.enablePan = false; // 禁用平移

// 变量声明
let mixer = null;
let modelCamera = null;
let modelLights = [];  // 存储模型中的灯光

// 加载GLB模型
const loader = new GLTFLoader();
loader.load(
    '币静态_web.glb',
    (gltf) => {
        scene.add(gltf.scene);
        

        // 为模型中的所有物体启用阴影
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;    // 投射阴影
                child.receiveShadow = true; // 接收阴影
            }
            
            // 查找所有灯光相关的对象
            if (child.type.includes('Light') || child instanceof THREE.Light) {
                console.log('找到灯光:', {
                    name: child.name,
                    type: child.type,
                    intensity: child.intensity,
                    position: child.position,
                    rotation: child.rotation,
                    target: child.target ? {
                        position: child.target.position,
                        worldPosition: child.target.getWorldPosition(new THREE.Vector3())
                    } : 'none',
                    parent: child.parent ? child.parent.name : 'none'
                });


                // 修改灯光和阴影设置
                if (child.name === '日光001') {
                    child.intensity = 10;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.shadow.radius = 12;  // 增加阴影柔和度
                    child.shadow.normalBias = 0.02;
                    // child.shadow.normalBias = 0.05; 
                    child.shadow.mapSize.set(2048, 2048);
                    child.shadow.camera.near = 0.1;
                    child.shadow.camera.far = 50;
                    child.shadow.camera.left = -50;
                    child.shadow.camera.right = 50;
                    child.shadow.camera.top = 50;
                    child.shadow.camera.bottom = -50;
                    console.log('调整日光001强度为:', child.intensity);
                } else if (child.name === '日光002') {
                    child.intensity = 4;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.shadow.radius = 6;  // 增加阴影柔和度
                    child.shadow.normalBias = 0.02;
                    child.shadow.mapSize.set(2048, 2048);
                    child.shadow.camera.near = 0.1;
                    child.shadow.camera.far = 50;
                    child.shadow.camera.left = -50;
                    child.shadow.camera.right = 50;
                    child.shadow.camera.top = 50;
                    child.shadow.camera.bottom = -50;
                    child.color.setHex(0xFFE37B);
                    console.log('调整日光002强度为:', child.intensity);
                }
            }

            
            if (child instanceof THREE.Camera) {
                modelCamera = child;
                console.log('模型摄像机信息:', {
                    position: modelCamera.position,
                    rotation: modelCamera.rotation,
                    matrix: modelCamera.matrix,
                    fov: modelCamera.fov,
                    aspect: modelCamera.aspect,
                    near: modelCamera.near,
                    far: modelCamera.far
                });
                camera = modelCamera;
                const height = 542;
                const width = window.innerWidth;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                renderer.domElement.style.margin = 'auto';
                renderer.domElement.style.display = 'block';
                // 更新控制器的相机引用
                controls.object = camera;
                controls.update();
            }
        });

    },
    undefined,
    (error) => {
        console.error('加载模型时发生错误:', error);
    }
);

// 时钟用于动画更新
const clock = new THREE.Clock();

// 添加鼠标视差效果
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) / windowHalfX; // -1 到 1
    mouseY = (event.clientY - windowHalfY) / windowHalfY; // -1 到 1
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 平滑插值计算目标位置
    targetX += (mouseX * 0.5 - targetX) * 0.05;
    targetY += (mouseY * 0.5 - targetY) * 0.05;
    
    // 应用视差效果到相机
    camera.position.x = targetX * 40;
    camera.position.y = -targetY * 40;
    camera.lookAt(scene.position);
    
    // 更新动画
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 处理窗口大小变化
window.addEventListener('resize', () => {
    const height = 542;
    const width = window.innerWidth;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}); 