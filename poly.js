import {solids, polyhedra, models} from './model.js';
import {loadObj, edgeList, getNormals} from './lib/loader.js';
import * as mat4 from '../lib/mat4.js';


var model, cmodel;
var p_fov = 12;
var p_near = .4; 
var p_far = 4;

const vs =/*glsl*/`#version 300 es
    precision mediump float;
    in vec3 position;
    in vec3 normal;
    in vec3 pent;
    in vec3 color;
    out vec3 vnormal;
    out vec3 vcolor;
    uniform float time;
    uniform mat4 pmat;
    uniform float a;
    uniform float zdist;

    mat3 rotz(float t){return mat3(cos(t), -sin(t), 0, sin(t), cos(t), 0, 0,0,1);}
    mat3 roty(float t){return mat3(cos(t), 0, sin(t), 0, 1, 0, -sin(t), 0, cos(t));}
    mat3 rotx(float t){return mat3(1, 0, 0, 0, cos(t), -sin(t), 0, sin(t), cos(t));} 

    void main() {
        mat3 r = roty(time)*rotz(time);
        float p = mix(1., a, pent.x);
        vnormal = normal*r;
        vcolor = color;
        vec3 pos = position*p*r;
        pos.z -= zdist; 
        gl_Position = vec4(pos,1)*pmat;
    }
`;

const fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vnormal;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    uniform float cmode;

    void main() {
        float f = max(0.,dot(vnormal, vec3(0,0,.8)));
        vec3 c = vec3(f*f*.9+.1);
        fragColor = vec4(mix(c,vcolor,vec3(cmode)),1);
    }
`;

function mults(v, s){
    return [v[0]*s, v[1]*s, v[2]*s];
}

function ntagonal(o, n){
    const vmap = {};
    const v = o.vertices.v;
    for(let f of o.elements.f.v){
        for(let _v of f){
            let vk = v[_v].join('');
            vmap[vk] ??= {i: _v ,a:[]};
            vmap[vk].a.push(n);
        }
    }
    return Object.values(vmap).filter(e=>e.a.length==n).map(e=>e.i);
} 


function concavePoly(model){
    let pentIdx = [1, 3, 5, 9, 11, 14, 16, 18, 22, 25, 26, 30];
    let decIdx = [ 1, 2, 3, 4, 9, 10, 11, 13, 16, 19, 22, 24];
    let arr = pentIdx;
    let cmodel = {
        ...model,
        vertices: {
            v: model.vertices.v.map(a=>a),
            vn: model.vertices.vn.map(a=>a)
        }
    };
    for(let i of arr)
      cmodel.vertices.v[i] = mults(cmodel.vertices.v[i], 1.23);
    cmodel.vertices.vn = getNormals(cmodel, false).fn;
    return cmodel;
}

function setup(pgm){
    model = loadObj(Object.values(polyhedra)[0], .4);
    pgm.uniforms.pmat = mat4.create();
    mat4.perspective(pgm.uniforms.pmat, p_fov, 1, p_near,p_far);

    for(let t of model.indices.v)
        for(let i of t) pgm.arrays.position.data.push(...model.vertices.v[i]);

    for(let t of model.indices.vn)
        for(let i of t) pgm.arrays.normal.data.push(...model.vertices.vn[i]);

    for(let t of model.elements.f.v)
        for(let i of t) pgm.arrays.color.data.push(0,0,1,.0,.8,0,.8,0,.8);

    let pent = [1, 3, 5, 9, 11, 14, 16, 18, 22, 25, 26, 30];
    let dec = [ 1, 2, 3, 4, 9, 10, 11, 13, 16, 19, 22, 24];
    for(let t of model.indices.v){
        for(let i of t){
            let f = pent.includes(i) ? 1: 0;
            pgm.arrays.pent.data.push(f,f,f);
        }
    }
}

const gui = {
    open: true,
    fields: [
        {
            z: [2.8, 0, 6, .01],
            onChange: v => {pgm.uniforms.zdist = v;}
        },
        {
            pfov: [p_fov, 6, 24, .01],
            onChange: (v)=>{
                p_fov = v;
                 pgm.uniforms.pmat = mat4.create();
                mat4.perspective(pgm.uniforms.pmat, p_fov, 1, p_near, p_far);
            }
        },
        {
            pnear: [p_near, 0, 2, .01],
            onChange: (v)=>{
                p_near = v;
                 pgm.uniforms.pmat = mat4.create();
                mat4.perspective(pgm.uniforms.pmat, p_fov, 1, p_near, p_far);
            }
        },
        {
            pfar: [p_far, 2, 12, .01],
            onChange: (v)=>{
                p_far = v;
                 pgm.uniforms.pmat = mat4.create();
                mat4.perspective(pgm.uniforms.pmat, p_fov, 1, p_near, p_far);
            }
        },
        {
            pent_amp: [1, .5, 1.5, .01],
            onChange: (v)=>{
                pgm.uniforms.a = v;
            }
        },
        {
            color: false,
            onChange: (v)=>{
                pgm.uniforms.cmode = +v;
            }
        }
    ]
}

const pgm = {
    arrays: {
        position: {
            components: 3,
            data: []
        },
        normal: {
            components: 3,
            data: []
        },
        color: {
            components: 3,
            data: []
        },
        pent: {
            components: 3,
            data: []
        }
    },
    uniforms: {
        a: 1,
        zdist: 2.8,
        cmode: 0,
        pmat: [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
    },
    drawMode: 'TRIANGLES',
    vs: vs,
    fs: fs,
    setupcb: setup,
    gui: gui

};

export default pgm;