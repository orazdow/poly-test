import Glview from './glview.js';
import {GUI} from './lib/dat.gui.module.min.js';
import poly from './poly.js';

const canvas = document.querySelector('canvas');
const glview = new Glview(canvas, poly, null, 0, new GUI());
glview.start();
