// JavaScript source code

//stolen i mean adapted from https://github.com/xdsopl/webgl/blob/master/cubemap.html
var skyboxVsSource = `
            attribute vec2 attribute_vertex_position;
        uniform vec3 uniform_camera_up;
        uniform vec3 uniform_camera_right;
        uniform vec3 uniform_camera_dir;
        uniform float uniform_camera_near;
        uniform float uniform_camera_far;

        varying vec3 varying_pixel_position;
        void main()
        {
        gl_Position = vec4(attribute_vertex_position, 0.0, 1.0);
        varying_pixel_position =
        attribute_vertex_position[0] * uniform_camera_right +
        attribute_vertex_position[1] * uniform_camera_up +
        uniform_camera_dir * uniform_camera_near;
        }
    `;
var skyboxFsSource = `
precision highp float;


        
float srgb(float v)
        {
        v = clamp(v, 0.0, 1.0);
        float K0 = 0.03928;
        float a = 0.055;
        float phi = 12.92;
        float gamma = 2.4;
        return v <= K0 / phi ? v * phi : (1.0 + a) * pow(v, 1.0 / gamma) - a;
        }
        float linear(float v)
        {
        v = clamp(v, 0.0, 1.0);
        float K0 = 0.03928;
        float a = 0.055;
        float phi = 12.92;
        float gamma = 2.4;
        return v <= K0 ? v / phi : pow((v + a) / (1.0 + a), gamma);
        }
        vec4 argb(vec3 c)
        {
        return vec4(srgb(c.r), srgb(c.g), srgb(c.b), 1.0);
        }
        vec3 texture(samplerCube sampler, vec3 c)
        {
        vec3 s = textureCube(sampler, c).rgb;
        return vec3(linear(s.r), linear(s.g), linear(s.b));
        }


        varying vec3 varying_pixel_position;
        uniform samplerCube uniform_cubemap;
        void main()
        {
            vec3 dir = normalize(varying_pixel_position);
            vec3 sample = texture(uniform_cubemap, vec3(-1.0, 1.0, 1.0) * dir);
            gl_FragColor = argb(sample);
        }
    `;


var canvas, gl, attribute_vertex_position, quad_buffer;
var camera = {
    up: [0.0, 1.0, 0.0],
    right: [1.0, 0.0, 0.0],
    dir: [0.0, 0.0, -1.0],
    origin: [0.0, 0.0, 0.0],
    near: 2.5,
    far: 100.0
};
var uniform_camera_up, uniform_camera_right, uniform_camera_origin;
var uniform_camera_dir, uniform_camera_near, uniform_camera_far;
var uniform_cubemap, cubemap_texture, cubemap_image, cubemap_counter;
var last_x, last_y;
var request = 0;
function update() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform3f(uniform_camera_up, camera.up[0], camera.up[1], camera.up[2]);
    gl.uniform3fv(uniform_camera_right, camera.right);//camera.right[0], camera.right[1], camera.right[2]);
    gl.uniform3f(uniform_camera_origin, camera.origin[0], camera.origin[1], camera.origin[2]);
    gl.uniform3f(uniform_camera_dir, camera.dir[0], camera.dir[1], camera.dir[2]);
    gl.uniform1f(uniform_camera_near, camera.near);
    gl.uniform1f(uniform_camera_far, camera.far);
    gl.uniform1i(uniform_cubemap, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
    gl.vertexAttribPointer(attribute_vertex_position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    request = 0;
}
function draw() {
    if (!request)
        request = window.requestAnimationFrame(update);
}
function compile() {
    var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, skyboxVsSource);
    gl.compileShader(vertex_shader);

    if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
        alert("vertex shader:\n" + gl.getShaderInfoLog(vertex_shader));
        return;
    }

    var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    var source = skyboxFsSource;
    //    "precision highp float;\n";

    //source += document.getElementById("argb-srgb").text;

    //source += document.getElementById("fragment-shader").text;

    gl.shaderSource(fragment_shader, source);
    gl.compileShader(fragment_shader);

    if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
        alert("fragment shader:\n" + gl.getShaderInfoLog(fragment_shader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("linker error:\n" + gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    attribute_vertex_position = gl.getAttribLocation(program, "attribute_vertex_position");
    gl.enableVertexAttribArray(attribute_vertex_position);
    uniform_camera_up = gl.getUniformLocation(program, "uniform_camera_up");
    uniform_camera_right = gl.getUniformLocation(program, "uniform_camera_right");
    uniform_camera_origin = gl.getUniformLocation(program, "uniform_camera_origin");
    uniform_camera_dir = gl.getUniformLocation(program, "uniform_camera_dir");
    uniform_camera_near = gl.getUniformLocation(program, "uniform_camera_near");
    uniform_camera_far = gl.getUniformLocation(program, "uniform_camera_far");
    uniform_cubemap = gl.getUniformLocation(program, "uniform_cubemap");
}
function v3_normalize(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
}
function v3_cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}
function m4_rot(v, a) {
    var c = Math.cos(a);
    var s = Math.sin(a);
    return [
        v[0] * v[0] * (1.0 - c) + c, v[0] * v[1] * (1.0 - c) - v[2] * s, v[0] * v[2] * (1.0 - c) + v[1] * s, 0.0,
        v[1] * v[0] * (1.0 - c) + v[2] * s, v[1] * v[1] * (1.0 - c) + c, v[1] * v[2] * (1.0 - c) - v[0] * s, 0.0,
        v[2] * v[0] * (1.0 - c) - v[1] * s, v[2] * v[1] * (1.0 - c) + v[0] * s, v[2] * v[2] * (1.0 - c) + c, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
}
function m4v3_mul(m, v) {
    return [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3],
        m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7],
        m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11],
        m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15]
    ];
}
function m4_mul(a, b) {
    return [
        a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12], a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13], a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14], a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],
        a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12], a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13], a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14], a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],
        a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12], a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13], a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14], a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],
        a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12], a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13], a[12] * b[2] + a[13] * b[6] + a[14] * b[9] + a[15] * b[14], a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15]
    ];
}
function mouse_move(event) {
    event.preventDefault();
    var x = event.clientX;
    var y = event.clientY;
    var x_rel = (x - last_x) / canvas.width;
    var y_rel = (last_y - y) / canvas.height;
    last_x = x;
    last_y = y;
    var rot_x = m4_rot(camera.right, Math.PI * y_rel);
    var rot_y = m4_rot(camera.up, - Math.PI * x_rel);
    var rotation = m4_mul(rot_x, rot_y);
    camera.origin = m4v3_mul(rotation, camera.origin);
    camera.up = v3_normalize(m4v3_mul(rotation, camera.up));
    camera.right = v3_normalize(m4v3_mul(rotation, camera.right));
    camera.dir = v3_cross(camera.up, camera.right);
    draw();
}
function mouse_down(event) {
    last_x = event.clientX;
    last_y = event.clientY;
    console.log('mdown');
    document.addEventListener("mousemove", mouse_move, false);
}
function mouse_up(event) {
    console.log('mup');
    document.removeEventListener("mousemove", mouse_move, false);
}
function onload_cubemap() {
    if (++cubemap_counter < 6)
        return;
    cubemap_texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap_texture);
    // wtf? no SRGB in webgl?
    for (var i = 0; i < 6; i++)
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubemap_image[i]);
    // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // linear interpolation in srgb color space .. just great :(
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    draw();
}
function load_cubemap(src) {
    cubemap_counter = 0;
    cubemap_image = [];
    for (var i = 0; i < 6; i++) {
        cubemap_image[i] = new Image();
        cubemap_image[i].onload = onload_cubemap;
        cubemap_image[i].src = src[i];
    }
}
function load_cubemap_files(e) {
    /*
    var info = "";
    var num = e.files.length;
    if (num < 6) {
        info += "only " + num + " face" + (num == 1 ? "" : "s") + " selected. ";
        info += "please select 6 faces named: posx.*, negx.*, posy.*, negy.*, posz.* and negz.*";
        document.getElementById("output").innerHTML = info;
        return;
    }
    var cubemap = [];
    var sides = ["posx", "negx", "posy", "negy", "posz", "negz"];
    for (var j = 0; j < 6; j++) {
        for (var i = 0; i < 6; i++) {
            var name = e.files[i].name;
            var base = name.substr(0, name.lastIndexOf('.'));
            if (base == sides[j]) {
                cubemap.push(window.URL.createObjectURL(e.files[i]));
                info += e.files[i].name + " ";
                break;
            }
        }
    }
    num = cubemap.length;
    if (num < 6) {
        info += (6 - num) + " face" + (num == 5 ? " is" : "s are") + " missing. ";
        info += "please select 6 faces named: posx.*, negx.*, posy.*, negy.*, posz.* and negz.*";
        document.getElementById("output").innerHTML = info;
        return;
    }
    document.getElementById("output").innerHTML = info;*/

    const faceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: 'skybox/right.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: 'skybox/left.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: 'skybox/top.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: 'skybox/bottom.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: 'skybox/back.jpg',
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: 'skybox/front.jpg',
        },
    ];


    cubemap_image = [];
    for (var j = 0; j < 6; j++) {
        //for (var i = 0; i < 6; i++) {
        //    var name = e.files[i].name;
        //    var base = name.substr(0, name.lastIndexOf('.'));
        //    if (base == sides[j]) {
        //        cubemap.push(window.URL.createObjectURL(e.files[i]));
        //        info += e.files[i].name + " ";
        //        break;
        //    }
        //}
        const { target, url } = faceInfos[j];

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        ////const image = new Image();
        ////image.src = url;
        cubemap_image[j] = new Image();
        cubemap_image[j].onload = onload_cubemap;
        cubemap_image[j].src = url;
    }

    //load_cubemap(cubemap);
}
var start = function () {
    canvas = document.getElementById("glCanvas");
    gl = canvas.getContext("webgl");
    if (!gl)
        gl = canvas.getContext("experimental-webgl");

    if (!gl) {
        alert("could not get webgl context");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    quad_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
    var vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    compile();

    var cubemap = [];
    var sides = ["posx", "negx", "posy", "negy", "posz", "negz"];
    for (var i = 0; i < 6; i++)
        cubemap.push("skybox" + "/" + sides[i] + ".jpg");;//cubemap.push("cubemap" + "/" + sides[i] + ".jpg");
    load_cubemap(cubemap);

    draw();
    console.log('add listner');
    const ui = document.querySelector('#uiCanvas');
    ui.addEventListener("mousedown", mouse_down, false);
    document.addEventListener("mouseup", mouse_up, false);
}();// ();



//function toggle(button) {
//    if (button.innerHTML == "disable") {
//        button.innerHTML = "enable";
//    } else {
//        button.innerHTML = "disable";
//    }
//    compile();
//    draw();
//}