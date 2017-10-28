// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE)
var OrbitControls = require('three-orbit-controls')(THREE)

var scene, camera, renderer;
var geometry, material, mesh;

init();


function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 100;

    controls = new OrbitControls(camera);
    controls.addEventListener( 'change', render );
    //geometry = new THREE.BoxGeometry( 200, 200, 200 );
    //material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

    //mesh = new THREE.Mesh( geometry, material );
    //scene.add( mesh );

    var loader = new STLLoader()

    loader.load('../stl/Body1.stl', function (geometry) {
      var material = new THREE.MeshNormalMaterial()
      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      //animate();
      render();
    })


    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

}

// who calls this?
function render(gl, width, height) {
    renderer.render( scene, camera );
}

function animate() {

    requestAnimationFrame( animate );

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    renderer.render( scene, camera );

}
