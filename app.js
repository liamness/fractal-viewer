'use strict';

var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext('webgl', {
            antialias: true,
            preserveDrawingBuffer: true
        });
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert('Could not initialise WebGL, sorry :-(');
    }
}

function getShader(url, type, callback) {
    var shader;
    if (type == 'fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == 'vertex') {
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
        alert('Could not initialise shaders');
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    initVertexBuffer();
    ready();
}

function updateUniforms() {
    var uScreenResolutionLoc = gl.getUniformLocation(shaderProgram, 'uScreenResolution');
    gl.uniform2f(uScreenResolutionLoc, canvas.width, canvas.height);
    var uRealLimitsLoc = gl.getUniformLocation(shaderProgram, 'uRealLimits');
    gl.uniform2f(uRealLimitsLoc, re_min, re_max);
    var uImaginaryLimitsLoc = gl.getUniformLocation(shaderProgram, 'uImaginaryLimits');
    gl.uniform2f(uImaginaryLimitsLoc, im_min, im_max);
    var uNumColoursLoc = gl.getUniformLocation(shaderProgram, 'uNumColours');
    gl.uniform1i(uNumColoursLoc, num_colours);
    var uWeightLoc = gl.getUniformLocation(shaderProgram, 'uWeight');
    gl.uniform1f(uWeightLoc, weight);

    var uColoursLoc = gl.getUniformLocation(shaderProgram, 'uColours');
    gl.uniform4fv(uColoursLoc, colours);

    var uSetColourLoc = gl.getUniformLocation(shaderProgram, 'uSetColour');
    if(is_coloured) {
        gl.uniform4f(uSetColourLoc, colours[0], colours[1], colours[2], colours[3]);
    } else {
        var black = [0.0, 0.0, 0.0, 1.0];
        gl.uniform4f(uSetColourLoc, black[0], black[1], black[2], black[3]);
    }
}

var squareVertexPositionBuffer;
function initVertexBuffer() {
    var vertices = new Float32Array([
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0
    ]);

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 2;
    squareVertexPositionBuffer.numItems = 4;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

function draw() {
    requestAnimationFrame(function() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    })
}

var gui = new dat.GUI();
gui.close();

var guiElems = {
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
        var data = canvas.toDataURL('image/png');
        printDialog('<p>Click <a href="' + data + '" download="screenshot">here</a> to download the screenshot.</p>');
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

    for(var i = 1; i <= 10; i++ ) {
        (function(i) {
            gui.addColor(guiElems, 'colour' + i)
            .name('Colour ' + i)
            .onChange(function(val) {
                // fix because dat.gui likes to return strings sometimes
                if(typeof val === 'string') {
                    val = [
                        parseInt(val.substr(1, 2), 16),
                        parseInt(val.substr(3, 2), 16),
                        parseInt(val.substr(5, 2), 16)
                    ];
                }

                colours[(i - 1) * 4] = val[0] / 255;
                colours[(i - 1) * 4 + 1] = val[1] / 255;
                colours[(i - 1) * 4 + 2] = val[2] / 255;
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

    gui.add(guiElems, 'displaySet').name('Colour Set');
    gui.add(guiElems, 'fullscreen').name('Fullscreen');
    gui.add(guiElems, 'screenshot').name('Screenshot');
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
function mouseDown(e) {
    new_x1 = old_x1 = e.pageX - canvas_rect.left;
    new_y1 = old_y1 = e.pageY - canvas_rect.top;
    clicked = true;
}

function mouseMove(e) {
    new_x1 = e.pageX - canvas_rect.left;
    new_y1 = e.pageY - canvas_rect.top;

    if(clicked) {
        var xDist = (new_x1 - old_x1) / canvas.width,
            yDist = (new_y1 - old_y1) / canvas.height;
        doTranslate(xDist, yDist);
    }

    old_x1 = new_x1;
    old_y1 = new_y1;
}

function mouseUp() {
    clicked = false;
}

function wheel(e) {
    e.preventDefault();

    var wheelDelta = (e.deltaMode === 0 ? e.deltaY : e.deltaY * 20),
        xDist = (e.pageX - canvas_rect.left) / canvas.width,
        yDist = (e.pageY - canvas_rect.top) / canvas.height,
        zoom = Math.pow(1.001, wheelDelta);

    doZoomTo(xDist, yDist, zoom);
}

function touchStart(e) {
    e.preventDefault();

    if(e.targetTouches.length === 1) {
        id1 = e.targetTouches[0].identifier;
        new_x1 = old_x1 = e.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = old_y1 = e.targetTouches[0].pageY - canvas_rect.top;
    } else if(e.targetTouches.length === 2) {
        id1 = e.targetTouches[0].identifier;
        id2 = e.targetTouches[1].identifier;
        new_x1 = old_x1 = e.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = old_y1 = e.targetTouches[0].pageY - canvas_rect.top;
        new_x2 = old_x2 = e.targetTouches[1].pageX - canvas_rect.left;
        new_y2 = old_y2 = e.targetTouches[1].pageY - canvas_rect.top;
    }
}

function touchMove(e) {
    e.preventDefault();

    if(e.targetTouches.length === 1) {
        new_x1 = e.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = e.targetTouches[0].pageY - canvas_rect.top;

        if(e.targetTouches[0].identifier === id1) {
            var xDist = (new_x1 - old_x1) / canvas.width,
                yDist = (new_y1 - old_y1) / canvas.height;

            doTranslate(xDist, yDist);
        } else {
            id1 = e.targetTouches[0].identifier;
        }

        old_x1 = new_x1;
        old_y1 = new_y1;
    } else if(e.targetTouches.length === 2) {
        new_x1 = e.targetTouches[0].pageX - canvas_rect.left;
        new_y1 = e.targetTouches[0].pageY - canvas_rect.top;
        new_x2 = e.targetTouches[1].pageX - canvas_rect.left;
        new_y2 = e.targetTouches[1].pageY - canvas_rect.top;

        if(e.targetTouches[0].identifier === id1 && e.targetTouches[1].identifier === id2) {
            var xPinchOld = old_x1 - old_x2,
                yPinchOld = old_y1 - old_y2,
                pinchOld = Math.sqrt(xPinchOld * xPinchOld + yPinchOld * yPinchOld),
                xPinchNew = new_x1 - new_x2,
                yPinchNew = new_y1 - new_y2,
                pinchNew = Math.sqrt(xPinchNew * xPinchNew + yPinchNew * yPinchNew),
                xDist = (new_x1 + new_x1) / 2 / canvas.width,
                yDist = (new_y1 + new_y2) / 2 / canvas.height;

            doZoomTo(xDist, yDist, pinchNew / pinchOld);
        } else {
            id1 = e.targetTouches[0].identifier;
            id2 = e.targetTouches[0].identifier;
        }

        old_x1 = new_x1;
        old_y1 = new_y1;
        old_x2 = new_x2;
        old_y2 = new_y2;
    }
}

function touchEnd(e) {
    e.preventDefault();
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
    var ratio = canvas.width / canvas.height,
        reWidth = re_max - re_min,
        imHeight = im_max - im_min,
        cur = reWidth / imHeight,
        diff = ratio - cur;

    if(diff !== 0) {
        var im_adj = (reWidth / ratio - imHeight) / 2.0;
        im_max += im_adj;
        im_min -= im_adj;

        updateUniforms();
        draw();
    }
}

function doTranslate(xDist, yDist) {
    var reWidth = re_max - re_min,
        imHeight = im_max - im_min,
        reAdj = reWidth * xDist,
        imAdj = imHeight * yDist;

    re_max -= reAdj;
    re_min -= reAdj;
    im_max += imAdj;
    im_min += imAdj;

    updateUniforms();
    draw();
}

function doZoom(zoom) {
    var reWidth = re_max - re_min,
        imHeight = im_max - im_min,
        x = re_min + reWidth / 2,
        y = im_max - imHeight / 2,
        newWidth = reWidth / zoom,
        newHeight = imHeight / zoom;

    re_max = x + newWidth / 2;
    re_min = x - newWidth / 2;
    im_max = y + newHeight / 2;
    im_min = y - newHeight / 2;

    updateUniforms();
    draw();
}

function doZoomTo(xDist, yDist, zoom) {
    var reWidth = re_max - re_min,
        imHeight = im_max - im_min,
        newWidth = reWidth / zoom,
        newHeight = imHeight / zoom;

    re_max -= (reWidth - newWidth) * (1 - xDist);
    re_min += (reWidth - newWidth) * xDist;
    im_max -= (imHeight - newHeight) * yDist;
    im_min += (imHeight - newHeight) * (1 - yDist);

    updateUniforms();
    draw();
}

var popup = document.querySelector('.popup'),
    popupWrap = document.querySelector('.popup-wrap'),
    currentAction, currentTimeout;

popupWrap.addEventListener('click', function(e) {
    if(e.target === popupWrap) { removeDialog(); }
});

window.addEventListener('keyup', function(e) {
    if(e.keyCode === '27') { removeDialog(); }
});

function printDialog( content, action, timeout ) {
    popup.innerHTML = content;

    if(action) {
        currentAction = action;
        popup.addEventListener('click', action);
    }

    if(timeout) { currentTimeout = setTimeout( removeDialog, timeout ); }

    document.body.classList.add('popup-active');
}

function removeDialog() {
    document.body.classList.remove('popup-active');
    popup.removeEventListener('click', currentAction);
    clearTimeout(currentTimeout);
}

currentTimeout = setTimeout(removeDialog, 20000);

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mouseup', mouseUp);
canvas.addEventListener('wheel', wheel);
canvas.addEventListener('touchstart', touchStart);
canvas.addEventListener('touchend', touchEnd);
canvas.addEventListener('touchleave', touchEnd);
canvas.addEventListener('touchmove', touchMove);

initGUI();
initGL(canvas);
initMandel();
initShaders(normalise);

var is_fullscreen = true;
var canvas_rect = canvas.getBoundingClientRect();

gl.clearColor(0.0, 0.0, 0.0, 1.0);

window.addEventListener('resize', resize);
