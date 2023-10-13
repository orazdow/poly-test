function loadObj(str, scale=1, hom=false){
    let obj = {
        vertices: {v:[], vt:[], vn:[]},
        elements: {
            p:{v:[], vt:[], vn:[]},
            l:{v:[], vt:[], vn:[]}, 
            f:{v:[], vt:[], vn:[]}
        },
        indices: {v:[], vt:[], vn:[]}
    };
    let a = str.split('\n');
    for(let s of a){

        let arr = s.split(' ').filter(el=> el!='');
        let c = arr.shift();

        switch(c){
            case 'v':
                arr = arr.map(f=>+f*scale);
                if(hom && arr.length == 3) arr.push(1);
                obj.vertices.v.push(arr);
            break;

            case 'vt':
                 arr = arr.map(f=>+f);
                 if(hom && arr.length == 3) arr.push(1);
                obj.vertices.vt.push(arr);
            break;

            case 'vn':
                 arr = arr.map(f=>+f);
                 if(hom && arr.length == 3) arr.push(1);
                obj.vertices.vn.push(arr);
            break;
            
            case 'f':
            case 'l':
            case 'p':
                let f = obj.elements[c];
                let v = [], vt = [], vn = [];
                for(let e of arr){
                    let el = e.split('/').filter(el=> el!='');
                    switch(el.length){
                        case 1:
                            v.push(+el[0]-1);
                        break;
                        case 2:
                            v.push(+el[0]-1);
                            vn.push(+el[1]-1);
                        break;
                        case 3:
                            v.push(+el[0]-1);
                            vt.push(+el[1]-1);
                            vn.push(+el[2]-1);
                        break;
                    }
                }
                if(v.length) f.v.push(v);
                if(vt.length) f.vt.push(vt);
                if(vn.length) f.vn.push(vn);
        }
    }   
    for(let e in obj.elements){ 
        for(let i in obj.elements[e]){
            obj.indices[i].push(...obj.elements[e][i]); 
        }
    }
    return obj;
}

function getNormals(o, vn=true){
    const vmap = {};
    const r = {fn: [], vn: []};
    const v = o.vertices.v;
    for(let f of o.elements.f.v){
        let v1 = subv(v[f[0]], v[f[1]])
        let v2 = subv(v[f[1]], v[f[2]])
        let n = normalize(cross(v1,v2));
        r.fn.push(n);
        if(vn) for(let _v of f){
            let vk = v[_v].join('');
            vmap[vk] ??= [];
            vmap[vk].push(n);
        }
    }
    if(vn)
        r.vn = Object.values(vmap).map(a=>averagev(a));
    return r;
} 

function edgeList(elements){
    let edges = {};
    function add(a, b){
        let key = a <= b ? a+' '+b : b+' '+a;
        edges[key] = a < b ? [a, b] : [b, a];
    }
    for(let f of elements){
        let n = f.length;
        if(n == 2){
            add(f[0], f[1]);
        }else if(n > 2){
            for(let i = 0; i < n; i++){
                let a = f[i], b = f[(i+1)%n];
                add(a, b);
            }
        }
    }
    return Object.values(edges);
}

function normalize(v){
    let d = Math.sqrt(v[0]**2+v[1]**2+v[2]**2) || 1;
    return mults(v, 1/d);
}
function cross(a, b){
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}
function dot(a, b){
  return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}
function addv(a, b){
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}
function subv(a, b){
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}
function multv(a, b){
    return [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
}
function mults(v, s){
    return [v[0]*s, v[1]*s, v[2]*s];
}
function adds(v, s){
    return [v[0]+s, v[1]+s, v[2]+s];
}
function averagev(a){
    let v = [0,0,0];
    for(let _v of a) v = addv(v, _v);
    return mults(v, 1./(a.length || 1));
}

export {loadObj, edgeList, getNormals};