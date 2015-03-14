var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl", {
            antialias: true,
            preserveDrawingBuffer: true
        });
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(url, type, callback) {
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        callback(null);
    }

    var req = new XMLHttpRequest();

    req.open('GET', url);

    req.onreadystatechange = function (a, b, c) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                gl.shaderSource(shader, req.responseText);
                gl.compileShader(shader);

                if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    alert(gl.getShaderInfoLog(shader));
                    callback(null);
                } else {
                    callback(shader);
                }
            } else {
                callback(null);
            }
        }
    };

    req.send();
}

var shaderProgram;

function initShaders(ready) {
    var vertexShader, fragmentShader;
    getShader('vertex.glsl', 'vertex', function(shader) {
        vertexShader = shader

        if(fragmentShader) {
            initShaderProgram(vertexShader, fragmentShader, ready)
        }
    });
    getShader('fragment.glsl', 'fragment', function(shader) {
        fragmentShader = shader;

        if(vertexShader) {
            initShaderProgram(vertexShader, fragmentShader, ready)
        }
    });
}

function initShaderProgram(vertexShader, fragmentShader, ready) {
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    initVertexBuffer();
    ready();
}

function updateUniforms() {
    var uScreenResolutionLoc = gl.getUniformLocation(shaderProgram, "uScreenResolution");
    gl.uniform2f(uScreenResolutionLoc, canvas.width, canvas.height);
    var uRealLimitsLoc = gl.getUniformLocation(shaderProgram, "uRealLimits");
    gl.uniform2f(uRealLimitsLoc, re_min, re_max);
    var uImaginaryLimitsLoc = gl.getUniformLocation(shaderProgram, "uImaginaryLimits");
    gl.uniform2f(uImaginaryLimitsLoc, im_min, im_max);
    var uNumColoursLoc = gl.getUniformLocation(shaderProgram, "uNumColours");
    gl.uniform1i(uNumColoursLoc, num_colours);
    var uWeightLoc = gl.getUniformLocation(shaderProgram, "uWeight");
    gl.uniform1f(uWeightLoc, weight);

    var uColoursLoc = gl.getUniformLocation(shaderProgram, "uColours");
    gl.uniform4fv(uColoursLoc, colours);

    var uSetColourLoc = gl.getUniformLocation(shaderProgram, "uSetColour");
    if(is_coloured) {
        gl.uniform4f(uSetColourLoc, colours[0], colours[1], colours[2], colours[3]);
    } else {
        var black = [0.0, 0.0, 0.0, 1.0];
        gl.uniform4f(uSetColourLoc, black[0], black[1], black[2], black[3]);
    }
}

var squareVertexPositionBuffer;

function initVertexBuffer() {
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    var vertices = [
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 2;
    squareVertexPositionBuffer.numItems = 4;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

var gui = new dat.GUI(),
    guiElems = {
        displaySet: function() {
            if(is_coloured == true) {
                is_coloured = false;
            } else {
            is_coloured = true;
            }
            updateUniforms();
            draw();
        },
        fullscreen: function() {
            if(is_fullscreen) {
                canvas.width = 400;
                canvas.height = 400;
                is_fullscreen = false;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                is_fullscreen = true;
            }
            resize();
            normalise();
        },
        screenshot: function() {
            var data = canvas.toDataURL("image/png");
            printDialog(
                '<p class="popupText">Click <a href="' + data + '" download="screenshot">here</a> to download the screenshot.</p>',
                removeDialog,
                false
            );
        },
        weighting: 0.5,
        numColours: 3,
        colour1: [255, 0, 0],
        colour2: [255, 255, 255],
        colour3: [0, 0, 255],
        colour4: [0, 0, 0],
        colour5: [0, 0, 0],
        colour6: [0, 0, 0],
        colour7: [0, 0, 0],
        colour8: [0, 0, 0],
        colour9: [0, 0, 0],
        colour10: [0, 0, 0]
    };

function initGUI() {
    var numColoursChoices = [];
    for(var i = 1; i <= 10; i++ ) {
        numColoursChoices.push(i);
    }
    gui.add(guiElems, 'numColours', numColoursChoices)
        .name('# of Colours')
        .onChange(function (val) {
            num_colours = val;
            updateUniforms();
            draw();
        });

    for(var i = 1; i <= guiElems.numColours; i++ ) {
        (function(i) {
            gui.addColor(guiElems, 'colour' + i)
            .name('Colour ' + i)
            .onChange(function(val) {
                colours[(i - 1) * 4] = val[0] / 255;
                colours[(i - 1) * 4 + 1] = val[1] / 255;
                colours[(i - 1) * 4 + 2]  = val[2] / 255;
                updateUniforms();
                draw();
            });
        })(i);
    }

    gui.add(guiElems, 'weighting', 0, 1)
        .name('Weighting')
        .onChange(function (val) {
            weight = val;
            updateUniforms();
            draw();
        });

    gui.add( guiElems, 'displaySet' ).name('Colour Set');
    gui.add( guiElems, 'fullscreen' ).name('Fullscreen');
    gui.add( guiElems, 'screenshot' ).name('Screenshot');
}

function resize() {
    if(is_fullscreen) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        normalise();
    }
    canvas_rect = canvas.getBoundingClientRect();

    initGL(canvas);
    initVertexBuffer();
    updateUniforms();
    draw();
}

var new_x1, new_y1, new_x2, new_y2, old_x1, old_y1, old_x2, old_y2, id1, id2, clicked = false, pinched = false;
function mouseDown(event) {
    new_x1 = old_x1 = event.pageX - canvas_rect.left;
    new_y1 = old_y1 = event.pageY - canvas_rect.top;
    clicked = true;
}

function mouseMove(event) {
    new_x1 = event.pageX - canvas_rect.left;
    new_y1 = event.pageY - canvas_rect.top;
    if(clicked) {
        var xDist = (new_x1 - old_x1) / canvas.width;
        var yDist = (new_y1 - old_y1) / canvas.height;
        doTranslate(xDist, yDist);
    }
    old_x1 = new_x1;
    old_y1 = new_y1;
}

function mouseUp(event) {
    clicked = false;
}

function mouseWheel(event) {
    var wheel = event.wheelDelta;
    zoom = Math.pow(1.001, wheel);
    var xDist = (event.pageX - canvas_rect.left) / canvas.width;
    var yDist = (event.pageY - canvas_rect.top) / canvas.height;
    doZoomTo(xDist, yDist, zoom);
}

function foxWheel(event) {
    var wheel = - event.detail * 10;
    zoom = Math.pow(1.001, wheel);
    var xDist = (event.pageX - canvas_rect.left) / canvas.width;
    var yDist = (event.pageY - canvas_rect.top) / canvas.height;
    doZoomTo(xDist, yDist, zoom);
}

function touchStart(event) {
    event.preventDefault();
    if(event.targetTouches.length === 1) {
        id1 = event.targetTouches[0].identifier;
        new_x1 = old_x1 = event.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = old_y1 = event.targetTouches[0].pageY - canvas_rect.top;
    } else if(event.targetTouches.length === 2) {
        id1 = event.targetTouches[0].identifier;
        id2 = event.targetTouches[1].identifier;
        new_x1 = old_x1 = event.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = old_y1 = event.targetTouches[0].pageY - canvas_rect.top;
        new_x2 = old_x2 = event.targetTouches[1].pageX - canvas_rect.left;
        new_y2 = old_y2 = event.targetTouches[1].pageY - canvas_rect.top;
    }
}

function touchMove(event) {
    event.preventDefault();
    if(event.targetTouches.length === 1) {
        new_x1 = event.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = event.targetTouches[0].pageY - canvas_rect.top;
        if(event.targetTouches[0].identifier === id1) {
            var xDist = (new_x1 - old_x1) / canvas.width;
            var yDist = (new_y1 - old_y1) / canvas.height;
            doTranslate(xDist, yDist);
        } else {
            id1 = event.targetTouches[0].identifier;
        }
        old_x1 = new_x1;
        old_y1 = new_y1;
    } else if(event.targetTouches.length === 2) {
        new_x1 = event.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = event.targetTouches[0].pageY - canvas_rect.top;
        new_x2 = event.targetTouches[1].pageX - canvas_rect.left;
        new_y2 = event.targetTouches[1].pageY - canvas_rect.top;
        if(event.targetTouches[0].identifier === id1 && event.targetTouches[1].identifier === id2) {
            var xPinchOld = old_x1 - old_x2;
            var yPinchOld = old_y1 - old_y2;
            var pinchOld = Math.sqrt(xPinchOld * xPinchOld + yPinchOld * yPinchOld);
            var xPinchNew = new_x1 - new_x2;
            var yPinchNew = new_y1 - new_y2;
            var pinchNew = Math.sqrt(xPinchNew * xPinchNew + yPinchNew * yPinchNew);
            var xDist = (new_x1 + new_x1) / 2 / canvas.width;
            var yDist = (new_y1 + new_y2) / 2 / canvas.height;
            doZoomTo(xDist, yDist, pinchNew / pinchOld);
        } else {
            id1 = event.targetTouches[0].identifier;
            id2 = event.targetTouches[0].identifier;
        }
        old_x1 = new_x1;
        old_y1 = new_y1;
        old_x2 = new_x2;
        old_y2 = new_y2;
    }
}

function touchEnd(event) {
    event.preventDefault();
}

var re_min, re_max, im_min, im_max, colours, num_colours, weight, is_coloured;
function initMandel() {
    re_min = -2.25;
    re_max = 0.75;
    im_min = -1.5;
    im_max = 1.5;
    colours = [
        1.0, 0.0, 0.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 0.0, 1.0
    ];
    num_colours = 3;
    weight = 0.5;
    is_coloured = false;
}

function normalise() {
    var ratio = canvas.width / canvas.height;
    var reWidth = re_max - re_min;
    var imHeight = im_max - im_min;
    var cur = reWidth / imHeight;
    var diff = ratio - cur;

    if(diff > 0.001 || diff < -0.001) {
        var im_adj = (reWidth / ratio - imHeight) / 2.0;
        im_max += im_adj;
        im_min -= im_adj;
    }

    updateUniforms();
    draw();
}

function doTranslate(xDist, yDist) {
    var reWidth = re_max - re_min;
    var imHeight = im_max - im_min;
    var reAdj = reWidth * xDist;
    var imAdj = imHeight * yDist;
    re_max -= reAdj;
    re_min -= reAdj;
    im_max += imAdj;
    im_min += imAdj;

    updateUniforms();
    draw();
}

function doZoom(zoom) {
    var reWidth = re_max - re_min;
    var imHeight = im_max - im_min;
    var x = re_min + reWidth / 2;
    var y = im_max - imHeight / 2;
    var newWidth = reWidth / zoom;
    var newHeight = imHeight / zoom;
    re_max = x + newWidth / 2;
    re_min = x - newWidth / 2;
    im_max = y + newHeight / 2;
    im_min = y - newHeight / 2;

    updateUniforms();
    draw();
}

function doZoomTo(xDist, yDist, zoom) {
    var reWidth = re_max - re_min;
    var imHeight = im_max - im_min;
    var newWidth = reWidth / zoom;
    var newHeight = imHeight / zoom;

    re_max -= (reWidth - newWidth) * (1 - xDist);
    re_min += (reWidth - newWidth) * xDist;
    im_max -= (imHeight - newHeight) * yDist;
    im_min += (imHeight - newHeight) * (1 - yDist);

    updateUniforms();
    draw();
}

var currentAction;

function printDialog( content, action, timeout ) {
    var popup = document.querySelector('.popup');
    popup.innerHTML = content;

    if(action) {
        currentAction = action;
        popup.addEventListener('click', action);
    }

    if(timeout) {
        setTimeout( removeDialog, timeout );
    }

    var popupWrap = document.querySelector('.popupWrap');
    popupWrap.className = 'popupWrap';
}

function removeDialog() {
    var popup = document.querySelector('.popup');
    popup.removeEventListener('click', currentAction);

    var popupWrap = document.querySelector('.popupWrap');
    popupWrap.className = 'popupWrap hidden';
}

setTimeout(removeDialog, 5000);

var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener("mousedown", mouseDown);
canvas.addEventListener("mousemove", mouseMove);
canvas.addEventListener("mouseup", mouseUp);
canvas.addEventListener('mousewheel', function(event){
    mouseWheel(event);
    event.preventDefault();
}, false);
canvas.addEventListener("DOMMouseScroll", function(event){
    foxWheel(event);
    event.preventDefault();
}, false);
canvas.addEventListener("touchstart", touchStart);
canvas.addEventListener("touchend", touchEnd);
canvas.addEventListener("touchleave", touchEnd);
canvas.addEventListener("touchmove", touchMove);

initGUI();
initGL(canvas);
initMandel();
initShaders(normalise);

var is_fullscreen = true;
var canvas_rect = canvas.getBoundingClientRect();

gl.clearColor(0.0, 0.0, 0.0, 1.0);

window.addEventListener('resize', resize);