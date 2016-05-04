/* global requestAnimationFrame */

var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var glslify = require('glslify')
var createOrbitCamera = require('orbit-camera');
var shell = require("gl-now")();
var createGui = require("pnp-gui");
var cameraPosFromViewMatrix = require('gl-camera-pos-from-view-matrix');
var randomArray = require('random-array');
var createSphere = require('primitive-icosphere');
var copyToClipboard = require('copy-to-clipboard');

var sphereShader, quadShader, quadGeo, sphereGeo;

var camera = createOrbitCamera([0, -2.0, 0], [0, 0, 0], [0, 1, 0]);

var mouseLeftDownPrev = false;

var bg = [0.6, 0.7, 1.0]; // clear color.

var aColor = [0.2, 0.7, 0.4];
var bColor = [0.6, 0.9, 0.2];
var cColor = [0.6, 0.8, 0.7];
var dColor = [0.5, 0.1, 0.0];

var noiseScale = {val: 1.0};
var seed = 100;

// arguments are top-left and bottom-right corners
function createQuad(tl, br) {
    var positions = [];
    var uvs = [];

    positions.push( [tl[0], tl[1] ] );
    positions.push( [ br[0],  tl[1] ] );
    positions.push( [ tl[0] ,  br[1] ] );
    positions.push([ br[0], br[1] ] );

    uvs.push( [0,0 ] );// top-left
    uvs.push( [1,0 ] );// bottom-left
    uvs.push( [0,1 ] );// top-right
    uvs.push( [1,1 ] );// bottom-right

    var cells = [];
    cells.push( [2,1,0] );

    cells.push( [1,2,3] );

    return {positions: positions, cells:cells, uvs:uvs};
}

shell.on("gl-init", function () {
    var gl = shell.gl

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK)
    
    gui = new createGui(gl);
    gui.windowSizes = [300, 380];

    var sphere = createSphere(1, { subdivisions: 2});
    sphereGeo = Geometry(gl)
        .attr('aPosition', sphere.positions).faces(sphere.cells);

    var quad = createQuad(  [400, 40], [880, 100] );
    quadGeo = Geometry(gl).
    attr('aPosition', quad.positions, {size:2} ).
    attr('aUv', quad.uvs, {size:2} ).faces(quad.cells, {size:3});

    sphereShader = glShader(gl, glslify("./sphere_vert.glsl"), glslify("./sphere_frag.glsl"));
    quadShader = glShader(gl, glslify("./quad_vert.glsl"), glslify("./quad_frag.glsl"));


    // fix intial camera view.
    camera.rotate([0,0], [0,0] );
});


function randomizeColor() {
    aColor = randomArray(0, 1).oned(3);
    bColor = randomArray(0, 1).oned(3);
    cColor = randomArray(0, 1).oned(3);
    dColor = randomArray(0, 1).oned(3);
}

function blackColor() {
    aColor = [0,0,0];
    bColor =[0,0,0];
    cColor = [0,0,0];
    dColor = [0,0,0];
}

function colorToStr(c) {
    return "vec3(" +  [ c[0].toFixed(2),c[1].toFixed(2),c[2].toFixed(2) ].join() + ")";
}

function paletteToStr() {
    return "cosPalette(t," +  [colorToStr(aColor),colorToStr(bColor),colorToStr(cColor),colorToStr(dColor)].join()+   ")";
}

function newSeed() {
    seed = randomArray(0.0, 100.0).oned(1)[0];
}

shell.on("gl-render", function (t) {
    var gl = shell.gl
    var canvas = shell.canvas;

    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var projection = mat4.create();
    var scratchMat = mat4.create();
    var view = camera.view(scratchMat);

    mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 10000.0);

    /*
    Render Sphere
     */

    sphereShader.bind();

    sphereShader.uniforms.uView = view;
    sphereShader.uniforms.uProjection = projection;
    sphereShader.uniforms.uAColor = aColor;
    sphereShader.uniforms.uBColor = bColor;
    sphereShader.uniforms.uCColor = cColor;
    sphereShader.uniforms.uDColor = dColor;
    sphereShader.uniforms.uNoiseScale = noiseScale.val;
    sphereShader.uniforms.uSeed = seed;
    
    sphereGeo.bind(sphereShader);
    sphereGeo.draw();

    /*
    Render Palette.
     */

    quadShader.bind();
    quadShader.uniforms.uAColor = aColor;
    quadShader.uniforms.uBColor = bColor;
    quadShader.uniforms.uCColor = cColor;
    quadShader.uniforms.uDColor = dColor;

    var projection = mat4.create()
    mat4.ortho(projection, 0,  canvas.width, canvas.height, 0, -1.0, 1.0)
    quadGeo.bind(quadShader);
    quadShader.uniforms.uProj = projection;
    quadGeo.draw();


    /*
    Render GUI.
     */

    var pressed = shell.wasDown("mouse-left");
    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePositionCur: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    gui.begin(io, "Window");

    gui.textLine("a + b*cos(2pi*(c*t+d))");

    gui.draggerRgb("a", aColor);
    gui.draggerRgb("b", bColor);
    gui.draggerRgb("c", cColor);
    gui.draggerRgb("d", dColor);

    if(gui.button("Randomize")) {
        randomizeColor();
    }

    if(gui.button("To Black")) {
        blackColor();
    }

    if(gui.button("Copy to Clipboard")) {
        copyToClipboard(paletteToStr() );
    }


    gui.separator();

    gui.textLine("Noise Settings");


    gui.sliderFloat("Scale", noiseScale, 0.1, 10.0);

    if(gui.button("New Seed")) {
        newSeed();
    }

    gui.end(gl, canvas.width, canvas.height);
});

shell.on("tick", function () {

    // if interacting with the GUI, do not let the mouse control the camera.
    if (gui.hasMouseFocus())
        return;

    if (shell.wasDown("mouse-left")) {
        var speed = 1.3;
        camera.rotate([(shell.mouseX / shell.width - 0.5) * speed, (shell.mouseY / shell.height - 0.5) * speed],
            [(shell.prevMouseX / shell.width - 0.5) * speed, (shell.prevMouseY / shell.height - 0.5) * speed])
    }
    if (shell.scroll[1]) {
        camera.zoom(shell.scroll[1] * 0.01);
    }
});
