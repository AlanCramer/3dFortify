// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE)
var OrbitControls = require('three-orbit-controls')(THREE)

var MeshLine = require( 'three.meshline' );
var TrackballControls = require('three-trackballcontrols')

//var ColladaLoader = require('three-collada-loader');
window.THREE = THREE;
var ColladaLoader = require('../node_modules/three/examples/js/loaders/ColladaLoader.js');
//var <script src="../node_modules/three/examples/js/loaders/ColladaLoader.js"></script>


var app = require('electron').remote;
var dialog = app.dialog;

document.getElementById('stl-open').addEventListener('click', _ => {
    dialog.showOpenDialog((fileNames) => {
        // fileNames is an array that contains all the selected
        if(fileNames === undefined){
            alert("No file selected");
            return;
        }

        var loader = new STLLoader();

        loader.load(fileNames[0], function (geometry) {
            var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );
            var mesh = new THREE.Mesh( geometry, material );

            mesh.position.set( 0, 0, 0 );
            mesh.rotation.set( 0, - Math.PI / 2, 0 );
            mesh.scale.set( 0.005, 0.005, 0.005 );

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            scene.add( mesh );
            render();
        })

    });
})
//
// document.getElementById('business').onchange = function () {
//   alert('Selected file: ' + this.value);
// };

var scene, camera, renderer;
var geometry, material, mesh, boxMesh;

var controls;

var meshCurves = [];
var showFields = false;

var leftCoil = null;
var rightCoil = null;
var plasticBox = null;

var showLeftCoil = true;
var showRightCoil = true;
var showPlasticBox = true;

//var spinScene = false;

var renderer = null;

initNew();


/////////////////////////////////////////
// Render Loop
/////////////////////////////////////////

function render() {
	renderer.render( scene, camera );
}

exports.THREE = THREE;
exports.toggleShowFields =  function toggleShowFields() {
	showFields = !showFields;
	meshCurves.map(function(c) {
		c.visible = showFields;
	});
	render();
}

exports.toggleLeftCoil = function toggleLeftCoil() {
	showLeftCoil = !showLeftCoil;
	leftCoil.visible = showLeftCoil;
	render();
}

exports.toggleRightCoil = function toggleRightCoil() {
	showRightCoil = !showRightCoil;
	rightCoil.visible = showRightCoil;
	render();
}

exports.togglePlasticBox = function togglePlasticBox() {
	showPlasticBox = !showPlasticBox;
	plasticBox.visible = showPlasticBox;
	render();
}

// exports.toggleSpinScene = function toggleSpinScene() {
// 	spinScene = !spinScene;
//     render();
// }

// Avoid constantly rendering the scene by only
// updating the controls every requestAnimationFrame
function animationLoop() {
	requestAnimationFrame(animationLoop);

	if (showFields) {
		meshCurves.map(function(c) {

			c.rotation.z += .01;
		});
		render();
	}

    // if (spinScene) {
    //     var timer = Date.now() * 0.0005;
    //
    //     var pos = camera.position;
    //     var dist = Math.sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
    //
    //     camera.position.x = Math.cos( timer ) * dist;
    //     camera.position.y = Math.sin( timer ) * dist;
    //
    //     camera.lookAt( scene.position );
    //
    //     render();
    // }

	controls.update();
}

var dae,
    loader = new THREE.ColladaLoader();

function loadLeftCoil( collada ) {
    var cfg = {
        pos: {x: 0, y:0.25, z:0},
        rot: {x: 0, y:0, z:Math.PI/2},
        scl: {x: 1, y:1, z:1}
    };
    return loadCoil(collada, cfg, true);
}

function loadRightCoil( collada ) {

    var cfg = {
        pos: {x: .25, y:0, z:0},
        rot: {x: 0, y:0, z:0},
        scl: {x: 1, y:1, z:1}
    };
    return loadCoil(collada, cfg, false);
}

function loadPlasticBox( collada ) {

    dae = collada.scene;

//  dae.rotation.z += 3.14/2;
    dae.scale.x = .1;
    dae.scale.y = .1;
    dae.scale.z = .25;

    dae.rotation.x += 3.14/2;
    dae.position.set(-4.2, -3.1, -.2);

    // override some materials to make it transparent
    dae.children[0].children[1].material[1].transparent = true;
    dae.children[0].children[1].material[1].opacity = .3;
    dae.children[0].children[1].material[0].opacity = .3

    plasticBox = dae;
    scene.add(dae);
    render();
}

// cfg {
//	pos: {x:, y:, z:},
//	rot: {x:, y:, z:},
//  scl: {x:, y:, z:}
//	}
function loadCoil (collada, cfg, isLeftCoil) {

    dae = collada.scene;
    dae.scale.x = .1;
    dae.scale.y = .1;
    dae.scale.z = .1;

    var d = .25;
    var numlines = 8;
    var newcurves = [];
    for (var iline = 0; iline < numlines; ++iline) {

        var t = iline * 2*Math.PI/numlines;
        var ypos = d*Math.cos(t);
        var zpos = d*Math.sin(t);
        meshCurve = createMeshCurve({
            pos: {x:0, y:ypos, z:zpos},
            r: .2,
            rot: {x:t, y:0, z:0}
        });
        newcurves.push(meshCurve);
    }

    for (var iline = 0; iline < numlines; ++iline) {

        var d2 = 2*d;
        var t = iline * 2*Math.PI/numlines;
        var ypos = d2*Math.cos(t);
        var zpos = d2*Math.sin(t);
        meshCurve = createMeshCurve({
            pos: {x:0, y:ypos, z:zpos},
            r: .2*2.2,
            rot: {x:t, y:0, z:0}
        });
        newcurves.push(meshCurve);
    }

    var group = new THREE.Group();
    group.add( dae );
    newcurves.forEach(function(c) {
        group.add(c);
    })

    var pos = cfg.pos;
    var rot = cfg.rot;
    var scl = cfg.scl;

    group.rotation.x += rot.x;
    group.rotation.y += rot.y;
    group.rotation.z += rot.z;

    group.position.set(pos.x, pos.y, pos.z);

    group.scale.x = scl.x;
    group.scale.y = scl.y;
    group.scale.z = scl.z;

    if (isLeftCoil) {
        leftCoil = group;
    }
    else {
        rightCoil = group;
    }
    scene.add( group );

    render();
    return group;
}


/////////////////////////////////////////
// Window Resizing
/////////////////////////////////////////

window.addEventListener( 'resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
    render();
}, false );



// cfg = { pos: {x:1, y:1, z:1},
//         r: 1,
//		   rot: {x:, y:, z:} }
function createMeshCurve(cfg) {
	var geometry = new THREE.Geometry();

	var rad = cfg.r;
	var pos = cfg.pos;
	var rot = cfg.rot;

	for( var j = 0; j < 2*Math.PI; j += 2 * Math.PI / 100 ) {
		var v = new THREE.Vector3( rad* Math.cos( j ), rad*Math.sin( j ), 0 );
		geometry.vertices.push( v );
	}

	var line = new MeshLine.MeshLine();
	line.setGeometry( geometry, function(d) { return .03 + .02*Math.sin(50 * d); } );

	var material = new MeshLine.MeshLineMaterial({sizeAttenuation: 0});
	var mesh = new THREE.Mesh( line.geometry, material );

	mesh.position.x += pos.x;
	mesh.position.y += pos.y;
	mesh.position.z += pos.z;

	mesh.rotation.x += rot.x;
	mesh.rotation.y += rot.y;
	mesh.rotation.z += rot.z;

	mesh.name = 'field-line';
	mesh.visible = showFields;
	meshCurves.push(mesh);

	return mesh;
}


function initNew() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 5, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set(-6, -6, 4);
    camera.up.y = 0;
    camera.up.z = 1;
    camera.lookAt( scene.position );

    renderer = new THREE.WebGLRenderer({
     	alpha: true,
        antialias: true
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x333344, 1 );

    document.body.appendChild( renderer.domElement );


    /////////////////////////////////////////
    // Trackball Controller
    /////////////////////////////////////////

    controls = new TrackballControls( camera );
    controls.rotateSpeed = 5.0;
    controls.zoomSpeed = 3.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;


    /////////////////////////////////////////
    // Lighting
    /////////////////////////////////////////

    var iphone_color  = '#FAFAFA',
        ambientLight  = new THREE.AmbientLight( '#EEEEEE' ),
        hemiLight     = new THREE.HemisphereLight( iphone_color, iphone_color, 0 ),
        light         = new THREE.PointLight( iphone_color, 1, 100 );

    hemiLight.position.set( 0, 50, 0 );
    light.position.set( 0, 20, 10 );

    scene.add( ambientLight );
    scene.add( hemiLight );
    scene.add( light );


    /////////////////////////////////////////
    // Utilities
    /////////////////////////////////////////

    var axisHelper = new THREE.AxesHelper( 1 );
    scene.add( axisHelper );


    // Render the scene when the controls have changed.
    // If you don’t have other animations or changes in your scene,
    // you won’t be draining system resources every frame to render a scene.
    controls.addEventListener( 'change', render );


    }

animationLoop();




/////////////////////////////////////////
// Object Loader
/////////////////////////////////////////



//loader.options.convertUpAxis = true;
loader.load( '../collada/toroidal-Inductor.dae', loadLeftCoil);
loader.load( '../collada/toroidal-Inductor.dae', loadRightCoil);

loader.load( '../collada/skp-simple-plastic-box/model.dae', loadPlasticBox);

//var curve = createCurve();
//scene.add(curve);


render();



function initOld() {

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

// function render(gl, width, height) {
//     renderer.render( scene, camera );
// }
//
// function animate() {
//
//     requestAnimationFrame( animate );
//
//     mesh.rotation.x += 0.01;
//     mesh.rotation.y += 0.02;
//
//     renderer.render( scene, camera );
// }
