// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var THREE = require('three');
var STLLoader = require('three-stl-loader')(THREE)
var OrbitControls = require('three-orbit-controls')(THREE)

var MeshLine = require( 'three.meshline' );
var TrackballControls = require('three-trackballcontrols')


//var CSG = require('threeCSG.es6')

//var ColladaLoader = require('three-collada-loader');
window.THREE = THREE;
var ColladaLoader = require('three/examples/js/loaders/ColladaLoader.js');
//var <script src="../node_modules/three/examples/js/loaders/ColladaLoader.js"></script>

var app = require('electron').remote;
var dialog = app.dialog;




//
// document.getElementById('business').onchange = function () {
//   alert('Selected file: ' + this.value);
// };

var scene, camera, renderer;
var geometry, material, mesh, boxMesh;

var stlMesh = null;
var stlGeom = null;
var polyhedronMesh = null;
var polyGeom = null;

var slicerPlane = null;
var controls;

var meshCurves = [];
var showFields = false;

var leftCoil = null;
var rightCoil = null;
var plasticBox = null;

var showLeftCoil = false;
var showRightCoil = false;
var showPlasticBox = false;
var showStl = true;
var showPoly = true;


var stlWireframe = false;

//var spinScene = false;

var renderer = null;

init();


var slider = document.getElementById("slice-slider");
slider.addEventListener("input", function(e) {

    let val = .2*slider.value;
    slicerPlane.position.z = val ;

    exports.sliceMesh(val);
    render();
});

document.getElementById('stl-open').addEventListener('click', _ => {
    dialog.showOpenDialog((fileNames) => {
        // fileNames is an array that contains all the selected
        if(fileNames === undefined){
            alert("No file selected");
            return;
        }

        var loader = new STLLoader();

        loader.load(fileNames[0], function (geometry) {

            scene.remove(stlMesh);

            stlGeom = geometry;

            var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200, side: THREE.DoubleSide } );
            stlMesh = new THREE.Mesh( geometry, material );

            var bbox = new THREE.Box3();
            bbox.setFromObject(stlMesh);
            var dist = bbox.max.sub(bbox.min);
            var maxDim = Math.max(dist.x, dist.y, dist.z);
            var desiredSize = .1;
            var scale = desiredSize / maxDim;

            stlMesh.position.set( 0, 0, 0 );
            //stlMesh.rotation.set( 0, - Math.PI / 2, 0 );
            //stlMesh.scale.set( scale, scale, scale );
            stlGeom.attributes.position.array.forEach(function(g,i) { stlGeom.attributes.position.array[i] = g*scale;})

            stlMesh.castShadow = true;
            stlMesh.receiveShadow = true;

            scene.add( stlMesh );
            render();
        })

    });
})

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

exports.toggleStl = function toggleStl() {
	showStl = !showStl;
	stlMesh.visible = showStl;
	render();
}

exports.toggleStlWireframe = function toggleStlWireframe() {
	stlWireframe = !stlWireframe;
	stlMesh.material.wireframe = stlWireframe;
	render();
}

exports.toggleShowPoly = function toggleShowPoly() {
	showPoly = !showPoly;
	polyhedronMesh.visible = showPoly;
	render();
}

exports.sliceMesh = function sliceMesh (zpos) {

  // first, turn on the slider
  slider.style.visibility = 'visible';

    var mesh = stlMesh ? stlMesh : polyhedronMesh;
    var geom = stlGeom ? stlGeom : polyGeom;
    var pos = geom.getAttribute('position');
    var vertCt = pos.count;
    var triCt = vertCt / 3;

    if (!slicerPlane) {
        var geometry = new THREE.PlaneGeometry( .2, .2, 2 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity:.2} );
        slicerPlane = new THREE.Mesh( geometry, material );

        // how to control position
        slicerPlane.rotation.z += Math.PI/4;
        slicerPlane.position.z += zpos;
        scene.add( slicerPlane );
        render();
    }

    // go thru triangles
    // if a vertex has z above plane and another below, reorder to front
    var isectTriCt = 0;
    for (var itri = 0; itri < pos.count; itri += 3) {
        var v1z = pos.getZ(itri),
            v2z = pos.getZ(itri + 1),
            v3z = pos.getZ(itri + 2);

        if ( !((v1z > zpos && v2z > zpos && v3z > zpos) ||
               (v1z < zpos && v2z < zpos && v3z < zpos)) ) {

            console.log('swapping tri ' + isectTriCt + ' at idx ' + isectTriCt * 3 + 'with tri ' + itri + ' at idx ' + itri*3);
            swapTriangles(pos, isectTriCt*3*3, itri*3);
            isectTriCt ++;
        }
    }

    geom.attributes.position.needsUpdate = true;
    geom.setDrawRange(0, isectTriCt*3);
    render();

}

function swapTriangles(pts, idx0, idx1) {

    var pos = pts.array;
    var tmp0 = pos.slice(idx0, idx0+9);
    var tmp1 = pos.slice(idx1, idx1+9);
    pos.set(tmp1, idx0);
    // pos.copyWithin(idx0, idx1, 3); // not working?
    pos.set(tmp0, idx1);
}


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

	controls.update();
}


function initPoly() {

    var mesh = new THREE.Object3D();
    var geom = new THREE.DodecahedronBufferGeometry(.1, 0);
    polyGeom = geom;

	mesh.add( new THREE.LineSegments(

		geom,
		new THREE.LineBasicMaterial( {
			color: 0xffffff,
			transparent: true,
			opacity: 0.5
		} )
	) );

	mesh.add( new THREE.Mesh(

		geom,
		new THREE.MeshPhongMaterial( {
			color: 0x156289,
			emissive: 0x072534,
			side: THREE.DoubleSide,
			flatShading: true
		} )
	) );

    scene.add( mesh );
    return mesh;
}


var dae,
    loader = new THREE.ColladaLoader();

function loadLeftCoil( collada ) {
    var cfg = {
        pos: {x: 0, y:0.25, z:0},
        rot: {x: 0, y:0, z:Math.PI/2},
        scl: {x: 1, y:1, z:1}
    };
    return loadCoil(collada, cfg, true, showLeftCoil);
}

function loadRightCoil( collada ) {

    var cfg = {
        pos: {x: .25, y:0, z:0},
        rot: {x: 0, y:0, z:0},
        scl: {x: 1, y:1, z:1}
    };
    return loadCoil(collada, cfg, false, showRightCoil);
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
    plasticBox.visible = showPlasticBox;
    scene.add(dae);
    render();
}

// cfg {
//	pos: {x:, y:, z:},
//	rot: {x:, y:, z:},
//  scl: {x:, y:, z:}
//	}
function loadCoil (collada, cfg, isLeftCoil, visible) {

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

    group.visible = visible;
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




function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 3, window.innerWidth / window.innerHeight, .1, 200 );
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

    controls = new TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 5.0;
    controls.zoomSpeed = 3.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;
    controls.minDistance = 0.2;
    controls.maxDistance = 100;


    /////////////////////////////////////////
    // Lighting
    /////////////////////////////////////////

    var lightGrey  = '#FAFAFA',
        ambientLight  = new THREE.AmbientLight( '#EEEEEE' ),
        hemiLight     = new THREE.HemisphereLight( lightGrey, lightGrey, 0 ),
        light         = new THREE.PointLight( lightGrey, 1, 100 );

    hemiLight.position.set( 0, 50, 0 );
    light.position.set( 0, 20, 10 );

    scene.add( ambientLight );
    scene.add( hemiLight );
    scene.add( light );



    var axisHelper = new THREE.AxesHelper( 1 );
    scene.add( axisHelper );

    polyhedronMesh = initPoly();


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



render();
