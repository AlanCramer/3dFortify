// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE)
var OrbitControls = require('three-orbit-controls')(THREE)

var scene, camera, renderer;
var geometry, material, mesh, boxMesh;

init();

function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 100;

    controls = new OrbitControls(camera);
    controls.addEventListener( 'change', render );

    var loader = new STLLoader();

    loader.load('../stl/Body1.stl', function (geometry) {

        var textureLoader = new THREE.TextureLoader();
        textureLoader.load('../textures/pressureTreatedWood.jpg', function(texture) {

            var material = new THREE.MeshStandardMaterial({map: texture});
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            var boxGeometry = new THREE.BoxGeometry(20, 20, 20);

            boxMesh = new THREE.Mesh(boxGeometry, material);
            scene.add(boxMesh);

            render();
        });
    })

    var lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set(-100, -200, -100);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    renderer = new THREE.WebGLRenderer();
    var windowScale = .7;
    renderer.setSize( window.innerWidth * windowScale, window.innerHeight * windowScale);
    renderer.setClearColor(0xffffff, 1);

    document.body.appendChild( renderer.domElement );
}

function render(gl, width, height) {
    renderer.render( scene, camera );
}

function animate() {

    requestAnimationFrame( animate );

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    renderer.render( scene, camera );
}
