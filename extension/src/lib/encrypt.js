// encrypt.asm.js - encLoader's module
// author: gvozdarev-sa
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof requires === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = requires('fs');
  var nodePath = requires('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will requires at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will requires at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 28160;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } },{ func: function() { __GLOBAL__I_a28() } });
var ___fsmu8;
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,96,38,0,0,248,0,0,0,130,0,0,0,66,0,0,0,152,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,112,38,0,0,248,0,0,0,242,0,0,0,66,0,0,0,152,0,0,0,8,0,0,0,26,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
/* memory initializer */ allocate([0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,74,117,108,0,0,0,0,0,74,117,110,0,0,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,65,117,103,117,115,116,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,80,77,0,0,0,0,0,0,65,77,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,
37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,102,97,108,115,101,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,58,32,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,67,0,0,0,0,0,0,0,118,101,99,116,111,114,0,0,37,46,48,76,102,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,84,104,117,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,83,117,110,100,97,121,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,83,101,112,0,0,0,0,0,65,117,103,0,0,0,0,0,69,82,82,79,82,58,32,119,114,111,110,103,32,97,100,100,105,116,105,111,110,97,108,32,98,121,116,101,115,32,110,117,109,98,101,114,32,119,104,105,108,101,32,100,101,99,114,121,112,116,105,111,110,32,112,114,111,99,101,115,115,10,0,0,69,82,82,79,82,58,32,119,114,111,110,103,32,97,100,100,105,116,105,111,110,97,108,32,98,121,116,101,115,32,110,117,109,98,101,114,32,119,104,105,108,101,32,101,110,99,114,121,112,116,105,111,110,32,112,114,111,99,101,115,115,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,
58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,120,32,0,0,34,0,0,0,118,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,32,0,0,194,0,0,0,162,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,32,0,0,72,0,0,0,6,1,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,32,0,0,96,0,0,0,8,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,32,0,0,96,0,0,0,22,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,32,0,0,166,0,0,0,84,0,0,0,52,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,32,0,0,254,0,0,0,186,0,0,0,52,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,33,0,0,160,0,0,0,188,0,0,0,52,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,33,0,0,0,1,0,0,140,0,0,0,52,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,33,0,0,250,0,0,0,94,0,0,0,52,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,33,0,0,158,0,0,0,110,0,0,0,52,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,34,0,0,42,0,0,0,112,0,0,0,52,0,0,0,118,0,0,0,4,0,0,0,32,0,0,0,6,0,0,0,20,0,0,0,56,0,0,0,2,0,0,0,248,255,255,255,16,34,0,0,20,0,0,0,10,0,0,0,32,0,0,0,14,0,0,0,2,0,0,0,30,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,34,0,0,240,0,0,0,224,0,0,0,52,0,0,0,18,0,0,0,16,0,0,0,60,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,56,34,0,0,62,0,0,0,100,0,0,0,112,0,0,0,120,0,0,0,88,0,0,0,42,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,34,0,0,78,0,0,0,190,0,0,0,52,0,0,0,44,0,0,0,38,0,0,0,8,0,0,0,42,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,34,0,0,64,0,0,0,68,0,0,0,52,0,0,0,40,0,0,0,76,0,0,0,12,0,0,0,54,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,34,0,0,244,0,0,0,2,0,0,0,52,0,0,0,24,0,0,0,30,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,34,0,0,50,0,0,0,208,0,0,0,52,0,0,0,38,0,0,0,14,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,34,0,0,212,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,34,0,0,32,0,0,0,138,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,34,0,0,6,0,0,0,172,0,0,0,52,0,0,0,8,0,0,0,6,0,0,0,12,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,34,0,0,100,0,0,0,20,0,0,0,52,0,0,0,20,0,0,0,24,0,0,0,34,0,0,0,22,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,35,0,0,44,0,0,0,28,0,0,0,52,0,0,0,48,0,0,0,46,0,0,0,38,0,0,0,40,0,0,0,30,0,0,0,44,0,0,0,36,0,0,0,54,0,0,0,52,0,0,0,50,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,35,0,0,56,0,0,0,4,0,0,0,52,0,0,0,76,0,0,0,70,0,0,0,64,0,0,0,66,0,0,0,58,0,0,0,68,0,0,0,62,0,0,0,28,0,0,0,74,0,0,0,72,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,35,0,0,74,0,0,0,92,0,0,0,52,0,0,0,6,0,0,0,10,0,
0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,35,0,0,30,0,0,0,174,0,0,0,52,0,0,0,16,0,0,0,14,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,35,0,0,12,0,0,0,184,0,0,0,52,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,116,0,0,0,94,0,0,0,24,0,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,35,0,0,178,0,0,0,132,0,0,0,52,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,48,0,0,0,8,0,0,0,20,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,35,0,0,178,0,0,0,24,0,0,0,52,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,92,0,0,0,58,0,0,0,10,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,35,0,0,178,0,0,0,102,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,35,0,0,178,0,0,0,38,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,36,0,0,62,0,0,0,156,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,36,0,0,178,0,0,0,80,0,0,0,52,0,0,0,20,0,0,0,2,0,0,0,4,0,0,0,10,0,0,0,16,0,0,0,28,0,0,0,24,0,0,0,6,0,0,0,4,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,36,0,0,4,1,0,0,40,0,0,0,52,0,0,0,10,0,0,0,4,0,0,0,18,0,0,0,36,0,0,0,8,0,0,0,6,0,0,0,26,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,36,0,0,70,0,0,0,220,0,0,0,70,0,0,0,2,0,0,0,14,0,0,0,32,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,36,0,0,178,0,0,0,86,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,36,0,0,178,0,0,0,236,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,36,0,0,128,0,0,0,232,0,0,0,20,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,36,0,0,10,0,0,0,120,0,0,0,60,0,0,0,40,0,0,0,28,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,208,36,0,0,48,0,0,0,206,0,0,0,252,255,255,255,252,255,255,255,208,36,0,0,146,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,232,36,0,0,214,0,0,0,234,0,0,0,252,255,255,255,252,255,255,255,232,36,0,0,108,0,0,0,198,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,37,0,0,88,0,0,0,8,1,0,0,248,255,255,255,248,255,255,255,0,37,0,0,180,0,0,0,230,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,24,37,0,0,106,0,0,0,202,0,0,0,248,255,255,255,248,255,255,255,24,37,0,0,136,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,37,0,0,200,0,0,0,182,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,37,0,0,246,0,0,0,228,0,0,0,16,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,54,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,30,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,37,0,0,154,0,0,0,176,0,0,0,38,0,0,0,40,0,0,0,28,0,0,0,8,0,0,0,82,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,42,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,37,0,0,222,0,0,0,144,0,0,0,52,0,0,0,60,0,0,0,114,0,0,0,30,0,0,0,78,0,0,0,4,0,0,0,34,0,0,0,50,0,0,0,24,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,37,0,0,104,0,0,0,58,0,0,0,52,0,0,0,106,0,0,0,4,0,0,0,66,0,0,0,74,0,0,0,76,0,0,0,26,0,0,0,110,0,0,0,50,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,37,0,0,226,0,0,0,116,0,0,0,52,0,0,0,16,0,0,0,56,0,0,0,6,0,0,0,
44,0,0,0,80,0,0,0,52,0,0,0,86,0,0,0,56,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,37,0,0,76,0,0,0,170,0,0,0,52,0,0,0,98,0,0,0,102,0,0,0,32,0,0,0,72,0,0,0,28,0,0,0,22,0,0,0,72,0,0,0,70,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,38,0,0,90,0,0,0,18,0,0,0,58,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,64,0,0,0,74,0,0,0,12,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,38,0,0,16,0,0,0,216,0,0,0,62,0,0,0,40,0,0,0,28,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,90,0,0,0,22,0,0,0,2,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,38,0,0,248,0,0,0,196,0,0,0,66,0,0,0,152,0,0,0,8,0,0,0,2,0,0,0,6,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,38,0,0,210,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,38,0,0,252,0,0,0,204,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,
104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,
108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,
78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,57,67,82,105,106,110,100,97,101,108,0,0,0,0,0,0,51,65,69,83,0,0,0,0,0,0,0,0,168,20,0,0,0,0,0,0,184,20,0,0,0,0,0,0,200,20,0,0,112,32,0,0,0,0,0,0,0,0,0,0,216,20,0,0,112,32,0,0,0,0,0,0,0,0,0,0,232,20,0,0,112,32,0,0,0,0,0,0,0,0,0,0,0,21,0,0,184,32,0,0,0,0,0,0,0,0,0,0,24,21,0,0,112,32,0,0,0,0,0,0,0,0,0,0,40,21,0,0,80,20,0,0,64,21,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,120,37,0,0,0,0,0,0,80,20,0,0,136,21,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,128,37,0,0,0,0,0,0,80,20,0,0,208,21,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,136,37,0,0,0,0,0,0,80,20,0,0,24,22,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,144,37,0,0,0,0,0,0,0,0,0,0,96,22,0,0,192,34,0,0,0,0,0,0,0,0,0,0,144,22,0,0,192,34,0,0,0,0,0,0,80,20,0,0,192,22,0,0,0,0,0,0,1,0,0,0,184,36,0,0,0,0,0,0,80,20,0,0,216,22,0,0,0,0,0,0,1,0,0,0,184,36,0,0,0,0,0,0,80,20,0,0,240,22,0,0,0,0,0,0,1,0,0,0,192,36,0,0,0,0,0,0,80,20,0,0,8,23,0,0,0,0,0,0,1,0,0,0,192,36,0,0,0,0,0,0,80,20,0,0,32,23,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,40,38,0,0,0,8,0,0,80,20,0,0,104,23,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,40,38,0,0,0,8,0,0,80,20,0,0,176,23,0,0,0,0,0,0,3,0,0,0,248,35,0,0,2,0,0,0,200,32,0,0,2,0,0,0,88,36,0,0,0,8,0,0,80,20,0,0,248,23,0,0,0,0,0,0,3,0,0,0,248,35,0,0,2,0,0,0,200,32,0,0,2,0,0,0,96,36,0,0,0,8,0,0,0,0,0,0,64,24,0,0,248,35,0,0,0,0,0,0,0,0,0,0,88,24,0,0,248,35,0,0,0,0,0,0,80,20,0,0,112,24,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,200,36,0,0,2,0,0,0,80,20,0,0,136,24,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,200,36,0,0,2,0,0,0,0,0,0,0,160,24,0,0,0,0,0,0,184,24,0,0,48,37,0,0,0,0,0,0,80,20,0,0,216,24,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,112,33,0,0,
0,0,0,0,80,20,0,0,32,25,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,136,33,0,0,0,0,0,0,80,20,0,0,104,25,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,160,33,0,0,0,0,0,0,80,20,0,0,176,25,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,184,33,0,0,0,0,0,0,0,0,0,0,248,25,0,0,248,35,0,0,0,0,0,0,0,0,0,0,16,26,0,0,248,35,0,0,0,0,0,0,80,20,0,0,40,26,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,64,37,0,0,2,0,0,0,80,20,0,0,80,26,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,64,37,0,0,2,0,0,0,80,20,0,0,120,26,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,64,37,0,0,2,0,0,0,80,20,0,0,160,26,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,64,37,0,0,2,0,0,0,0,0,0,0,200,26,0,0,176,36,0,0,0,0,0,0,0,0,0,0,224,26,0,0,248,35,0,0,0,0,0,0,80,20,0,0,248,26,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,32,38,0,0,2,0,0,0,80,20,0,0,16,27,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,32,38,0,0,2,0,0,0,0,0,0,0,40,27,0,0,0,0,0,0,80,27,0,0,0,0,0,0,120,27,0,0,72,37,0,0,0,0,0,0,0,0,0,0,152,27,0,0,216,35,0,0,0,0,0,0,0,0,0,0,192,27,0,0,216,35,0,0,0,0,0,0,0,0,0,0,232,27,0,0,0,0,0,0,32,28,0,0,0,0,0,0,88,28,0,0,0,0,0,0,120,28,0,0,0,0,0,0,152,28,0,0,0,0,0,0,184,28,0,0,0,0,0,0,216,28,0,0,80,20,0,0,240,28,0,0,0,0,0,0,1,0,0,0,80,33,0,0,3,244,255,255,80,20,0,0,32,29,0,0,0,0,0,0,1,0,0,0,96,33,0,0,3,244,255,255,80,20,0,0,80,29,0,0,0,0,0,0,1,0,0,0,80,33,0,0,3,244,255,255,80,20,0,0,128,29,0,0,0,0,0,0,1,0,0,0,96,33,0,0,3,244,255,255,0,0,0,0,176,29,0,0,152,32,0,0,0,0,0,0,0,0,0,0,200,29,0,0,0,0,0,0,224,29,0,0,168,36,0,0,0,0,0,0,0,0,0,0,248,29,0,0,152,36,0,0,0,0,0,0,0,0,0,0,24,30,0,0,160,36,0,0,0,0,0,0,0,0,0,0,56,30,0,0,0,0,0,0,88,30,0,0,0,0,0,0,120,30,0,0,0,0,0,0,152,30,0,0,80,20,0,0,184,30,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,24,38,0,0,2,0,0,0,80,20,0,0,216,30,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,24,38,0,0,2,0,0,0,80,20,0,0,248,30,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,24,38,0,0,2,0,0,0,80,20,0,0,24,31,0,0,0,0,0,0,2,0,0,0,248,35,0,0,2,0,0,0,24,38,0,0,2,0,0,0,0,0,0,0,56,31,0,0,0,0,0,0,80,31,0,0,0,0,0,0,104,31,0,0,0,0,0,0,128,31,0,0,152,36,0,0,0,0,0,0,0,0,0,0,152,31,0,0,160,36,0,0,0,0,0,0,0,0,0,0,176,31,0,0,112,38,0,0,0,0,0,0,0,0,0,0,216,31,0,0,112,38,0,0,0,0,0,0,0,0,0,0,0,32,0,0,128,38,0,0,0,0,0,0,0,0,0,0,40,32,0,0,104,32,0,0,0,0,0,0,0,0,0,0,80,32,0,0,80,20,0,0,96,32,0,0,0,0,0,0,1,0,0,0,144,38,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,5,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,7,0,0,0,3,0,0,0,5,0,0,0,4,0,0,0,4,0,0,0,1,2,4,8,16,32,64,128,27,54,108,216,171,77,154,47,94,188,99,198,151,53,106,212,179,125,250,239,197,145,0,0,0,0,0,0,14,11,13,9,28,22,26,18,18,29,23,27,56,44,52,36,54,39,57,45,36,58,46,54,42,49,35,63,112,88,104,72,126,83,101,65,108,78,114,90,98,69,127,83,72,116,92,108,70,127,81,101,84,98,70,126,90,105,75,119,224,176,208,144,238,187,221,153,252,166,202,130,242,173,199,139,216,156,228,180,214,151,233,189,196,138,254,166,202,129,243,175,144,232,184,216,
158,227,181,209,140,254,162,202,130,245,175,195,168,196,140,252,166,207,129,245,180,210,150,238,186,217,155,231,219,123,187,59,213,112,182,50,199,109,161,41,201,102,172,32,227,87,143,31,237,92,130,22,255,65,149,13,241,74,152,4,171,35,211,115,165,40,222,122,183,53,201,97,185,62,196,104].concat([147,15,231,87,157,4,234,94,143,25,253,69,129,18,240,76,59,203,107,171,53,192,102,162,39,221,113,185,41,214,124,176,3,231,95,143,13,236,82,134,31,241,69,157,17,250,72,148,75,147,3,227,69,152,14,234,87,133,25,241,89,142,20,248,115,191,55,199,125,180,58,206,111,169,45,213,97,162,32,220,173,246,109,118,163,253,96,127,177,224,119,100,191,235,122,109,149,218,89,82,155,209,84,91,137,204,67,64,135,199,78,73,221,174,5,62,211,165,8,55,193,184,31,44,207,179,18,37,229,130,49,26,235,137,60,19,249,148,43,8,247,159,38,1,77,70,189,230,67,77,176,239,81,80,167,244,95,91,170,253,117,106,137,194,123,97,132,203,105,124,147,208,103,119,158,217,61,30,213,174,51,21,216,167,33,8,207,188,47,3,194,181,5,50,225,138,11,57,236,131,25,36,251,152,23,47,246,145,118,141,214,77,120,134,219,68,106,155,204,95,100,144,193,86,78,161,226,105,64,170,239,96,82,183,248,123,92,188,245,114,6,213,190,5,8,222,179,12,26,195,164,23,20,200,169,30,62,249,138,33,48,242,135,40,34,239,144,51,44,228,157,58,150,61,6,221,152,54,11,212,138,43,28,207,132,32,17,198,174,17,50,249,160,26,63,240,178,7,40,235,188,12,37,226,230,101,110,149,232,110,99,156,250,115,116,135,244,120,121,142,222,73,90,177,208,66,87,184,194,95,64,163,204,84,77,170,65,247,218,236,79,252,215,229,93,225,192,254,83,234,205,247,121,219,238,200,119,208,227,193,101,205,244,218,107,198,249,211,49,175,178,164,63,164,191,173,45,185,168,182,35,178,165,191,9,131,134,128,7,136,139,137,21,149,156,146,27,158,145,155,161,71,10,124,175,76,7,117,189,81,16,110,179,90,29,103,153,107,62,88,151,96,51,81,133,125,36,74,139,118,41,67,209,31,98,52,223,20,111,61,205,9,120,38,195,2,117,47,233,51,86,16,231,56,91,25,245,37,76,2,251,46,65,11,154,140,97,215,148,135,108,222,134,154,123,197,136,145,118,204,162,160,85,243,172,171,88,250,190,182,79,225,176,189,66,232,234,212,9,159,228,223,4,150,246,194,19,141,248,201,30,132,210,248,61,187,220,243,48,178,206,238,39,169,192,229,42,160,122,60,177,71,116,55,188,78,102,42,171,85,104,33,166,92,66,16,133,99,76,27,136,106,94,6,159,113,80,13,146,120,10,100,217,15,4,111,212,6,22,114,195,29,24,121,206,20,50,72,237,43,60,67,224,34,46,94,247,57,32,85,250,48,236,1,183,154,226,10,186,147,240,23,173,136,254,28,160,129,212,45,131,190,218,38,142,183,200,59,153,172,198,48,148,165,156,89,223,210,146,82,210,219,128,79,197,192,142,68,200,201,164,117,235,246,170,126,230,255,184,99,241,228,182,104,252,237,12,177,103,10,2,186,106,3,16,167,125,24,30,172,112,17,52,157,83,46,58,150,94,39,40,139,73,60,38,128,68,53,124,233,15,66,114,226,2,75,96,255,21,80,110,244,24,89,68,197,59,102,74,206,54,111,88,211,33,116,86,216,44,125,55,122,12,161,57,113,1,168,43,108,22,179,37,103,27,186,15,86,56,133,1,93,53,140,19,64,34,151,29,75,47,158,71,34,100,233,73,41,105,224,91,
52,126,251,85,63,115,242,127,14,80,205,113,5,93,196,99,24,74,223,109,19,71,214,215,202,220,49,217,193,209,56,203,220,198,35,197,215,203,42,239,230,232,21,225,237,229,28,243,240,242,7,253,251,255,14,167,146,180,121,169,153,185,112,187,132,174,107,181,143,163,98,159,190,128,93,145,181,141,84,131,168,154,79,141,163,151,70,0,0,0,0,9,14,11,13,18,28,22,26,27,18,29,23,36,56,44,52,45,54,39,57,54,36,58,46,63,42,49,35,72,112,88,104,65,126,83,101,90,108,78,114,83,98,69,127,108,72,116,92,101,70,127,81,126,84,98,70,119,90,105,75,144,224,176,208,153,238,187,221,130,252,166,202,139,242,173,199,180,216,156,228,189,214,151,233,166,196,138,254,175,202,129,243,216,144,232,184,209,158,227,181,202,140,254,162,195,130,245,175,252,168,196,140,245,166,207,129,238,180,210,150,231,186,217,155,59,219,123,187,50,213,112,182,41,199,109,161,32,201,102,172,31,227,87,143,22,237,92,130,13,255,65,149,4,241,74,152,115,171,35,211,122,165,40,222,97,183,53,201,104,185,62,196,87,147,15,231,94,157,4,234,69,143,25,253,76,129,18,240,171,59,203,107,162,53,192,102,185,39,221,113,176,41,214,124,143,3,231,95,134,13,236,82,157,31,241,69,148,17,250,72,227,75,147,3,234,69,152,14,241,87,133,25,248,89,142,20,199,115,191,55,206,125,180,58,213,111,169,45,220,97,162,32,118,173,246,109,127,163,253,96,100,177,224,119,109,191,235,122,82,149,218,89,91,155,209,84,64,137,204,67,73,135,199,78,62,221,174,5,55,211,165,8,44,193,184,31,37,207,179,18,26,229,130,49,19,235,137,60,8,249,148,43,1,247,159,38,230,77,70,189,239,67,77,176,244,81,80,167,253,95,91,170,194,117,106,137,203,123,97,132,208,105,124,147,217,103,119,158,174,61,30,213,167,51,21,216,188,33,8,207,181,47,3,194,138,5,50,225,131,11,57,236,152,25,36,251,145,23,47,246,77,118,141,214,68,120,134,219,95,106,155,204,86,100,144,193,105,78,161,226,96,64,170,239,123,82,183,248,114,92,188,245,5,6,213,190,12,8,222,179,23,26,195,164,30,20,200,169,33,62,249,138,40,48,242,135,51,34,239,144,58,44,228,157,221,150,61,6,212,152,54,11,207,138,43,28,198,132,32,17,249,174,17,50,240,160,26,63,235,178,7,40,226,188,12,37,149,230,101,110,156,232,110,99,135,250,115,116,142,244,120,121,177,222,73,90,184,208,66,87,163,194,95,64,170,204,84,77,236,65,247,218,229,79,252,215,254,93,225,192,247,83,234,205,200,121,219,238,193,119,208,227,218,101,205,244,211,107,198,249,164,49,175,178,173,63,164,191,182,45,185,168,191,35,178,165,128,9,131,134,137,7,136,139,146,21,149,156,155,27,158,145,124,161,71,10,117,175,76,7,110,189,81,16,103,179,90,29,88,153,107,62,81,151,96,51,74,133,125,36,67,139,118,41,52,209,31,98,61,223,20,111,38,205,9,120,47,195,2,117,16,233,51,86,25,231,56,91,2,245,37,76,11,251,46,65,215,154,140,97,222,148,135,108,197,134,154,123,204,136,145,118,243,162,160,85,250,172,171,88,225,190,182,79,232,176,189,66,159,234,212,9,150,228,223,4,141,246,194,19,132,248,201,30,187,210,248,61,178,220,243,48,169,206,238,39,160,192,229,42,71,122,60,177,78,116,55,188,85,102,42,171,92,104,33,166,99,66,16,133,106,76,27,136,113,94,6,159,120,80,13,146,15,10,100,217,6,4,111,212,29,22,114,195,20,
24,121,206,43,50,72,237,34,60,67,224,57,46,94,247,48,32,85,250,154,236,1,183,147,226,10,186,136,240,23,173,129,254,28,160,190,212,45,131,183,218,38,142,172,200,59,153,165,198,48,148,210,156,89,223,219,146,82,210,192,128,79,197,201,142,68,200,246,164,117,235,255,170,126,230,228,184,99,241,237,182,104,252,10,12,177,103,3,2,186,106,24,16,167,125,17,30,172,112,46,52,157,83,39,58,150,94,60,40,139,73,53,38,128,68,66,124,233,15,75,114,226,2,80,96,255,21,89,110,244,24,102,68,197,59,111,74,206,54,116,88,211,33,125,86,216,44,161,55,122,12,168,57,113,1,179,43,108,22,186,37,103,27,133,15,86,56,140,1,93,53,151,19,64,34,158,29,75,47,233,71,34,100,224,73,41,105,251,91,52,126,242,85,63,115,205,127,14,80,196,113,5,93,223,99,24,74,214,109,19,71,49,215,202,220,56,217,193,209,35,203,220,198,42,197,215,203,21,239,230,232,28,225,237,229,7,243,240,242,14,253,251,255,121,167,146,180,112,169,153,185,107,187,132,174,98,181,143,163,93,159,190,128,84,145,181,141,79,131,168,154,70,141,163,151,0,0,0,0,13,9,14,11,26,18,28,22,23,27,18,29,52,36,56,44,57,45,54,39,46,54,36,58,35,63,42,49,104,72,112,88,101,65,126,83,114,90,108,78,127,83,98,69,92,108,72,116,81,101,70,127,70,126,84,98,75,119,90,105,208,144,224,176,221,153,238,187,202,130,252,166,199,139,242,173,228,180,216,156,233,189,214,151,254,166,196,138,243,175,202,129,184,216,144,232,181,209,158,227,162,202,140,254,175,195,130,245,140,252,168,196,129,245,166,207,150,238,180,210,155,231,186,217,187,59,219,123,182,50,213,112,161,41,199,109,172,32,201,102,143,31,227,87,130,22,237,92,149,13,255,65,152,4,241,74,211,115,171,35,222,122,165,40,201,97,183,53,196,104,185,62,231,87,147,15,234,94,157,4,253,69,143,25,240,76,129,18,107,171,59,203,102,162,53,192,113,185,39,221,124,176,41,214,95,143,3,231,82,134,13,236,69,157,31,241,72,148,17,250,3,227,75,147,14,234,69,152,25,241,87,133,20,248,89,142,55,199,115,191,58,206,125,180,45,213,111,169,32,220,97,162,109,118,173,246,96,127,163,253,119,100,177,224,122,109,191,235,89,82,149,218,84,91,155,209,67,64,137,204,78,73,135,199,5,62,221,174,8,55,211,165,31,44,193,184,18,37,207,179,49,26,229,130,60,19,235,137,43,8,249,148,38,1,247,159,189,230,77,70,176,239,67,77,167,244,81,80,170,253,95,91,137,194,117,106,132,203,123,97,147,208,105,124,158,217,103,119,213,174,61,30,216,167,51,21,207,188,33,8,194,181,47,3,225,138,5,50,236,131,11,57,251,152,25,36,246,145,23,47,214,77,118,141,219,68,120,134,204,95,106,155,193,86,100,144,226,105,78,161,239,96,64,170,248,123,82,183,245,114,92,188,190,5,6,213,179,12,8,222,164,23,26,195,169,30,20,200,138,33,62,249,135,40,48,242,144,51,34,239,157,58,44,228,6,221,150,61,11,212,152,54,28,207,138,43,17,198,132,32,50,249,174,17,63,240,160,26,40,235,178,7,37,226,188,12,110,149,230,101,99,156,232,110,116,135,250,115,121,142,244,120,90,177,222,73,87,184,208,66,64,163,194,95,77,170,204,84,218,236,65,247,215,229,79,252,192,254,93,225,205,247,83,234,238,200,121,219,227,193,119,208,244,218,101,205,249,211,107,198,178,164,49,175,191,173,63,164,168,182,45,185,165,191,35,178,134,128,9,
131,139,137,7,136,156,146,21,149,145,155,27,158,10,124,161,71,7,117,175,76,16,110,189,81,29,103,179,90,62,88,153,107,51,81,151,96,36,74,133,125,41,67,139,118,98,52,209,31,111,61,223,20,120,38,205,9,117,47,195,2,86,16,233,51,91,25,231,56,76,2,245,37,65,11,251,46,97,215,154,140,108,222,148,135,123,197,134,154,118,204,136,145,85,243,162,160,88,250,172,171,79,225,190,182,66,232,176,189,9,159,234,212,4,150,228,223,19,141,246,194,30,132,248,201,61,187,210,248,48,178,220,243,39,169,206,238,42,160,192,229,177,71,122,60,188,78,116,55,171,85,102,42,166,92,104,33,133,99,66,16,136,106,76,27,159,113,94,6,146,120,80,13,217,15,10,100,212,6,4,111,195,29,22,114,206,20,24,121,237,43,50,72,224,34,60,67,247,57,46,94,250,48,32,85,183,154,236,1,186,147,226,10,173,136,240,23,160,129,254,28,131,190,212,45,142,183,218,38,153,172,200,59,148,165,198,48,223,210,156,89,210,219,146,82,197,192,128,79,200,201,142,68,235,246,164,117,230,255,170,126,241,228,184,99,252,237,182,104,103,10,12,177,106,3,2,186,125,24,16,167,112,17,30,172,83,46,52,157,94,39,58,150,73,60,40,139,68,53,38,128,15,66,124,233,2,75,114,226,21,80,96,255,24,89,110,244,59,102,68,197,54,111,74,206,33,116,88,211,44,125,86,216,12,161,55,122,1,168,57,113,22,179,43,108,27,186,37,103,56,133,15,86,53,140,1,93,34,151,19,64,47,158,29,75,100,233,71,34,105,224,73,41,126,251,91,52,115,242,85,63,80,205,127,14,93,196,113,5,74,223,99,24,71,214,109,19,220,49,215,202,209,56,217,193,198,35,203,220,203,42,197,215,232,21,239,230,229,28,225,237,242,7,243,240,255,14,253,251,180,121,167,146,185,112,169,153,174,107,187,132,163,98,181,143,128,93,159,190,141,84,145,181,154,79,131,168,151,70,141,163,0,0,0,0,11,13,9,14,22,26,18,28,29,23,27,18,44,52,36,56,39,57,45,54,58,46,54,36,49,35,63,42,88,104,72,112,83,101,65,126,78,114,90,108,69,127,83,98,116,92,108,72,127,81,101,70,98,70,126,84,105,75,119,90,176,208,144,224,187,221,153,238,166,202,130,252,173,199,139,242,156,228,180,216,151,233,189,214,138,254,166,196,129,243,175,202,232,184,216,144,227,181,209,158,254,162,202,140,245,175,195,130,196,140,252,168,207,129,245,166,210,150,238,180,217,155,231,186,123,187,59,219,112,182,50,213,109,161,41,199,102,172,32,201,87,143,31,227,92,130,22,237,65,149,13,255,74,152,4,241,35,211,115,171,40,222,122,165,53,201,97,183,62,196,104,185,15,231,87,147,4,234,94,157,25,253,69,143,18,240,76,129,203,107,171,59,192,102,162,53,221,113,185,39,214,124,176,41,231,95,143,3,236,82,134,13,241,69,157,31,250,72,148,17,147,3,227,75,152,14,234,69,133,25,241,87,142,20,248,89,191,55,199,115,180,58,206,125,169,45,213,111,162,32,220,97,246,109,118,173,253,96,127,163,224,119,100,177,235,122,109,191,218,89,82,149,209,84,91,155,204,67,64,137,199,78,73,135,174,5,62,221,165,8,55,211,184,31,44,193,179,18,37,207,130,49,26,229,137,60,19,235,148,43,8,249,159,38,1,247,70,189,230,77,77,176,239,67,80,167,244,81,91,170,253,95,106,137,194,117,97,132,203,123,124,147,208,105,119,158,217,103,30,213,174,61,21,216,167,51,8,207,188,33,3,194,181,47,50,225,138,5,57,236,131,11,36,251,152,25,47,246,
145,23,141,214,77,118,134,219,68,120,155,204,95,106,144,193,86,100,161,226,105,78,170,239,96,64,183,248,123,82,188,245,114,92,213,190,5,6,222,179,12,8,195,164,23,26,200,169,30,20,249,138,33,62,242,135,40,48,239,144,51,34,228,157,58,44,61,6,221,150,54,11,212,152,43,28,207,138,32,17,198,132,17,50,249,174,26,63,240,160,7,40,235,178,12,37,226,188,101,110,149,230,110,99,156,232,115,116,135,250,120,121,142,244,73,90,177,222,66,87,184,208,95,64,163,194,84,77,170,204,247,218,236,65,252,215,229,79,225,192,254,93,234,205,247,83,219,238,200,121,208,227,193,119,205,244,218,101,198,249,211,107,175,178,164,49,164,191,173,63,185,168,182,45,178,165,191,35,131,134,128,9,136,139,137,7,149,156,146,21,158,145,155,27,71,10,124,161,76,7,117,175,81,16,110,189,90,29,103,179,107,62,88,153,96,51,81,151,125,36,74,133,118,41,67,139,31,98,52,209,20,111,61,223,9,120,38,205,2,117,47,195,51,86,16,233,56,91,25,231,37,76,2,245,46,65,11,251,140,97,215,154,135,108,222,148,154,123,197,134,145,118,204,136,160,85,243,162,171,88,250,172,182,79,225,190,189,66,232,176,212,9,159,234,223,4,150,228,194,19,141,246,201,30,132,248,248,61,187,210,243,48,178,220,238,39,169,206,229,42,160,192,60,177,71,122,55,188,78,116,42,171,85,102,33,166,92,104,16,133,99,66,27,136,106,76,6,159,113,94,13,146,120,80,100,217,15,10,111,212,6,4,114,195,29,22,121,206,20,24,72,237,43,50,67,224,34,60,94,247,57,46,85,250,48,32,1,183,154,236,10,186,147,226,23,173,136,240,28,160,129,254,45,131,190,212,38,142,183,218,59,153,172,200,48,148,165,198,89,223,210,156,82,210,219,146,79,197,192,128,68,200,201,142,117,235,246,164,126,230,255,170,99,241,228,184,104,252,237,182,177,103,10,12,186,106,3,2,167,125,24,16,172,112,17,30,157,83,46,52,150,94,39,58,139,73,60,40,128,68,53,38,233,15,66,124,226,2,75,114,255,21,80,96,244,24,89,110,197,59,102,68,206,54,111,74,211,33,116,88,216,44,125,86,122,12,161,55,113,1,168,57,108,22,179,43,103,27,186,37,86,56,133,15,93,53,140,1,64,34,151,19,75,47,158,29,34,100,233,71,41,105,224,73,52,126,251,91,63,115,242,85,14,80,205,127,5,93,196,113,24,74,223,99,19,71,214,109,202,220,49,215,193,209,56,217,220,198,35,203,215,203,42,197,230,232,21,239,237,229,28,225,240,242,7,243,251,255,14,253,146,180,121,167,153,185,112,169,132,174,107,187,143,163,98,181,190,128,93,159,181,141,84,145,168,154,79,131,163,151,70,141,81,80,167,244,126,83,101,65,26,195,164,23,58,150,94,39,59,203,107,171,31,241,69,157,172,171,88,250,75,147,3,227,32,85,250,48,173,246,109,118,136,145,118,204,245,37,76,2,79,252,215,229,197,215,203,42,38,128,68,53,181,143,163,98,222,73,90,177,37,103,27,186,69,152,14,234,93,225,192,254,195,2,117,47,129,18,240,76,141,163,151,70,107,198,249,211,3,231,95,143,21,149,156,146,191,235,122,109,149,218,89,82,212,45,131,190,88,211,33,116,73,41,105,224,142,68,200,201,117,106,137,194,244,120,121,142,153,107,62,88,39,221,113,185,190,182,79,225,240,23,173,136,201,102,172,32,125,180,58,206,99,24,74,223,229,130,49,26,151,96,51,81,98,69,127,83,177,224,119,100,187,132,174,107,254,28,160,129,249,148,43,8,112,88,104,72,
143,25,253,69,148,135,108,222,82,183,248,123,171,35,211,115,114,226,2,75,227,87,143,31,102,42,171,85,178,7,40,235,47,3,194,181,134,154,123,197,211,165,8,55,48,242,135,40,35,178,165,191,2,186,106,3,237,92,130,22,138,43,28,207,167,146,180,121,243,240,242,7,78,161,226,105,101,205,244,218,6,213,190,5,209,31,98,52,196,138,254,166,52,157,83,46,162,160,85,243,5,50,225,138,164,117,235,246,11,57,236,131,64,170,239,96,94,6,159,113,189,81,16,110,62,249,138,33,150,61,6,221,221,174,5,62,77,70,189,230,145,181,141,84,113,5,93,196,4,111,212,6,96,255,21,80,25,36,251,152,214,151,233,189,137,204,67,64,103,119,158,217,176,189,66,232,7,136,139,137,231,56,91,25,121,219,238,200,161,71,10,124,124,233,15,66,248,201,30,132,0,0,0,0,9,131,134,128,50,72,237,43,30,172,112,17,108,78,114,90,253,251,255,14,15,86,56,133,61,30,213,174,54,39,57,45,10,100,217,15,104,33,166,92,155,209,84,91,36,58,46,54,12,177,103,10,147,15,231,87,180,210,150,238,27,158,145,155,128,79,197,192,97,162,32,220,90,105,75,119,28,22,26,18,226,10,186,147,192,229,42,160,60,67,224,34,18,29,23,27,14,11,13,9,242,173,199,139,45,185,168,182,20,200,169,30,87,133,25,241,175,76,7,117,238,187,221,153,163,253,96,127,247,159,38,1,92,188,245,114,68,197,59,102,91,52,126,251,139,118,41,67,203,220,198,35,182,104,252,237,184,99,241,228,215,202,220,49,66,16,133,99,19,64,34,151,132,32,17,198,133,125,36,74,210,248,61,187,174,17,50,249,199,109,161,41,29,75,47,158,220,243,48,178,13,236,82,134,119,208,227,193,43,108,22,179,169,153,185,112,17,250,72,148,71,34,100,233,168,196,140,252,160,26,63,240,86,216,44,125,34,239,144,51,135,199,78,73,217,193,209,56,140,254,162,202,152,54,11,212,166,207,129,245,165,40,222,122,218,38,142,183,63,164,191,173,44,228,157,58,80,13,146,120,106,155,204,95,84,98,70,126,246,194,19,141,144,232,184,216,46,94,247,57,130,245,175,195,159,190,128,93,105,124,147,208,111,169,45,213,207,179,18,37,200,59,153,172,16,167,125,24,232,110,99,156,219,123,187,59,205,9,120,38,110,244,24,89,236,1,183,154,131,168,154,79,230,101,110,149,170,126,230,255,33,8,207,188,239,230,232,21,186,217,155,231,74,206,54,111,234,212,9,159,41,214,124,176,49,175,178,164,42,49,35,63,198,48,148,165,53,192,102,162,116,55,188,78,252,166,202,130,224,176,208,144,51,21,216,167,241,74,152,4,65,247,218,236,127,14,80,205,23,47,246,145,118,141,214,77,67,77,176,239,204,84,77,170,228,223,4,150,158,227,181,209,76,27,136,106,193,184,31,44,70,127,81,101,157,4,234,94,1,93,53,140,250,115,116,135,251,46,65,11,179,90,29,103,146,82,210,219,233,51,86,16,109,19,71,214,154,140,97,215,55,122,12,161,89,142,20,248,235,137,60,19,206,238,39,169,183,53,201,97,225,237,229,28,122,60,177,71,156,89,223,210,85,63,115,242,24,121,206,20,115,191,55,199,83,234,205,247,95,91,170,253,223,20,111,61,120,134,219,68,202,129,243,175,185,62,196,104,56,44,52,36,194,95,64,163,22,114,195,29,188,12,37,226,40,139,73,60,255,65,149,13,57,113,1,168,8,222,179,12,216,156,228,180,100,144,193,86,123,97,132,203,213,112,182,50,72,116,92,108,208,66,87,184,244,81,80,167,65,126,83,101,23,26,195,164,39,58,
150,94,171,59,203,107,157,31,241,69,250,172,171,88,227,75,147,3,48,32,85,250,118,173,246,109,204,136,145,118,2,245,37,76,229,79,252,215,42,197,215,203,53,38,128,68,98,181,143,163,177,222,73,90,186,37,103,27,234,69,152,14,254,93,225,192,47,195,2,117,76,129,18,240,70,141,163,151,211,107,198,249,143,3,231,95,146,21,149,156,109,191,235,122,82,149,218,89,190,212,45,131,116,88,211,33,224,73,41,105,201,142,68,200,194,117,106,137,142,244,120,121,88,153,107,62,185,39,221,113,225,190,182,79,136,240,23,173,32,201,102,172,206,125,180,58,223,99,24,74,26,229,130,49,81,151,96,51,83,98,69,127,100,177,224,119,107,187,132,174,129,254,28,160,8,249,148,43,72,112,88,104,69,143,25,253,222,148,135,108,123,82,183,248,115,171,35,211,75,114,226,2,31,227,87,143,85,102,42,171,235,178,7,40,181,47,3,194,197,134,154,123,55,211,165,8,40,48,242,135,191,35,178,165,3,2,186,106,22,237,92,130,207,138,43,28,121,167,146,180,7,243,240,242,105,78,161,226,218,101,205,244,5,6,213,190,52,209,31,98,166,196,138,254,46,52,157,83,243,162,160,85,138,5,50,225,246,164,117,235,131,11,57,236,96,64,170,239,113,94,6,159,110,189,81,16,33,62,249,138,221,150,61,6,62,221,174,5,230,77,70,189,84,145,181,141,196,113,5,93,6,4,111,212,80,96,255,21,152,25,36,251,189,214,151,233,64,137,204,67,217,103,119,158,232,176,189,66,137,7,136,139,25,231,56,91,200,121,219,238,124,161,71,10,66,124,233,15,132,248,201,30,0,0,0,0,128,9,131,134,43,50,72,237,17,30,172,112,90,108,78,114,14,253,251,255,133,15,86,56,174,61,30,213,45,54,39,57,15,10,100,217,92,104,33,166,91,155,209,84,54,36,58,46,10,12,177,103,87,147,15,231,238,180,210,150,155,27,158,145,192,128,79,197,220,97,162,32,119,90,105,75,18,28,22,26,147,226,10,186,160,192,229,42,34,60,67,224,27,18,29,23,9,14,11,13,139,242,173,199,182,45,185,168,30,20,200,169,241,87,133,25,117,175,76,7,153,238,187,221,127,163,253,96,1,247,159,38,114,92,188,245,102,68,197,59,251,91,52,126,67,139,118,41,35,203,220,198,237,182,104,252,228,184,99,241,49,215,202,220,99,66,16,133,151,19,64,34,198,132,32,17,74,133,125,36,187,210,248,61,249,174,17,50,41,199,109,161,158,29,75,47,178,220,243,48,134,13,236,82,193,119,208,227,179,43,108,22,112,169,153,185,148,17,250,72,233,71,34,100,252,168,196,140,240,160,26,63,125,86,216,44,51,34,239,144,73,135,199,78,56,217,193,209,202,140,254,162,212,152,54,11,245,166,207,129,122,165,40,222,183,218,38,142,173,63,164,191,58,44,228,157,120,80,13,146,95,106,155,204,126,84,98,70,141,246,194,19,216,144,232,184,57,46,94,247,195,130,245,175,93,159,190,128,208,105,124,147,213,111,169,45,37,207,179,18,172,200,59,153,24,16,167,125,156,232,110,99,59,219,123,187,38,205,9,120,89,110,244,24,154,236,1,183,79,131,168,154,149,230,101,110,255,170,126,230,188,33,8,207,21,239,230,232,231,186,217,155,111,74,206,54,159,234,212,9,176,41,214,124,164,49,175,178,63,42,49,35,165,198,48,148,162,53,192,102,78,116,55,188,130,252,166,202,144,224,176,208,167,51,21,216,4,241,74,152,236,65,247,218,205,127,14,80,145,23,47,246,77,118,141,214,239,67,77,176,170,204,84,77,150,228,223,4,209,158,227,181,
106,76,27,136,44,193,184,31,101,70,127,81,94,157,4,234,140,1,93,53,135,250,115,116,11,251,46,65,103,179,90,29,219,146,82,210,16,233,51,86,214,109,19,71,215,154,140,97,161,55,122,12,248,89,142,20,19,235,137,60,169,206,238,39,97,183,53,201,28,225,237,229,71,122,60,177,210,156,89,223,242,85,63,115,20,24,121,206,199,115,191,55,247,83,234,205,253,95,91,170,61,223,20,111,68,120,134,219,175,202,129,243,104,185,62,196,36,56,44,52,163,194,95,64,29,22,114,195,226,188,12,37,60,40,139,73,13,255,65,149,168,57,113,1,12,8,222,179,180,216,156,228,86,100,144,193,203,123,97,132,50,213,112,182,108,72,116,92,184,208,66,87,167,244,81,80,101,65,126,83,164,23,26,195,94,39,58,150,107,171,59,203,69,157,31,241,88,250,172,171,3,227,75,147,250,48,32,85,109,118,173,246,118,204,136,145,76,2,245,37,215,229,79,252,203,42,197,215,68,53,38,128,163,98,181,143,90,177,222,73,27,186,37,103,14,234,69,152,192,254,93,225,117,47,195,2,240,76,129,18,151,70,141,163,249,211,107,198,95,143,3,231,156,146,21,149,122,109,191,235,89,82,149,218,131,190,212,45,33,116,88,211,105,224,73,41,200,201,142,68,137,194,117,106,121,142,244,120,62,88,153,107,113,185,39,221,79,225,190,182,173,136,240,23,172,32,201,102,58,206,125,180,74,223,99,24,49,26,229,130,51,81,151,96,127,83,98,69,119,100,177,224,174,107,187,132,160,129,254,28,43,8,249,148,104,72,112,88,253,69,143,25,108,222,148,135,248,123,82,183,211,115,171,35,2,75,114,226,143,31,227,87,171,85,102,42,40,235,178,7,194,181,47,3,123,197,134,154,8,55,211,165,135,40,48,242,165,191,35,178,106,3,2,186,130,22,237,92,28,207,138,43,180,121,167,146,242,7,243,240,226,105,78,161,244,218,101,205,190,5,6,213,98,52,209,31,254,166,196,138,83,46,52,157,85,243,162,160,225,138,5,50,235,246,164,117,236,131,11,57,239,96,64,170,159,113,94,6,16,110,189,81,138,33,62,249,6,221,150,61,5,62,221,174,189,230,77,70,141,84,145,181,93,196,113,5,212,6,4,111,21,80,96,255,251,152,25,36,233,189,214,151,67,64,137,204,158,217,103,119,66,232,176,189,139,137,7,136,91,25,231,56,238,200,121,219,10,124,161,71,15,66,124,233,30,132,248,201,0,0,0,0,134,128,9,131,237,43,50,72,112,17,30,172,114,90,108,78,255,14,253,251,56,133,15,86,213,174,61,30,57,45,54,39,217,15,10,100,166,92,104,33,84,91,155,209,46,54,36,58,103,10,12,177,231,87,147,15,150,238,180,210,145,155,27,158,197,192,128,79,32,220,97,162,75,119,90,105,26,18,28,22,186,147,226,10,42,160,192,229,224,34,60,67,23,27,18,29,13,9,14,11,199,139,242,173,168,182,45,185,169,30,20,200,25,241,87,133,7,117,175,76,221,153,238,187,96,127,163,253,38,1,247,159,245,114,92,188,59,102,68,197,126,251,91,52,41,67,139,118,198,35,203,220,252,237,182,104,241,228,184,99,220,49,215,202,133,99,66,16,34,151,19,64,17,198,132,32,36,74,133,125,61,187,210,248,50,249,174,17,161,41,199,109,47,158,29,75,48,178,220,243,82,134,13,236,227,193,119,208,22,179,43,108,185,112,169,153,72,148,17,250,100,233,71,34,140,252,168,196,63,240,160,26,44,125,86,216,144,51,34,239,78,73,135,199,209,56,217,193,162,202,140,254,11,212,152,54,129,245,166,207,222,122,165,40,142,183,218,38,191,173,63,164,
157,58,44,228,146,120,80,13,204,95,106,155,70,126,84,98,19,141,246,194,184,216,144,232,247,57,46,94,175,195,130,245,128,93,159,190,147,208,105,124,45,213,111,169,18,37,207,179,153,172,200,59,125,24,16,167,99,156,232,110,187,59,219,123,120,38,205,9,24,89,110,244,183,154,236,1,154,79,131,168,110,149,230,101,230,255,170,126,207,188,33,8,232,21,239,230,155,231,186,217,54,111,74,206,9,159,234,212,124,176,41,214,178,164,49,175,35,63,42,49,148,165,198,48,102,162,53,192,188,78,116,55,202,130,252,166,208,144,224,176,216,167,51,21,152,4,241,74,218,236,65,247,80,205,127,14,246,145,23,47,214,77,118,141,176,239,67,77,77,170,204,84,4,150,228,223,181,209,158,227,136,106,76,27,31,44,193,184,81,101,70,127,234,94,157,4,53,140,1,93,116,135,250,115,65,11,251,46,29,103,179,90,210,219,146,82,86,16,233,51,71,214,109,19,97,215,154,140,12,161,55,122,20,248,89,142,60,19,235,137,39,169,206,238,201,97,183,53,229,28,225,237,177,71,122,60,223,210,156,89,115,242,85,63,206,20,24,121,55,199,115,191,205,247,83,234,170,253,95,91,111,61,223,20,219,68,120,134,243,175,202,129,196,104,185,62,52,36,56,44,64,163,194,95,195,29,22,114,37,226,188,12,73,60,40,139,149,13,255,65,1,168,57,113,179,12,8,222,228,180,216,156,193,86,100,144,132,203,123,97,182,50,213,112,92,108,72,116,87,184,208,66,80,167,244,81,83,101,65,126,195,164,23,26,150,94,39,58,203,107,171,59,241,69,157,31,171,88,250,172,147,3,227,75,85,250,48,32,246,109,118,173,145,118,204,136,37,76,2,245,252,215,229,79,215,203,42,197,128,68,53,38,143,163,98,181,73,90,177,222,103,27,186,37,152,14,234,69,225,192,254,93,2,117,47,195,18,240,76,129,163,151,70,141,198,249,211,107,231,95,143,3,149,156,146,21,235,122,109,191,218,89,82,149,45,131,190,212,211,33,116,88,41,105,224,73,68,200,201,142,106,137,194,117,120,121,142,244,107,62,88,153,221,113,185,39,182,79,225,190,23,173,136,240,102,172,32,201,180,58,206,125,24,74,223,99,130,49,26,229,96,51,81,151,69,127,83,98,224,119,100,177,132,174,107,187,28,160,129,254,148,43,8,249,88,104,72,112,25,253,69,143,135,108,222,148,183,248,123,82,35,211,115,171,226,2,75,114,87,143,31,227,42,171,85,102,7,40,235,178,3,194,181,47,154,123,197,134,165,8,55,211,242,135,40,48,178,165,191,35,186,106,3,2,92,130,22,237,43,28,207,138,146,180,121,167,240,242,7,243,161,226,105,78,205,244,218,101,213,190,5,6,31,98,52,209,138,254,166,196,157,83,46,52,160,85,243,162,50,225,138,5,117,235,246,164,57,236,131,11,170,239,96,64,6,159,113,94,81,16,110,189,249,138,33,62,61,6,221,150,174,5,62,221,70,189,230,77,181,141,84,145,5,93,196,113,111,212,6,4,255,21,80,96,36,251,152,25,151,233,189,214,204,67,64,137,119,158,217,103,189,66,232,176,136,139,137,7,56,91,25,231,219,238,200,121,71,10,124,161,233,15,66,124,201,30,132,248,0,0,0,0,131,134,128,9,72,237,43,50,172,112,17,30,78,114,90,108,251,255,14,253,86,56,133,15,30,213,174,61,39,57,45,54,100,217,15,10,33,166,92,104,209,84,91,155,58,46,54,36,177,103,10,12,15,231,87,147,210,150,238,180,158,145,155,27,79,197,192,128,162,32,220,97,105,75,119,90,22,26,18,28,10,186,147,226,229,42,160,192,67,
224,34,60,29,23,27,18,11,13,9,14,173,199,139,242,185,168,182,45,200,169,30,20,133,25,241,87,76,7,117,175,187,221,153,238,253,96,127,163,159,38,1,247,188,245,114,92,197,59,102,68,52,126,251,91,118,41,67,139,220,198,35,203,104,252,237,182,99,241,228,184,202,220,49,215,16,133,99,66,64,34,151,19,32,17,198,132,125,36,74,133,248,61,187,210,17,50,249,174,109,161,41,199,75,47,158,29,243,48,178,220,236,82,134,13,208,227,193,119,108,22,179,43,153,185,112,169,250,72,148,17,34,100,233,71,196,140,252,168,26,63,240,160,216,44,125,86,239,144,51,34,199,78,73,135,193,209,56,217,254,162,202,140,54,11,212,152,207,129,245,166,40,222,122,165,38,142,183,218,164,191,173,63,228,157,58,44,13,146,120,80,155,204,95,106,98,70,126,84,194,19,141,246,232,184,216,144,94,247,57,46,245,175,195,130,190,128,93,159,124,147,208,105,169,45,213,111,179,18,37,207,59,153,172,200,167,125,24,16,110,99,156,232,123,187,59,219,9,120,38,205,244,24,89,110,1,183,154,236,168,154,79,131,101,110,149,230,126,230,255,170,8,207,188,33,230,232,21,239,217,155,231,186,206,54,111,74,212,9,159,234,214,124,176,41,175,178,164,49,49,35,63,42,48,148,165,198,192,102,162,53,55,188,78,116,166,202,130,252,176,208,144,224,21,216,167,51,74,152,4,241,247,218,236,65,14,80,205,127,47,246,145,23,141,214,77,118,77,176,239,67,84,77,170,204,223,4,150,228,227,181,209,158,27,136,106,76,184,31,44,193,127,81,101,70,4,234,94,157,93,53,140,1,115,116,135,250,46,65,11,251,90,29,103,179,82,210,219,146,51,86,16,233,19,71,214,109,140,97,215,154,122,12,161,55,142,20,248,89,137,60,19,235,238,39,169,206,53,201,97,183,237,229,28,225,60,177,71,122,89,223,210,156,63,115,242,85,121,206,20,24,191,55,199,115,234,205,247,83,91,170,253,95,20,111,61,223,134,219,68,120,129,243,175,202,62,196,104,185,44,52,36,56,95,64,163,194,114,195,29,22,12,37,226,188,139,73,60,40,65,149,13,255,113,1,168,57,222,179,12,8,156,228,180,216,144,193,86,100,97,132,203,123,112,182,50,213,116,92,108,72,66,87,184,208,198,165,99,99,248,132,124,124,238,153,119,119,246,141,123,123,255,13,242,242,214,189,107,107,222,177,111,111,145,84,197,197,96,80,48,48,2,3,1,1,206,169,103,103,86,125,43,43,231,25,254,254,181,98,215,215,77,230,171,171,236,154,118,118,143,69,202,202,31,157,130,130,137,64,201,201,250,135,125,125,239,21,250,250,178,235,89,89,142,201,71,71,251,11,240,240,65,236,173,173,179,103,212,212,95,253,162,162,69,234,175,175,35,191,156,156,83,247,164,164,228,150,114,114,155,91,192,192,117,194,183,183,225,28,253,253,61,174,147,147,76,106,38,38,108,90,54,54,126,65,63,63,245,2,247,247,131,79,204,204,104,92,52,52,81,244,165,165,209,52,229,229,249,8,241,241,226,147,113,113,171,115,216,216,98,83,49,49,42,63,21,21,8,12,4,4,149,82,199,199,70,101,35,35,157,94,195,195,48,40,24,24,55,161,150,150,10,15,5,5,47,181,154,154,14,9,7,7,36,54,18,18,27,155,128,128,223,61,226,226,205,38,235,235,78,105,39,39,127,205,178,178,234,159,117,117,18,27,9,9,29,158,131,131,88,116,44,44,52,46,26,26,54,45,27,27,220,178,110,110,180,238,90,90,91,251,160,160,164,246,82,82,118,77,59,59,183,97,214,214,125,206,
179,179,82,123,41,41,221,62,227,227,94,113,47,47,19,151,132,132,166,245,83,83,185,104,209,209,0,0,0,0,193,44,237,237,64,96,32,32,227,31,252,252,121,200,177,177,182,237,91,91,212,190,106,106,141,70,203,203,103,217,190,190,114,75,57,57,148,222,74,74,152,212,76,76,176,232,88,88,133,74,207,207,187,107,208,208,197,42,239,239,79,229,170,170,237,22,251,251,134,197,67,67,154,215,77,77,102,85,51,51,17,148,133,133,138,207,69,69,233,16,249,249,4,6,2,2,254,129,127,127,160,240,80,80,120,68,60,60,37,186,159,159,75,227,168,168,162,243,81,81,93,254,163,163,128,192,64,64,5,138,143,143,63,173,146,146,33,188,157,157,112,72,56,56,241,4,245,245,99,223,188,188,119,193,182,182,175,117,218,218,66,99,33,33,32,48,16,16,229,26,255,255,253,14,243,243,191,109,210,210,129,76,205,205,24,20,12,12,38,53,19,19,195,47,236,236,190,225,95,95,53,162,151,151,136,204,68,68,46,57,23,23,147,87,196,196,85,242,167,167,252,130,126,126,122,71,61,61,200,172,100,100,186,231,93,93,50,43,25,25,230,149,115,115,192,160,96,96,25,152,129,129,158,209,79,79,163,127,220,220,68,102,34,34,84,126,42,42,59,171,144,144,11,131,136,136,140,202,70,70,199,41,238,238,107,211,184,184,40,60,20,20,167,121,222,222,188,226,94,94,22,29,11,11,173,118,219,219,219,59,224,224,100,86,50,50,116,78,58,58,20,30,10,10,146,219,73,73,12,10,6,6,72,108,36,36,184,228,92,92,159,93,194,194,189,110,211,211,67,239,172,172,196,166,98,98,57,168,145,145,49,164,149,149,211,55,228,228,242,139,121,121,213,50,231,231,139,67,200,200,110,89,55,55,218,183,109,109,1,140,141,141,177,100,213,213,156,210,78,78,73,224,169,169,216,180,108,108,172,250,86,86,243,7,244,244,207,37,234,234,202,175,101,101,244,142,122,122,71,233,174,174,16,24,8,8,111,213,186,186,240,136,120,120,74,111,37,37,92,114,46,46,56,36,28,28,87,241,166,166,115,199,180,180,151,81,198,198,203,35,232,232,161,124,221,221,232,156,116,116,62,33,31,31,150,221,75,75,97,220,189,189,13,134,139,139,15,133,138,138,224,144,112,112,124,66,62,62,113,196,181,181,204,170,102,102,144,216,72,72,6,5,3,3,247,1,246,246,28,18,14,14,194,163,97,97,106,95,53,53,174,249,87,87,105,208,185,185,23,145,134,134,153,88,193,193,58,39,29,29,39,185,158,158,217,56,225,225,235,19,248,248,43,179,152,152,34,51,17,17,210,187,105,105,169,112,217,217,7,137,142,142,51,167,148,148,45,182,155,155,60,34,30,30,21,146,135,135,201,32,233,233,135,73,206,206,170,255,85,85,80,120,40,40,165,122,223,223,3,143,140,140,89,248,161,161,9,128,137,137,26,23,13,13,101,218,191,191,215,49,230,230,132,198,66,66,208,184,104,104,130,195,65,65,41,176,153,153,90,119,45,45,30,17,15,15,123,203,176,176,168,252,84,84,109,214,187,187,44,58,22,22,99,198,165,99,124,248,132,124,119,238,153,119,123,246,141,123,242,255,13,242,107,214,189,107,111,222,177,111,197,145,84,197,48,96,80,48,1,2,3,1,103,206,169,103,43,86,125,43,254,231,25,254,215,181,98,215,171,77,230,171,118,236,154,118,202,143,69,202,130,31,157,130,201,137,64,201,125,250,135,125,250,239,21,250,89,178,235,89,71,142,201,71,240,251,11,240,173,65,236,173,212,179,103,212,162,95,253,162,175,69,234,175,156,
35,191,156,164,83,247,164,114,228,150,114,192,155,91,192,183,117,194,183,253,225,28,253,147,61,174,147,38,76,106,38,54,108,90,54,63,126,65,63,247,245,2,247,204,131,79,204,52,104,92,52,165,81,244,165,229,209,52,229,241,249,8,241,113,226,147,113,216,171,115,216,49,98,83,49,21,42,63,21,4,8,12,4,199,149,82,199,35,70,101,35,195,157,94,195,24,48,40,24,150,55,161,150,5,10,15,5,154,47,181,154,7,14,9,7,18,36,54,18,128,27,155,128,226,223,61,226,235,205,38,235,39,78,105,39,178,127,205,178,117,234,159,117,9,18,27,9,131,29,158,131,44,88,116,44,26,52,46,26,27,54,45,27,110,220,178,110,90,180,238,90,160,91,251,160,82,164,246,82,59,118,77,59,214,183,97,214,179,125,206,179,41,82,123,41,227,221,62,227,47,94,113,47,132,19,151,132,83,166,245,83,209,185,104,209,0,0,0,0,237,193,44,237,32,64,96,32,252,227,31,252,177,121,200,177,91,182,237,91,106,212,190,106,203,141,70,203,190,103,217,190,57,114,75,57,74,148,222,74,76,152,212,76,88,176,232,88,207,133,74,207,208,187,107,208,239,197,42,239,170,79,229,170,251,237,22,251,67,134,197,67,77,154,215,77,51,102,85,51,133,17,148,133,69,138,207,69,249,233,16,249,2,4,6,2,127,254,129,127,80,160,240,80,60,120,68,60,159,37,186,159,168,75,227,168,81,162,243,81,163,93,254,163,64,128,192,64,143,5,138,143,146,63,173,146,157,33,188,157,56,112,72,56,245,241,4,245,188,99,223,188,182,119,193,182,218,175,117,218,33,66,99,33,16,32,48,16,255,229,26,255,243,253,14,243,210,191,109,210,205,129,76,205,12,24,20,12,19,38,53,19,236,195,47,236,95,190,225,95,151,53,162,151,68,136,204,68,23,46,57,23,196,147,87,196,167,85,242,167,126,252,130,126,61,122,71,61,100,200,172,100,93,186,231,93,25,50,43,25,115,230,149,115,96,192,160,96,129,25,152,129,79,158,209,79,220,163,127,220,34,68,102,34,42,84,126,42,144,59,171,144,136,11,131,136,70,140,202,70,238,199,41,238,184,107,211,184,20,40,60,20,222,167,121,222,94,188,226,94,11,22,29,11,219,173,118,219,224,219,59,224,50,100,86,50,58,116,78,58,10,20,30,10,73,146,219,73,6,12,10,6,36,72,108,36,92,184,228,92,194,159,93,194,211,189,110,211,172,67,239,172,98,196,166,98,145,57,168,145,149,49,164,149,228,211,55,228,121,242,139,121,231,213,50,231,200,139,67,200,55,110,89,55,109,218,183,109,141,1,140,141,213,177,100,213,78,156,210,78,169,73,224,169,108,216,180,108,86,172,250,86,244,243,7,244,234,207,37,234,101,202,175,101,122,244,142,122,174,71,233,174,8,16,24,8,186,111,213,186,120,240,136,120,37,74,111,37,46,92,114,46,28,56,36,28,166,87,241,166,180,115,199,180,198,151,81,198,232,203,35,232,221,161,124,221,116,232,156,116,31,62,33,31,75,150,221,75,189,97,220,189,139,13,134,139,138,15,133,138,112,224,144,112,62,124,66,62,181,113,196,181,102,204,170,102,72,144,216,72,3,6,5,3,246,247,1,246,14,28,18,14,97,194,163,97,53,106,95,53,87,174,249,87,185,105,208,185,134,23,145,134,193,153,88,193,29,58,39,29,158,39,185,158,225,217,56,225,248,235,19,248,152,43,179,152,17,34,51,17,105,210,187,105,217,169,112,217,142,7,137,142,148,51,167,148,155,45,182,155,30,60,34,30,135,21,146,135,233,201,32,233,206,135,73,206,85,170,255,85,40,80,120,40,223,
165,122,223,140,3,143,140,161,89,248,161,137,9,128,137,13,26,23,13,191,101,218,191,230,215,49,230,66,132,198,66,104,208,184,104,65,130,195,65,153,41,176,153,45,90,119,45,15,30,17,15,176,123,203,176,84,168,252,84,187,109,214,187,22,44,58,22,99,99,198,165,124,124,248,132,119,119,238,153,123,123,246,141,242,242,255,13,107,107,214,189,111,111,222,177,197,197,145,84,48,48,96,80,1,1,2,3,103,103,206,169,43,43,86,125,254,254,231,25,215,215,181,98,171,171,77,230,118,118,236,154,202,202,143,69,130,130,31,157,201,201,137,64,125,125,250,135,250,250,239,21,89,89,178,235,71,71,142,201,240,240,251,11,173,173,65,236,212,212,179,103,162,162,95,253,175,175,69,234,156,156,35,191,164,164,83,247,114,114,228,150,192,192,155,91,183,183,117,194,253,253,225,28,147,147,61,174,38,38,76,106,54,54,108,90,63,63,126,65,247,247,245,2,204,204,131,79,52,52,104,92,165,165,81,244,229,229,209,52,241,241,249,8])
.concat([113,113,226,147,216,216,171,115,49,49,98,83,21,21,42,63,4,4,8,12,199,199,149,82,35,35,70,101,195,195,157,94,24,24,48,40,150,150,55,161,5,5,10,15,154,154,47,181,7,7,14,9,18,18,36,54,128,128,27,155,226,226,223,61,235,235,205,38,39,39,78,105,178,178,127,205,117,117,234,159,9,9,18,27,131,131,29,158,44,44,88,116,26,26,52,46,27,27,54,45,110,110,220,178,90,90,180,238,160,160,91,251,82,82,164,246,59,59,118,77,214,214,183,97,179,179,125,206,41,41,82,123,227,227,221,62,47,47,94,113,132,132,19,151,83,83,166,245,209,209,185,104,0,0,0,0,237,237,193,44,32,32,64,96,252,252,227,31,177,177,121,200,91,91,182,237,106,106,212,190,203,203,141,70,190,190,103,217,57,57,114,75,74,74,148,222,76,76,152,212,88,88,176,232,207,207,133,74,208,208,187,107,239,239,197,42,170,170,79,229,251,251,237,22,67,67,134,197,77,77,154,215,51,51,102,85,133,133,17,148,69,69,138,207,249,249,233,16,2,2,4,6,127,127,254,129,80,80,160,240,60,60,120,68,159,159,37,186,168,168,75,227,81,81,162,243,163,163,93,254,64,64,128,192,143,143,5,138,146,146,63,173,157,157,33,188,56,56,112,72,245,245,241,4,188,188,99,223,182,182,119,193,218,218,175,117,33,33,66,99,16,16,32,48,255,255,229,26,243,243,253,14,210,210,191,109,205,205,129,76,12,12,24,20,19,19,38,53,236,236,195,47,95,95,190,225,151,151,53,162,68,68,136,204,23,23,46,57,196,196,147,87,167,167,85,242,126,126,252,130,61,61,122,71,100,100,200,172,93,93,186,231,25,25,50,43,115,115,230,149,96,96,192,160,129,129,25,152,79,79,158,209,220,220,163,127,34,34,68,102,42,42,84,126,144,144,59,171,136,136,11,131,70,70,140,202,238,238,199,41,184,184,107,211,20,20,40,60,222,222,167,121,94,94,188,226,11,11,22,29,219,219,173,118,224,224,219,59,50,50,100,86,58,58,116,78,10,10,20,30,73,73,146,219,6,6,12,10,36,36,72,108,92,92,184,228,194,194,159,93,211,211,189,110,172,172,67,239,98,98,196,166,145,145,57,168,149,149,49,164,228,228,211,55,121,121,242,139,231,231,213,50,200,200,139,67,55,55,110,89,109,109,218,183,141,141,1,140,213,213,177,100,78,78,156,210,169,169,73,224,108,108,216,180,86,86,172,250,244,244,243,7,234,234,207,37,101,101,202,175,122,122,244,142,174,174,71,233,8,8,16,24,186,186,111,213,120,120,240,136,37,37,74,111,46,46,92,114,28,28,56,36,166,166,87,241,180,180,115,199,198,198,151,81,232,232,203,35,221,221,161,124,116,116,232,156,31,31,62,33,75,75,150,221,189,189,97,220,139,139,13,134,138,138,15,133,112,112,224,144,62,62,124,66,181,181,113,196,102,102,204,170,72,72,144,216,3,3,6,5,246,246,247,1,14,14,28,18,97,97,194,163,53,53,106,95,87,87,174,249,185,185,105,208,134,134,23,145,193,193,153,88,29,29,58,39,158,158,39,185,225,225,217,56,248,248,235,19,152,152,43,179,17,17,34,51,105,105,210,187,217,217,169,112,142,142,7,137,148,148,51,167,155,155,45,182,30,30,60,34,135,135,21,146,233,233,201,32,206,206,135,73,85,85,170,255,40,40,80,120,223,223,165,122,140,140,3,143,161,161,89,248,137,137,9,128,13,13,26,23,191,191,101,218,230,230,215,49,66,66,132,198,104,104,208,184,65,65,130,195,153,153,41,176,45,45,90,119,15,15,30,17,176,176,123,203,84,84,168,252,187,187,
109,214,22,22,44,58,165,99,99,198,132,124,124,248,153,119,119,238,141,123,123,246,13,242,242,255,189,107,107,214,177,111,111,222,84,197,197,145,80,48,48,96,3,1,1,2,169,103,103,206,125,43,43,86,25,254,254,231,98,215,215,181,230,171,171,77,154,118,118,236,69,202,202,143,157,130,130,31,64,201,201,137,135,125,125,250,21,250,250,239,235,89,89,178,201,71,71,142,11,240,240,251,236,173,173,65,103,212,212,179,253,162,162,95,234,175,175,69,191,156,156,35,247,164,164,83,150,114,114,228,91,192,192,155,194,183,183,117,28,253,253,225,174,147,147,61,106,38,38,76,90,54,54,108,65,63,63,126,2,247,247,245,79,204,204,131,92,52,52,104,244,165,165,81,52,229,229,209,8,241,241,249,147,113,113,226,115,216,216,171,83,49,49,98,63,21,21,42,12,4,4,8,82,199,199,149,101,35,35,70,94,195,195,157,40,24,24,48,161,150,150,55,15,5,5,10,181,154,154,47,9,7,7,14,54,18,18,36,155,128,128,27,61,226,226,223,38,235,235,205,105,39,39,78,205,178,178,127,159,117,117,234,27,9,9,18,158,131,131,29,116,44,44,88,46,26,26,52,45,27,27,54,178,110,110,220,238,90,90,180,251,160,160,91,246,82,82,164,77,59,59,118,97,214,214,183,206,179,179,125,123,41,41,82,62,227,227,221,113,47,47,94,151,132,132,19,245,83,83,166,104,209,209,185,0,0,0,0,44,237,237,193,96,32,32,64,31,252,252,227,200,177,177,121,237,91,91,182,190,106,106,212,70,203,203,141,217,190,190,103,75,57,57,114,222,74,74,148,212,76,76,152,232,88,88,176,74,207,207,133,107,208,208,187,42,239,239,197,229,170,170,79,22,251,251,237,197,67,67,134,215,77,77,154,85,51,51,102,148,133,133,17,207,69,69,138,16,249,249,233,6,2,2,4,129,127,127,254,240,80,80,160,68,60,60,120,186,159,159,37,227,168,168,75,243,81,81,162,254,163,163,93,192,64,64,128,138,143,143,5,173,146,146,63,188,157,157,33,72,56,56,112,4,245,245,241,223,188,188,99,193,182,182,119,117,218,218,175,99,33,33,66,48,16,16,32,26,255,255,229,14,243,243,253,109,210,210,191,76,205,205,129,20,12,12,24,53,19,19,38,47,236,236,195,225,95,95,190,162,151,151,53,204,68,68,136,57,23,23,46,87,196,196,147,242,167,167,85,130,126,126,252,71,61,61,122,172,100,100,200,231,93,93,186,43,25,25,50,149,115,115,230,160,96,96,192,152,129,129,25,209,79,79,158,127,220,220,163,102,34,34,68,126,42,42,84,171,144,144,59,131,136,136,11,202,70,70,140,41,238,238,199,211,184,184,107,60,20,20,40,121,222,222,167,226,94,94,188,29,11,11,22,118,219,219,173,59,224,224,219,86,50,50,100,78,58,58,116,30,10,10,20,219,73,73,146,10,6,6,12,108,36,36,72,228,92,92,184,93,194,194,159,110,211,211,189,239,172,172,67,166,98,98,196,168,145,145,57,164,149,149,49,55,228,228,211,139,121,121,242,50,231,231,213,67,200,200,139,89,55,55,110,183,109,109,218,140,141,141,1,100,213,213,177,210,78,78,156,224,169,169,73,180,108,108,216,250,86,86,172,7,244,244,243,37,234,234,207,175,101,101,202,142,122,122,244,233,174,174,71,24,8,8,16,213,186,186,111,136,120,120,240,111,37,37,74,114,46,46,92,36,28,28,56,241,166,166,87,199,180,180,115,81,198,198,151,35,232,232,203,124,221,221,161,156,116,116,232,33,31,31,62,221,75,75,150,220,189,189,97,134,139,139,13,133,138,138,15,144,112,
112,224,66,62,62,124,196,181,181,113,170,102,102,204,216,72,72,144,5,3,3,6,1,246,246,247,18,14,14,28,163,97,97,194,95,53,53,106,249,87,87,174,208,185,185,105,145,134,134,23,88,193,193,153,39,29,29,58,185,158,158,39,56,225,225,217,19,248,248,235,179,152,152,43,51,17,17,34,187,105,105,210,112,217,217,169,137,142,142,7,167,148,148,51,182,155,155,45,34,30,30,60,146,135,135,21,32,233,233,201,73,206,206,135,255,85,85,170,120,40,40,80,122,223,223,165,143,140,140,3,248,161,161,89,128,137,137,9,23,13,13,26,218,191,191,101,49,230,230,215,198,66,66,132,184,104,104,208,195,65,65,130,176,153,153,41,119,45,45,90,17,15,15,30,203,176,176,123,252,84,84,168,214,187,187,109,58,22,22,44,82,9,106,213,48,54,165,56,191,64,163,158,129,243,215,251,124,227,57,130,155,47,255,135,52,142,67,68,196,222,233,203,84,123,148,50,166,194,35,61,238,76,149,11,66,250,195,78,8,46,161,102,40,217,36,178,118,91,162,73,109,139,209,37,114,248,246,100,134,104,152,22,212,164,92,204,93,101,182,146,108,112,72,80,253,237,185,218,94,21,70,87,167,141,157,132,144,216,171,0,140,188,211,10,247,228,88,5,184,179,69,6,208,44,30,143,202,63,15,2,193,175,189,3,1,19,138,107,58,145,17,65,79,103,220,234,151,242,207,206,240,180,230,115,150,172,116,34,231,173,53,133,226,249,55,232,28,117,223,110,71,241,26,113,29,41,197,137,111,183,98,14,170,24,190,27,252,86,62,75,198,210,121,32,154,219,192,254,120,205,90,244,31,221,168,51,136,7,199,49,177,18,16,89,39,128,236,95,96,81,127,169,25,181,74,13,45,229,122,159,147,201,156,239,160,224,59,77,174,42,245,176,200,235,187,60,131,83,153,97,23,43,4,126,186,119,214,38,225,105,20,99,85,33,12,125,99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___gxx_personality_v0() {
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_strlen"] = _strlen;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device requiresd",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address requiresd",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",
112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not requiresd by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead requires a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? requires('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only requiresd on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = requires('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___errno_location() {
      return ___errno_state;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _abort() {
      Module['abort']();
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until requiresd precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
              Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = requires("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var r=env._stderr|0;var s=env.___fsmu8|0;var t=env._stdout|0;var u=env.___dso_handle|0;var v=+env.NaN;var w=+env.Infinity;var x=0;var y=0;var z=0;var A=0;var B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0.0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=global.Math.floor;var V=global.Math.abs;var W=global.Math.sqrt;var X=global.Math.pow;var Y=global.Math.cos;var Z=global.Math.sin;var _=global.Math.tan;var $=global.Math.acos;var aa=global.Math.asin;var ab=global.Math.atan;var ac=global.Math.atan2;var ad=global.Math.exp;var ae=global.Math.log;var af=global.Math.ceil;var ag=global.Math.imul;var ah=env.abort;var ai=env.assert;var aj=env.asmPrintInt;var ak=env.asmPrintFloat;var al=env.min;var am=env.invoke_viiiii;var an=env.invoke_viiiiiii;var ao=env.invoke_vi;var ap=env.invoke_vii;var aq=env.invoke_iii;var ar=env.invoke_iiii;var as=env.invoke_viiiiiid;var at=env.invoke_ii;var au=env.invoke_viii;var av=env.invoke_viiiiid;var aw=env.invoke_v;var ax=env.invoke_iiiiiiiii;var ay=env.invoke_viiiiiiiii;var az=env.invoke_viiiiiiii;var aA=env.invoke_viiiiii;var aB=env.invoke_iiiii;var aC=env.invoke_iiiiii;var aD=env.invoke_viiii;var aE=env._llvm_lifetime_end;var aF=env._llvm_va_end;var aG=env._vsscanf;var aH=env._sscanf;var aI=env.___ctype_tolower_loc;var aJ=env._snprintf;var aK=env._vsnprintf;var aL=env._fgetc;var aM=env.___cxa_throw;var aN=env._strerror;var aO=env._pthread_mutex_lock;var aP=env._atexit;var aQ=env._abort;var aR=env.___cxa_end_catch;var aS=env.___cxa_free_exception;var aT=env._isdigit;var aU=env._pread;var aV=env._fflush;var aW=env.__addDays;var aX=env._catclose;var aY=env.__arraySum;var aZ=env._sysconf;var a_=env.___cxa_rethrow;var a$=env.___setErrNo;var a0=env._fwrite;var a1=env._send;var a2=env._llvm_eh_exception;var a3=env._isxdigit;var a4=env._write;var a5=env.__scanString;var a6=env._strtoull;var a7=env._exit;var a8=env._sprintf;var a9=env._asprintf;var ba=env.___ctype_b_loc;var bb=env.___cxa_find_matching_catch;var bc=env._freelocale;var bd=env.___cxa_allocate_exception;var be=env._isspace;var bf=env._strtoll;var bg=env._fread;var bh=env._catgets;var bi=env._time;var bj=env._vasprintf;var bk=env.__isLeapYear;var bl=env._read;var bm=env.__formatString;var bn=env.__reallyNegative;var bo=env.___resumeException;var bp=env.___cxa_is_number_type;var bq=env._pthread_cond_broadcast;var br=env.___cxa_begin_catch;var bs=env.___ctype_
toupper_loc;var bt=env.___cxa_guard_acquire;var bu=env.__ZSt9terminatev;var bv=env.___cxa_does_inherit;var bw=env._isascii;var bx=env._pthread_mutex_unlock;var by=env.__getFloat;var bz=env._recv;var bA=env.__parseInt64;var bB=env.___cxa_guard_abort;var bC=env.__ZSt18uncaught_exceptionv;var bD=env._pwrite;var bE=env.___cxa_call_unexpected;var bF=env._sbrk;var bG=env._strerror_r;var bH=env._newlocale;var bI=env.___errno_location;var bJ=env.___gxx_personality_v0;var bK=env._catopen;var bL=env._pthread_cond_wait;var bM=env._llvm_lifetime_start;var bN=env._uselocale;var bO=env.___cxa_guard_release;var bP=env._ungetc;var bQ=env.__exit;var bR=env._strftime;var bS=0.0;
// EMSCRIPTEN_START_FUNCS
function b9(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function ca(){return i|0}function cb(a){a=a|0;i=a}function cc(a,b){a=a|0;b=b|0;if((x|0)==0){x=a;y=b}}function cd(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function ce(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function cf(a){a=a|0;K=a}function cg(a){a=a|0;L=a}function ch(a){a=a|0;M=a}function ci(a){a=a|0;N=a}function cj(a){a=a|0;O=a}function ck(a){a=a|0;P=a}function cl(a){a=a|0;Q=a}function cm(a){a=a|0;R=a}function cn(a){a=a|0;S=a}function co(a){a=a|0;T=a}function cp(){c[2074]=p+8;c[2076]=p+8;c[2078]=q+8;c[2082]=q+8;c[2086]=q+8;c[2090]=q+8;c[2094]=q+8;c[2098]=p+8;c[2132]=q+8;c[2136]=q+8;c[2200]=q+8;c[2204]=q+8;c[2224]=p+8;c[2226]=q+8;c[2262]=q+8;c[2266]=q+8;c[2302]=q+8;c[2306]=q+8;c[2326]=p+8;c[2328]=p+8;c[2330]=q+8;c[2334]=q+8;c[2338]=q+8;c[2342]=p+8;c[2344]=p+8;c[2346]=p+8;c[2348]=p+8;c[2350]=p+8;c[2352]=p+8;c[2354]=p+8;c[2380]=q+8;c[2384]=p+8;c[2386]=q+8;c[2390]=q+8;c[2394]=q+8;c[2398]=p+8;c[2400]=p+8;c[2402]=p+8;c[2404]=p+8;c[2438]=p+8;c[2440]=p+8;c[2442]=p+8;c[2444]=q+8;c[2448]=q+8;c[2452]=q+8;c[2456]=q+8;c[2460]=q+8;c[2464]=q+8;c[2468]=p+8}function cq(a,b){a=a|0;b=b|0;var c=0;a=b&15;if((a|0)==0){c=b}else{c=b+16-a|0}return c+32|0}function cr(b,c,d,e,f,g){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=g&15;if((h|0)==0){i=g}else{i=g+16-h|0}h=i+16|0;j=32-g+i|0;k=kM(h)|0;l=kM(h)|0;if((g|0)==0){m=k}else{n=e;e=k;o=0;while(1){a[e]=a[n]|0;p=o+1|0;if(p>>>0<g>>>0){n=n+1|0;e=e+1|0;o=p}else{break}}m=k+g|0}switch(j|0){case 33:{q=k+(i+15)|0;r=26;break};case 47:{kV(m|0,15,15);a[k+(i+15)|0]=-113;s=m+15|0;break};case 46:{kV(m|0,14,14);a[k+(i+15)|0]=-114;s=m+14|0;break};case 45:{kV(m|0,13,13);a[k+(i+15)|0]=-115;s=m+13|0;break};case 44:{kV(m|0,12,12);a[k+(i+15)|0]=-116;s=m+12|0;break};case 43:{kV(m|0,11,11);a[k+(i+15)|0]=-117;s=m+11|0;break};case 42:{kV(m|0,10,10);a[k+(i+15)|0]=-118;s=m+10|0;break};case 41:{kV(m|0,9,9);a[k+(i+15)|0]=-119;s=m+9|0;break};case 40:{j=m;g=j|0;C=134744072;a[g]=C&255;C=C>>8;a[g+1|0]=C&255;C=C>>8;a[g+2|0]=C&255;C=C>>8;a[g+3|0]=C&255;g=j+4|0;C=134744072;a[g]=C&255;C=C>>8;a[g+1|0]=C&255;C=C>>8;a[g+2|0]=C&255;C=C>>8;a[g+3|0]=C&255;a[k+(i+15)|0]=-120;s=m+8|0;break};case 39:{kV(m|0,7,7);a[k+(i+15)|0]=-121;s=m+7|0;break};case 38:{kV(m|0,6,6);a[k+(i+15)|0]=-122;s=m+6|0;break};case 37:{kV(m|0,5,5);a[k+(i+15)|0]=-123;s=m+5|0;break};case 36:{g=m;C=67372036;a[g]=C&255;C=C>>8;a[g+1|0]=C&255;C=C>>8;a[g+2|0]=C&255;C=C>>8;a[g+3|0]=C&255;a[k+(i+15)|0]=-124;s=m+4|0;break};case 35:{kV(m|0,3,3);a[k+(i+15)|0]=-125;s=m+3|0;break};case 34:{g=m;C=514;a[g]=C&255;C=C>>8;a[g+1|0]=C&255;a[k+(i+15)|0]=-126;s=m+2|0;break};case 32:{g=k+(i+15)|0;a[g]=-128;q=g;r=26;break};default:{cs(26432,2048)|0;s=m}}if((r|0)==26){a[m]=1;a[q]=-127;s=m+1|0}kV(s|0,-128|0,15);s=b|0;cy(s,d,c,16,16);cD(s,k,l,h,1);if((h|0)==0){t=f}else{s=l;d=f;b=0;
while(1){a[d]=a[s]|0;m=b+1|0;if(m>>>0<h>>>0){s=s+1|0;d=d+1|0;b=m}else{break}}t=f+h|0}a[t]=a[c]|0;a[t+1|0]=a[c+1|0]|0;a[t+2|0]=a[c+2|0]|0;a[t+3|0]=a[c+3|0]|0;a[t+4|0]=a[c+4|0]|0;a[t+5|0]=a[c+5|0]|0;a[t+6|0]=a[c+6|0]|0;a[t+7|0]=a[c+7|0]|0;a[t+8|0]=a[c+8|0]|0;a[t+9|0]=a[c+9|0]|0;a[t+10|0]=a[c+10|0]|0;a[t+11|0]=a[c+11|0]|0;a[t+12|0]=a[c+12|0]|0;a[t+13|0]=a[c+13|0]|0;a[t+14|0]=a[c+14|0]|0;a[t+15|0]=a[c+15|0]|0;if((k|0)!=0){kO(k)}if((l|0)==0){return}kO(l);return}function cs(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=g|0;a[k]=0;c[g+4>>2]=b;l=b;m=c[(c[l>>2]|0)-12>>2]|0;n=b;do{if((c[n+(m+16)>>2]|0)==0){o=c[n+(m+72)>>2]|0;if((o|0)!=0){ew(o)|0}a[k]=1;o=kW(d|0)|0;p=c[(c[l>>2]|0)-12>>2]|0;c[h>>2]=c[n+(p+24)>>2];q=d+o|0;o=(c[n+(p+4)>>2]&176|0)==32?q:d;r=n+p|0;s=n+(p+76)|0;p=c[s>>2]|0;if((p|0)==-1){d_(f,r);t=io(f,26336)|0;u=bX[c[(c[t>>2]|0)+28>>2]&31](t,32)|0;im(f);c[s>>2]=u<<24>>24;v=u}else{v=p&255}cu(j,h,d,o,q,r,v);if((c[j>>2]|0)!=0){break}r=c[(c[l>>2]|0)-12>>2]|0;dY(n+r|0,c[n+(r+16)>>2]|5)}}while(0);eH(g);i=e;return b|0}function ct(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0;i=g-16|0;j=kM(16)|0;k=kM(i)|0;a[j]=a[e+i|0]|0;a[j+1|0]=a[e+(g-15)|0]|0;a[j+2|0]=a[e+(g-14)|0]|0;a[j+3|0]=a[e+(g-13)|0]|0;a[j+4|0]=a[e+(g-12)|0]|0;a[j+5|0]=a[e+(g-11)|0]|0;a[j+6|0]=a[e+(g-10)|0]|0;a[j+7|0]=a[e+(g-9)|0]|0;a[j+8|0]=a[e+(g-8)|0]|0;a[j+9|0]=a[e+(g-7)|0]|0;a[j+10|0]=a[e+(g-6)|0]|0;a[j+11|0]=a[e+(g-5)|0]|0;a[j+12|0]=a[e+(g-4)|0]|0;a[j+13|0]=a[e+(g-3)|0]|0;a[j+14|0]=a[e+(g-2)|0]|0;a[j+15|0]=a[e+(g-1)|0]|0;if((i|0)!=0){l=0;m=e;e=k;while(1){a[e]=a[m]|0;n=l+1|0;if(n>>>0<i>>>0){l=n;m=m+1|0;e=e+1|0}else{break}}}e=b|0;cy(e,d,j,16,16);cE(e,k,f,i,1);switch(a[f+(g-17)|0]|0){case-128:{c[h>>2]=g-32;break};case-127:{c[h>>2]=g-33;break};case-126:{c[h>>2]=g-34;break};case-125:{c[h>>2]=g-35;break};case-124:{c[h>>2]=g-36;break};case-123:{c[h>>2]=g-37;break};case-122:{c[h>>2]=g-38;break};case-121:{c[h>>2]=g-39;break};case-120:{c[h>>2]=g-40;break};case-119:{c[h>>2]=g-41;break};case-118:{c[h>>2]=g-42;break};case-117:{c[h>>2]=g-43;break};case-116:{c[h>>2]=g-44;break};case-115:{c[h>>2]=g-45;break};case-114:{c[h>>2]=g-46;break};case-113:{c[h>>2]=g-47;break};default:{cs(26432,1984)|0}}if((k|0)!=0){kO(k)}if((j|0)==0){return}kO(j);return}function cu(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g|0;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;do{if((h|0)>0){if((bY[c[(c[d>>2]|0)+48>>2]&63](d,e,h)|0)==(h|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){if(q>>>0<11>>>0){h=q<<1&255;e=l;a[e]=h;r=l+1|0;s=h;t=e}else{e=q+16&-16;h=kL(e)|0;c[l+8>>2]=h;g=e|1;c[l>>2]=g;c[l+4>>2]=q;r=h;s=g&255;t=l}kV(r|0,j|0,q|0);a[r+q|0]=0;if((s&1)==0){u=l+1|0}else{u=c[l+8>>2]|0}if((bY[c[(c[d>>2]|0)
+48>>2]&63](d,u,q)|0)==(q|0)){if((a[t]&1)==0){break}kN(c[l+8>>2]|0);break}c[m>>2]=0;c[b>>2]=0;if((a[t]&1)==0){i=k;return}kN(c[l+8>>2]|0);i=k;return}}while(0);l=n-o|0;do{if((l|0)>0){if((bY[c[(c[d>>2]|0)+48>>2]&63](d,f,l)|0)==(l|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function cv(b){b=b|0;c[b>>2]=5248;a[b+4|0]=0;return}function cw(a){a=a|0;kN(a);return}function cx(a){a=a|0;return}function cy(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;i=b+968|0;c[i>>2]=g;c[b+972>>2]=h;j=b+980|0;kX(j|0,f|0,h)|0;j=b+1012|0;kX(j|0,f|0,h)|0;if((g|0)==16){if((h|0)==16){k=10}else{k=(h|0)==24?12:14}c[b+976>>2]=k;l=k}else if((g|0)==24){g=(h|0)!=32?12:14;c[b+976>>2]=g;l=g}else{c[b+976>>2]=14;l=14}g=(h|0)/4|0;k=b+976|0;if((h|0)>3){f=(h|0)>7?g<<2:4;j=0;do{kV(b+8+(j<<5)|0,0,f|0);m=c[k>>2]|0;j=j+1|0;}while((j|0)<=(m|0));if((m|0)<0){n=m}else{o=m;p=134}}else{m=0;while(1){j=m+1|0;if((j|0)>(l|0)){o=l;p=134;break}else{m=j}}}L149:do{if((p|0)==134){if((h|0)<=3){m=0;while(1){l=m+1|0;if((l|0)>(o|0)){n=o;break L149}else{m=l}}}m=(h|0)>7?g<<2:4;l=0;while(1){kV(b+488+(l<<5)|0,0,m|0);j=c[k>>2]|0;f=l+1|0;if((f|0)>(j|0)){n=j;break}else{l=f}}}}while(0);o=ag(n+1|0,g)|0;n=c[i>>2]|0;i=(n|0)/4|0;p=b+1044|0;l=(n|0)>3;do{if(l){m=0;f=p;j=e;while(1){q=(d[j]|0)<<24;c[f>>2]=q;r=(d[j+1|0]|0)<<16|q;c[f>>2]=r;q=r|(d[j+2|0]|0)<<8;c[f>>2]=q;c[f>>2]=q|(d[j+3|0]|0);q=m+1|0;if((q|0)<(i|0)){m=q;f=f+4|0;j=j+4|0}else{break}}if(!(l&(o|0)>0)){s=0;break}j=(n|0)>7?-i|0:-1;f=-o|0;m=j>>>0>f>>>0?j:f;f=0;do{j=b+1044+(f<<2)|0;q=(f|0)%(g|0)|0;r=(f|0)/(g|0)|0;c[b+8+(r<<5)+(q<<2)>>2]=c[j>>2];c[b+488+((c[k>>2]|0)-r<<5)+(q<<2)>>2]=c[j>>2];f=f+1|0;}while((f|0)<(i|0)&(f|0)<(o|0));s=-m|0}else{s=0}}while(0);if((s|0)<(o|0)){e=b+1044+(i-1<<2)|0;f=(n-32|0)>>>0>3>>>0;j=(n|0)/8|0;q=(n|0)>15;r=(n|0)>7;t=(n|0)>7?-i|0:-1;n=s;s=0;while(1){u=c[e>>2]|0;v=s+1|0;w=(d[10040+s|0]|0)<<24^c[p>>2]^((d[22616+(u>>>8&255)|0]|0)<<16|(d[22616+(u>>>16&255)|0]|0)<<24|(d[22616+(u&255)|0]|0)<<8|(d[22616+(u>>>24)|0]|0));c[p>>2]=w;L171:do{if(f){if(r){x=1;y=1;z=w}else{break}while(1){u=y+1|0;A=b+1044+(y<<2)|0;c[A>>2]=c[A>>2]^z;if((u|0)>=(i|0)){break L171}A=c[b+1044+(x<<2)>>2]|0;x=x+1|0;y=u;z=A}}else{L177:do{if(q){A=1;u=1;B=w;while(1){C=u+1|0;D=b+1044+(u<<2)|0;c[D>>2]=c[D>>2]^B;if((C|0)>=(j|0)){break L177}D=c[b+1044+(A<<2)>>2]|0;A=A+1|0;u=C;B=D}}}while(0);B=c[b+1044+(j-1<<2)>>2]|0;u=b+1044+(j<<2)|0;A=((d[22616+(B>>>8&255)|0]|0)<<8|(d[22616+(B&255)|0]|0)|(d[22616+(B>>>16&255)|0]|0)<<16|(d[22616+(B>>>24)|0]|0)<<24)^c[u>>2];c[u>>2]=A;u=j+1|0;if((u|0)<(i|0)){E=j;F=u;G=A}else{break}while(1){A=E+1|0;u=b+1044+(F<<2)|0;c[u>>2]=c[u>>2]^G;u=F+1|0;if((u|0)>=(i|0)){break L171}E=A;F=u;G=c[b+1044+(A<<2)>>2]|0}}}while(0);if(l&(n|0)<(o|0)){w=n-o|0;m=t>>>0>w>>>0?t:w;w=0;A=n;do{u=b+1044+(w<<2)|0;B=(A|0)%(g|0)|0;D=(A|0)/(g|0)|0;c[b+8+(D<<5)+(B<<2)>>2]=c[u>>2];c[b+488+((c[k>>2]|0)-D<<5)+(B<<2)>>2]=c[u>>2];w=w+1|0;A=A+1|0;}while((
w|0)<(i|0)&(A|0)<(o|0));H=n-m|0}else{H=n}if((H|0)<(o|0)){n=H;s=v}else{break}}}s=c[k>>2]|0;if((s|0)<=1){I=b+4|0;a[I]=1;return}if((h|0)>3){J=1}else{h=1;do{h=h+1|0;}while((h|0)<(s|0));I=b+4|0;a[I]=1;return}do{s=0;do{h=b+488+(J<<5)+(s<<2)|0;H=c[h>>2]|0;c[h>>2]=c[12120+((H>>>16&255)<<2)>>2]^c[13144+(H>>>24<<2)>>2]^c[11096+((H>>>8&255)<<2)>>2]^c[10072+((H&255)<<2)>>2];s=s+1|0;}while((s|0)<(g|0));J=J+1|0;}while((J|0)<(c[k>>2]|0));I=b+4|0;a[I]=1;return}function cz(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=((d[e+1|0]|0)<<16|(d[e]|0)<<24|(d[e+2|0]|0)<<8|(d[e+3|0]|0))^c[b+8>>2];h=((d[e+5|0]|0)<<16|(d[e+4|0]|0)<<24|(d[e+6|0]|0)<<8|(d[e+7|0]|0))^c[b+12>>2];i=((d[e+9|0]|0)<<16|(d[e+8|0]|0)<<24|(d[e+10|0]|0)<<8|(d[e+11|0]|0))^c[b+16>>2];j=((d[e+13|0]|0)<<16|(d[e+12|0]|0)<<24|(d[e+14|0]|0)<<8|(d[e+15|0]|0))^c[b+20>>2];e=c[b+976>>2]|0;if((e|0)>1){k=j;l=i;m=h;n=g;o=1;while(1){p=c[20312+((m>>>16&255)<<2)>>2]^c[21336+(n>>>24<<2)>>2]^c[19288+((l>>>8&255)<<2)>>2]^c[18264+((k&255)<<2)>>2]^c[b+8+(o<<5)>>2];q=c[20312+((l>>>16&255)<<2)>>2]^c[21336+(m>>>24<<2)>>2]^c[19288+((k>>>8&255)<<2)>>2]^c[18264+((n&255)<<2)>>2]^c[b+8+(o<<5)+4>>2];r=c[20312+((k>>>16&255)<<2)>>2]^c[21336+(l>>>24<<2)>>2]^c[19288+((n>>>8&255)<<2)>>2]^c[18264+((m&255)<<2)>>2]^c[b+8+(o<<5)+8>>2];s=c[20312+((n>>>16&255)<<2)>>2]^c[21336+(k>>>24<<2)>>2]^c[19288+((m>>>8&255)<<2)>>2]^c[18264+((l&255)<<2)>>2]^c[b+8+(o<<5)+12>>2];t=o+1|0;if((t|0)<(e|0)){k=s;l=r;m=q;n=p;o=t}else{u=s;v=r;w=q;x=p;break}}}else{u=j;v=i;w=h;x=g}g=c[b+8+(e<<5)>>2]|0;a[f]=((d[22616+(x>>>24)|0]|0)^g>>>24)&255;a[f+1|0]=((d[22616+(w>>>16&255)|0]|0)^g>>>16)&255;a[f+2|0]=((d[22616+(v>>>8&255)|0]|0)^g>>>8)&255;a[f+3|0]=((d[22616+(u&255)|0]|0)^g)&255;g=c[b+8+(e<<5)+4>>2]|0;a[f+4|0]=((d[22616+(w>>>24)|0]|0)^g>>>24)&255;a[f+5|0]=((d[22616+(v>>>16&255)|0]|0)^g>>>16)&255;a[f+6|0]=((d[22616+(u>>>8&255)|0]|0)^g>>>8)&255;a[f+7|0]=((d[22616+(x&255)|0]|0)^g)&255;g=c[b+8+(e<<5)+8>>2]|0;a[f+8|0]=((d[22616+(v>>>24)|0]|0)^g>>>24)&255;a[f+9|0]=((d[22616+(u>>>16&255)|0]|0)^g>>>16)&255;a[f+10|0]=((d[22616+(x>>>8&255)|0]|0)^g>>>8)&255;a[f+11|0]=((d[22616+(w&255)|0]|0)^g)&255;g=c[b+8+(e<<5)+12>>2]|0;a[f+12|0]=((d[22616+(u>>>24)|0]|0)^g>>>24)&255;a[f+13|0]=((d[22616+(x>>>16&255)|0]|0)^g>>>16)&255;a[f+14|0]=((d[22616+(w>>>8&255)|0]|0)^g>>>8)&255;a[f+15|0]=((d[22616+(v&255)|0]|0)^g)&255;return}function cA(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=((d[e+1|0]|0)<<16|(d[e]|0)<<24|(d[e+2|0]|0)<<8|(d[e+3|0]|0))^c[b+488>>2];h=((d[e+5|0]|0)<<16|(d[e+4|0]|0)<<24|(d[e+6|0]|0)<<8|(d[e+7|0]|0))^c[b+492>>2];i=((d[e+9|0]|0)<<16|(d[e+8|0]|0)<<24|(d[e+10|0]|0)<<8|(d[e+11|0]|0))^c[b+496>>2];j=((d[e+13|0]|0)<<16|(d[e+12|0]|0)<<24|(d[e+14|0]|0)<<8|(d[e+15|0]|0))^c[b+500>>2];e=c[b+976>>2]|0;if((e|0)>1){k=j;l=i;m=h;n=g;o=1;while(1){p=c[16216+((k>>>16&255)<<2)>>2]^c[17240+(n>>>24<<2)>>2]^c[15192+((l>>>8&255)<<2)>>2]^c[14168+((m&255)<<2)>>2]^c[b+488+(o<<5)>>2];q=c[
16216+((n>>>16&255)<<2)>>2]^c[17240+(m>>>24<<2)>>2]^c[15192+((k>>>8&255)<<2)>>2]^c[14168+((l&255)<<2)>>2]^c[b+488+(o<<5)+4>>2];r=c[16216+((m>>>16&255)<<2)>>2]^c[17240+(l>>>24<<2)>>2]^c[15192+((n>>>8&255)<<2)>>2]^c[14168+((k&255)<<2)>>2]^c[b+488+(o<<5)+8>>2];s=c[16216+((l>>>16&255)<<2)>>2]^c[17240+(k>>>24<<2)>>2]^c[15192+((m>>>8&255)<<2)>>2]^c[14168+((n&255)<<2)>>2]^c[b+488+(o<<5)+12>>2];t=o+1|0;if((t|0)<(e|0)){k=s;l=r;m=q;n=p;o=t}else{u=s;v=r;w=q;x=p;break}}}else{u=j;v=i;w=h;x=g}g=c[b+488+(e<<5)>>2]|0;a[f]=((d[22360+(x>>>24)|0]|0)^g>>>24)&255;a[f+1|0]=((d[22360+(u>>>16&255)|0]|0)^g>>>16)&255;a[f+2|0]=((d[22360+(v>>>8&255)|0]|0)^g>>>8)&255;a[f+3|0]=((d[22360+(w&255)|0]|0)^g)&255;g=c[b+488+(e<<5)+4>>2]|0;a[f+4|0]=((d[22360+(w>>>24)|0]|0)^g>>>24)&255;a[f+5|0]=((d[22360+(x>>>16&255)|0]|0)^g>>>16)&255;a[f+6|0]=((d[22360+(u>>>8&255)|0]|0)^g>>>8)&255;a[f+7|0]=((d[22360+(v&255)|0]|0)^g)&255;g=c[b+488+(e<<5)+8>>2]|0;a[f+8|0]=((d[22360+(v>>>24)|0]|0)^g>>>24)&255;a[f+9|0]=((d[22360+(w>>>16&255)|0]|0)^g>>>16)&255;a[f+10|0]=((d[22360+(x>>>8&255)|0]|0)^g>>>8)&255;a[f+11|0]=((d[22360+(u&255)|0]|0)^g)&255;g=c[b+488+(e<<5)+12>>2]|0;a[f+12|0]=((d[22360+(u>>>24)|0]|0)^g>>>24)&255;a[f+13|0]=((d[22360+(v>>>16&255)|0]|0)^g>>>16)&255;a[f+14|0]=((d[22360+(w>>>8&255)|0]|0)^g>>>8)&255;a[f+15|0]=((d[22360+(x&255)|0]|0)^g)&255;return}function cB(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=c[b+972>>2]|0;if((g|0)==16){cz(b,e,f);return}h=(g|0)/4|0;if((g-16|0)>>>0<4>>>0){i=0}else{i=(g-24|0)>>>0<4>>>0?1:2}j=c[9952+(i<<5)>>2]|0;k=c[9960+(i<<5)>>2]|0;l=c[9968+(i<<5)>>2]|0;i=b+1108|0;m=(g|0)>3;if(m){g=0;n=e;e=i|0;while(1){o=(d[n]|0)<<24;c[e>>2]=o;p=(d[n+1|0]|0)<<16|o;c[e>>2]=p;o=p|(d[n+2|0]|0)<<8;c[e>>2]=o;c[e>>2]=(o|(d[n+3|0]|0))^c[b+8+(g<<2)>>2];o=g+1|0;if((o|0)<(h|0)){g=o;n=n+4|0;e=e+4|0}else{break}}}e=b+976|0;n=c[e>>2]|0;L229:do{if((n|0)>1){g=i;o=b+1076|0;p=h<<2;if(m){q=1}else{r=1;while(1){kX(g|0,o|0,p)|0;s=r+1|0;if((s|0)<(n|0)){r=s}else{t=n;break L229}}}while(1){r=0;do{c[b+1076+(r<<2)>>2]=c[20312+(((c[b+1108+(((r+j|0)%(h|0)|0)<<2)>>2]|0)>>>16&255)<<2)>>2]^c[21336+((c[b+1108+(r<<2)>>2]|0)>>>24<<2)>>2]^c[19288+(((c[b+1108+(((r+k|0)%(h|0)|0)<<2)>>2]|0)>>>8&255)<<2)>>2]^c[18264+((c[b+1108+(((r+l|0)%(h|0)|0)<<2)>>2]&255)<<2)>>2]^c[b+8+(q<<5)+(r<<2)>>2];r=r+1|0;}while((r|0)<(h|0));r=c[e>>2]|0;kX(g|0,o|0,p)|0;s=q+1|0;if((s|0)<(r|0)){q=s}else{t=r;break}}}else{t=n}}while(0);if(m){u=0;v=0;w=t}else{return}while(1){t=c[b+8+(w<<5)+(u<<2)>>2]|0;a[f+v|0]=((d[22616+((c[b+1108+(u<<2)>>2]|0)>>>24)|0]|0)^t>>>24)&255;a[f+(v|1)|0]=((d[22616+((c[b+1108+(((u+j|0)%(h|0)|0)<<2)>>2]|0)>>>16&255)|0]|0)^t>>>16)&255;a[f+(v|2)|0]=((d[22616+((c[b+1108+(((u+k|0)%(h|0)|0)<<2)>>2]|0)>>>8&255)|0]|0)^t>>>8)&255;a[f+(v|3)|0]=((d[22616+(c[b+1108+(((u+l|0)%(h|0)|0)<<2)>>2]&255)|0]|0)^t)&255;t=u+1|0;if((t|0)>=(h|0)){break}u=t;v=v+4|0;w=c[e>>2]|0}return}function cC(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;
g=c[b+972>>2]|0;if((g|0)==16){cA(b,e,f);return}h=(g|0)/4|0;if((g-16|0)>>>0<4>>>0){i=0}else{i=(g-24|0)>>>0<4>>>0?1:2}j=c[9956+(i<<5)>>2]|0;k=c[9964+(i<<5)>>2]|0;l=c[9972+(i<<5)>>2]|0;i=b+1108|0;m=(g|0)>3;if(m){g=0;n=e;e=i|0;while(1){o=(d[n]|0)<<24;c[e>>2]=o;p=(d[n+1|0]|0)<<16|o;c[e>>2]=p;o=p|(d[n+2|0]|0)<<8;c[e>>2]=o;c[e>>2]=(o|(d[n+3|0]|0))^c[b+488+(g<<2)>>2];o=g+1|0;if((o|0)<(h|0)){g=o;n=n+4|0;e=e+4|0}else{break}}}e=b+976|0;n=c[e>>2]|0;L259:do{if((n|0)>1){g=i;o=b+1076|0;p=h<<2;if(m){q=1}else{r=1;while(1){kX(g|0,o|0,p)|0;s=r+1|0;if((s|0)<(n|0)){r=s}else{t=n;break L259}}}while(1){r=0;do{c[b+1076+(r<<2)>>2]=c[16216+(((c[b+1108+(((r+j|0)%(h|0)|0)<<2)>>2]|0)>>>16&255)<<2)>>2]^c[17240+((c[b+1108+(r<<2)>>2]|0)>>>24<<2)>>2]^c[15192+(((c[b+1108+(((r+k|0)%(h|0)|0)<<2)>>2]|0)>>>8&255)<<2)>>2]^c[14168+((c[b+1108+(((r+l|0)%(h|0)|0)<<2)>>2]&255)<<2)>>2]^c[b+488+(q<<5)+(r<<2)>>2];r=r+1|0;}while((r|0)<(h|0));r=c[e>>2]|0;kX(g|0,o|0,p)|0;s=q+1|0;if((s|0)<(r|0)){q=s}else{t=r;break}}}else{t=n}}while(0);if(m){u=0;v=0;w=t}else{return}while(1){t=c[b+488+(w<<5)+(u<<2)>>2]|0;a[f+v|0]=((d[22360+((c[b+1108+(u<<2)>>2]|0)>>>24)|0]|0)^t>>>24)&255;a[f+(v|1)|0]=((d[22360+((c[b+1108+(((u+j|0)%(h|0)|0)<<2)>>2]|0)>>>16&255)|0]|0)^t>>>16)&255;a[f+(v|2)|0]=((d[22360+((c[b+1108+(((u+k|0)%(h|0)|0)<<2)>>2]|0)>>>8&255)|0]|0)^t>>>8)&255;a[f+(v|3)|0]=((d[22360+(c[b+1108+(((u+l|0)%(h|0)|0)<<2)>>2]&255)|0]|0)^t)&255;t=u+1|0;if((t|0)>=(h|0)){break}u=t;v=v+4|0;w=c[e>>2]|0}return}function cD(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((g|0)==1){h=b+972|0;i=c[h>>2]|0;if(((f>>>0)/(i>>>0)|0|0)==0){return}j=b+1012|0;k=0;l=d;m=e;n=i;while(1){if((n|0)>0){i=j;o=l;p=0;while(1){a[i]=a[i]^a[o];q=p+1|0;if((q|0)<(c[h>>2]|0)){i=i+1|0;o=o+1|0;p=q}else{break}}}cB(b,j,m);p=c[h>>2]|0;kX(j|0,m|0,p)|0;o=k+1|0;if(o>>>0<((f>>>0)/(p>>>0)|0)>>>0){k=o;l=l+p|0;m=m+p|0;n=p}else{break}}return}else if((g|0)==2){g=b+972|0;if(((f>>>0)/((c[g>>2]|0)>>>0)|0|0)==0){return}n=b+1012|0;m=0;l=d;k=e;while(1){cB(b,n,k);j=c[g>>2]|0;if((j|0)>0){h=k;p=l;o=0;while(1){a[h]=a[h]^a[p];i=o+1|0;q=c[g>>2]|0;if((i|0)<(q|0)){h=h+1|0;p=p+1|0;o=i}else{r=q;break}}}else{r=j}kX(n|0,k|0,r)|0;o=m+1|0;if(o>>>0<((f>>>0)/(r>>>0)|0)>>>0){m=o;l=l+r|0;k=k+r|0}else{break}}return}else{r=b+972|0;if(((f>>>0)/((c[r>>2]|0)>>>0)|0|0)==0){return}else{s=0;t=d;u=e}while(1){cB(b,t,u);e=c[r>>2]|0;d=s+1|0;if(d>>>0<((f>>>0)/(e>>>0)|0)>>>0){s=d;t=t+e|0;u=u+e|0}else{break}}return}}function cE(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((g|0)==1){h=b+972|0;if(((f>>>0)/((c[h>>2]|0)>>>0)|0|0)==0){return}i=b+1012|0;j=0;k=d;l=e;while(1){cC(b,k,l);m=c[h>>2]|0;if((m|0)>0){n=l;o=i;p=0;while(1){a[n]=a[n]^a[o];q=p+1|0;r=c[h>>2]|0;if((q|0)<(r|0)){n=n+1|0;o=o+1|0;p=q}else{s=r;break}}}else{s=m}kX(i|0,k|0,s)|0;p=j+1|0;if(p>>>0<((f>>>0)/(s>>>0)|0)>>>0){j=p;k=k+s|0;l=l+s|0}else{break}}return}else if((g|0)==2){g=b+972|0;if(((f>>>0)/((c[g>>2]|0)>>>0)|0|0)==0){
return}s=b+1012|0;l=0;k=d;j=e;while(1){cB(b,s,j);i=c[g>>2]|0;if((i|0)>0){h=j;p=k;o=0;while(1){a[h]=a[h]^a[p];n=o+1|0;r=c[g>>2]|0;if((n|0)<(r|0)){h=h+1|0;p=p+1|0;o=n}else{t=r;break}}}else{t=i}kX(s|0,k|0,t)|0;o=l+1|0;if(o>>>0<((f>>>0)/(t>>>0)|0)>>>0){l=o;k=k+t|0;j=j+t|0}else{break}}return}else{t=b+972|0;if(((f>>>0)/((c[t>>2]|0)>>>0)|0|0)==0){return}else{u=0;v=d;w=e}while(1){cC(b,v,w);e=c[t>>2]|0;d=u+1|0;if(d>>>0<((f>>>0)/(e>>>0)|0)>>>0){u=d;v=v+e|0;w=w+e|0}else{break}}return}}function cF(a){a=a|0;cx(a|0);return}function cG(a){a=a|0;return cq(27024,a)|0}function cH(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;cr(27024,a,b,c,d,e);return}function cI(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ct(27024,a,b,c,d,e);return}function cJ(a){a=a|0;cx(a|0);kN(a);return}function cK(){cv(27024);c[6756]=5272;aP(252,27024,u|0)|0;return}function cL(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+32|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=c[o>>2]|0;c5(25704,h,25832);c[6674]=4580;c[6676]=4600;c[6675]=0;d$(26704,25704);c[6694]=0;c[6695]=-1;j=c[t>>2]|0;c[6402]=4360;ik(25612);kV(25616,0,24);c[6402]=4728;c[6410]=j;il(g,25612);k=io(g,26032)|0;l=k;im(g);c[6411]=l;c[6412]=25840;a[25652]=(b_[c[(c[k>>2]|0)+28>>2]&127](l)|0)&1;c[6608]=4484;c[6609]=4504;d$(26436,25608);c[6627]=0;c[6628]=-1;l=c[r>>2]|0;c[6414]=4360;ik(25660);kV(25664,0,24);c[6414]=4728;c[6422]=l;il(f,25660);k=io(f,26032)|0;g=k;im(f);c[6423]=g;c[6424]=25848;a[25700]=(b_[c[(c[k>>2]|0)+28>>2]&127](g)|0)&1;c[6652]=4484;c[6653]=4504;d$(26612,25656);c[6671]=0;c[6672]=-1;g=c[(c[(c[6652]|0)-12>>2]|0)+26632>>2]|0;c[6630]=4484;c[6631]=4504;d$(26524,g);c[6649]=0;c[6650]=-1;c[(c[(c[6674]|0)-12>>2]|0)+26768>>2]=26432;g=(c[(c[6652]|0)-12>>2]|0)+26612|0;c[g>>2]=c[g>>2]|8192;c[(c[(c[6652]|0)-12>>2]|0)+26680>>2]=26432;cT(25552,h,25856);c[6586]=4532;c[6588]=4552;c[6587]=0;d$(26352,25552);c[6606]=0;c[6607]=-1;c[6364]=4288;ik(25460);kV(25464,0,24);c[6364]=4656;c[6372]=j;il(e,25460);j=io(e,26024)|0;h=j;im(e);c[6373]=h;c[6374]=25864;a[25500]=(b_[c[(c[j>>2]|0)+28>>2]&127](h)|0)&1;c[6516]=4436;c[6517]=4456;d$(26068,25456);c[6535]=0;c[6536]=-1;c[6376]=4288;ik(25508);kV(25512,0,24);c[6376]=4656;c[6384]=l;il(d,25508);l=io(d,26024)|0;h=l;im(d);c[6385]=h;c[6386]=25872;a[25548]=(b_[c[(c[l>>2]|0)+28>>2]&127](h)|0)&1;c[6560]=4436;c[6561]=4456;d$(26244,25504);c[6579]=0;c[6580]=-1;h=c[(c[(c[6560]|0)-12>>2]|0)+26264>>2]|0;c[6538]=4436;c[6539]=4456;d$(26156,h);c[6557]=0;c[6558]=-1;c[(c[(c[6586]|0)-12>>2]|0)+26416>>2]=26064;h=(c[(c[6560]|0)-12>>2]|0)+26244|0;c[h>>2]=c[h>>2]|8192;c[(c[(c[6560]|0)-12>>2]|0)+26312>>2]=26064;i=b;return}function cM(a){a=a|0;ew(26432)|0;ew(26520)|0;eC(26064)|0;eC(26152)|0;return}function cN(a){a=a|0;c[a>>2]=4288;im(a+4|0);return}function cO(a){a=a|0;c[a>>2]=4288;im(a+4|0);kN(a);return}function cP(b,d){b=b|0;d=d|0;var e=0;b_[c[(c[b>>2]|0)+24>>2]&127](b)|0;e=io(d,26024)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(b_[c[(c[e>>2]|0)+28>>2]&127](d)|0)&1;return}function cQ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;
d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=b7[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((a0(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=305;break}if((l|0)==2){m=-1;n=307;break}else if((l|0)!=1){n=303;break}}if((n|0)==305){i=b;return m|0}else if((n|0)==307){i=b;return m|0}else if((n|0)==303){m=((aV(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}return 0}function cR(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if((a[b+44|0]&1)!=0){f=a0(d|0,4,e|0,c[b+32>>2]|0)|0;return f|0}g=b;if((e|0)>0){h=d;i=0}else{f=0;return f|0}while(1){if((bX[c[(c[g>>2]|0)+52>>2]&31](b,c[h>>2]|0)|0)==-1){f=i;j=316;break}d=i+1|0;if((d|0)<(e|0)){h=h+4|0;i=d}else{f=d;j=314;break}}if((j|0)==316){return f|0}else if((j|0)==314){return f|0}return 0}function cS(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L387:do{if(!k){c[g>>2]=d;if((a[b+44|0]&1)!=0){if((a0(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+4|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=b2[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=332;break}if((v|0)==3){w=324;break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=334;break}v=(c[h>>2]|0)-r|0;if((a0(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=335;break}if(u){t=u?c[j>>2]|0:t}else{break L387}}if((w|0)==324){if((a0(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==332){i=e;return l|0}else if((w|0)==334){i=e;return l|0}else if((w|0)==335){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function cT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4288;j=b+4|0;ik(j);kV(b+8|0,0,24);c[h>>2]=5056;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;il(g,j);j=io(g,26024)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=b_[c[(c[j>>2]|0)+24>>2]&127](e)|0;e=c[d>>2]|0;a[b+53|0]=(b_[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[h>>2]|0)<=8){im(g);i=f;return}hF(184);im(g);i=f;return}function cU(a){a=a|0;c[a>>2]=4288;im(a+4|0);return}function cV(a){a=a|0;c[a>>2]=4288;im(a+4|0);kN(a);return}function cW(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=io(d,26024)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=b_[c[(c[e>>2]|0)+24>>2]&127](d)|0;d=c[f>>2]|0;a[b+53|0]=(b_[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;if((c[g>>2]|0)<=8){return}hF(184);return}function cX(a){a=a|0;return c_(a,0)|0}function cY(a){a=a|0;return c_(a,1)|0}function cZ(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L430:do{if(l){c[h>>2]=c[n>>2];o=c[b+36>>2]|0;p=f|0;q=b2[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+4|0,j,p,f+8|0,g)|0;if((q|0)==3){a[p]=c[n>>2]&255;c[g>>2]=f+1}else if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L430}r=o-1|0;c[g>>2]
=r;if((bP(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function c_(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;if((a[k]&1)!=0){l=b+48|0;m=c[l>>2]|0;if(!d){n=m;i=e;return n|0}c[l>>2]=-1;a[k]=0;n=m;i=e;return n|0}m=c[b+44>>2]|0;k=(m|0)>1?m:1;L450:do{if((k|0)>0){m=b+32|0;l=0;while(1){o=aL(c[m>>2]|0)|0;if((o|0)==-1){n=-1;break}a[f+l|0]=o&255;l=l+1|0;if((l|0)>=(k|0)){break L450}}i=e;return n|0}}while(0);L457:do{if((a[b+53|0]&1)==0){l=b+40|0;m=b+36|0;o=f|0;p=g+4|0;q=b+32|0;r=k;while(1){s=c[l>>2]|0;t=s;u=c[t>>2]|0;v=c[t+4>>2]|0;t=c[m>>2]|0;w=f+r|0;x=b2[c[(c[t>>2]|0)+16>>2]&31](t,s,o,w,h,g,p,j)|0;if((x|0)==2){n=-1;y=396;break}else if((x|0)==3){y=381;break}else if((x|0)!=1){z=r;break L457}x=c[l>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((r|0)==8){n=-1;y=397;break}v=aL(c[q>>2]|0)|0;if((v|0)==-1){n=-1;y=398;break}a[w]=v&255;r=r+1|0}if((y|0)==396){i=e;return n|0}else if((y|0)==397){i=e;return n|0}else if((y|0)==398){i=e;return n|0}else if((y|0)==381){c[g>>2]=a[o]|0;z=r;break}}else{c[g>>2]=a[f|0]|0;z=k}}while(0);if(d){d=c[g>>2]|0;c[b+48>>2]=d;n=d;i=e;return n|0}d=b+32|0;b=z;while(1){if((b|0)<=0){break}z=b-1|0;if((bP(a[f+z|0]|0,c[d>>2]|0)|0)==-1){n=-1;y=391;break}else{b=z}}if((y|0)==391){i=e;return n|0}n=c[g>>2]|0;i=e;return n|0}function c$(a){a=a|0;c[a>>2]=4360;im(a+4|0);return}function c0(a){a=a|0;c[a>>2]=4360;im(a+4|0);kN(a);return}function c1(b,d){b=b|0;d=d|0;var e=0;b_[c[(c[b>>2]|0)+24>>2]&127](b)|0;e=io(d,26032)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(b_[c[(c[e>>2]|0)+28>>2]&127](d)|0)&1;return}function c2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=b7[c[(c[a>>2]|0)+20>>2]&31](a,c[g>>2]|0,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((a0(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=407;break}if((l|0)==2){m=-1;n=409;break}else if((l|0)!=1){n=405;break}}if((n|0)==409){i=b;return m|0}else if((n|0)==407){i=b;return m|0}else if((n|0)==405){m=((aV(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}return 0}function c3(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((a[b+44|0]&1)!=0){g=a0(e|0,1,f|0,c[b+32>>2]|0)|0;return g|0}h=b;if((f|0)>0){i=e;j=0}else{g=0;return g|0}while(1){if((bX[c[(c[h>>2]|0)+52>>2]&31](b,d[i]|0)|0)==-1){g=j;k=417;break}e=j+1|0;if((e|0)<(f|0)){i=i+1|0;j=e}else{g=e;k=418;break}}if((k|0)==417){return g|0}else if((k|0)==418){return g|0}return 0}function c4(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=(d|0)==-1;L508:do{if(!k){a[g]=d&255;if((a[b+44|0]&1)!=0){if((a0(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}m=f|0;c[h>>2]=m;n=g+1|0;o=b+36|0;p=b+40|0;q=f+8|0;r=f;s=b+32|0;t=g;while(1){u=c[o>>2]|0;v=b2[c[(c[u>>2]|0)+12>>2]&31](u,c[p>>2]|0,t,n,j,m,q,h)|0;if((c[j>>2]|0)==(t|0)){l=-1;w=435;break}if((v|0)==3){w=426;
break}u=(v|0)==1;if(v>>>0>=2>>>0){l=-1;w=436;break}v=(c[h>>2]|0)-r|0;if((a0(m|0,1,v|0,c[s>>2]|0)|0)!=(v|0)){l=-1;w=433;break}if(u){t=u?c[j>>2]|0:t}else{break L508}}if((w|0)==426){if((a0(t|0,1,1,c[s>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((w|0)==435){i=e;return l|0}else if((w|0)==436){i=e;return l|0}else if((w|0)==433){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function c5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4360;j=b+4|0;ik(j);kV(b+8|0,0,24);c[h>>2]=5128;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;il(g,j);j=io(g,26032)|0;e=j;d=b+36|0;c[d>>2]=e;h=b+44|0;c[h>>2]=b_[c[(c[j>>2]|0)+24>>2]&127](e)|0;e=c[d>>2]|0;a[b+53|0]=(b_[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[h>>2]|0)<=8){im(g);i=f;return}hF(184);im(g);i=f;return}function c6(a){a=a|0;c[a>>2]=4360;im(a+4|0);return}function c7(a){a=a|0;c[a>>2]=4360;im(a+4|0);kN(a);return}function c8(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=io(d,26032)|0;d=e;f=b+36|0;c[f>>2]=d;g=b+44|0;c[g>>2]=b_[c[(c[e>>2]|0)+24>>2]&127](d)|0;d=c[f>>2]|0;a[b+53|0]=(b_[c[(c[d>>2]|0)+28>>2]&127](d)|0)&1;if((c[g>>2]|0)<=8){return}hF(184);return}function c9(a){a=a|0;return dc(a,0)|0}function da(a){a=a|0;return dc(a,1)|0}function db(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b+52|0;l=(a[k]&1)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;L551:do{if(l){a[h]=c[n>>2]&255;o=c[b+36>>2]|0;p=f|0;q=b2[c[(c[o>>2]|0)+12>>2]&31](o,c[b+40>>2]|0,h,h+1|0,j,p,f+8|0,g)|0;if((q|0)==2|(q|0)==1){m=-1;i=e;return m|0}else if((q|0)==3){a[p]=c[n>>2]&255;c[g>>2]=f+1}q=b+32|0;while(1){o=c[g>>2]|0;if(o>>>0<=p>>>0){break L551}r=o-1|0;c[g>>2]=r;if((bP(a[r]|0,c[q>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function dc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=b+52|0;if((a[l]&1)!=0){m=b+48|0;n=c[m>>2]|0;if(!e){o=n;i=f;return o|0}c[m>>2]=-1;a[l]=0;o=n;i=f;return o|0}n=c[b+44>>2]|0;l=(n|0)>1?n:1;L571:do{if((l|0)>0){n=b+32|0;m=0;while(1){p=aL(c[n>>2]|0)|0;if((p|0)==-1){o=-1;break}a[g+m|0]=p&255;m=m+1|0;if((m|0)>=(l|0)){break L571}}i=f;return o|0}}while(0);L578:do{if((a[b+53|0]&1)==0){m=b+40|0;n=b+36|0;p=g|0;q=h+1|0;r=b+32|0;s=l;while(1){t=c[m>>2]|0;u=t;v=c[u>>2]|0;w=c[u+4>>2]|0;u=c[n>>2]|0;x=g+s|0;y=b2[c[(c[u>>2]|0)+16>>2]&31](u,t,p,x,j,h,q,k)|0;if((y|0)==2){o=-1;z=497;break}else if((y|0)==3){z=483;break}else if((y|0)!=1){A=s;break L578}y=c[m>>2]|0;c[y>>2]=v;c[y+4>>2]=w;if((s|0)==8){o=-1;z=496;break}w=aL(c[r>>2]|0)|0;if((w|0)==-1){o=-1;z=493;break}a[x]=w&255;s=s+1|0}if((z|0)==496){i=f;return o|0}else if((z|0)==497){i=f;return o|0}else if((z|0)==483){a[h]=a[p]|0;A=s;break}else if((z|0)==493){i=f;return o|0}}else{a[h]=a[g|0]|0;A=l}}while(0);do{if(e){l=a[h]|0;c[b+48>>2]=l&255;B=l}else{l=b+32|0;k=A;while(1){if((k|0)<=0){z=490;
break}j=k-1|0;if((bP(d[g+j|0]|0|0,c[l>>2]|0)|0)==-1){o=-1;z=500;break}else{k=j}}if((z|0)==500){i=f;return o|0}else if((z|0)==490){B=a[h]|0;break}}}while(0);o=B&255;i=f;return o|0}function dd(){cL(0);aP(142,26784,u|0)|0;return}function de(a){a=a|0;return}function df(a){a=a|0;var b=0;b=a+4|0;I=c[b>>2]|0,c[b>>2]=I+1,I;return}function dg(a){a=a|0;var b=0,d=0;b=a+4|0;if(((I=c[b>>2]|0,c[b>>2]=I+ -1,I)|0)!=0){d=0;return d|0}bV[c[(c[a>>2]|0)+8>>2]&511](a);d=1;return d|0}function dh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=2664;d=a+4|0;if((d|0)==0){return}a=kW(b|0)|0;e=a+1|0;f=kM(a+13|0)|0;c[f+4>>2]=a;c[f>>2]=a;a=f+12|0;c[d>>2]=a;c[f+8>>2]=0;kX(a|0,b|0,e)|0;return}function di(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=2664;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;kN(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;kN(e);return}kO(d);e=a;kN(e);return}function dj(a){a=a|0;var b=0;c[a>>2]=2664;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}kO(a);return}function dk(a){a=a|0;return c[a+4>>2]|0}function dl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;c[b>>2]=2600;e=b+4|0;if((e|0)==0){return}if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=kW(f|0)|0;b=d+1|0;g=kM(d+13|0)|0;c[g+4>>2]=d;c[g>>2]=d;d=g+12|0;c[e>>2]=d;c[g+8>>2]=0;kX(d|0,f|0,b)|0;return}function dm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=2600;d=a+4|0;if((d|0)==0){return}a=kW(b|0)|0;e=a+1|0;f=kM(a+13|0)|0;c[f+4>>2]=a;c[f>>2]=a;a=f+12|0;c[d>>2]=a;c[f+8>>2]=0;kX(a|0,b|0,e)|0;return}function dn(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=2600;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;kN(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;kN(e);return}kO(d);e=a;kN(e);return}function dp(a){a=a|0;var b=0;c[a>>2]=2600;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((I=c[a>>2]|0,c[a>>2]=I+ -1,I)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}kO(a);return}function dq(a){a=a|0;return c[a+4>>2]|0}function dr(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=2664;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((I=c[d>>2]|0,c[d>>2]=I+ -1,I)-1|0)>=0){e=a;kN(e);return}d=(c[b>>2]|0)-12|0;if((d|0)==0){e=a;kN(e);return}kO(d);e=a;kN(e);return}function ds(a){a=a|0;return}function dt(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function du(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;b$[c[(c[a>>2]|0)+12>>2]&7](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function dv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[b+4>>2]|0)!=(a|0)){e=0;return e|0}e=(c[b>>2]|0)==(d|0);return e|0}function dw(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;d=aN(e|0)|0;e=kW(d|0)|0;if(e>>>0>4294967279>>>0){dC(0)}if(e>>>0<11>>>0){a[b]=e<<1&255;f=b+1|0;kX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=kL(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;kX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function dx(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;h=f;j=i;i=i+12|0;i=i+7&-8;k=e|0;l=c[k>>2]|0;do{if((l|0)!
=0){m=d[h]|0;if((m&1|0)==0){n=m>>>1}else{n=c[f+4>>2]|0}if((n|0)==0){o=l}else{dM(f,1304,2)|0;o=c[k>>2]|0}m=c[e+4>>2]|0;b$[c[(c[m>>2]|0)+24>>2]&7](j,m,o);m=j;p=a[m]|0;if((p&1)==0){q=j+1|0}else{q=c[j+8>>2]|0}r=p&255;if((r&1|0)==0){s=r>>>1}else{s=c[j+4>>2]|0}dM(f,q,s)|0;if((a[m]&1)==0){break}kN(c[j+8>>2]|0)}}while(0);j=b;c[j>>2]=c[h>>2];c[j+4>>2]=c[h+4>>2];c[j+8>>2]=c[h+8>>2];kV(h|0,0,12);i=g;return}function dy(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+32|0;g=d;d=i;i=i+8|0;c[d>>2]=c[g>>2];c[d+4>>2]=c[g+4>>2];g=f|0;h=f+16|0;j=kW(e|0)|0;if(j>>>0>4294967279>>>0){dC(0)}if(j>>>0<11>>>0){a[h]=j<<1&255;k=h+1|0}else{l=j+16&-16;m=kL(l)|0;c[h+8>>2]=m;c[h>>2]=l|1;c[h+4>>2]=j;k=m}kX(k|0,e|0,j)|0;a[k+j|0]=0;dx(g,d,h);dl(b|0,g);if((a[g]&1)!=0){kN(c[g+8>>2]|0)}if((a[h]&1)==0){n=b|0;c[n>>2]=4624;o=b+8|0;p=d;q=o;r=p|0;s=c[r>>2]|0;t=p+4|0;u=c[t>>2]|0;v=q|0;c[v>>2]=s;w=q+4|0;c[w>>2]=u;i=f;return}kN(c[h+8>>2]|0);n=b|0;c[n>>2]=4624;o=b+8|0;p=d;q=o;r=p|0;s=c[r>>2]|0;t=p+4|0;u=c[t>>2]|0;v=q|0;c[v>>2]=s;w=q+4|0;c[w>>2]=u;i=f;return}function dz(a){a=a|0;dp(a|0);kN(a);return}function dA(a){a=a|0;dp(a|0);return}function dB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e;if((c[a>>2]|0)==1){do{bL(25784,25760)|0;}while((c[a>>2]|0)==1)}if((c[a>>2]|0)!=0){f;return}c[a>>2]=1;g;bV[d&511](b);h;c[a>>2]=-1;i;bq(25784)|0;return}function dC(a){a=a|0;a=bd(8)|0;dh(a,296);c[a>>2]=2632;aM(a|0,8360,36)}function dD(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;if((a[e]&1)==0){f=b;c[f>>2]=c[e>>2];c[f+4>>2]=c[e+4>>2];c[f+8>>2]=c[e+8>>2];return}e=c[d+8>>2]|0;f=c[d+4>>2]|0;if(f>>>0>4294967279>>>0){dC(0)}if(f>>>0<11>>>0){a[b]=f<<1&255;g=b+1|0}else{d=f+16&-16;h=kL(d)|0;c[b+8>>2]=h;c[b>>2]=d|1;c[b+4>>2]=f;g=h}kX(g|0,e|0,f)|0;a[g+f|0]=0;return}function dE(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if(e>>>0>4294967279>>>0){dC(0)}if(e>>>0<11>>>0){a[b]=e<<1&255;f=b+1|0;kX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}else{h=e+16&-16;i=kL(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=e;f=i;kX(f|0,d|0,e)|0;g=f+e|0;a[g]=0;return}}function dF(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;if(d>>>0>4294967279>>>0){dC(0)}if(d>>>0<11>>>0){a[b]=d<<1&255;f=b+1|0;kV(f|0,e|0,d|0);g=f+d|0;a[g]=0;return}else{h=d+16&-16;i=kL(h)|0;c[b+8>>2]=i;c[b>>2]=h|1;c[b+4>>2]=d;f=i;kV(f|0,e|0,d|0);g=f+d|0;a[g]=0;return}}function dG(b){b=b|0;if((a[b]&1)==0){return}kN(c[b+8>>2]|0);return}function dH(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=kW(d|0)|0;f=b;g=b;h=a[g]|0;if((h&1)==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}if(i>>>0<e>>>0){h=j&255;if((h&1|0)==0){k=h>>>1}else{k=c[b+4>>2]|0}dN(b,i,e-i|0,k,0,k,e,d);return b|0}if((j&1)==0){l=f+1|0}else{l=c[b+8>>2]|0}kY(l|0,d|0,e|0);a[l+e|0]=0;if((a[g]&1)==0){a[g]=e<<1&255;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function dI(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b;g=a[f]|0;h=g&255;if((h&1|0)==0){i=h>>>1}else{i=c[b+4>>2]|0}if(i>>>0<d>>>0){h=d-i|0;dJ(b,h,e)|0;return}if((g&1)==0){a[b+1+d|0]=0;a[f]=d<<1&255;return}else{
a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;return}}function dJ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){return b|0}f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<d>>>0){dO(b,h,d-h+j|0,j,j,0,0);k=a[f]|0}else{k=i}if((k&1)==0){l=b+1|0}else{l=c[b+8>>2]|0}kV(l+j|0,e|0,d|0);e=j+d|0;if((a[f]&1)==0){a[f]=e<<1&255}else{c[b+4>>2]=e}a[l+e|0]=0;return b|0}function dK(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if(d>>>0>4294967279>>>0){dC(0)}e=b;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}g=j>>>0>d>>>0?j:d;if(g>>>0<11>>>0){k=11}else{k=g+16&-16}g=k-1|0;if((g|0)==(h|0)){return}if((g|0)==10){l=e+1|0;m=c[b+8>>2]|0;n=1;o=0}else{if(g>>>0>h>>>0){p=kL(k)|0}else{p=kL(k)|0}h=i&1;if(h<<24>>24==0){q=e+1|0}else{q=c[b+8>>2]|0}l=p;m=q;n=h<<24>>24!=0;o=1}h=i&255;if((h&1|0)==0){r=h>>>1}else{r=c[b+4>>2]|0}h=r+1|0;kX(l|0,m|0,h)|0;if(n){kN(m)}if(o){c[b>>2]=k|1;c[b+4>>2]=j;c[b+8>>2]=l;return}else{a[f]=j<<1&255;return}}function dL(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=10}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){dO(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2&255;j=b+1|0;k=g+1|0;l=j+g|0;a[l]=d;m=j+k|0;a[m]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+g|0;a[l]=d;m=j+k|0;a[m]=0;return}}function dM(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<e>>>0){dN(b,h,e-h+j|0,j,j,0,e,d);return b|0}if((e|0)==0){return b|0}if((i&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}i=k+j|0;kX(i|0,d|0,e)|0;d=j+e|0;if((a[f]&1)==0){a[f]=d<<1&255}else{c[b+4>>2]=d}a[k+d|0]=0;return b|0}function dN(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((-18-d|0)>>>0<e>>>0){dC(0)}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<11>>>0){o=11;break}o=n+16&-16}else{o=-17}}while(0);e=kL(o)|0;if((g|0)!=0){kX(e|0,k|0,g)|0}if((i|0)!=0){n=e+g|0;kX(n|0,j|0,i)|0}j=f-h|0;if((j|0)!=(g|0)){f=j-g|0;n=e+(i+g)|0;l=k+(h+g)|0;kX(n|0,l|0,f)|0}if((d|0)==10){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}kN(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+s|0;a[u]=0;return}function dO(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((-17-d|0)>>>0<e>>>0){dC(0)}if((a[b]&1)==0){j=b+1|0}else{j=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<11>>>0){n=11;break}n=m+16&-16}else{n=-17}}while(0);e=kL(n)|0;if((g|0)!=0){kX(e|0,j|0,g)|0}m=f-h|0;if((m|0)!=(g|0)){f=m-g|0;m=e+(i+g)|0;i=j+(h+g)|0;kX(m|0,i|0,f)|0}if((d|0)==10){
o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}kN(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function dP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(e>>>0>1073741807>>>0){dC(0)}if(e>>>0<2>>>0){a[b]=e<<1&255;f=b+4|0;g=kh(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}else{i=e+4&-4;j=kL(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=e;f=j;g=kh(f,d,e)|0;h=f+(e<<2)|0;c[h>>2]=0;return}}function dQ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if(d>>>0>1073741807>>>0){dC(0)}if(d>>>0<2>>>0){a[b]=d<<1&255;f=b+4|0;g=kj(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}else{i=d+4&-4;j=kL(i<<2)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=d;f=j;g=kj(f,e,d)|0;h=f+(d<<2)|0;c[h>>2]=0;return}}function dR(b){b=b|0;if((a[b]&1)==0){return}kN(c[b+8>>2]|0);return}function dS(a,b){a=a|0;b=b|0;return dT(a,b,kg(b)|0)|0}function dT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)==0){h=1;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}if(h>>>0<e>>>0){g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}dW(b,h,e-h|0,j,0,j,e,d);return b|0}if((i&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}ki(k,d,e)|0;c[k+(e<<2)>>2]=0;if((a[f]&1)==0){a[f]=e<<1&255;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function dU(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if(d>>>0>1073741807>>>0){dC(0)}e=b;f=a[e]|0;if((f&1)==0){g=1;h=f}else{f=c[b>>2]|0;g=(f&-2)-1|0;h=f&255}f=h&255;if((f&1|0)==0){i=f>>>1}else{i=c[b+4>>2]|0}f=i>>>0>d>>>0?i:d;if(f>>>0<2>>>0){j=2}else{j=f+4&-4}f=j-1|0;if((f|0)==(g|0)){return}if((f|0)==1){k=b+4|0;l=c[b+8>>2]|0;m=1;n=0}else{d=j<<2;if(f>>>0>g>>>0){o=kL(d)|0}else{o=kL(d)|0}d=h&1;if(d<<24>>24==0){p=b+4|0}else{p=c[b+8>>2]|0}k=o;l=p;m=d<<24>>24!=0;n=1}d=k;k=h&255;if((k&1|0)==0){q=k>>>1}else{q=c[b+4>>2]|0}kh(d,l,q+1|0)|0;if(m){kN(l)}if(n){c[b>>2]=j|1;c[b+4>>2]=i;c[b+8>>2]=d;return}else{a[e]=i<<1&255;return}}function dV(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b;f=a[e]|0;if((f&1)==0){g=(f&255)>>>1;h=1}else{g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}if((g|0)==(h|0)){dX(b,h,1,h,h,0,0);i=a[e]|0}else{i=f}if((i&1)==0){a[e]=(g<<1)+2&255;j=b+4|0;k=g+1|0;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}else{e=c[b+8>>2]|0;i=g+1|0;c[b+4>>2]=i;j=e;k=i;l=j+(g<<2)|0;c[l>>2]=d;m=j+(k<<2)|0;c[m>>2]=0;return}}function dW(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((1073741806-d|0)>>>0<e>>>0){dC(0)}if((a[b]&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<2>>>0){o=2;break}o=n+4&-4}else{o=1073741807}}while(0);e=kL(o<<2)|0;if((g|0)!=0){kh(e,k,g)|0}if((i|0)!=0){n=e+(g<<2)|0;kh(n,j,i)|0}j=f-h|0;if((j|0)!=(g|0)){f=j-g|0;n=e+(i+g<<2)|0;l=k+(h+g<<2)|0;kh(n,l,f)|0}if((d|0)==1){p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}kN(k);p=b+8|0;c[p>>2]=e;q=o|1;r=b|0;c[r>>2]=q;s=j+i|0;t=b+4|0;c[t>>2]=s;u=e+(s<<2)|0;c[u>>2]=0;return}function dX(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var 
j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((1073741807-d|0)>>>0<e>>>0){dC(0)}if((a[b]&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){k=e+d|0;l=d<<1;m=k>>>0<l>>>0?l:k;if(m>>>0<2>>>0){n=2;break}n=m+4&-4}else{n=1073741807}}while(0);e=kL(n<<2)|0;if((g|0)!=0){kh(e,j,g)|0}m=f-h|0;if((m|0)!=(g|0)){f=m-g|0;m=e+(i+g<<2)|0;i=j+(h+g<<2)|0;kh(m,i,f)|0}if((d|0)==1){o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}kN(j);o=b+8|0;c[o>>2]=e;p=n|1;q=b|0;c[q>>2]=p;return}function dY(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=(c[b+24>>2]|0)==0;if(g){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((g&1|d)&c[b+20>>2]|0)==0){i=e;return}e=bd(16)|0;do{if((a[26904]|0)==0){if((bt(26904)|0)==0){break}c[6228]=4128;aP(70,24912,u|0)|0}}while(0);b=k$(24912,0,32)|0;c[f>>2]=b&0|1;c[f+4>>2]=K|0;dy(e,f,1328);c[e>>2]=3312;aM(e|0,8904,32)}function dZ(a){a=a|0;var b=0,d=0,e=0,f=0;c[a>>2]=3288;b=c[a+40>>2]|0;d=a+32|0;e=a+36|0;if((b|0)!=0){f=b;do{f=f-1|0;b$[c[(c[d>>2]|0)+(f<<2)>>2]&7](0,a,c[(c[e>>2]|0)+(f<<2)>>2]|0);}while((f|0)!=0)}im(a+28|0);kH(c[d>>2]|0);kH(c[e>>2]|0);kH(c[a+48>>2]|0);kH(c[a+60>>2]|0);return}function d_(a,b){a=a|0;b=b|0;il(a,b+28|0);return}function d$(a,b){a=a|0;b=b|0;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;b=a+28|0;kV(a+32|0,0,40);if((b|0)==0){return}ik(b);return}function d0(a){a=a|0;c[a>>2]=4360;im(a+4|0);kN(a);return}function d1(a){a=a|0;c[a>>2]=4360;im(a+4|0);return}function d2(a,b){a=a|0;b=b|0;return}function d3(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function d4(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function d5(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function d6(a){a=a|0;return 0}function d7(a){a=a|0;return 0}function d8(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+12|0;i=b+16|0;j=d;d=0;while(1){k=c[h>>2]|0;if(k>>>0<(c[i>>2]|0)>>>0){c[h>>2]=k+1;l=a[k]|0}else{k=b_[c[(c[f>>2]|0)+40>>2]&127](b)|0;if((k|0)==-1){g=d;m=982;break}l=k&255}a[j]=l;k=d+1|0;if((k|0)<(e|0)){j=j+1|0;d=k}else{g=k;m=981;break}}if((m|0)==982){return g|0}else if((m|0)==981){return g|0}return 0}function d9(a){a=a|0;return-1|0}function ea(a){a=a|0;var b=0,e=0;if((b_[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){b=-1;return b|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1;b=d[a]|0;return b|0}function eb(a,b){a=a|0;b=b|0;return-1|0}function ec(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=b;if((f|0)<=0){h=0;return h|0}i=b+24|0;j=b+28|0;k=0;l=e;while(1){e=c[i>>2]|0;if(e>>>0<(c[j>>2]|0)>>>0){m=a[l]|0;c[i>>2]=e+1;a[e]=m}else{if((bX[c[(c[g>>2]|0)+52>>2]&31](b,d[l]|0)|0)==-1){h=k;n=1e3;break}}m=k+1|0;if((m|0)<(f|0)){k=m;l=l+1|0}else{h=m;n=998;break}}if((n|0)==998){return h|0}else if((n|0)==1e3){return h|0}return 0}function ed(a,b){a=a|0;b=b|0;return-1|0}function ee(a){a=a|0;c[
a>>2]=4288;im(a+4|0);kN(a);return}function ef(a){a=a|0;c[a>>2]=4288;im(a+4|0);return}function eg(a,b){a=a|0;b=b|0;return}function eh(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function ei(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function ej(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2];c[d+4>>2]=c[b+4>>2];c[d+8>>2]=c[b+8>>2];c[d+12>>2]=c[b+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function ek(a){a=a|0;return 0}function el(a){a=a|0;return 0}function em(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+12|0;h=a+16|0;i=b;b=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+4;k=c[j>>2]|0}else{j=b_[c[(c[e>>2]|0)+40>>2]&127](a)|0;if((j|0)==-1){f=b;l=1019;break}else{k=j}}c[i>>2]=k;j=b+1|0;if((j|0)<(d|0)){i=i+4|0;b=j}else{f=j;l=1017;break}}if((l|0)==1017){return f|0}else if((l|0)==1019){return f|0}return 0}function en(a){a=a|0;return-1|0}function eo(a){a=a|0;var b=0,d=0;if((b_[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){b=-1;return b|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4;b=c[a>>2]|0;return b|0}function ep(a,b){a=a|0;b=b|0;return-1|0}function eq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+24|0;h=a+28|0;i=0;j=b;while(1){b=c[g>>2]|0;if(b>>>0<(c[h>>2]|0)>>>0){k=c[j>>2]|0;c[g>>2]=b+4;c[b>>2]=k}else{if((bX[c[(c[e>>2]|0)+52>>2]&31](a,c[j>>2]|0)|0)==-1){f=i;l=1034;break}}k=i+1|0;if((k|0)<(d|0)){i=k;j=j+4|0}else{f=k;l=1035;break}}if((l|0)==1035){return f|0}else if((l|0)==1034){return f|0}return 0}function er(a,b){a=a|0;b=b|0;return-1|0}function es(a){a=a|0;dZ(a+8|0);kN(a);return}function et(a){a=a|0;dZ(a+8|0);return}function eu(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;dZ(b+(d+8)|0);kN(b+d|0);return}function ev(a){a=a|0;dZ(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function ew(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){ew(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((b_[c[(c[k>>2]|0)+24>>2]&127](k)|0)!=-1){break}k=c[(c[f>>2]|0)-12>>2]|0;dY(h+k|0,c[h+(k+16)>>2]|1)}}while(0);eH(e);i=d;return b|0}function ex(a){a=a|0;var b=0;b=a+16|0;c[b>>2]=c[b>>2]|1;if((c[a+20>>2]&1|0)==0){return}else{a_()}}function ey(a){a=a|0;dZ(a+8|0);kN(a);return}function ez(a){a=a|0;dZ(a+8|0);return}function eA(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;dZ(b+(d+8)|0);kN(b+d|0);return}function eB(a){a=a|0;dZ(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function eC(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24)>>2]|0)==0){i=d;return b|0}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16)>>2]|0)==0){k=c[h+(g+72)>>2]|0;if((k|0)!=0){eC(k)|0}a[j]=1;k=c[h+((c[(c[f>>2]|0)-12>>2]|0)+24)>>2]|0;if((b_[c[(c[k>>2]|0)+24>>2]&127](k)|0)!=-1){
break}k=c[(c[f>>2]|0)-12>>2]|0;dY(h+k|0,c[h+(k+16)>>2]|1)}}while(0);eM(e);i=d;return b|0}function eD(a){a=a|0;dZ(a+4|0);kN(a);return}function eE(a){a=a|0;dZ(a+4|0);return}function eF(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;dZ(b+(d+4)|0);kN(b+d|0);return}function eG(a){a=a|0;dZ(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function eH(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bC()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((b_[c[(c[e>>2]|0)+24>>2]&127](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;dY(d+b|0,c[d+(b+16)>>2]|1);return}function eI(a){a=a|0;dZ(a+4|0);kN(a);return}function eJ(a){a=a|0;dZ(a+4|0);return}function eK(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;dZ(b+(d+4)|0);kN(b+d|0);return}function eL(a){a=a|0;dZ(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function eM(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24)>>2]|0)==0){return}if((c[e+(d+16)>>2]|0)!=0){return}if((c[e+(d+4)>>2]&8192|0)==0){return}if(bC()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if((b_[c[(c[e>>2]|0)+24>>2]&127](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;dY(d+b|0,c[d+(b+16)>>2]|1);return}function eN(a){a=a|0;return 1400}function eO(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)==1){dE(a,1640,35);return}else{dw(a,b|0,c);return}}function eP(a){a=a|0;ds(a|0);return}function eQ(a){a=a|0;dA(a|0);kN(a);return}function eR(a){a=a|0;dA(a|0);return}function eS(a){a=a|0;dZ(a);kN(a);return}function eT(a){a=a|0;ds(a|0);kN(a);return}function eU(a){a=a|0;de(a|0);kN(a);return}function eV(a){a=a|0;de(a|0);return}function eW(a){a=a|0;de(a|0);return}function eX(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L1322:do{if((e|0)==(f|0)){g=c}else{b=c;h=e;while(1){if((b|0)==(d|0)){i=-1;j=1153;break}k=a[b]|0;l=a[h]|0;if(k<<24>>24<l<<24>>24){i=-1;j=1151;break}if(l<<24>>24<k<<24>>24){i=1;j=1154;break}k=b+1|0;l=h+1|0;if((l|0)==(f|0)){g=k;break L1322}else{b=k;h=l}}if((j|0)==1151){return i|0}else if((j|0)==1154){return i|0}else if((j|0)==1153){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function eY(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;if(g>>>0>4294967279>>>0){dC(b)}if(g>>>0<11>>>0){a[b]=g<<1&255;h=b+1|0}else{i=g+16&-16;j=kL(i)|0;c[b+8>>2]=j;c[b>>2]=i|1;c[b+4>>2]=g;h=j}if((e|0)==(f|0)){k=h;a[k]=0;return}j=f+(-d|0)|0;d=h;g=e;while(1){a[d]=a[g]|0;e=g+1|0;if((e|0)==(f|0)){break}else{d=d+1|0;g=e}}k=h+j|0;a[k]=0;return}function eZ(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if((c|0)==(d|0)){e=0;return e|0}else{f=c;g=0}while(1){c=(a[f]|0)+(g<<4)|0;b=c&-268435456;h=(b>>>24|b)^c;c=f+1|0;if((c|0)==(d|0)){e=h;break}else{f=c;g=h}}return e|0}function e_(a){a=a|0;de(a|0);kN(a);return}function e$(a){a=a|0;de(a|0);return}function e0(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L1358:do{
if((e|0)==(f|0)){g=b}else{a=b;h=e;while(1){if((a|0)==(d|0)){i=-1;j=1183;break}k=c[a>>2]|0;l=c[h>>2]|0;if((k|0)<(l|0)){i=-1;j=1182;break}if((l|0)<(k|0)){i=1;j=1181;break}k=a+4|0;l=h+4|0;if((l|0)==(f|0)){g=k;break L1358}else{a=k;h=l}}if((j|0)==1183){return i|0}else if((j|0)==1182){return i|0}else if((j|0)==1181){return i|0}}}while(0);i=(g|0)!=(d|0)|0;return i|0}function e1(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741807>>>0){dC(b)}if(h>>>0<2>>>0){a[b]=g>>>1&255;i=b+4|0}else{g=h+4&-4;j=kL(g<<2)|0;c[b+8>>2]=j;c[b>>2]=g|1;c[b+4>>2]=h;i=j}if((e|0)==(f|0)){k=i;c[k>>2]=0;return}j=(f-4+(-d|0)|0)>>>2;d=i;h=e;while(1){c[d>>2]=c[h>>2];e=h+4|0;if((e|0)==(f|0)){break}else{d=d+4|0;h=e}}k=i+(j+1<<2)|0;c[k>>2]=0;return}function e2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((b|0)==(d|0)){e=0;return e|0}else{f=b;g=0}while(1){b=(c[f>>2]|0)+(g<<4)|0;a=b&-268435456;h=(a>>>24|a)^b;b=f+4|0;if((b|0)==(d|0)){e=h;break}else{f=b;g=h}}return e|0}function e3(a){a=a|0;de(a|0);kN(a);return}function e4(a){a=a|0;de(a|0);return}function e5(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];bU[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==0){a[j]=0}else if((w|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}d_(r,g);q=r|0;r=c[q>>2]|0;if((c[6584]|0)!=-1){c[m>>2]=26336;c[m+4>>2]=14;c[m+8>>2]=0;dB(26336,m,98)}m=(c[6585]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[q>>2]|0;dg(n)|0;d_(s,g);n=s|0;p=c[n>>2]|0;if((c[6488]|0)!=-1){c[l>>2]=25952;c[l+4>>2]=14;c[l+8>>2]=0;dB(25952,l,98)}d=(c[6489]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;z=c[n>>2]|0;dg(z)|0;z=t|0;A=x;bW[c[(c[A>>2]|0)+24>>2]&127](z,y);bW[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(e6(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];dG(t+12|0);dG(t|0);i=k;return}}while(0);o=bd(4)|0;kl(o);aM(o|0,8328,134)}}while(0);k=bd(4)|0;kl(k);aM(k|0,8328,134)}function e6(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=kG(m)|0;if((o|0)!=0){p=o;q=o;break}kS();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;
m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){z=r;break}if((b_[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){A=z;B=0}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if((b_[c[(c[m>>2]|0)+36>>2]&127](m)|0)!=-1){C=m;break}c[b>>2]=0;C=0}else{C=m}}while(0);A=c[u>>2]|0;B=C}D=(B|0)==0;if(!((r^D)&(s|0)!=0)){break}m=c[A+12>>2]|0;if((m|0)==(c[A+16>>2]|0)){E=(b_[c[(c[A>>2]|0)+36>>2]&127](A)|0)&255}else{E=a[m]|0}if(k){F=E}else{F=bX[c[(c[e>>2]|0)+12>>2]&31](h,E)|0}do{if(n){G=x;H=s}else{m=t+1|0;L1469:do{if(k){y=s;o=x;w=p;v=0;I=f;while(1){do{if((a[w]|0)==1){J=I;if((a[J]&1)==0){K=I+1|0}else{K=c[I+8>>2]|0}if(F<<24>>24!=(a[K+t|0]|0)){a[w]=0;L=v;M=o;N=y-1|0;break}O=d[J]|0;if((O&1|0)==0){P=O>>>1}else{P=c[I+4>>2]|0}if((P|0)!=(m|0)){L=1;M=o;N=y;break}a[w]=2;L=1;M=o+1|0;N=y-1|0}else{L=v;M=o;N=y}}while(0);O=I+12|0;if((O|0)==(g|0)){Q=N;R=M;S=L;break L1469}y=N;o=M;w=w+1|0;v=L;I=O}}else{I=s;v=x;w=p;o=0;y=f;while(1){do{if((a[w]|0)==1){O=y;if((a[O]&1)==0){T=y+1|0}else{T=c[y+8>>2]|0}if(F<<24>>24!=(bX[c[(c[e>>2]|0)+12>>2]&31](h,a[T+t|0]|0)|0)<<24>>24){a[w]=0;U=o;V=v;W=I-1|0;break}J=d[O]|0;if((J&1|0)==0){X=J>>>1}else{X=c[y+4>>2]|0}if((X|0)!=(m|0)){U=1;V=v;W=I;break}a[w]=2;U=1;V=v+1|0;W=I-1|0}else{U=o;V=v;W=I}}while(0);J=y+12|0;if((J|0)==(g|0)){Q=W;R=V;S=U;break L1469}I=W;v=V;w=w+1|0;o=U;y=J}}}while(0);if(!S){G=R;H=Q;break}m=c[u>>2]|0;y=m+12|0;o=c[y>>2]|0;if((o|0)==(c[m+16>>2]|0)){w=c[(c[m>>2]|0)+40>>2]|0;b_[w&127](m)|0}else{c[y>>2]=o+1}if((R+Q|0)>>>0<2>>>0|n){G=R;H=Q;break}o=t+1|0;y=R;m=p;w=f;while(1){do{if((a[m]|0)==2){v=d[w]|0;if((v&1|0)==0){Y=v>>>1}else{Y=c[w+4>>2]|0}if((Y|0)==(o|0)){Z=y;break}a[m]=0;Z=y-1|0}else{Z=y}}while(0);v=w+12|0;if((v|0)==(g|0)){G=Z;H=Q;break}else{y=Z;m=m+1|0;w=v}}}}while(0);t=t+1|0;x=G;s=H}do{if((A|0)==0){_=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){_=A;break}if((b_[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[u>>2]=0;_=0;break}else{_=c[u>>2]|0;break}}}while(0);u=(_|0)==0;do{if(D){$=1327}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(u){break}else{$=1329;break}}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)==-1){c[b>>2]=0;$=1327;break}else{if(u^(B|0)==0){break}else{$=1329;break}}}}while(0);if(($|0)==1327){if(u){$=1329}}if(($|0)==1329){c[j>>2]=c[j>>2]|2}L1548:do{if(n){$=1334}else{u=f;B=p;while(1){if((a[B]|0)==2){aa=u;break L1548}b=u+12|0;if((b|0)==(g|0)){$=1334;break L1548}u=b;B=B+1|0}}}while(0);if(($|0)==1334){c[j>>2]=c[j>>2]|4;aa=g}if((q|0)==0){i=l;return aa|0}kH(q);i=l;return aa|0}function e7(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];e8(a,0,j,k,f,g,h);i=b;return}function e8(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,
O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;fQ(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L1572:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b_[c[(c[w>>2]|0)+36>>2]&127](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=1362}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L1572}}if((b_[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;E=1362;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L1572}}}}while(0);if((E|0)==1362){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}dI(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}dI(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)&255}else{R=a[K]|0}if((fq(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;b_[Q&127](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=j$(H,c[q>>2]|0,j,v)|0;hJ(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L1632:do{if(J){E=1403}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b_[c[(c[I>>2]|0)+36>>2]&127](I)|0)!=-1){break}c[f>>2]=0;E=1403;break L1632}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}}while(0);do{if((E|0)==1403){if(h){break}U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}function e9(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fa(a,0,j,k,f,g,h);i=b;return}function fa(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else 
if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=l|0;fQ(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L1657:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b_[c[(c[w>>2]|0)+36>>2]&127](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=1431}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L1657}}if((b_[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;E=1431;break}else{L=(D|0)==0;if(C^L){F=D;G=L;break}else{H=m;I=D;J=L;break L1657}}}}while(0);if((E|0)==1431){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;L=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((L?D>>>1:c[z>>2]|0)|0)){if(L){M=D>>>1;N=D>>>1}else{D=c[z>>2]|0;M=D;N=D}dI(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}dI(o,O,0);if((a[p]&1)==0){P=x}else{P=c[y>>2]|0}c[q>>2]=P+N;Q=P}else{Q=m}D=B+12|0;L=c[D>>2]|0;R=B+16|0;if((L|0)==(c[R>>2]|0)){S=(b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)&255}else{S=a[L]|0}if((fq(S,v,Q,q,t,A,n,l,s,u)|0)!=0){H=Q;I=F;J=G;break}L=c[D>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[B>>2]|0)+40>>2]|0;b_[R&127](B)|0;m=Q;w=B;continue}else{c[D>>2]=L+1;m=Q;w=B;continue}}w=d[n]|0;if((w&1|0)==0){T=w>>>1}else{T=c[n+4>>2]|0}do{if((T|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}Q=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=Q}}while(0);t=j_(H,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;hJ(n,l,c[s>>2]|0,j);do{if(C){U=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){U=B;break}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){U=B;break}c[h>>2]=0;U=0}}while(0);h=(U|0)==0;L1717:do{if(J){E=1472}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b_[c[(c[I>>2]|0)+36>>2]&127](I)|0)!=-1){break}c[f>>2]=0;E=1472;break L1717}}while(0);if(!(h^(I|0)==0)){break}V=b|0;c[V>>2]=U;dG(o);dG(n);i=e;return}}while(0);do{if((E|0)==1472){if(h){break}V=b|0;c[V>>2]=U;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;dG(o);dG(n);i=e;return}function fb(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fc(a,0,j,k,f,g,h);i=b;return}function fc(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;f=i;i=i+72|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+32|0;o=f+40|0;p=f+56|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==8){w=16}else if((v|0)==0){w=0}else if((v|0)==64){w=8}else{w=10}v=m|0;fQ(o,j,v,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=a[n]|0;n=x;x=c[j>>2]
|0;L1742:while(1){do{if((x|0)==0){C=0}else{if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){C=x;break}if((b_[c[(c[x>>2]|0)+36>>2]&127](x)|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);D=(C|0)==0;E=c[g>>2]|0;do{if((E|0)==0){F=1500}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){if(D){G=E;H=0;break}else{I=n;J=E;K=0;break L1742}}if((b_[c[(c[E>>2]|0)+36>>2]&127](E)|0)==-1){c[g>>2]=0;F=1500;break}else{L=(E|0)==0;if(D^L){G=E;H=L;break}else{I=n;J=E;K=L;break L1742}}}}while(0);if((F|0)==1500){F=0;if(D){I=n;J=0;K=1;break}else{G=0;H=1}}E=d[q]|0;L=(E&1|0)==0;if(((c[r>>2]|0)-n|0)==((L?E>>>1:c[A>>2]|0)|0)){if(L){M=E>>>1;N=E>>>1}else{E=c[A>>2]|0;M=E;N=E}dI(p,M<<1,0);if((a[q]&1)==0){O=10}else{O=(c[h>>2]&-2)-1|0}dI(p,O,0);if((a[q]&1)==0){P=y}else{P=c[z>>2]|0}c[r>>2]=P+N;Q=P}else{Q=n}E=C+12|0;L=c[E>>2]|0;R=C+16|0;if((L|0)==(c[R>>2]|0)){S=(b_[c[(c[C>>2]|0)+36>>2]&127](C)|0)&255}else{S=a[L]|0}if((fq(S,w,Q,r,u,B,o,m,t,v)|0)!=0){I=Q;J=G;K=H;break}L=c[E>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[C>>2]|0)+40>>2]|0;b_[R&127](C)|0;n=Q;x=C;continue}else{c[E>>2]=L+1;n=Q;x=C;continue}}x=d[o]|0;if((x&1|0)==0){T=x>>>1}else{T=c[o+4>>2]|0}do{if((T|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}Q=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=Q}}while(0);b[l>>1]=jZ(I,c[r>>2]|0,k,w)|0;hJ(o,m,c[t>>2]|0,k);do{if(D){U=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){U=C;break}if((b_[c[(c[C>>2]|0)+36>>2]&127](C)|0)!=-1){U=C;break}c[j>>2]=0;U=0}}while(0);j=(U|0)==0;L1802:do{if(K){F=1541}else{do{if((c[J+12>>2]|0)==(c[J+16>>2]|0)){if((b_[c[(c[J>>2]|0)+36>>2]&127](J)|0)!=-1){break}c[g>>2]=0;F=1541;break L1802}}while(0);if(!(j^(J|0)==0)){break}V=e|0;c[V>>2]=U;dG(p);dG(o);i=f;return}}while(0);do{if((F|0)==1541){if(j){break}V=e|0;c[V>>2]=U;dG(p);dG(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;V=e|0;c[V>>2]=U;dG(p);dG(o);i=f;return}function fd(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fe(a,0,j,k,f,g,h);i=b;return}function fe(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=l|0;fQ(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L1827:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b_[c[(c[w>>2]|0)+36>>2]&127](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=1569}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}
else{H=m;I=D;J=0;break L1827}}if((b_[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;E=1569;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L1827}}}}while(0);if((E|0)==1569){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}dI(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}dI(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)&255}else{R=a[K]|0}if((fq(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;b_[Q&127](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=jY(H,c[q>>2]|0,j,v)|0;hJ(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L1887:do{if(J){E=1610}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b_[c[(c[I>>2]|0)+36>>2]&127](I)|0)!=-1){break}c[f>>2]=0;E=1610;break L1887}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}}while(0);do{if((E|0)==1610){if(h){break}U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}function ff(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fg(a,0,j,k,f,g,h);i=b;return}function fg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;fQ(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L1912:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b_[c[(c[w>>2]|0)+36>>2]&127](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=1638}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L1912}}if((b_[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;E=1638;break}else{K=(D|0)==0;if(C^K){F=D;G=K;break}else{H=m;I=D;J=K;break L1912}}}}while(0);if((E|0)==1638){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;K=(D&1|0)==0;if(((c[q>>2]|0)-
m|0)==((K?D>>>1:c[z>>2]|0)|0)){if(K){L=D>>>1;M=D>>>1}else{D=c[z>>2]|0;L=D;M=D}dI(o,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[g>>2]&-2)-1|0}dI(o,N,0);if((a[p]&1)==0){O=x}else{O=c[y>>2]|0}c[q>>2]=O+M;P=O}else{P=m}D=B+12|0;K=c[D>>2]|0;Q=B+16|0;if((K|0)==(c[Q>>2]|0)){R=(b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)&255}else{R=a[K]|0}if((fq(R,v,P,q,t,A,n,l,s,u)|0)!=0){H=P;I=F;J=G;break}K=c[D>>2]|0;if((K|0)==(c[Q>>2]|0)){Q=c[(c[B>>2]|0)+40>>2]|0;b_[Q&127](B)|0;m=P;w=B;continue}else{c[D>>2]=K+1;m=P;w=B;continue}}w=d[n]|0;if((w&1|0)==0){S=w>>>1}else{S=c[n+4>>2]|0}do{if((S|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}P=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=P}}while(0);c[k>>2]=jX(H,c[q>>2]|0,j,v)|0;hJ(n,l,c[s>>2]|0,j);do{if(C){T=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){T=B;break}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){T=B;break}c[h>>2]=0;T=0}}while(0);h=(T|0)==0;L1972:do{if(J){E=1679}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b_[c[(c[I>>2]|0)+36>>2]&127](I)|0)!=-1){break}c[f>>2]=0;E=1679;break L1972}}while(0);if(!(h^(I|0)==0)){break}U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}}while(0);do{if((E|0)==1679){if(h){break}U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;U=b|0;c[U>>2]=T;dG(o);dG(n);i=e;return}function fh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fi(a,0,j,k,f,g,h);i=b;return}function fi(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+72|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+32|0;n=e+40|0;o=e+56|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=l|0;fQ(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=a[m]|0;m=w;w=c[h>>2]|0;L1997:while(1){do{if((w|0)==0){B=0}else{if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){B=w;break}if((b_[c[(c[w>>2]|0)+36>>2]&127](w)|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);C=(B|0)==0;D=c[f>>2]|0;do{if((D|0)==0){E=1707}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(C){F=D;G=0;break}else{H=m;I=D;J=0;break L1997}}if((b_[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;E=1707;break}else{L=(D|0)==0;if(C^L){F=D;G=L;break}else{H=m;I=D;J=L;break L1997}}}}while(0);if((E|0)==1707){E=0;if(C){H=m;I=0;J=1;break}else{F=0;G=1}}D=d[p]|0;L=(D&1|0)==0;if(((c[q>>2]|0)-m|0)==((L?D>>>1:c[z>>2]|0)|0)){if(L){M=D>>>1;N=D>>>1}else{D=c[z>>2]|0;M=D;N=D}dI(o,M<<1,0);if((a[p]&1)==0){O=10}else{O=(c[g>>2]&-2)-1|0}dI(o,O,0);if((a[p]&1)==0){P=x}else{P=c[y>>2]|0}c[q>>2]=P+N;Q=P}else{Q=m}D=B+12|0;L=c[D>>2]|0;R=B+16|0;if((L|0)==(c[R>>2]|0)){S=(b_[c[(c[
B>>2]|0)+36>>2]&127](B)|0)&255}else{S=a[L]|0}if((fq(S,v,Q,q,t,A,n,l,s,u)|0)!=0){H=Q;I=F;J=G;break}L=c[D>>2]|0;if((L|0)==(c[R>>2]|0)){R=c[(c[B>>2]|0)+40>>2]|0;b_[R&127](B)|0;m=Q;w=B;continue}else{c[D>>2]=L+1;m=Q;w=B;continue}}w=d[n]|0;if((w&1|0)==0){T=w>>>1}else{T=c[n+4>>2]|0}do{if((T|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}Q=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=Q}}while(0);t=jW(H,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;hJ(n,l,c[s>>2]|0,j);do{if(C){U=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){U=B;break}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){U=B;break}c[h>>2]=0;U=0}}while(0);h=(U|0)==0;L2057:do{if(J){E=1748}else{do{if((c[I+12>>2]|0)==(c[I+16>>2]|0)){if((b_[c[(c[I>>2]|0)+36>>2]&127](I)|0)!=-1){break}c[f>>2]=0;E=1748;break L2057}}while(0);if(!(h^(I|0)==0)){break}V=b|0;c[V>>2]=U;dG(o);dG(n);i=e;return}}while(0);do{if((E|0)==1748){if(h){break}V=b|0;c[V>>2]=U;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;dG(o);dG(n);i=e;return}function fj(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fk(a,0,j,k,f,g,h);i=b;return}function fk(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;fR(o,j,x,m,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L2077:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((b_[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=1772}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L2077}}if((b_[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[f>>2]=0;H=1772;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L2077}}}}while(0);if((H|0)==1772){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}dI(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}dI(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(b_[c[(c[E>>2]|0)+36>>2]&127](E)|0)&255}else{U=a[N]|0}if((fS(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;b_[T&127](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{
V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);g[l>>2]=+jV(K,c[r>>2]|0,k);hJ(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((b_[c[(c[E>>2]|0)+36>>2]&127](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L2138:do{if(M){H=1814}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b_[c[(c[L>>2]|0)+36>>2]&127](L)|0)!=-1){break}c[f>>2]=0;H=1814;break L2138}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}}while(0);do{if((H|0)==1814){if(j){break}X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}function fl(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fm(a,0,j,k,f,g,h);i=b;return}function fm(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;fR(o,j,x,m,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L2158:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((b_[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=1838}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L2158}}if((b_[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[f>>2]=0;H=1838;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L2158}}}}while(0);if((H|0)==1838){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}dI(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}dI(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(b_[c[(c[E>>2]|0)+36>>2]&127](E)|0)&255}else{U=a[N]|0}if((fS(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;b_[T&127](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);h[l>>3]=+jU(K,c[r>>2]|0,k);hJ(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((b_[c[(c[E>>2]|0)
+36>>2]&127](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L2219:do{if(M){H=1880}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b_[c[(c[L>>2]|0)+36>>2]&127](L)|0)!=-1){break}c[f>>2]=0;H=1880;break L2219}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}}while(0);do{if((H|0)==1880){if(j){break}X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}function fn(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fo(a,0,j,k,f,g,h);i=b;return}function fo(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+80|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+32|0;n=e+40|0;o=e+48|0;p=e+64|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;fR(o,j,x,m,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=a[m]|0;m=a[n]|0;n=z;z=c[j>>2]|0;L2239:while(1){do{if((z|0)==0){E=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){E=z;break}if((b_[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);F=(E|0)==0;G=c[f>>2]|0;do{if((G|0)==0){H=1904}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(F){I=G;J=0;break}else{K=n;L=G;M=0;break L2239}}if((b_[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[f>>2]=0;H=1904;break}else{N=(G|0)==0;if(F^N){I=G;J=N;break}else{K=n;L=G;M=N;break L2239}}}}while(0);if((H|0)==1904){H=0;if(F){K=n;L=0;M=1;break}else{I=0;J=1}}G=d[q]|0;N=(G&1|0)==0;if(((c[r>>2]|0)-n|0)==((N?G>>>1:c[C>>2]|0)|0)){if(N){O=G>>>1;P=G>>>1}else{G=c[C>>2]|0;O=G;P=G}dI(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}dI(p,Q,0);if((a[q]&1)==0){R=A}else{R=c[B>>2]|0}c[r>>2]=R+P;S=R}else{S=n}G=E+12|0;N=c[G>>2]|0;T=E+16|0;if((N|0)==(c[T>>2]|0)){U=(b_[c[(c[E>>2]|0)+36>>2]&127](E)|0)&255}else{U=a[N]|0}if((fS(U,v,w,S,r,D,m,o,y,t,u,x)|0)!=0){K=S;L=I;M=J;break}N=c[G>>2]|0;if((N|0)==(c[T>>2]|0)){T=c[(c[E>>2]|0)+40>>2]|0;b_[T&127](E)|0;n=S;z=E;continue}else{c[G>>2]=N+1;n=S;z=E;continue}}z=d[o]|0;if((z&1|0)==0){V=z>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=S}}while(0);h[l>>3]=+jT(K,c[r>>2]|0,k);hJ(o,y,c[t>>2]|0,k);do{if(F){W=0}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){W=E;break}if((b_[c[(c[E>>2]|0)+36>>2]&127](E)|0)!=-1){W=E;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;L2300:do{if(M){H=1946}else{do{if((c[L+12>>2]|0)==(c[L+16>>2]|0)){if((b_[c[(c[L>>2]|0)+36>>2]&127](L)|0)!=-1){break}c[f>>2]=0;H=1946;break L2300}}while(0);if(!(j^(L|0)==0)){break}X=b|0;c[X>>2]
=W;dG(p);dG(o);i=e;return}}while(0);do{if((H|0)==1946){if(j){break}X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;X=b|0;c[X>>2]=W;dG(p);dG(o);i=e;return}function fp(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+48|0;o=i;i=i+4|0;i=i+7&-8;p=i;i=i+12|0;i=i+7&-8;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;kV(n|0,0,12);u=p;d_(o,h);h=o|0;o=c[h>>2]|0;if((c[6584]|0)!=-1){c[l>>2]=26336;c[l+4>>2]=14;c[l+8>>2]=0;dB(26336,l,98)}l=(c[6585]|0)-1|0;v=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+32>>2]|0;b6[z&15](x,9904,9930,y)|0;x=c[h>>2]|0;dg(x)|0;kV(u|0,0,12);x=p;dI(p,10,0);if((a[u]&1)==0){z=x+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;x=f|0;w=g|0;D=p|0;E=p+4|0;F=A;G=c[x>>2]|0;L2327:while(1){do{if((G|0)==0){H=0}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){H=G;break}if((b_[c[(c[G>>2]|0)+36>>2]&127](G)|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;J=c[w>>2]|0;do{if((J|0)==0){K=1977}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(I){break}else{L=F;break L2327}}if((b_[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[w>>2]=0;K=1977;break}else{if(I^(J|0)==0){break}else{L=F;break L2327}}}}while(0);if((K|0)==1977){K=0;if(I){L=F;break}}J=d[u]|0;M=(J&1|0)==0;if(((c[q>>2]|0)-F|0)==((M?J>>>1:c[E>>2]|0)|0)){if(M){N=J>>>1;O=J>>>1}else{J=c[E>>2]|0;N=J;O=J}dI(p,N<<1,0);if((a[u]&1)==0){P=10}else{P=(c[D>>2]&-2)-1|0}dI(p,P,0);if((a[u]&1)==0){Q=B}else{Q=c[C>>2]|0}c[q>>2]=Q+O;R=Q}else{R=F}J=H+12|0;M=c[J>>2]|0;S=H+16|0;if((M|0)==(c[S>>2]|0)){T=(b_[c[(c[H>>2]|0)+36>>2]&127](H)|0)&255}else{T=a[M]|0}if((fq(T,16,R,q,t,0,n,z,s,y)|0)!=0){L=R;break}M=c[J>>2]|0;if((M|0)==(c[S>>2]|0)){S=c[(c[H>>2]|0)+40>>2]|0;b_[S&127](H)|0;F=R;G=H;continue}else{c[J>>2]=M+1;F=R;G=H;continue}}a[L+3|0]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);G=fr(L,c[6226]|0,1256,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){U=0}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){U=G;break}if((b_[c[(c[G>>2]|0)+36>>2]&127](G)|0)!=-1){U=G;break}c[x>>2]=0;U=0}}while(0);x=(U|0)==0;G=c[w>>2]|0;do{if((G|0)==0){K=2022}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(!x){break}V=b|0;c[V>>2]=U;dG(p);dG(n);i=e;return}if((b_[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[w>>2]=0;K=2022;break}if(!(x^(G|0)==0)){break}V=b|0;c[V>>2]=U;dG(p);dG(n);i=e;return}}while(0);do{if((K|0)==2022){if(x){break}V=b|0;c[V>>2]=U;dG(p);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;V=b|0;c[V>>2]=U;dG(p);dG(n);i=e;return}}while(0);e=bd(4)|0;kl(e);aM(e|0,8328,134)}function fq(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,
o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(a[m+24|0]|0)==b<<24>>24;if(!p){if((a[m+25|0]|0)!=b<<24>>24){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&b<<24>>24==i<<24>>24){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+26|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((a[i]|0)==b<<24>>24){s=i;break}else{i=i+1|0}}i=s-m|0;if((i|0)>23){q=-1;return q|0}do{if((e|0)==16){if((i|0)<22){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;m=a[9904+i|0]|0;s=c[g>>2]|0;c[g>>2]=s+1;a[s]=m;q=0;return q|0}else if((e|0)==8|(e|0)==10){if((i|0)<(e|0)){break}else{q=-1}return q|0}}while(0);e=a[9904+i|0]|0;c[g>>2]=n+1;a[n]=e;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function fr(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=bN(b|0)|0;b=aG(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}bN(h|0)|0;i=f;return b|0}function fs(a){a=a|0;de(a|0);kN(a);return}function ft(a){a=a|0;de(a|0);return}function fu(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+112|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=k+48|0;q=k+56|0;r=k+64|0;s=k+72|0;t=k+80|0;u=k+104|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;w=e|0;c[p>>2]=c[w>>2];c[q>>2]=c[f>>2];bU[v&127](o,d,p,q,g,h,n);q=c[o>>2]|0;c[w>>2]=q;w=c[n>>2]|0;if((w|0)==0){a[j]=0}else if((w|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}d_(r,g);q=r|0;r=c[q>>2]|0;if((c[6582]|0)!=-1){c[m>>2]=26328;c[m+4>>2]=14;c[m+8>>2]=0;dB(26328,m,98)}m=(c[6583]|0)-1|0;w=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-w>>2>>>0>m>>>0){n=c[w+(m<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[q>>2]|0;dg(n)|0;d_(s,g);n=s|0;p=c[n>>2]|0;if((c[6486]|0)!=-1){c[l>>2]=25944;c[l+4>>2]=14;c[l+8>>2]=0;dB(25944,l,98)}d=(c[6487]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>d>>>0){x=c[v+(d<<2)>>2]|0;if((x|0)==0){break}y=x;z=c[n>>2]|0;dg(z)|0;z=t|0;A=x;bW[c[(c[A>>2]|0)+24>>2]&127](z,y);bW[c[(c[A>>2]|0)+28>>2]&127](t+12|0,y);c[u>>2]=c[f>>2];a[j]=(fv(e,u,z,t+24|0,o,h,1)|0)==(z|0)|0;c[b>>2]=c[e>>2];dR(t+12|0);dR(t|0);i=k;return}}while(0);o=bd(4)|0;kl(o);aM(o|0,8328,134)}}while(0);k=bd(4)|0;kl(k);aM(k|0,8328,134)}function fv(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;l=i;i=i+104|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=(g-f|0)/12|0;n=l|0;do{if(m>>>0>100>>>0){o=kG(m)|0;if((o|0)!=0){p=o;q=o;break}kS();p=0;q=0}else{p=n;q=0}}while(0);n=(f|0)==(g|0);if(n){r=m;s=0}else{o=m;m=0;t=p;u=f;while(1){v=d[u]|0;if((v&1|0)==0){w=v>>>1}else{w=c[u+4>>2]|0}if((w|0)==0){a[t]=2;
x=m+1|0;y=o-1|0}else{a[t]=1;x=m;y=o}v=u+12|0;if((v|0)==(g|0)){r=y;s=x;break}else{o=y;m=x;t=t+1|0;u=v}}}u=b|0;b=e|0;e=h;t=0;x=s;s=r;while(1){r=c[u>>2]|0;do{if((r|0)==0){z=0}else{m=c[r+12>>2]|0;if((m|0)==(c[r+16>>2]|0)){A=b_[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{A=c[m>>2]|0}if((A|0)==-1){c[u>>2]=0;z=0;break}else{z=c[u>>2]|0;break}}}while(0);r=(z|0)==0;m=c[b>>2]|0;if((m|0)==0){B=z;C=0}else{y=c[m+12>>2]|0;if((y|0)==(c[m+16>>2]|0)){D=b_[c[(c[m>>2]|0)+36>>2]&127](m)|0}else{D=c[y>>2]|0}if((D|0)==-1){c[b>>2]=0;E=0}else{E=m}B=c[u>>2]|0;C=E}F=(C|0)==0;if(!((r^F)&(s|0)!=0)){break}r=c[B+12>>2]|0;if((r|0)==(c[B+16>>2]|0)){G=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{G=c[r>>2]|0}if(k){H=G}else{H=bX[c[(c[e>>2]|0)+28>>2]&31](h,G)|0}do{if(n){I=x;J=s}else{r=t+1|0;L2534:do{if(k){m=s;y=x;o=p;w=0;v=f;while(1){do{if((a[o]|0)==1){K=v;if((a[K]&1)==0){L=v+4|0}else{L=c[v+8>>2]|0}if((H|0)!=(c[L+(t<<2)>>2]|0)){a[o]=0;M=w;N=y;O=m-1|0;break}P=d[K]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[v+4>>2]|0}if((Q|0)!=(r|0)){M=1;N=y;O=m;break}a[o]=2;M=1;N=y+1|0;O=m-1|0}else{M=w;N=y;O=m}}while(0);P=v+12|0;if((P|0)==(g|0)){R=O;S=N;T=M;break L2534}m=O;y=N;o=o+1|0;w=M;v=P}}else{v=s;w=x;o=p;y=0;m=f;while(1){do{if((a[o]|0)==1){P=m;if((a[P]&1)==0){U=m+4|0}else{U=c[m+8>>2]|0}if((H|0)!=(bX[c[(c[e>>2]|0)+28>>2]&31](h,c[U+(t<<2)>>2]|0)|0)){a[o]=0;V=y;W=w;X=v-1|0;break}K=d[P]|0;if((K&1|0)==0){Y=K>>>1}else{Y=c[m+4>>2]|0}if((Y|0)!=(r|0)){V=1;W=w;X=v;break}a[o]=2;V=1;W=w+1|0;X=v-1|0}else{V=y;W=w;X=v}}while(0);K=m+12|0;if((K|0)==(g|0)){R=X;S=W;T=V;break L2534}v=X;w=W;o=o+1|0;y=V;m=K}}}while(0);if(!T){I=S;J=R;break}r=c[u>>2]|0;m=r+12|0;y=c[m>>2]|0;if((y|0)==(c[r+16>>2]|0)){o=c[(c[r>>2]|0)+40>>2]|0;b_[o&127](r)|0}else{c[m>>2]=y+4}if((S+R|0)>>>0<2>>>0|n){I=S;J=R;break}y=t+1|0;m=S;r=p;o=f;while(1){do{if((a[r]|0)==2){w=d[o]|0;if((w&1|0)==0){Z=w>>>1}else{Z=c[o+4>>2]|0}if((Z|0)==(y|0)){_=m;break}a[r]=0;_=m-1|0}else{_=m}}while(0);w=o+12|0;if((w|0)==(g|0)){I=_;J=R;break}else{m=_;r=r+1|0;o=w}}}}while(0);t=t+1|0;x=I;s=J}do{if((B|0)==0){$=1}else{J=c[B+12>>2]|0;if((J|0)==(c[B+16>>2]|0)){aa=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{aa=c[J>>2]|0}if((aa|0)==-1){c[u>>2]=0;$=1;break}else{$=(c[u>>2]|0)==0;break}}}while(0);do{if(F){ab=2197}else{u=c[C+12>>2]|0;if((u|0)==(c[C+16>>2]|0)){ac=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{ac=c[u>>2]|0}if((ac|0)==-1){c[b>>2]=0;ab=2197;break}else{if($^(C|0)==0){break}else{ab=2199;break}}}}while(0);if((ab|0)==2197){if($){ab=2199}}if((ab|0)==2199){c[j>>2]=c[j>>2]|2}L2615:do{if(n){ab=2204}else{$=f;C=p;while(1){if((a[C]|0)==2){ad=$;break L2615}b=$+12|0;if((b|0)==(g|0)){ab=2204;break L2615}$=b;C=C+1|0}}}while(0);if((ab|0)==2204){c[j>>2]=c[j>>2]|4;ad=g}if((q|0)==0){i=l;return ad|0}kH(q);i=l;return ad|0}function fw(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fx(a,0,j,k,f,g,h);i=b;return}function fx(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;
j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==64){v=8}else if((u|0)==8){v=16}else if((u|0)==0){v=0}else{v=10}u=l|0;fT(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L2639:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b_[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=2233}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=2233;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L2639}}}}while(0);if((F|0)==2233){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}dI(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}dI(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{T=c[G>>2]|0}if((fP(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;b_[S&127](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=j$(K,c[q>>2]|0,j,v)|0;hJ(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=2275}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=b_[c[(c[L>>2]|0)+36>>2]&127](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=2275;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}}while(0);do{if((F|0)==2275){if(h){break}Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}function fy(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fz(a,0,j,k,f,g,h);i=b;return}function fz(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;
i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==64){v=8}else if((u|0)==8){v=16}else{v=10}u=l|0;fT(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L2729:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b_[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=2304}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=2304;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{L=m;M=C;N=G;break L2729}}}}while(0);if((F|0)==2304){F=0;if(E){L=m;M=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}dI(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}dI(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{U=c[G>>2]|0}if((fP(U,v,S,q,t,A,n,l,s,u)|0)!=0){L=S;M=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;b_[T&127](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=j_(L,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;hJ(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=2346}else{B=c[M+12>>2]|0;if((B|0)==(c[M+16>>2]|0)){Y=b_[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=2346;break}if(!(h^(M|0)==0)){break}Z=b|0;c[Z>>2]=W;dG(o);dG(n);i=e;return}}while(0);do{if((F|0)==2346){if(h){break}Z=b|0;c[Z>>2]=W;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;dG(o);dG(n);i=e;return}function fA(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fB(a,0,j,k,f,g,h);i=b;return}function fB(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;f=i;i=i+144|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+104|0;o=f+112|0;p=f+128|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==64){w=8}else if((v|0)==8){w=16}else if((v|0)==0){
w=0}else{w=10}v=m|0;fT(o,j,v,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=c[n>>2]|0;n=x;x=c[j>>2]|0;L2819:while(1){do{if((x|0)==0){C=0}else{D=c[x+12>>2]|0;if((D|0)==(c[x+16>>2]|0)){E=b_[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{E=c[D>>2]|0}if((E|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);F=(C|0)==0;D=c[g>>2]|0;do{if((D|0)==0){G=2375}else{H=c[D+12>>2]|0;if((H|0)==(c[D+16>>2]|0)){I=b_[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{I=c[H>>2]|0}if((I|0)==-1){c[g>>2]=0;G=2375;break}else{H=(D|0)==0;if(F^H){J=D;K=H;break}else{L=n;M=D;N=H;break L2819}}}}while(0);if((G|0)==2375){G=0;if(F){L=n;M=0;N=1;break}else{J=0;K=1}}D=d[q]|0;H=(D&1|0)==0;if(((c[r>>2]|0)-n|0)==((H?D>>>1:c[A>>2]|0)|0)){if(H){O=D>>>1;P=D>>>1}else{D=c[A>>2]|0;O=D;P=D}dI(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}dI(p,Q,0);if((a[q]&1)==0){R=y}else{R=c[z>>2]|0}c[r>>2]=R+P;S=R}else{S=n}D=C+12|0;H=c[D>>2]|0;T=C+16|0;if((H|0)==(c[T>>2]|0)){U=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{U=c[H>>2]|0}if((fP(U,w,S,r,u,B,o,m,t,v)|0)!=0){L=S;M=J;N=K;break}H=c[D>>2]|0;if((H|0)==(c[T>>2]|0)){T=c[(c[C>>2]|0)+40>>2]|0;b_[T&127](C)|0;n=S;x=C;continue}else{c[D>>2]=H+4;n=S;x=C;continue}}x=d[o]|0;if((x&1|0)==0){V=x>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=S}}while(0);b[l>>1]=jZ(L,c[r>>2]|0,k,w)|0;hJ(o,m,c[t>>2]|0,k);do{if(F){W=0}else{t=c[C+12>>2]|0;if((t|0)==(c[C+16>>2]|0)){X=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{X=c[t>>2]|0}if((X|0)!=-1){W=C;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;do{if(N){G=2417}else{C=c[M+12>>2]|0;if((C|0)==(c[M+16>>2]|0)){Y=b_[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{Y=c[C>>2]|0}if((Y|0)==-1){c[g>>2]=0;G=2417;break}if(!(j^(M|0)==0)){break}Z=e|0;c[Z>>2]=W;dG(p);dG(o);i=f;return}}while(0);do{if((G|0)==2417){if(j){break}Z=e|0;c[Z>>2]=W;dG(p);dG(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;Z=e|0;c[Z>>2]=W;dG(p);dG(o);i=f;return}function fC(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fD(a,0,j,k,f,g,h);i=b;return}function fD(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;fT(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L11:while(1){
do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b_[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=22}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=22;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L11}}}}while(0);if((F|0)==22){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}dI(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}dI(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{T=c[G>>2]|0}if((fP(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;b_[S&127](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=jY(K,c[q>>2]|0,j,v)|0;hJ(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=64}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=b_[c[(c[L>>2]|0)+36>>2]&127](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=64;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}}while(0);do{if((F|0)==64){if(h){break}Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}function fE(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fF(a,0,j,k,f,g,h);i=b;return}function fF(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}u=l|0;fT(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L101:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b_[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=93}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)
){H=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=93;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L101}}}}while(0);if((F|0)==93){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}dI(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}dI(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{T=c[G>>2]|0}if((fP(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;b_[S&127](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=jX(K,c[q>>2]|0,j,v)|0;hJ(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=135}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=b_[c[(c[L>>2]|0)+36>>2]&127](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=135;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}}while(0);do{if((F|0)==135){if(h){break}Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;dG(o);dG(n);i=e;return}function fG(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fH(a,0,j,k,f,g,h);i=b;return}function fH(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==64){v=8}else if((u|0)==8){v=16}else{v=10}u=l|0;fT(n,h,u,m);kV(p|0,0,12);h=o;dI(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L191:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=b_[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=164}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=b_[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=164;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{L=m;M=C;N=G;break L191}}}}while(0);if((F|0)==164){F=0;if(E){L=m;M=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;
if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}dI(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}dI(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{U=c[G>>2]|0}if((fP(U,v,S,q,t,A,n,l,s,u)|0)!=0){L=S;M=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;b_[T&127](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=jW(L,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;hJ(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=206}else{B=c[M+12>>2]|0;if((B|0)==(c[M+16>>2]|0)){Y=b_[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=206;break}if(!(h^(M|0)==0)){break}Z=b|0;c[Z>>2]=W;dG(o);dG(n);i=e;return}}while(0);do{if((F|0)==206){if(h){break}Z=b|0;c[Z>>2]=W;dG(o);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;dG(o);dG(n);i=e;return}function fI(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fJ(a,0,j,k,f,g,h);i=b;return}function fJ(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;fU(o,j,x,m,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L276:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=b_[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=231}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=b_[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=231;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L276}}}}while(0);if((I|0)==231){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}dI(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[h>>2]&-2)-1|0}dI(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[
F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=b_[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{W=c[J>>2]|0}if((fV(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;b_[V&127](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);g[l>>2]=+jV(N,c[r>>2]|0,k);hJ(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=b_[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=274}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=b_[c[(c[O>>2]|0)+36>>2]&127](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=274;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}}while(0);do{if((I|0)==274){if(j){break}$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}function fK(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fL(a,0,j,k,f,g,h);i=b;return}function fL(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;fU(o,j,x,m,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L362:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=b_[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=299}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=b_[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=299;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L362}}}}while(0);if((I|0)==299){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}dI(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}dI(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=b_[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{W=c[J>>2]|0}if((fV(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;b_[V&127](E)|0;n=U;
z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+jU(N,c[r>>2]|0,k);hJ(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=b_[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=342}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=b_[c[(c[O>>2]|0)+36>>2]&127](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=342;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}}while(0);do{if((I|0)==342){if(j){break}$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}function fM(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];fN(a,0,j,k,f,g,h);i=b;return}function fN(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;fU(o,j,x,m,n);kV(q|0,0,12);j=p;dI(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L448:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=b_[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=367}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=b_[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=367;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L448}}}}while(0);if((I|0)==367){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}dI(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}dI(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=b_[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{W=c[J>>2]|0}if((fV(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;b_[V&127](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+jT(N,
c[r>>2]|0,k);hJ(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=b_[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=410}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=b_[c[(c[O>>2]|0)+36>>2]&127](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=410;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}}while(0);do{if((I|0)==410){if(j){break}$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;dG(p);dG(o);i=e;return}function fO(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+136|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+120|0;o=i;i=i+4|0;i=i+7&-8;p=i;i=i+12|0;i=i+7&-8;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;kV(n|0,0,12);u=p;d_(o,h);h=o|0;o=c[h>>2]|0;if((c[6582]|0)!=-1){c[l>>2]=26328;c[l+4>>2]=14;c[l+8>>2]=0;dB(26328,l,98)}l=(c[6583]|0)-1|0;v=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+48>>2]|0;b6[z&15](x,9904,9930,y)|0;x=c[h>>2]|0;dg(x)|0;kV(u|0,0,12);x=p;dI(p,10,0);if((a[u]&1)==0){z=x+1|0;A=z;B=z;C=p+8|0}else{z=p+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[q>>2]=A;z=r|0;c[s>>2]=z;c[t>>2]=0;x=f|0;w=g|0;D=p|0;E=p+4|0;F=A;G=c[x>>2]|0;L541:while(1){do{if((G|0)==0){H=0}else{I=c[G+12>>2]|0;if((I|0)==(c[G+16>>2]|0)){J=b_[c[(c[G>>2]|0)+36>>2]&127](G)|0}else{J=c[I>>2]|0}if((J|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;K=c[w>>2]|0;do{if((K|0)==0){L=442}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=b_[c[(c[K>>2]|0)+36>>2]&127](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[w>>2]=0;L=442;break}else{if(I^(K|0)==0){break}else{O=F;break L541}}}}while(0);if((L|0)==442){L=0;if(I){O=F;break}}K=d[u]|0;M=(K&1|0)==0;if(((c[q>>2]|0)-F|0)==((M?K>>>1:c[E>>2]|0)|0)){if(M){P=K>>>1;Q=K>>>1}else{K=c[E>>2]|0;P=K;Q=K}dI(p,P<<1,0);if((a[u]&1)==0){R=10}else{R=(c[D>>2]&-2)-1|0}dI(p,R,0);if((a[u]&1)==0){S=B}else{S=c[C>>2]|0}c[q>>2]=S+Q;T=S}else{T=F}K=H+12|0;M=c[K>>2]|0;U=H+16|0;if((M|0)==(c[U>>2]|0)){V=b_[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{V=c[M>>2]|0}if((fP(V,16,T,q,t,0,n,z,s,y)|0)!=0){O=T;break}M=c[K>>2]|0;if((M|0)==(c[U>>2]|0)){U=c[(c[H>>2]|0)+40>>2]|0;b_[U&127](H)|0;F=T;G=H;continue}else{c[K>>2]=M+4;F=T;G=H;continue}}a[O+3|0]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);G=fr(O,c[6226]|0,1256,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){W=0}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){X=b_[c[(c[G>>2]|0)+36>>2]&127](G)|0}else{X=c[F>>2]|0}if((X|0)!=-1){W=G;break}c[x>>2]=0;W=0}}while(0);x=(W|0)==0;G=c[w>>2]|0;do{if((G|0)==0){L=487}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){Y=b_[c[(c[G>>2]|0)+36>>2]&127](G)|0}
else{Y=c[F>>2]|0}if((Y|0)==-1){c[w>>2]=0;L=487;break}if(!(x^(G|0)==0)){break}Z=b|0;c[Z>>2]=W;dG(p);dG(n);i=e;return}}while(0);do{if((L|0)==487){if(x){break}Z=b|0;c[Z>>2]=W;dG(p);dG(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;dG(p);dG(n);i=e;return}}while(0);e=bd(4)|0;kl(e);aM(e|0,8328,134)}function fP(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&(b|0)==(i|0)){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+104|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((c[i>>2]|0)==(b|0)){s=i;break}else{i=i+4|0}}i=s-m|0;m=i>>2;if((i|0)>92){q=-1;return q|0}do{if((e|0)==16){if((i|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;s=a[9904+m|0]|0;b=c[g>>2]|0;c[g>>2]=b+1;a[b]=s;q=0;return q|0}else if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}}while(0);e=a[9904+m|0]|0;c[g>>2]=n+1;a[n]=e;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function fQ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;d_(k,d);d=k|0;k=c[d>>2]|0;if((c[6584]|0)!=-1){c[j>>2]=26336;c[j+4>>2]=14;c[j+8>>2]=0;dB(26336,j,98)}j=(c[6585]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+32>>2]|0;b6[o&15](n,9904,9930,e)|0;n=c[d>>2]|0;if((c[6488]|0)!=-1){c[h>>2]=25952;c[h+4>>2]=14;c[h+8>>2]=0;dB(25952,h,98)}o=(c[6489]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;a[f]=b_[c[(c[p>>2]|0)+16>>2]&127](q)|0;bW[c[(c[p>>2]|0)+20>>2]&127](b,q);q=c[d>>2]|0;dg(q)|0;i=g;return}}while(0);o=bd(4)|0;kl(o);aM(o|0,8328,134)}}while(0);g=bd(4)|0;kl(g);aM(g|0,8328,134)}function fR(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+40|0;j=h|0;k=h+16|0;l=h+32|0;d_(l,d);d=l|0;l=c[d>>2]|0;if((c[6584]|0)!=-1){c[k>>2]=26336;c[k+4>>2]=14;c[k+8>>2]=0;dB(26336,k,98)}k=(c[6585]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;p=c[(c[n>>2]|0)+32>>2]|0;b6[p&15](o,9904,9936,e)|0;o=c[d>>2]|0;if((c[6488]|0)!=-1){c[j>>2]=25952;c[j+4>>2]=14;c[j+8>>2]=0;dB(25952,j,98)}p=(c[6489]|0)-1|0;n=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-n>>2>>>0>p>>>0){q=c[n+(p<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;a[f]=b_[c[(c[s>>2]|0)+12>>2]&127](r)|0;a[g]=b_[c[(c[s>>2]|0)+16>>2]&127](r)|0;bW[c[(c[q>>2]|0)+20>>2]&127](b,r);r=c[d>>2]|0;dg(r)|0;i=h;return}}while(0);p=bd(4)|0;kl(p);aM(p|0,8328,134)}}while(0);h=bd(4)|0;kl(h);aM(h|0,8328,134)}function fS(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(
b<<24>>24==i<<24>>24){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((a[j]|0)==b<<24>>24){s=j;break}else{j=j+1|0}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[9904+j|0]|0;if((j|0)==25|(j|0)==24){s=c[h>>2]|0;do{if((s|0)!=(g|0)){if((a[s-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=s+1;a[s]=o;p=0;return p|0}else if((j|0)==22|(j|0)==23){a[f]=80;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=o;p=0;return p|0}else{s=a[f]|0;do{if((o&95|0)==(s<<24>>24|0)){a[f]=s|-128;if((a[e]&1)==0){break}a[e]=0;g=d[k]|0;if((g&1|0)==0){t=g>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}g=c[m>>2]|0;if((g-l|0)>=160){break}b=c[n>>2]|0;c[m>>2]=g+4;c[g>>2]=b}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=o;if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}return 0}function fT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+32|0;d_(j,b);b=j|0;j=c[b>>2]|0;if((c[6582]|0)!=-1){c[h>>2]=26328;c[h+4>>2]=14;c[h+8>>2]=0;dB(26328,h,98)}h=(c[6583]|0)-1|0;k=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-k>>2>>>0>h>>>0){l=c[k+(h<<2)>>2]|0;if((l|0)==0){break}m=l;n=c[(c[l>>2]|0)+48>>2]|0;b6[n&15](m,9904,9930,d)|0;m=c[b>>2]|0;if((c[6486]|0)!=-1){c[g>>2]=25944;c[g+4>>2]=14;c[g+8>>2]=0;dB(25944,g,98)}n=(c[6487]|0)-1|0;l=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-l>>2>>>0>n>>>0){o=c[l+(n<<2)>>2]|0;if((o|0)==0){break}p=o;c[e>>2]=b_[c[(c[o>>2]|0)+16>>2]&127](p)|0;bW[c[(c[o>>2]|0)+20>>2]&127](a,p);p=c[b>>2]|0;dg(p)|0;i=f;return}}while(0);n=bd(4)|0;kl(n);aM(n|0,8328,134)}}while(0);f=bd(4)|0;kl(f);aM(f|0,8328,134)}function fU(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;d_(k,b);b=k|0;k=c[b>>2]|0;if((c[6582]|0)!=-1){c[j>>2]=26328;c[j+4>>2]=14;c[j+8>>2]=0;dB(26328,j,98)}j=(c[6583]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+48>>2]|0;b6[o&15](n,9904,9936,d)|0;n=c[b>>2]|0;if((c[6486]|0)!=-1){c[h>>2]=25944;c[h+4>>2]=14;c[h+8>>2]=0;dB(25944,h,98)}o=(c[6487]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;r=p;c[e>>2]=b_[c[(c[r>>2]|0)+12>>2]&127](q)|0;c[f>>2]=b_[c[(c[r>>2]|0)+16>>2]&127](q)|0;bW[c[(c[p>>2]|0)+20>>2]&127](a,q);q=c[b>>2]|0;dg(q)|0;i=g;return}}while(0);o=bd(4)|0;kl(o);aM(o|0,8328,134)}}while(0);g=bd(4)|0;kl(g);aM(g|0,8328,134)}function fV(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(
i|0)){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((c[j>>2]|0)==(b|0)){s=j;break}else{j=j+4|0}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[9904+o|0]|0;do{if((o|0)==25|(o|0)==24){b=c[h>>2]|0;do{if((b|0)!=(g|0)){if((a[b-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=b+1;a[b]=s;p=0;return p|0}else if((o|0)==22|(o|0)==23){a[f]=80}else{r=a[f]|0;if((s&95|0)!=(r<<24>>24|0)){break}a[f]=r|-128;if((a[e]&1)==0){break}a[e]=0;r=d[k]|0;if((r&1|0)==0){t=r>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}r=c[m>>2]|0;if((r-l|0)>=160){break}q=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=q}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=s;if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}function fW(a){a=a|0;de(a|0);kN(a);return}function fX(a){a=a|0;de(a|0);return}function fY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];b5[o&31](b,d,l,f,g,h&1);i=j;return}d_(m,f);f=m|0;m=c[f>>2]|0;if((c[6488]|0)!=-1){c[k>>2]=25952;c[k+4>>2]=14;c[k+8>>2]=0;dB(25952,k,98)}k=(c[6489]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;dg(o)|0;o=c[l>>2]|0;if(h){bW[c[o+24>>2]&127](n,d)}else{bW[c[o+28>>2]&127](n,d)}d=n;o=n;l=a[o]|0;if((l&1)==0){p=d+1|0;q=p;r=p;s=n+8|0}else{p=n+8|0;q=c[p>>2]|0;r=d+1|0;s=p}p=e|0;d=n+4|0;t=q;u=l;while(1){if((u&1)==0){v=r}else{v=c[s>>2]|0}l=u&255;if((t|0)==(v+((l&1|0)==0?l>>>1:c[d>>2]|0)|0)){break}l=a[t]|0;w=c[p>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)!=(c[w+28>>2]|0)){c[x>>2]=y+1;a[y]=l;break}if((bX[c[(c[w>>2]|0)+52>>2]&31](w,l&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2];dG(n);i=j;return}}while(0);j=bd(4)|0;kl(j);aM(j|0,8328,134)}function fZ(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[2512]|0;a[q+1|0]=a[2513]|0;a[q+2|0]=a[2514]|0;a[q+3|0]=a[2515]|0;a[q+4|0]=a[2516]|0;a[q+5|0]=a[2517]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=k|0;do{if((a[26896]
|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);t=f_(u,12,c[6226]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=750;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=750;break}w=k+2|0}else if((h|0)==32){w=q}else{x=750}}while(0);if((x|0)==750){w=u}x=l|0;d_(o,f);f$(u,w,q,x,m,n,o);dg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];cu(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function f_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+16|0;h=g|0;j=h;c[j>>2]=f;c[j+4>>2]=0;j=bN(d|0)|0;d=aK(a|0,b|0,e|0,h|0)|0;if((j|0)==0){i=g;return d|0}bN(j|0)|0;i=g;return d|0}function f$(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6584]|0)!=-1){c[n>>2]=26336;c[n+4>>2]=14;c[n+8>>2]=0;dB(26336,n,98)}n=(c[6585]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}r=k;s=c[p>>2]|0;if((c[6488]|0)!=-1){c[m>>2]=25952;c[m+4>>2]=14;c[m+8>>2]=0;dB(25952,m,98)}m=(c[6489]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}t=s;bW[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+32>>2]|0;b6[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=bX[c[(c[k>>2]|0)+28>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=bX[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1;a[y]=q;q=bX[c[(c[p>>2]|0)+28>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=b_[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+1;a[I]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=bX[c[(c[p>>2]|0)+28>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-1|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=a[J]|0;a[J]=a[K]|0;a[K]=C;J=J+1|0;K=K-1|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;dG(o);i=l;return}else{L=g+(e-b)|0;c[h>>2]=L;dG(o);i=l;return}}function f0(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;
g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=l|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);v=f_(u,22,c[6226]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+v|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=833;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=833;break}w=l+2|0}else if((j|0)==32){w=r}else{x=833}}while(0);if((x|0)==833){w=u}x=m|0;d_(p,f);f$(u,w,r,x,n,o,p);dg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];cu(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function f1(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[2512]|0;a[q+1|0]=a[2513]|0;a[q+2|0]=a[2514]|0;a[q+3|0]=a[2515]|0;a[q+4|0]=a[2516]|0;a[q+5|0]=a[2517]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=k|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);v=f_(u,12,c[6226]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=858;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=858;break}w=k+2|0}else{x=858}}while(0);if((x|0)==858){w=u}x=l|0;d_(o,f);f$(u,w,q,x,m,n,o);dg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];cu(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function f2(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);t=f_(u,23,c[6226]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(
s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=883;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=883;break}w=l+2|0}else if((j|0)==32){w=r}else{x=883}}while(0);if((x|0)==883){w=u}x=m|0;d_(p,f);f$(u,w,r,x,n,o,p);dg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];cu(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function f3(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=c[6226]|0;if(y){w=f_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=f_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[26896]|0)==0;if(y){do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=f4(m,c[6226]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);w=f4(m,c[6226]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}kS();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=939;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=939;break}F=E+2|0}else if((B|0)==32){F=A}else{G=939}}while(0);if((G|0)==939){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=kG(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}kS();H=0;I=0;J=c[m>>2]|0}}while(0);d_(q,f);f5(J,F,A,H,o,p,q);dg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];cu(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){kH(I)}if((D|0)==0){i=d;return}kH(D);i=d;return}function f4(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=bN(b|0)|0;b=bj(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}bN(h|0)|0;i=f;return b|0}function f5(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6584]|0)!=-1){c[n>>2]=26336;c[n+4>>2]=14;c[n+8>>2]=0;dB(26336,n,98)}n=(c[6585]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-
q>>2>>>0<=n>>>0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}r=k;s=c[p>>2]|0;if((c[6488]|0)!=-1){c[m>>2]=25952;c[m+4>>2]=14;c[m+8>>2]=0;dB(25952,m,98)}m=(c[6489]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}t=s;bW[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=bX[c[(c[k>>2]|0)+28>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=m;v=b+1|0}else{v=b}m=f;L1213:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=1005;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=1005;break}p=k;n=bX[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1;a[q]=n;n=v+2|0;q=bX[c[(c[p>>2]|0)+28>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L1213}u=a[q]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((a3(u<<24>>24|0,c[6226]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=1005}}while(0);L1228:do{if((x|0)==1005){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L1228}q=a[w]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((aT(q<<24>>24|0,c[6226]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=1005}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+32>>2]|0;b6[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=b_[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+1;a[J]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=bX[c[(c[p>>2]|0)+28>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-1|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=a[K]|0;a[K]=a[L]|0;a[L]=D;K=K+1|0;L=L-1|0;}while(K>>>0<L>>>0)}}while(0);L1267:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=bX[c[(c[L>>2]|0)+28>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L1267}}L=b_[c[(c[s>>2]|0)+12>>2]&127](t)|0;H=c[j>>2]|0;c[j>>2]=H+1;a[H]=L;M=K+1|0}else{M=y}}while(0);b6[c[(c[k>>2]|0)+32>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;dG(o);i=l;return}N=g+(e-b)|0;c[h>>2]=N;dG(o);i=l;return}function f6(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;
p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=c[6226]|0;if(y){w=f_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=f_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[26896]|0)==0;if(y){do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=f4(m,c[6226]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);w=f4(m,c[6226]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}kS();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1102;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1102;break}F=E+2|0}else{G=1102}}while(0);if((G|0)==1102){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=kG(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}kS();H=0;I=0;J=c[m>>2]|0}}while(0);d_(q,f);f5(J,F,A,H,o,p,q);dg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];cu(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){kH(I)}if((D|0)==0){i=d;return}kH(D);i=d;return}function f7(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+104|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+88|0;n=d+96|0;o=d+16|0;a[o]=a[2520]|0;a[o+1|0]=a[2521]|0;a[o+2|0]=a[2522]|0;a[o+3|0]=a[2523]|0;a[o+4|0]=a[2524]|0;a[o+5|0]=a[2525]|0;p=k|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);q=f_(p,20,c[6226]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==32){r=o}else if((h|0)==16){s=a[p]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){r=k+1|0;break}if(!((q|0)>1&s<<24>>24==48)){t=1135;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){t=1135;break}r=k+2|0}else{t=1135}}while(0);if((t|0)==1135){r=p}d_(m,f);t=m|0;m=c[t>>2]|0;if((c[6584]|0)!=-1){c[j>>2]=26336;c[j+4>>2]=14;c[j+8>>2]=0;dB(26336,j,98)}j=(c[6585]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){s=c[h+(j<<2)>>2]|0;if((s|0)==0){break}u=s;v=c[t>>2]|0;dg(v)|0;v=l|0;w=c[(c[s>>2]|0)+32>>2]|0;b6[w&15](u,p,o,v)|0;u=l+q|0;if((r|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;cu(
b,n,v,x,u,f,g);i=d;return}x=l+(r-k)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;cu(b,n,v,x,u,f,g);i=d;return}}while(0);d=bd(4)|0;kl(d);aM(d|0,8328,134)}function f8(a){a=a|0;de(a|0);kN(a);return}function f9(a){a=a|0;de(a|0);return}function ga(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];b5[o&31](b,d,l,f,g,h&1);i=j;return}d_(m,f);f=m|0;m=c[f>>2]|0;if((c[6486]|0)!=-1){c[k>>2]=25944;c[k+4>>2]=14;c[k+8>>2]=0;dB(25944,k,98)}k=(c[6487]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;dg(o)|0;o=c[l>>2]|0;if(h){bW[c[o+24>>2]&127](n,d)}else{bW[c[o+28>>2]&127](n,d)}d=n;o=a[d]|0;if((o&1)==0){l=n+4|0;p=l;q=l;r=n+8|0}else{l=n+8|0;p=c[l>>2]|0;q=n+4|0;r=l}l=e|0;s=p;t=o;while(1){if((t&1)==0){u=q}else{u=c[r>>2]|0}o=t&255;if((o&1|0)==0){v=o>>>1}else{v=c[q>>2]|0}if((s|0)==(u+(v<<2)|0)){break}o=c[s>>2]|0;w=c[l>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)==(c[w+28>>2]|0)){z=bX[c[(c[w>>2]|0)+52>>2]&31](w,o)|0}else{c[x>>2]=y+4;c[y>>2]=o;z=o}if((z|0)!=-1){break}c[l>>2]=0}}while(0);s=s+4|0;t=a[d]|0}c[b>>2]=c[l>>2];dR(n);i=j;return}}while(0);j=bd(4)|0;kl(j);aM(j|0,8328,134)}function gb(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[2512]|0;a[q+1|0]=a[2513]|0;a[q+2|0]=a[2514]|0;a[q+3|0]=a[2515]|0;a[q+4|0]=a[2516]|0;a[q+5|0]=a[2517]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=k|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);t=f_(u,12,c[6226]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=1206;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1206;break}w=k+2|0}else if((h|0)==32){w=q}else{x=1206}}while(0);if((x|0)==1206){w=u}x=l|0;d_(o,f);gc(u,w,q,x,m,n,o);dg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];gd(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function gc(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6582]|0)!=-1){c[n>>2]=26328;c[n+4>>2]=14;c[n+8>>2]=0;dB(26328,n,98)}n=(c[6583]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,
134)}r=k;s=c[p>>2]|0;if((c[6486]|0)!=-1){c[m>>2]=25944;c[m+4>>2]=14;c[m+8>>2]=0;dB(25944,m,98)}m=(c[6487]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}t=s;bW[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+48>>2]|0;b6[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b<<2)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=bX[c[(c[k>>2]|0)+44>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=bX[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4;c[y>>2]=q;q=bX[c[(c[p>>2]|0)+44>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=b_[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=bX[c[(c[p>>2]|0)+44>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b<<2)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-4|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=c[J>>2]|0;c[J>>2]=c[K>>2];c[K>>2]=C;J=J+4|0;K=K-4|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;dG(o);i=l;return}else{L=g+(e-b<<2)|0;c[h>>2]=L;dG(o);i=l;return}}function gd(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g>>2;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;g=h>>2;do{if((h|0)>0){if((bY[c[(c[d>>2]|0)+48>>2]&63](d,e,g)|0)==(g|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){dQ(l,q,j);if((a[l]&1)==0){r=l+4|0}else{r=c[l+8>>2]|0}if((bY[c[(c[d>>2]|0)+48>>2]&63](d,r,q)|0)==(q|0)){dR(l);break}c[m>>2]=0;c[b>>2]=0;dR(l);i=k;return}}while(0);l=n-o|0;o=l>>2;do{if((l|0)>0){if((bY[c[(c[d>>2]|0)+48>>2]&63](d,f,o)|0)==(o|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function ge(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+232|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+200|0;o=d+208|0;p=d+216|0;q=d+224|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0)
{a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);t=f_(u,22,c[6226]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=1307;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1307;break}w=l+2|0}else if((j|0)==32){w=r}else{x=1307}}while(0);if((x|0)==1307){w=u}x=m|0;d_(p,f);gc(u,w,r,x,n,o,p);dg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];gd(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function gf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[2512]|0;a[q+1|0]=a[2513]|0;a[q+2|0]=a[2514]|0;a[q+3|0]=a[2515]|0;a[q+4|0]=a[2516]|0;a[q+5|0]=a[2517]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=k|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);v=f_(u,12,c[6226]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=1332;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1332;break}w=k+2|0}else if((h|0)==32){w=q}else{x=1332}}while(0);if((x|0)==1332){w=u}x=l|0;d_(o,f);gc(u,w,q,x,m,n,o);dg(c[o>>2]|0)|0;c[p>>2]=c[e>>2];gd(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function gg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+240|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+208|0;o=d+216|0;p=d+224|0;q=d+232|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);t=f_(u,23,c[6226]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=1357;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=1357;break}w=l+2|0}else{x=1357}}while(0);if((x|0)==1357){w=u}x=m|0;d_(p,f);gc(u,w,r,x,n,o,p);dg(c[p>>2]|0)|0;c[q>>2]=c[e>>2];gd(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function gh(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,
s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=c[6226]|0;if(y){w=f_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=f_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[26896]|0)==0;if(y){do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=f4(m,c[6226]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);w=f4(m,c[6226]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}kS();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1413;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1413;break}F=E+2|0}else if((B|0)==32){F=A}else{G=1413}}while(0);if((G|0)==1413){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=kG(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}kS();H=B;I=B;J=c[m>>2]|0}}while(0);d_(q,f);gi(J,F,A,H,o,p,q);dg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];gd(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){kH(I)}if((D|0)==0){i=d;return}kH(D);i=d;return}function gi(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[6582]|0)!=-1){c[n>>2]=26328;c[n+4>>2]=14;c[n+8>>2]=0;dB(26328,n,98)}n=(c[6583]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bd(4)|0;s=r;kl(s);aM(r|0,8328,134)}r=k;s=c[p>>2]|0;if((c[6486]|0)!=-1){c[m>>2]=25944;c[m+4>>2]=14;c[m+8>>2]=0;dB(25944,m,98)}m=(c[6487]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bd(4)|0;u=t;kl(u);aM(t|0,8328,134)}t=s;bW[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=bX[c[(c[k>>2]|0)+44>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L1752:do{if((m-v|0)>1){if((a[v]|0)!
=48){w=v;x=1468;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=1468;break}p=k;n=bX[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4;c[q>>2]=n;n=v+2|0;q=bX[c[(c[p>>2]|0)+44>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L1752}u=a[q]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((a3(u<<24>>24|0,c[6226]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=1468}}while(0);L1767:do{if((x|0)==1468){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L1767}q=a[w]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((aT(q<<24>>24|0,c[6226]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=1468}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+48>>2]|0;b6[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z<<2)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=b_[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=bX[c[(c[p>>2]|0)+44>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b<<2)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-4|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=c[K>>2]|0;c[K>>2]=c[L>>2];c[L>>2]=D;K=K+4|0;L=L-4|0;}while(K>>>0<L>>>0)}}while(0);L1806:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=bX[c[(c[L>>2]|0)+44>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L1806}}L=b_[c[(c[s>>2]|0)+12>>2]&127](t)|0;H=c[j>>2]|0;c[j>>2]=H+4;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);b6[c[(c[k>>2]|0)+48>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;dG(o);i=l;return}N=g+(e-b<<2)|0;c[h>>2]=N;dG(o);i=l;return}function gj(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[
m>>2]=k;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=c[6226]|0;if(y){w=f_(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=f_(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[26896]|0)==0;if(y){do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=f4(m,c[6226]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);w=f4(m,c[6226]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}kS();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=1565;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=1565;break}F=E+2|0}else{G=1565}}while(0);if((G|0)==1565){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=kG(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}kS();H=B;I=B;J=c[m>>2]|0}}while(0);d_(q,f);gi(J,F,A,H,o,p,q);dg(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];gd(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){kH(I)}if((D|0)==0){i=d;return}kH(D);i=d;return}function gk(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+216|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+200|0;n=d+208|0;o=d+16|0;a[o]=a[2520]|0;a[o+1|0]=a[2521]|0;a[o+2|0]=a[2522]|0;a[o+3|0]=a[2523]|0;a[o+4|0]=a[2524]|0;a[o+5|0]=a[2525]|0;p=k|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);q=f_(p,20,c[6226]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==16){r=a[p]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){s=k+1|0;break}if(!((q|0)>1&r<<24>>24==48)){t=1598;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){t=1598;break}s=k+2|0}else if((h|0)==32){s=o}else{t=1598}}while(0);if((t|0)==1598){s=p}d_(m,f);t=m|0;m=c[t>>2]|0;if((c[6582]|0)!=-1){c[j>>2]=26328;c[j+4>>2]=14;c[j+8>>2]=0;dB(26328,j,98)}j=(c[6583]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){r=c[h+(j<<2)>>2]|0;if((r|0)==0){break}u=r;v=c[t>>2]|0;dg(v)|0;v=l|0;w=c[(c[r>>2]|0)+48>>2]|0;b6[w&15](u,p,o,v)|0;u=l+(q<<2)|0;if((s|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;gd(b,n,v,x,u,f,g);i=d;return}x=l+(s-k<<2)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;gd(b,n,v,x,u,f,g);i=d;return}}while(0);d=bd(4)|0;kl(d);aM(d|0,8328,134)}function gl(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;n=i;i=i+48|0;o=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[o>>2];o=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[o>>2];o=n|0;p=n+16|0;q=n+24|0;r=n+32|0;
s=n+40|0;d_(p,h);t=p|0;p=c[t>>2]|0;if((c[6584]|0)!=-1){c[o>>2]=26336;c[o+4>>2]=14;c[o+8>>2]=0;dB(26336,o,98)}o=(c[6585]|0)-1|0;u=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-u>>2>>>0>o>>>0){v=c[u+(o<<2)>>2]|0;if((v|0)==0){break}w=v;x=c[t>>2]|0;dg(x)|0;c[j>>2]=0;x=f|0;L1936:do{if((l|0)==(m|0)){y=1677}else{z=g|0;A=v;B=v;C=v+8|0;D=e;E=r|0;F=s|0;G=q|0;H=l;I=0;L1938:while(1){J=I;while(1){if((J|0)!=0){y=1677;break L1936}K=c[x>>2]|0;do{if((K|0)==0){L=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){L=K;break}if((b_[c[(c[K>>2]|0)+36>>2]&127](K)|0)!=-1){L=K;break}c[x>>2]=0;L=0}}while(0);K=(L|0)==0;M=c[z>>2]|0;L1948:do{if((M|0)==0){y=1630}else{do{if((c[M+12>>2]|0)==(c[M+16>>2]|0)){if((b_[c[(c[M>>2]|0)+36>>2]&127](M)|0)!=-1){break}c[z>>2]=0;y=1630;break L1948}}while(0);if(K){N=M}else{y=1631;break L1938}}}while(0);if((y|0)==1630){y=0;if(K){y=1631;break L1938}else{N=0}}if((bY[c[(c[A>>2]|0)+36>>2]&63](w,a[H]|0,0)|0)<<24>>24==37){y=1634;break}M=a[H]|0;if(M<<24>>24>=0){O=c[C>>2]|0;if((b[O+(M<<24>>24<<1)>>1]&8192)!=0){P=H;y=1645;break}}Q=L+12|0;M=c[Q>>2]|0;R=L+16|0;if((M|0)==(c[R>>2]|0)){S=(b_[c[(c[L>>2]|0)+36>>2]&127](L)|0)&255}else{S=a[M]|0}M=bX[c[(c[B>>2]|0)+12>>2]&31](w,S)|0;if(M<<24>>24==(bX[c[(c[B>>2]|0)+12>>2]&31](w,a[H]|0)|0)<<24>>24){y=1672;break}c[j>>2]=4;J=4}L1966:do{if((y|0)==1634){y=0;J=H+1|0;if((J|0)==(m|0)){y=1635;break L1938}M=bY[c[(c[A>>2]|0)+36>>2]&63](w,a[J]|0,0)|0;if((M<<24>>24|0)==69|(M<<24>>24|0)==48){T=H+2|0;if((T|0)==(m|0)){y=1638;break L1938}U=M;V=bY[c[(c[A>>2]|0)+36>>2]&63](w,a[T]|0,0)|0;W=T}else{U=0;V=M;W=J}J=c[(c[D>>2]|0)+36>>2]|0;c[E>>2]=L;c[F>>2]=N;b3[J&7](q,e,r,s,h,j,k,V,U);c[x>>2]=c[G>>2];X=W+1|0}else if((y|0)==1645){while(1){y=0;J=P+1|0;if((J|0)==(m|0)){Y=m;break}M=a[J]|0;if(M<<24>>24<0){Y=J;break}if((b[O+(M<<24>>24<<1)>>1]&8192)==0){Y=J;break}else{P=J;y=1645}}K=L;J=N;while(1){do{if((K|0)==0){Z=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){Z=K;break}if((b_[c[(c[K>>2]|0)+36>>2]&127](K)|0)!=-1){Z=K;break}c[x>>2]=0;Z=0}}while(0);M=(Z|0)==0;do{if((J|0)==0){y=1658}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(M){_=J;break}else{X=Y;break L1966}}if((b_[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[z>>2]=0;y=1658;break}else{if(M^(J|0)==0){_=J;break}else{X=Y;break L1966}}}}while(0);if((y|0)==1658){y=0;if(M){X=Y;break L1966}else{_=0}}T=Z+12|0;$=c[T>>2]|0;aa=Z+16|0;if(($|0)==(c[aa>>2]|0)){ab=(b_[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)&255}else{ab=a[$]|0}if(ab<<24>>24<0){X=Y;break L1966}if((b[(c[C>>2]|0)+(ab<<24>>24<<1)>>1]&8192)==0){X=Y;break L1966}$=c[T>>2]|0;if(($|0)==(c[aa>>2]|0)){aa=c[(c[Z>>2]|0)+40>>2]|0;b_[aa&127](Z)|0;K=Z;J=_;continue}else{c[T>>2]=$+1;K=Z;J=_;continue}}}else if((y|0)==1672){y=0;J=c[Q>>2]|0;if((J|0)==(c[R>>2]|0)){K=c[(c[L>>2]|0)+40>>2]|0;b_[K&127](L)|0}else{c[Q>>2]=J+1}X=H+1|0}}while(0);if((X|0)==(m|0)){y=1677;break L1936}H=X;I=c[j>>2]|0}if((y|0)==1635){c[j>>2]=4;ac=L;break}else if((y|0)==1638){c[j>>2]=4;ac=L;break}else if((y|0)==1631){c[j>>2]=4;ac=L;break}}}while(0);if((y|0)==1677){ac=c[x>>2]|0}w=f|0;do{if((ac|0)!=0){if((c[ac+12>>2]|0)!=(c[ac+16>>2]|0)){
break}if((b_[c[(c[ac>>2]|0)+36>>2]&127](ac)|0)!=-1){break}c[w>>2]=0}}while(0);x=c[w>>2]|0;v=(x|0)==0;I=g|0;H=c[I>>2]|0;L2024:do{if((H|0)==0){y=1687}else{do{if((c[H+12>>2]|0)==(c[H+16>>2]|0)){if((b_[c[(c[H>>2]|0)+36>>2]&127](H)|0)!=-1){break}c[I>>2]=0;y=1687;break L2024}}while(0);if(!v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);do{if((y|0)==1687){if(v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);c[j>>2]=c[j>>2]|2;ad=d|0;c[ad>>2]=x;i=n;return}}while(0);n=bd(4)|0;kl(n);aM(n|0,8328,134)}function gm(a){a=a|0;de(a|0);kN(a);return}function gn(a){a=a|0;de(a|0);return}function go(a){a=a|0;return 2}function gp(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];gl(a,b,k,l,f,g,h,2504,2512);i=j;return}function gq(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=b_[c[(c[n>>2]|0)+20>>2]&127](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=o;e=a[o]|0;if((e&1)==0){p=f+1|0;q=f+1|0}else{f=c[o+8>>2]|0;p=f;q=f}f=e&255;if((f&1|0)==0){r=f>>>1}else{r=c[o+4>>2]|0}gl(b,d,l,m,g,h,j,q,p+r|0);i=k;return}function gr(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;d_(m,f);f=m|0;m=c[f>>2]|0;if((c[6584]|0)!=-1){c[l>>2]=26336;c[l+4>>2]=14;c[l+8>>2]=0;dB(26336,l,98)}l=(c[6585]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;dg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b_[c[c[q>>2]>>2]&127](q)|0;c[k>>2]=o;o=(e6(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bd(4)|0;kl(j);aM(j|0,8328,134)}function gs(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;d_(m,f);f=m|0;m=c[f>>2]|0;if((c[6584]|0)!=-1){c[l>>2]=26336;c[l+4>>2]=14;c[l+8>>2]=0;dB(26336,l,98)}l=(c[6585]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;dg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b_[c[(c[q>>2]|0)+4>>2]&127](q)|0;c[k>>2]=o;o=(e6(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bd(4)|0;kl(j);aM(j|0,8328,134)}function gt(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]
=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;d_(l,f);f=l|0;l=c[f>>2]|0;if((c[6584]|0)!=-1){c[k>>2]=26336;c[k+4>>2]=14;c[k+8>>2]=0;dB(26336,k,98)}k=(c[6585]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;dg(n)|0;c[j>>2]=c[e>>2];n=gy(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=bd(4)|0;kl(b);aM(b|0,8328,134)}function gu(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;d_(z,g);_=z|0;z=c[_>>2]|0;if((c[6584]|0)!=-1){c[y>>2]=26336;c[y+4>>2]=14;c[y+8>>2]=0;dB(26336,y,98)}y=(c[6585]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;dg(aa)|0;L2101:do{switch(k<<24>>24|0){case 89:{c[m>>2]=c[f>>2];aa=gy(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2101}c[j+20>>2]=aa-1900;break};case 99:{aa=d+8|0;ac=b_[c[(c[aa>>2]|0)+12>>2]&127](aa)|0;aa=e|0;c[B>>2]=c[aa>>2];c[C>>2]=c[f>>2];ad=ac;ae=a[ac]|0;if((ae&1)==0){af=ad+1|0;ag=ad+1|0}else{ad=c[ac+8>>2]|0;af=ad;ag=ad}ad=ae&255;if((ad&1|0)==0){ah=ad>>>1}else{ah=c[ac+4>>2]|0}gl(A,d,B,C,g,h,j,ag,af+ah|0);c[aa>>2]=c[A>>2];break};case 110:case 116:{c[J>>2]=c[f>>2];gv(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];gw(d,j+8|0,e,K,h,ab);break};case 114:{aa=e|0;c[M>>2]=c[aa>>2];c[N>>2]=c[f>>2];gl(L,d,M,N,g,h,j,2472,2483);c[aa>>2]=c[L>>2];break};case 37:{c[Z>>2]=c[f>>2];gx(0,e,Z,h,ab);break};case 109:{c[r>>2]=c[f>>2];aa=(gy(e,r,h,ab,2)|0)-1|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<12){c[j+16>>2]=aa;break L2101}else{c[h>>2]=ac|4;break L2101}break};case 68:{ac=e|0;c[E>>2]=c[ac>>2];c[F>>2]=c[f>>2];gl(D,d,E,F,g,h,j,2496,2504);c[ac>>2]=c[D>>2];break};case 77:{c[q>>2]=c[f>>2];ac=gy(e,q,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<60){c[j+4>>2]=ac;break L2101}else{c[h>>2]=aa|4;break L2101}break};case 121:{c[n>>2]=c[f>>2];aa=gy(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2101}if((aa|0)<69){ai=aa+2e3|0}else{ai=(aa-69|0)>>>0<31>>>0?aa+1900|0:aa}c[j+20>>2]=ai-1900;break};case 70:{aa=e|0;c[H>>2]=c[aa>>2];c[I>>2]=c[f>>2];gl(G,d,H,I,g,h,j,2488,2496);c[aa>>2]=c[G>>2];break};case 72:{c[u>>2]=c[f>>2];aa=gy(e,u,h,ab,2)|0;ac=c[h>>2]|0;if((
ac&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L2101}else{c[h>>2]=ac|4;break L2101}break};case 82:{ac=e|0;c[P>>2]=c[ac>>2];c[Q>>2]=c[f>>2];gl(O,d,P,Q,g,h,j,2464,2469);c[ac>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];ac=gy(e,p,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<61){c[j>>2]=ac;break L2101}else{c[h>>2]=aa|4;break L2101}break};case 73:{aa=j+8|0;c[t>>2]=c[f>>2];ac=gy(e,t,h,ab,2)|0;ad=c[h>>2]|0;do{if((ad&4|0)==0){if((ac-1|0)>>>0>=12>>>0){break}c[aa>>2]=ac;break L2101}}while(0);c[h>>2]=ad|4;break};case 97:case 65:{ac=c[f>>2]|0;aa=d+8|0;ae=b_[c[c[aa>>2]>>2]&127](aa)|0;c[x>>2]=ac;ac=(e6(e,x,ae,ae+168|0,ab,h,0)|0)-ae|0;if((ac|0)>=168){break L2101}c[j+24>>2]=((ac|0)/12|0|0)%7|0;break};case 88:{ac=d+8|0;ae=b_[c[(c[ac>>2]|0)+24>>2]&127](ac)|0;ac=e|0;c[X>>2]=c[ac>>2];c[Y>>2]=c[f>>2];aa=ae;aj=a[ae]|0;if((aj&1)==0){ak=aa+1|0;al=aa+1|0}else{aa=c[ae+8>>2]|0;ak=aa;al=aa}aa=aj&255;if((aa&1|0)==0){am=aa>>>1}else{am=c[ae+4>>2]|0}gl(W,d,X,Y,g,h,j,al,ak+am|0);c[ac>>2]=c[W>>2];break};case 100:case 101:{ac=j+12|0;c[v>>2]=c[f>>2];ae=gy(e,v,h,ab,2)|0;aa=c[h>>2]|0;do{if((aa&4|0)==0){if((ae-1|0)>>>0>=31>>>0){break}c[ac>>2]=ae;break L2101}}while(0);c[h>>2]=aa|4;break};case 84:{ae=e|0;c[S>>2]=c[ae>>2];c[T>>2]=c[f>>2];gl(R,d,S,T,g,h,j,2456,2464);c[ae>>2]=c[R>>2];break};case 119:{c[o>>2]=c[f>>2];ae=gy(e,o,h,ab,1)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(ae|0)<7){c[j+24>>2]=ae;break L2101}else{c[h>>2]=ac|4;break L2101}break};case 98:case 66:case 104:{ac=c[f>>2]|0;ae=d+8|0;ad=b_[c[(c[ae>>2]|0)+4>>2]&127](ae)|0;c[w>>2]=ac;ac=(e6(e,w,ad,ad+288|0,ab,h,0)|0)-ad|0;if((ac|0)>=288){break L2101}c[j+16>>2]=((ac|0)/12|0|0)%12|0;break};case 106:{c[s>>2]=c[f>>2];ac=gy(e,s,h,ab,3)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ac|0)<366){c[j+28>>2]=ac;break L2101}else{c[h>>2]=ad|4;break L2101}break};case 120:{ad=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];bU[ad&127](b,d,U,V,g,h,j);i=l;return};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=bd(4)|0;kl(l);aM(l|0,8328,134)}function gv(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;j=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[j>>2];j=e|0;e=f|0;f=h+8|0;L2182:while(1){h=c[j>>2]|0;do{if((h|0)==0){k=0}else{if((c[h+12>>2]|0)!=(c[h+16>>2]|0)){k=h;break}if((b_[c[(c[h>>2]|0)+36>>2]&127](h)|0)==-1){c[j>>2]=0;k=0;break}else{k=c[j>>2]|0;break}}}while(0);h=(k|0)==0;l=c[e>>2]|0;L2191:do{if((l|0)==0){m=1827}else{do{if((c[l+12>>2]|0)==(c[l+16>>2]|0)){if((b_[c[(c[l>>2]|0)+36>>2]&127](l)|0)!=-1){break}c[e>>2]=0;m=1827;break L2191}}while(0);if(h){n=l;o=0}else{p=l;q=0;break L2182}}}while(0);if((m|0)==1827){m=0;if(h){p=0;q=1;break}else{n=0;o=1}}l=c[j>>2]|0;r=c[l+12>>2]|0;if((r|0)==(c[l+16>>2]|0)){s=(b_[c[(c[l>>2]|0)+36>>2]&127](l)|0)&255}else{s=a[r]|0}if(s<<24>>24<0){p=n;q=o;break}if((b[(c[f>>2]|0)+(s<<24>>24<<1)>>1]&8192)==0){p=n;q=o;break}r=c[j>>2]|0;l=r+12|0;t=c[l>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;b_[u&127](r)|0;continue}else{c[l>>2]=t+1;continue}}o=c[j>>2]|0;do{if((o|0)==0){v=0}
else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){v=o;break}if((b_[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[j>>2]=0;v=0;break}else{v=c[j>>2]|0;break}}}while(0);j=(v|0)==0;do{if(q){m=1846}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(!(j^(p|0)==0)){break}i=d;return}if((b_[c[(c[p>>2]|0)+36>>2]&127](p)|0)==-1){c[e>>2]=0;m=1846;break}if(!j){break}i=d;return}}while(0);do{if((m|0)==1846){if(j){break}i=d;return}}while(0);c[g>>2]=c[g>>2]|2;i=d;return}function gw(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=b_[c[(c[l>>2]|0)+8>>2]&127](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=e6(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function gx(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;h=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[h>>2];h=d|0;d=c[h>>2]|0;do{if((d|0)==0){j=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){j=d;break}if((b_[c[(c[d>>2]|0)+36>>2]&127](d)|0)==-1){c[h>>2]=0;j=0;break}else{j=c[h>>2]|0;break}}}while(0);d=(j|0)==0;j=e|0;e=c[j>>2]|0;L2265:do{if((e|0)==0){k=1884}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((b_[c[(c[e>>2]|0)+36>>2]&127](e)|0)!=-1){break}c[j>>2]=0;k=1884;break L2265}}while(0);if(d){l=e;m=0}else{k=1885}}}while(0);if((k|0)==1884){if(d){k=1885}else{l=0;m=1}}if((k|0)==1885){c[f>>2]=c[f>>2]|6;i=b;return}d=c[h>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){n=(b_[c[(c[d>>2]|0)+36>>2]&127](d)|0)&255}else{n=a[e]|0}if((bY[c[(c[g>>2]|0)+36>>2]&63](g,n,0)|0)<<24>>24!=37){c[f>>2]=c[f>>2]|4;i=b;return}n=c[h>>2]|0;g=n+12|0;e=c[g>>2]|0;if((e|0)==(c[n+16>>2]|0)){d=c[(c[n>>2]|0)+40>>2]|0;b_[d&127](n)|0}else{c[g>>2]=e+1}e=c[h>>2]|0;do{if((e|0)==0){o=0}else{if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){o=e;break}if((b_[c[(c[e>>2]|0)+36>>2]&127](e)|0)==-1){c[h>>2]=0;o=0;break}else{o=c[h>>2]|0;break}}}while(0);h=(o|0)==0;do{if(m){k=1904}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){if(!(h^(l|0)==0)){break}i=b;return}if((b_[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1){c[j>>2]=0;k=1904;break}if(!h){break}i=b;return}}while(0);do{if((k|0)==1904){if(h){break}i=b;return}}while(0);c[f>>2]=c[f>>2]|2;i=b;return}function gy(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;j=i;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){l=d;break}if((b_[c[(c[d>>2]|0)+36>>2]&127](d)|0)==-1){c[k>>2]=0;l=0;break}else{l=c[k>>2]|0;break}}}while(0);d=(l|0)==0;l=e|0;e=c[l>>2]|0;L2319:do{if((e|0)==0){m=1924}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((b_[c[(c[e>>2]|0)+36>>2]&127](e)|0)!=-1){break}c[l>>2]=0;m=1924;break L2319}}while(0);if(d){n=e}else{m=1925}}}while(
0);if((m|0)==1924){if(d){m=1925}else{n=0}}if((m|0)==1925){c[f>>2]=c[f>>2]|6;o=0;i=j;return o|0}d=c[k>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){p=(b_[c[(c[d>>2]|0)+36>>2]&127](d)|0)&255}else{p=a[e]|0}do{if(p<<24>>24>=0){e=g+8|0;if((b[(c[e>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0){break}d=g;q=(bY[c[(c[d>>2]|0)+36>>2]&63](g,p,0)|0)<<24>>24;r=c[k>>2]|0;s=r+12|0;t=c[s>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;b_[u&127](r)|0;v=q;w=h;x=n}else{c[s>>2]=t+1;v=q;w=h;x=n}while(1){y=v-48|0;q=w-1|0;t=c[k>>2]|0;do{if((t|0)==0){z=0}else{if((c[t+12>>2]|0)!=(c[t+16>>2]|0)){z=t;break}if((b_[c[(c[t>>2]|0)+36>>2]&127](t)|0)==-1){c[k>>2]=0;z=0;break}else{z=c[k>>2]|0;break}}}while(0);t=(z|0)==0;if((x|0)==0){A=z;B=0}else{do{if((c[x+12>>2]|0)==(c[x+16>>2]|0)){if((b_[c[(c[x>>2]|0)+36>>2]&127](x)|0)!=-1){C=x;break}c[l>>2]=0;C=0}else{C=x}}while(0);A=c[k>>2]|0;B=C}D=(B|0)==0;if(!((t^D)&(q|0)>0)){m=1954;break}s=c[A+12>>2]|0;if((s|0)==(c[A+16>>2]|0)){E=(b_[c[(c[A>>2]|0)+36>>2]&127](A)|0)&255}else{E=a[s]|0}if(E<<24>>24<0){o=y;m=1972;break}if((b[(c[e>>2]|0)+(E<<24>>24<<1)>>1]&2048)==0){o=y;m=1973;break}s=((bY[c[(c[d>>2]|0)+36>>2]&63](g,E,0)|0)<<24>>24)+(y*10|0)|0;r=c[k>>2]|0;u=r+12|0;F=c[u>>2]|0;if((F|0)==(c[r+16>>2]|0)){G=c[(c[r>>2]|0)+40>>2]|0;b_[G&127](r)|0;v=s;w=q;x=B;continue}else{c[u>>2]=F+1;v=s;w=q;x=B;continue}}if((m|0)==1954){do{if((A|0)==0){H=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){H=A;break}if((b_[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[k>>2]=0;H=0;break}else{H=c[k>>2]|0;break}}}while(0);d=(H|0)==0;L2376:do{if(D){m=1964}else{do{if((c[B+12>>2]|0)==(c[B+16>>2]|0)){if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){break}c[l>>2]=0;m=1964;break L2376}}while(0);if(d){o=y}else{break}i=j;return o|0}}while(0);do{if((m|0)==1964){if(d){break}else{o=y}i=j;return o|0}}while(0);c[f>>2]=c[f>>2]|2;o=y;i=j;return o|0}else if((m|0)==1972){i=j;return o|0}else if((m|0)==1973){i=j;return o|0}}}while(0);c[f>>2]=c[f>>2]|4;o=0;i=j;return o|0}function gz(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0;l=i;i=i+48|0;m=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[m>>2];m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=l|0;n=l+16|0;o=l+24|0;p=l+32|0;q=l+40|0;d_(n,f);r=n|0;n=c[r>>2]|0;if((c[6582]|0)!=-1){c[m>>2]=26328;c[m+4>>2]=14;c[m+8>>2]=0;dB(26328,m,98)}m=(c[6583]|0)-1|0;s=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;v=c[r>>2]|0;dg(v)|0;c[g>>2]=0;v=d|0;L2399:do{if((j|0)==(k|0)){w=2044}else{x=e|0;y=t;z=t;A=t;B=b;C=p|0;D=q|0;E=o|0;F=j;G=0;L2401:while(1){H=G;while(1){if((H|0)!=0){w=2044;break L2399}I=c[v>>2]|0;do{if((I|0)==0){J=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){L=b_[c[(c[I>>2]|0)+36>>2]&127](I)|0}else{L=c[K>>2]|0}if((L|0)!=-1){J=I;break}c[v>>2]=0;J=0}}while(0);I=(J|0)==0;K=c[x>>2]|0;do{if((K|0)==0){w=1996}else{M=c[
K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=b_[c[(c[K>>2]|0)+36>>2]&127](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[x>>2]=0;w=1996;break}else{if(I^(K|0)==0){O=K;break}else{w=1998;break L2401}}}}while(0);if((w|0)==1996){w=0;if(I){w=1998;break L2401}else{O=0}}if((bY[c[(c[y>>2]|0)+52>>2]&63](u,c[F>>2]|0,0)|0)<<24>>24==37){w=2001;break}if(bY[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[F>>2]|0)|0){P=F;w=2011;break}Q=J+12|0;K=c[Q>>2]|0;R=J+16|0;if((K|0)==(c[R>>2]|0)){S=b_[c[(c[J>>2]|0)+36>>2]&127](J)|0}else{S=c[K>>2]|0}K=bX[c[(c[A>>2]|0)+28>>2]&31](u,S)|0;if((K|0)==(bX[c[(c[A>>2]|0)+28>>2]&31](u,c[F>>2]|0)|0)){w=2039;break}c[g>>2]=4;H=4}L2433:do{if((w|0)==2011){while(1){w=0;H=P+4|0;if((H|0)==(k|0)){T=k;break}if(bY[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[H>>2]|0)|0){P=H;w=2011}else{T=H;break}}I=J;H=O;while(1){do{if((I|0)==0){U=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){V=b_[c[(c[I>>2]|0)+36>>2]&127](I)|0}else{V=c[K>>2]|0}if((V|0)!=-1){U=I;break}c[v>>2]=0;U=0}}while(0);K=(U|0)==0;do{if((H|0)==0){w=2026}else{M=c[H+12>>2]|0;if((M|0)==(c[H+16>>2]|0)){W=b_[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{W=c[M>>2]|0}if((W|0)==-1){c[x>>2]=0;w=2026;break}else{if(K^(H|0)==0){X=H;break}else{Y=T;break L2433}}}}while(0);if((w|0)==2026){w=0;if(K){Y=T;break L2433}else{X=0}}M=U+12|0;Z=c[M>>2]|0;_=U+16|0;if((Z|0)==(c[_>>2]|0)){$=b_[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{$=c[Z>>2]|0}if(!(bY[c[(c[z>>2]|0)+12>>2]&63](u,8192,$)|0)){Y=T;break L2433}Z=c[M>>2]|0;if((Z|0)==(c[_>>2]|0)){_=c[(c[U>>2]|0)+40>>2]|0;b_[_&127](U)|0;I=U;H=X;continue}else{c[M>>2]=Z+4;I=U;H=X;continue}}}else if((w|0)==2039){w=0;H=c[Q>>2]|0;if((H|0)==(c[R>>2]|0)){I=c[(c[J>>2]|0)+40>>2]|0;b_[I&127](J)|0}else{c[Q>>2]=H+4}Y=F+4|0}else if((w|0)==2001){w=0;H=F+4|0;if((H|0)==(k|0)){w=2002;break L2401}I=bY[c[(c[y>>2]|0)+52>>2]&63](u,c[H>>2]|0,0)|0;if((I<<24>>24|0)==69|(I<<24>>24|0)==48){Z=F+8|0;if((Z|0)==(k|0)){w=2005;break L2401}aa=I;ab=bY[c[(c[y>>2]|0)+52>>2]&63](u,c[Z>>2]|0,0)|0;ac=Z}else{aa=0;ab=I;ac=H}H=c[(c[B>>2]|0)+36>>2]|0;c[C>>2]=J;c[D>>2]=O;b3[H&7](o,b,p,q,f,g,h,ab,aa);c[v>>2]=c[E>>2];Y=ac+4|0}}while(0);if((Y|0)==(k|0)){w=2044;break L2399}F=Y;G=c[g>>2]|0}if((w|0)==1998){c[g>>2]=4;ad=J;break}else if((w|0)==2002){c[g>>2]=4;ad=J;break}else if((w|0)==2005){c[g>>2]=4;ad=J;break}}}while(0);if((w|0)==2044){ad=c[v>>2]|0}u=d|0;do{if((ad|0)!=0){t=c[ad+12>>2]|0;if((t|0)==(c[ad+16>>2]|0)){ae=b_[c[(c[ad>>2]|0)+36>>2]&127](ad)|0}else{ae=c[t>>2]|0}if((ae|0)!=-1){break}c[u>>2]=0}}while(0);v=c[u>>2]|0;t=(v|0)==0;G=e|0;F=c[G>>2]|0;do{if((F|0)==0){w=2057}else{E=c[F+12>>2]|0;if((E|0)==(c[F+16>>2]|0)){af=b_[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{af=c[E>>2]|0}if((af|0)==-1){c[G>>2]=0;w=2057;break}if(!(t^(F|0)==0)){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);do{if((w|0)==2057){if(t){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);c[g>>2]=c[g>>2]|2;ag=a|0;c[ag>>2]=v;i=l;return}}while(0);l=bd(4)|0;kl(l);aM(l|0,8328,134)}function gA(a){a=a|0;de(a|0);kN(a);return}function gB(a){a=a|0;de(a|0);return}function gC(a){a=a|0;return 2}function gD(a,b,d,e,f,g,h){a=a|0;b=b|0;
d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];gz(a,b,k,l,f,g,h,2424,2456);i=j;return}function gE(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=b_[c[(c[n>>2]|0)+20>>2]&127](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=a[o]|0;if((f&1)==0){p=o+4|0;q=o+4|0}else{e=c[o+8>>2]|0;p=e;q=e}e=f&255;if((e&1|0)==0){r=e>>>1}else{r=c[o+4>>2]|0}gz(b,d,l,m,g,h,j,q,p+(r<<2)|0);i=k;return}function gF(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;d_(m,f);f=m|0;m=c[f>>2]|0;if((c[6582]|0)!=-1){c[l>>2]=26328;c[l+4>>2]=14;c[l+8>>2]=0;dB(26328,l,98)}l=(c[6583]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;dg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b_[c[c[q>>2]>>2]&127](q)|0;c[k>>2]=o;o=(fv(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bd(4)|0;kl(j);aM(j|0,8328,134)}function gG(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;d_(m,f);f=m|0;m=c[f>>2]|0;if((c[6582]|0)!=-1){c[l>>2]=26328;c[l+4>>2]=14;c[l+8>>2]=0;dB(26328,l,98)}l=(c[6583]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;dg(o)|0;o=c[e>>2]|0;q=b+8|0;r=b_[c[(c[q>>2]|0)+4>>2]&127](q)|0;c[k>>2]=o;o=(fv(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bd(4)|0;kl(j);aM(j|0,8328,134)}function gH(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;d_(l,f);f=l|0;l=c[f>>2]|0;if((c[6582]|0)!=-1){c[k>>2]=26328;c[k+4>>2]=14;c[k+8>>2]=0;dB(26328,k,98)}k=(c[6583]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;dg(n)|0;c[j>>2]=c[e>>2];n=gM(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=bd(4)|0;kl(b);aM(b|0,8328,134)}function gI(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,
r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;d_(z,g);_=z|0;z=c[_>>2]|0;if((c[6582]|0)!=-1){c[y>>2]=26328;c[y+4>>2]=14;c[y+8>>2]=0;dB(26328,y,98)}y=(c[6583]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;dg(aa)|0;L2576:do{switch(k<<24>>24|0){case 70:{aa=e|0;c[H>>2]=c[aa>>2];c[I>>2]=c[f>>2];gz(G,d,H,I,g,h,j,2256,2288);c[aa>>2]=c[G>>2];break};case 119:{c[o>>2]=c[f>>2];aa=gM(e,o,h,ab,1)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<7){c[j+24>>2]=aa;break L2576}else{c[h>>2]=ac|4;break L2576}break};case 82:{ac=e|0;c[P>>2]=c[ac>>2];c[Q>>2]=c[f>>2];gz(O,d,P,Q,g,h,j,2320,2340);c[ac>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];ac=gM(e,p,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<61){c[j>>2]=ac;break L2576}else{c[h>>2]=aa|4;break L2576}break};case 77:{c[q>>2]=c[f>>2];aa=gM(e,q,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<60){c[j+4>>2]=aa;break L2576}else{c[h>>2]=ac|4;break L2576}break};case 72:{c[u>>2]=c[f>>2];ac=gM(e,u,h,ab,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0&(ac|0)<24){c[j+8>>2]=ac;break L2576}else{c[h>>2]=aa|4;break L2576}break};case 98:case 66:case 104:{aa=c[f>>2]|0;ac=d+8|0;ad=b_[c[(c[ac>>2]|0)+4>>2]&127](ac)|0;c[w>>2]=aa;aa=(fv(e,w,ad,ad+288|0,ab,h,0)|0)-ad|0;if((aa|0)>=288){break L2576}c[j+16>>2]=((aa|0)/12|0|0)%12|0;break};case 89:{c[m>>2]=c[f>>2];aa=gM(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2576}c[j+20>>2]=aa-1900;break};case 120:{aa=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];bU[aa&127](b,d,U,V,g,h,j);i=l;return};case 88:{aa=d+8|0;ad=b_[c[(c[aa>>2]|0)+24>>2]&127](aa)|0;aa=e|0;c[X>>2]=c[aa>>2];c[Y>>2]=c[f>>2];ac=a[ad]|0;if((ac&1)==0){ae=ad+4|0;af=ad+4|0}else{ag=c[ad+8>>2]|0;ae=ag;af=ag}ag=ac&255;if((ag&1|0)==0){ah=ag>>>1}else{ah=c[ad+4>>2]|0}gz(W,d,X,Y,g,h,j,af,ae+(ah<<2)|0);c[aa>>2]=c[W>>2];break};case 106:{c[s>>2]=c[f>>2];aa=gM(e,s,h,ab,3)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(aa|0)<366){c[j+28>>2]=aa;break L2576}else{c[h>>2]=ad|4;break L2576}break};case 100:case 101:{ad=j+12|0;c[v>>2]=c[f>>2];aa=gM(e,v,h,ab,2)|0;ag=c[h>>2]|0;do{if((ag&4|0)==0){if((aa-1|0)>>>0>=31>>>0){break}c[ad>>2]=aa;break L2576}}while(0);c[h>>2]=ag|4;break};case 109:{c[r>>2]=c[f>>2];aa=(gM(e,r,h,ab,2)|0)-1|0;ad=c[h>>2]|0;if((ad&4|0)==0&(aa|0)<12){c[j+16>>2]=aa;break L2576}else{c[h>>2]=ad|4;break L2576}break};case 112:{c[K>>2]=c[f>>2];gK(d,j+8|0,e,K,h,ab);break};case 
114:{ad=e|0;c[M>>2]=c[ad>>2];c[N>>2]=c[f>>2];gz(L,d,M,N,g,h,j,2344,2388);c[ad>>2]=c[L>>2];break};case 73:{ad=j+8|0;c[t>>2]=c[f>>2];aa=gM(e,t,h,ab,2)|0;ac=c[h>>2]|0;do{if((ac&4|0)==0){if((aa-1|0)>>>0>=12>>>0){break}c[ad>>2]=aa;break L2576}}while(0);c[h>>2]=ac|4;break};case 99:{aa=d+8|0;ad=b_[c[(c[aa>>2]|0)+12>>2]&127](aa)|0;aa=e|0;c[B>>2]=c[aa>>2];c[C>>2]=c[f>>2];ag=a[ad]|0;if((ag&1)==0){ai=ad+4|0;aj=ad+4|0}else{ak=c[ad+8>>2]|0;ai=ak;aj=ak}ak=ag&255;if((ak&1|0)==0){al=ak>>>1}else{al=c[ad+4>>2]|0}gz(A,d,B,C,g,h,j,aj,ai+(al<<2)|0);c[aa>>2]=c[A>>2];break};case 84:{aa=e|0;c[S>>2]=c[aa>>2];c[T>>2]=c[f>>2];gz(R,d,S,T,g,h,j,2288,2320);c[aa>>2]=c[R>>2];break};case 97:case 65:{aa=c[f>>2]|0;ad=d+8|0;ak=b_[c[c[ad>>2]>>2]&127](ad)|0;c[x>>2]=aa;aa=(fv(e,x,ak,ak+168|0,ab,h,0)|0)-ak|0;if((aa|0)>=168){break L2576}c[j+24>>2]=((aa|0)/12|0|0)%7|0;break};case 37:{c[Z>>2]=c[f>>2];gL(0,e,Z,h,ab);break};case 121:{c[n>>2]=c[f>>2];aa=gM(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L2576}if((aa|0)<69){am=aa+2e3|0}else{am=(aa-69|0)>>>0<31>>>0?aa+1900|0:aa}c[j+20>>2]=am-1900;break};case 110:case 116:{c[J>>2]=c[f>>2];gJ(0,e,J,h,ab);break};case 68:{aa=e|0;c[E>>2]=c[aa>>2];c[F>>2]=c[f>>2];gz(D,d,E,F,g,h,j,2392,2424);c[aa>>2]=c[D>>2];break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=bd(4)|0;kl(l);aM(l|0,8328,134)}function gJ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=d|0;d=f;L2657:while(1){h=c[g>>2]|0;do{if((h|0)==0){j=1}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){l=b_[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[g>>2]=0;j=1;break}else{j=(c[g>>2]|0)==0;break}}}while(0);h=c[b>>2]|0;do{if((h|0)==0){m=2201}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){n=b_[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{n=c[k>>2]|0}if((n|0)==-1){c[b>>2]=0;m=2201;break}else{k=(h|0)==0;if(j^k){o=h;p=k;break}else{q=h;r=k;break L2657}}}}while(0);if((m|0)==2201){m=0;if(j){q=0;r=1;break}else{o=0;p=1}}h=c[g>>2]|0;k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){s=b_[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{s=c[k>>2]|0}if(!(bY[c[(c[d>>2]|0)+12>>2]&63](f,8192,s)|0)){q=o;r=p;break}k=c[g>>2]|0;h=k+12|0;t=c[h>>2]|0;if((t|0)==(c[k+16>>2]|0)){u=c[(c[k>>2]|0)+40>>2]|0;b_[u&127](k)|0;continue}else{c[h>>2]=t+4;continue}}p=c[g>>2]|0;do{if((p|0)==0){v=1}else{o=c[p+12>>2]|0;if((o|0)==(c[p+16>>2]|0)){w=b_[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{w=c[o>>2]|0}if((w|0)==-1){c[g>>2]=0;v=1;break}else{v=(c[g>>2]|0)==0;break}}}while(0);do{if(r){m=2223}else{g=c[q+12>>2]|0;if((g|0)==(c[q+16>>2]|0)){x=b_[c[(c[q>>2]|0)+36>>2]&127](q)|0}else{x=c[g>>2]|0}if((x|0)==-1){c[b>>2]=0;m=2223;break}if(!(v^(q|0)==0)){break}i=a;return}}while(0);do{if((m|0)==2223){if(v){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function gK(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=b_[c[(c[l>>2]|0)+8>>2]&
127](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=fv(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function gL(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=c[g>>2]|0;do{if((b|0)==0){h=1}else{j=c[b+12>>2]|0;if((j|0)==(c[b+16>>2]|0)){k=b_[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{k=c[j>>2]|0}if((k|0)==-1){c[g>>2]=0;h=1;break}else{h=(c[g>>2]|0)==0;break}}}while(0);k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=2263}else{b=c[d+12>>2]|0;if((b|0)==(c[d+16>>2]|0)){m=b_[c[(c[d>>2]|0)+36>>2]&127](d)|0}else{m=c[b>>2]|0}if((m|0)==-1){c[k>>2]=0;l=2263;break}else{b=(d|0)==0;if(h^b){n=d;o=b;break}else{l=2265;break}}}}while(0);if((l|0)==2263){if(h){l=2265}else{n=0;o=1}}if((l|0)==2265){c[e>>2]=c[e>>2]|6;i=a;return}h=c[g>>2]|0;d=c[h+12>>2]|0;if((d|0)==(c[h+16>>2]|0)){p=b_[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{p=c[d>>2]|0}if((bY[c[(c[f>>2]|0)+52>>2]&63](f,p,0)|0)<<24>>24!=37){c[e>>2]=c[e>>2]|4;i=a;return}p=c[g>>2]|0;f=p+12|0;d=c[f>>2]|0;if((d|0)==(c[p+16>>2]|0)){h=c[(c[p>>2]|0)+40>>2]|0;b_[h&127](p)|0}else{c[f>>2]=d+4}d=c[g>>2]|0;do{if((d|0)==0){q=1}else{f=c[d+12>>2]|0;if((f|0)==(c[d+16>>2]|0)){r=b_[c[(c[d>>2]|0)+36>>2]&127](d)|0}else{r=c[f>>2]|0}if((r|0)==-1){c[g>>2]=0;q=1;break}else{q=(c[g>>2]|0)==0;break}}}while(0);do{if(o){l=2287}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){s=b_[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{s=c[g>>2]|0}if((s|0)==-1){c[k>>2]=0;l=2287;break}if(!(q^(n|0)==0)){break}i=a;return}}while(0);do{if((l|0)==2287){if(q){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function gM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=i;h=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[h>>2];h=a|0;a=c[h>>2]|0;do{if((a|0)==0){j=1}else{k=c[a+12>>2]|0;if((k|0)==(c[a+16>>2]|0)){l=b_[c[(c[a>>2]|0)+36>>2]&127](a)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[h>>2]=0;j=1;break}else{j=(c[h>>2]|0)==0;break}}}while(0);l=b|0;b=c[l>>2]|0;do{if((b|0)==0){m=14}else{a=c[b+12>>2]|0;if((a|0)==(c[b+16>>2]|0)){n=b_[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{n=c[a>>2]|0}if((n|0)==-1){c[l>>2]=0;m=14;break}else{if(j^(b|0)==0){o=b;break}else{m=16;break}}}}while(0);if((m|0)==14){if(j){m=16}else{o=0}}if((m|0)==16){c[d>>2]=c[d>>2]|6;p=0;i=g;return p|0}j=c[h>>2]|0;b=c[j+12>>2]|0;if((b|0)==(c[j+16>>2]|0)){q=b_[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{q=c[b>>2]|0}b=e;if(!(bY[c[(c[b>>2]|0)+12>>2]&63](e,2048,q)|0)){c[d>>2]=c[d>>2]|4;p=0;i=g;return p|0}j=e;n=(bY[c[(c[j>>2]|0)+52>>2]&63](e,q,0)|0)<<24>>24;q=c[h>>2]|0;a=q+12|0;k=c[a>>2]|0;if((k|0)==(c[q+16>>2]|0)){r=c[(c[q>>2]|0)+40>>2]|0;b_[r&127](q)|0;s=n;t=f;u=o}else{c[a>>2]=k+4;s=n;t=f;u=o}while(1){v=s-48|0;
o=t-1|0;f=c[h>>2]|0;do{if((f|0)==0){w=0}else{n=c[f+12>>2]|0;if((n|0)==(c[f+16>>2]|0)){x=b_[c[(c[f>>2]|0)+36>>2]&127](f)|0}else{x=c[n>>2]|0}if((x|0)==-1){c[h>>2]=0;w=0;break}else{w=c[h>>2]|0;break}}}while(0);f=(w|0)==0;if((u|0)==0){y=w;z=0}else{n=c[u+12>>2]|0;if((n|0)==(c[u+16>>2]|0)){A=b_[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{A=c[n>>2]|0}if((A|0)==-1){c[l>>2]=0;B=0}else{B=u}y=c[h>>2]|0;z=B}C=(z|0)==0;if(!((f^C)&(o|0)>0)){break}f=c[y+12>>2]|0;if((f|0)==(c[y+16>>2]|0)){D=b_[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{D=c[f>>2]|0}if(!(bY[c[(c[b>>2]|0)+12>>2]&63](e,2048,D)|0)){p=v;m=66;break}f=((bY[c[(c[j>>2]|0)+52>>2]&63](e,D,0)|0)<<24>>24)+(v*10|0)|0;n=c[h>>2]|0;k=n+12|0;a=c[k>>2]|0;if((a|0)==(c[n+16>>2]|0)){q=c[(c[n>>2]|0)+40>>2]|0;b_[q&127](n)|0;s=f;t=o;u=z;continue}else{c[k>>2]=a+4;s=f;t=o;u=z;continue}}if((m|0)==66){i=g;return p|0}do{if((y|0)==0){E=1}else{u=c[y+12>>2]|0;if((u|0)==(c[y+16>>2]|0)){F=b_[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{F=c[u>>2]|0}if((F|0)==-1){c[h>>2]=0;E=1;break}else{E=(c[h>>2]|0)==0;break}}}while(0);do{if(C){m=60}else{h=c[z+12>>2]|0;if((h|0)==(c[z+16>>2]|0)){G=b_[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[h>>2]|0}if((G|0)==-1){c[l>>2]=0;m=60;break}if(E^(z|0)==0){p=v}else{break}i=g;return p|0}}while(0);do{if((m|0)==60){if(E){break}else{p=v}i=g;return p|0}}while(0);c[d>>2]=c[d>>2]|2;p=v;i=g;return p|0}function gN(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((f|0)==(c[6226]|0)){g=b|0;de(g);kN(d);return}bc(c[e>>2]|0);g=b|0;de(g);kN(d);return}function gO(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((e|0)==(c[6226]|0)){f=b|0;de(f);return}bc(c[d>>2]|0);f=b|0;de(f);return}function gP(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+112|0;f=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[f>>2];f=g|0;l=g+8|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=bR(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=bX[c[(c[s>>2]|0)+52>>2]&31](s,m&255)|0}else{c[l>>2]=j+1;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function gQ(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((f|0)==(c[6226]|0)){g=b|0;de(g);kN(d);return}bc(c[e>>2]|0);g=b|0;de(g);kN(d);return}function gR(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((e|0)==(c[6226]|0)){f=b|0;de(f);return}bc(c[d>>2]|0);f=b|0;de(f);return}
function gS(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+408|0;e=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[e>>2];e=f|0;k=f+400|0;l=e|0;c[k>>2]=e+400;gT(b+8|0,l,k,g,h,j);j=c[k>>2]|0;k=c[d>>2]|0;if((l|0)==(j|0)){m=k;n=a|0;c[n>>2]=m;i=f;return}else{o=k;p=l}while(1){l=c[p>>2]|0;if((o|0)==0){q=0}else{k=o+24|0;d=c[k>>2]|0;if((d|0)==(c[o+28>>2]|0)){r=bX[c[(c[o>>2]|0)+52>>2]&31](o,l)|0}else{c[k>>2]=d+4;c[d>>2]=l;r=l}q=(r|0)==-1?0:o}l=p+4|0;if((l|0)==(j|0)){m=q;break}else{o=q;p=l}}n=a|0;c[n>>2]=m;i=f;return}function gT(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+120|0;k=j|0;l=j+112|0;m=i;i=i+4|0;i=i+7&-8;n=j+8|0;o=k|0;a[o]=37;p=k+1|0;a[p]=g;q=k+2|0;a[q]=h;a[k+3|0]=0;if(h<<24>>24!=0){a[p]=h;a[q]=g}g=b|0;bR(n|0,100,o|0,f|0,c[g>>2]|0)|0;c[l>>2]=0;c[l+4>>2]=0;c[m>>2]=n;n=(c[e>>2]|0)-d>>2;f=bN(c[g>>2]|0)|0;g=kb(d,m,n,l)|0;if((f|0)!=0){bN(f|0)|0}if((g|0)==-1){hF(904)}else{c[e>>2]=d+(g<<2);i=j;return}}function gU(a){a=a|0;de(a|0);kN(a);return}function gV(a){a=a|0;de(a|0);return}function gW(a){a=a|0;return 127}function gX(a){a=a|0;return 127}function gY(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function gZ(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function g_(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function g$(a,b){a=a|0;b=b|0;dF(a,1,45);return}function g0(a){a=a|0;return 0}function g1(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function g2(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function g3(a){a=a|0;de(a|0);kN(a);return}function g4(a){a=a|0;de(a|0);return}function g5(a){a=a|0;return 127}function g6(a){a=a|0;return 127}function g7(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function g8(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function g9(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function ha(a,b){a=a|0;b=b|0;dF(a,1,45);return}function hb(a){a=a|0;return 0}function hc(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function hd(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function he(a){a=a|0;de(a|0);kN(a);return}function hf(a){a=a|0;de(a|0);return}function hg(a){a=a|0;return 2147483647}function hh(a){a=a|0;return 2147483647}function hi(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function hj(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function hk(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function hl(a,b){a=a|0;b=b|0;dQ(a,1,45);return}function hm(a){a=a|0;return 0}function hn(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function ho(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function hp(a){a=a|0;de(a|0);kN(a);return}function hq(a){a=a|0;de(a|0);return}function hr(a){a=a|0;return 2147483647}
function hs(a){a=a|0;return 2147483647}function ht(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function hu(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function hv(a,b){a=a|0;b=b|0;kV(a|0,0,12);return}function hw(a,b){a=a|0;b=b|0;dQ(a,1,45);return}function hx(a){a=a|0;return 0}function hy(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function hz(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function hA(a){a=a|0;de(a|0);kN(a);return}function hB(a){a=a|0;de(a|0);return}function hC(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+280|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=d+160|0;t=d+176|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=164;w=m+100|0;d_(p,h);m=p|0;x=c[m>>2]|0;if((c[6584]|0)!=-1){c[l>>2]=26336;c[l+4>>2]=14;c[l+8>>2]=0;dB(26336,l,98)}l=(c[6585]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(hE(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+32>>2]|0;b6[D&15](A,2240,2250,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>98){H=kG(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}kS();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+10|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((a[N]|0)==(a[M]|0)){O=N;break}else{N=N+1|0}}a[L]=a[2240+(O-H)|0]|0;N=M+1|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=aH(D|0,1416,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}kH(J);break}M=bd(8)|0;dm(M,1368);aM(M|0,8344,26)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){R=z;break}if((b_[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){S=243}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(A){break}else{S=245;break}}if((b_[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[B>>2]=0;S=243;break}else{if(A^(z|0)==0){break}else{S=245;break}}}}while(0);if((S|0)==243){if(A){S=245}}if((S|0)==245){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;dg(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}bV[c[v>>2]&511](z);i=d;return}}while(0);d=bd(4)|0;kl(d);aM(d|0,8328,134)}function hD(a){a=a|0;return}function hE(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,
aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0;q=i;i=i+440|0;r=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[r>>2];r=q|0;s=q+400|0;t=q+408|0;u=q+416|0;v=q+424|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=r|0;kV(w|0,0,12);E=x;F=y;G=z;H=A;kV(E|0,0,12);kV(F|0,0,12);kV(G|0,0,12);kV(H|0,0,12);hI(g,h,s,t,u,v,x,y,z,B);h=n|0;c[o>>2]=c[h>>2];g=e|0;e=f|0;f=m+8|0;m=z+1|0;I=z+4|0;J=z+8|0;K=y+1|0;L=y+4|0;M=y+8|0;N=(j&512|0)!=0;j=x+1|0;O=x+4|0;P=x+8|0;Q=A+1|0;R=A+4|0;S=A+8|0;T=s+3|0;U=v+4|0;V=n+4|0;n=p;p=164;W=D;X=D;D=r+400|0;r=0;Y=0;L286:while(1){Z=c[g>>2]|0;do{if((Z|0)==0){_=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){_=Z;break}if((b_[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)==-1){c[g>>2]=0;_=0;break}else{_=c[g>>2]|0;break}}}while(0);Z=(_|0)==0;$=c[e>>2]|0;do{if(($|0)==0){aa=271}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=530;break L286}}if((b_[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[e>>2]=0;aa=271;break}else{if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=530;break L286}}}}while(0);if((aa|0)==271){aa=0;if(Z){ac=p;ad=W;ae=X;af=r;aa=530;break}else{ab=0}}L308:do{switch(a[s+Y|0]|0){case 3:{$=a[F]|0;ag=$&255;ah=(ag&1|0)==0?ag>>>1:c[L>>2]|0;ag=a[G]|0;ai=ag&255;aj=(ai&1|0)==0?ai>>>1:c[I>>2]|0;if((ah|0)==(-aj|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L308}ai=(ah|0)==0;ah=c[g>>2]|0;aq=c[ah+12>>2]|0;ar=c[ah+16>>2]|0;as=(aq|0)==(ar|0);if(!(ai|(aj|0)==0)){if(as){aj=(b_[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255;at=c[g>>2]|0;au=aj;av=a[F]|0;aw=at;ax=c[at+12>>2]|0;ay=c[at+16>>2]|0}else{au=a[aq]|0;av=$;aw=ah;ax=aq;ay=ar}ar=aw+12|0;at=(ax|0)==(ay|0);if(au<<24>>24==(a[(av&1)==0?K:c[M>>2]|0]|0)){if(at){aj=c[(c[aw>>2]|0)+40>>2]|0;b_[aj&127](aw)|0}else{c[ar>>2]=ax+1}ar=d[F]|0;ak=((ar&1|0)==0?ar>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;al=D;am=X;an=W;ao=p;ap=n;break L308}if(at){az=(b_[c[(c[aw>>2]|0)+36>>2]&127](aw)|0)&255}else{az=a[ax]|0}if(az<<24>>24!=(a[(a[G]&1)==0?m:c[J>>2]|0]|0)){aa=366;break L286}at=c[g>>2]|0;ar=at+12|0;aj=c[ar>>2]|0;if((aj|0)==(c[at+16>>2]|0)){aA=c[(c[at>>2]|0)+40>>2]|0;b_[aA&127](at)|0}else{c[ar>>2]=aj+1}a[l]=1;aj=d[G]|0;ak=((aj&1|0)==0?aj>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;al=D;am=X;an=W;ao=p;ap=n;break L308}if(ai){if(as){ai=(b_[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255;aB=ai;aC=a[G]|0}else{aB=a[aq]|0;aC=ag}if(aB<<24>>24!=(a[(aC&1)==0?m:c[J>>2]|0]|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L308}ag=c[g>>2]|0;ai=ag+12|0;aj=c[ai>>2]|0;if((aj|0)==(c[ag+16>>2]|0)){ar=c[(c[ag>>2]|0)+40>>2]|0;b_[ar&127](ag)|0}else{c[ai>>2]=aj+1}a[l]=1;aj=d[G]|0;ak=((aj&1|0)==0?aj>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;al=D;am=X;an=W;ao=p;ap=n;break L308}if(as){as=(b_[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255;aD=as;aE=a[F]|0}else{aD=a[
aq]|0;aE=$}if(aD<<24>>24!=(a[(aE&1)==0?K:c[M>>2]|0]|0)){a[l]=1;ak=r;al=D;am=X;an=W;ao=p;ap=n;break L308}$=c[g>>2]|0;aq=$+12|0;as=c[aq>>2]|0;if((as|0)==(c[$+16>>2]|0)){ah=c[(c[$>>2]|0)+40>>2]|0;b_[ah&127]($)|0}else{c[aq>>2]=as+1}as=d[F]|0;ak=((as&1|0)==0?as>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;al=D;am=X;an=W;ao=p;ap=n;break};case 1:{if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=530;break L286}as=c[g>>2]|0;aq=c[as+12>>2]|0;if((aq|0)==(c[as+16>>2]|0)){aF=(b_[c[(c[as>>2]|0)+36>>2]&127](as)|0)&255}else{aF=a[aq]|0}aq=aF<<24>>24;if((bw(aq|0)|0)==0){aa=298;break L286}if((b[(c[f>>2]|0)+(aq<<1)>>1]&8192)==0){aa=298;break L286}aq=c[g>>2]|0;as=aq+12|0;$=c[as>>2]|0;if(($|0)==(c[aq+16>>2]|0)){aG=(b_[c[(c[aq>>2]|0)+40>>2]&127](aq)|0)&255}else{c[as>>2]=$+1;aG=a[$]|0}dL(A,aG);aa=299;break};case 0:{aa=299;break};case 2:{if(!((r|0)!=0|Y>>>0<2>>>0)){if((Y|0)==2){aH=(a[T]|0)!=0}else{aH=0}if(!(N|aH)){ak=0;al=D;am=X;an=W;ao=p;ap=n;break L308}}$=a[E]|0;as=c[P>>2]|0;aq=($&1)==0?j:as;L383:do{if((Y|0)==0){aI=aq;aJ=$;aK=as}else{if((d[s+(Y-1)|0]|0)>>>0>=2>>>0){aI=aq;aJ=$;aK=as;break}ah=$&255;L386:do{if((((ah&1|0)==0?ah>>>1:c[O>>2]|0)|0)==0){aL=aq;aM=$;aN=as}else{aj=aq;while(1){ai=a[aj]|0;if((bw(ai|0)|0)==0){break}if((b[(c[f>>2]|0)+(ai<<1)>>1]&8192)==0){break}ai=aj+1|0;ag=a[E]|0;ar=c[P>>2]|0;at=ag&255;if((ai|0)==(((ag&1)==0?j:ar)+((at&1|0)==0?at>>>1:c[O>>2]|0)|0)){aL=ai;aM=ag;aN=ar;break L386}else{aj=ai}}aL=aj;aM=a[E]|0;aN=c[P>>2]|0}}while(0);ah=(aM&1)==0?j:aN;ai=aL-ah|0;ar=a[H]|0;ag=ar&255;at=(ag&1|0)==0?ag>>>1:c[R>>2]|0;if(ai>>>0>at>>>0){aI=ah;aJ=aM;aK=aN;break}ag=(ar&1)==0?Q:c[S>>2]|0;ar=ag+at|0;if((aL|0)==(ah|0)){aI=aL;aJ=aM;aK=aN;break}aA=ag+(at-ai)|0;ai=ah;while(1){if((a[aA]|0)!=(a[ai]|0)){aI=ah;aJ=aM;aK=aN;break L383}at=aA+1|0;if((at|0)==(ar|0)){aI=aL;aJ=aM;aK=aN;break}else{aA=at;ai=ai+1|0}}}}while(0);aq=aJ&255;L400:do{if((aI|0)==(((aJ&1)==0?j:aK)+((aq&1|0)==0?aq>>>1:c[O>>2]|0)|0)){aO=aI}else{as=ab;$=aI;while(1){ai=c[g>>2]|0;do{if((ai|0)==0){aP=0}else{if((c[ai+12>>2]|0)!=(c[ai+16>>2]|0)){aP=ai;break}if((b_[c[(c[ai>>2]|0)+36>>2]&127](ai)|0)==-1){c[g>>2]=0;aP=0;break}else{aP=c[g>>2]|0;break}}}while(0);ai=(aP|0)==0;do{if((as|0)==0){aa=397}else{if((c[as+12>>2]|0)!=(c[as+16>>2]|0)){if(ai){aQ=as;break}else{aO=$;break L400}}if((b_[c[(c[as>>2]|0)+36>>2]&127](as)|0)==-1){c[e>>2]=0;aa=397;break}else{if(ai){aQ=as;break}else{aO=$;break L400}}}}while(0);if((aa|0)==397){aa=0;if(ai){aO=$;break L400}else{aQ=0}}aj=c[g>>2]|0;aA=c[aj+12>>2]|0;if((aA|0)==(c[aj+16>>2]|0)){aR=(b_[c[(c[aj>>2]|0)+36>>2]&127](aj)|0)&255}else{aR=a[aA]|0}if(aR<<24>>24!=(a[$]|0)){aO=$;break L400}aA=c[g>>2]|0;aj=aA+12|0;ar=c[aj>>2]|0;if((ar|0)==(c[aA+16>>2]|0)){ah=c[(c[aA>>2]|0)+40>>2]|0;b_[ah&127](aA)|0}else{c[aj>>2]=ar+1}ar=$+1|0;aj=a[E]|0;aA=aj&255;if((ar|0)==(((aj&1)==0?j:c[P>>2]|0)+((aA&1|0)==0?aA>>>1:c[O>>2]|0)|0)){aO=ar;break}else{as=aQ;$=ar}}}}while(0);if(!N){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L308}aq=a[E]|0;$=aq&255;if((aO|0)==(((aq&1)==0?j:c[P>>2]|0)+(($&1|0)==0?$>>>1:c[O>>2]|0)|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n}else{
aa=410;break L286}break};case 4:{$=0;aq=D;as=X;ar=W;aA=p;aj=n;L435:while(1){ah=c[g>>2]|0;do{if((ah|0)==0){aS=0}else{if((c[ah+12>>2]|0)!=(c[ah+16>>2]|0)){aS=ah;break}if((b_[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)==-1){c[g>>2]=0;aS=0;break}else{aS=c[g>>2]|0;break}}}while(0);ah=(aS|0)==0;at=c[e>>2]|0;do{if((at|0)==0){aa=423}else{if((c[at+12>>2]|0)!=(c[at+16>>2]|0)){if(ah){break}else{break L435}}if((b_[c[(c[at>>2]|0)+36>>2]&127](at)|0)==-1){c[e>>2]=0;aa=423;break}else{if(ah){break}else{break L435}}}}while(0);if((aa|0)==423){aa=0;if(ah){break}}at=c[g>>2]|0;ag=c[at+12>>2]|0;if((ag|0)==(c[at+16>>2]|0)){aT=(b_[c[(c[at>>2]|0)+36>>2]&127](at)|0)&255}else{aT=a[ag]|0}ag=aT<<24>>24;do{if((bw(ag|0)|0)==0){aa=443}else{if((b[(c[f>>2]|0)+(ag<<1)>>1]&2048)==0){aa=443;break}at=c[o>>2]|0;if((at|0)==(aj|0)){aU=(c[V>>2]|0)!=164;aV=c[h>>2]|0;aW=aj-aV|0;aX=aW>>>0<2147483647>>>0?aW<<1:-1;aY=kI(aU?aV:0,aX)|0;if((aY|0)==0){kS()}do{if(aU){c[h>>2]=aY;aZ=aY}else{aV=c[h>>2]|0;c[h>>2]=aY;if((aV|0)==0){aZ=aY;break}bV[c[V>>2]&511](aV);aZ=c[h>>2]|0}}while(0);c[V>>2]=82;aY=aZ+aW|0;c[o>>2]=aY;a_=(c[h>>2]|0)+aX|0;a$=aY}else{a_=aj;a$=at}c[o>>2]=a$+1;a[a$]=aT;a0=$+1|0;a1=aq;a2=as;a3=ar;a4=aA;a5=a_}}while(0);if((aa|0)==443){aa=0;ag=d[w]|0;if((((ag&1|0)==0?ag>>>1:c[U>>2]|0)|0)==0|($|0)==0){break}if(aT<<24>>24!=(a[u]|0)){break}if((as|0)==(aq|0)){ag=as-ar|0;ah=ag>>>0<2147483647>>>0?ag<<1:-1;if((aA|0)==164){a6=0}else{a6=ar}aY=kI(a6,ah)|0;aU=aY;if((aY|0)==0){kS()}a7=aU+(ah>>>2<<2)|0;a8=aU+(ag>>2<<2)|0;a9=aU;ba=82}else{a7=aq;a8=as;a9=ar;ba=aA}c[a8>>2]=$;a0=0;a1=a7;a2=a8+4|0;a3=a9;a4=ba;a5=aj}aU=c[g>>2]|0;ag=aU+12|0;ah=c[ag>>2]|0;if((ah|0)==(c[aU+16>>2]|0)){aY=c[(c[aU>>2]|0)+40>>2]|0;b_[aY&127](aU)|0;$=a0;aq=a1;as=a2;ar=a3;aA=a4;aj=a5;continue}else{c[ag>>2]=ah+1;$=a0;aq=a1;as=a2;ar=a3;aA=a4;aj=a5;continue}}if((ar|0)==(as|0)|($|0)==0){bb=aq;bc=as;bd=ar;be=aA}else{if((as|0)==(aq|0)){ah=as-ar|0;ag=ah>>>0<2147483647>>>0?ah<<1:-1;if((aA|0)==164){bf=0}else{bf=ar}aU=kI(bf,ag)|0;aY=aU;if((aU|0)==0){kS()}bg=aY+(ag>>>2<<2)|0;bh=aY+(ah>>2<<2)|0;bi=aY;bj=82}else{bg=aq;bh=as;bi=ar;bj=aA}c[bh>>2]=$;bb=bg;bc=bh+4|0;bd=bi;be=bj}if((c[B>>2]|0)>0){aY=c[g>>2]|0;do{if((aY|0)==0){bk=0}else{if((c[aY+12>>2]|0)!=(c[aY+16>>2]|0)){bk=aY;break}if((b_[c[(c[aY>>2]|0)+36>>2]&127](aY)|0)==-1){c[g>>2]=0;bk=0;break}else{bk=c[g>>2]|0;break}}}while(0);aY=(bk|0)==0;$=c[e>>2]|0;do{if(($|0)==0){aa=476}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(aY){bl=$;break}else{aa=483;break L286}}if((b_[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[e>>2]=0;aa=476;break}else{if(aY){bl=$;break}else{aa=483;break L286}}}}while(0);if((aa|0)==476){aa=0;if(aY){aa=483;break L286}else{bl=0}}$=c[g>>2]|0;aA=c[$+12>>2]|0;if((aA|0)==(c[$+16>>2]|0)){bm=(b_[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{bm=a[aA]|0}if(bm<<24>>24!=(a[t]|0)){aa=483;break L286}aA=c[g>>2]|0;$=aA+12|0;ar=c[$>>2]|0;if((ar|0)==(c[aA+16>>2]|0)){as=c[(c[aA>>2]|0)+40>>2]|0;b_[as&127](aA)|0;bn=aj;bo=bl}else{c[$>>2]=ar+1;bn=aj;bo=bl}while(1){ar=c[g>>2]|0;do{if((ar|0)==0){bp=0}else{if((c[ar+12>>2]|0)!=(c[
ar+16>>2]|0)){bp=ar;break}if((b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0)==-1){c[g>>2]=0;bp=0;break}else{bp=c[g>>2]|0;break}}}while(0);ar=(bp|0)==0;do{if((bo|0)==0){aa=499}else{if((c[bo+12>>2]|0)!=(c[bo+16>>2]|0)){if(ar){bq=bo;break}else{aa=508;break L286}}if((b_[c[(c[bo>>2]|0)+36>>2]&127](bo)|0)==-1){c[e>>2]=0;aa=499;break}else{if(ar){bq=bo;break}else{aa=508;break L286}}}}while(0);if((aa|0)==499){aa=0;if(ar){aa=508;break L286}else{bq=0}}$=c[g>>2]|0;aA=c[$+12>>2]|0;if((aA|0)==(c[$+16>>2]|0)){br=(b_[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{br=a[aA]|0}aA=br<<24>>24;if((bw(aA|0)|0)==0){aa=508;break L286}if((b[(c[f>>2]|0)+(aA<<1)>>1]&2048)==0){aa=508;break L286}aA=c[o>>2]|0;if((aA|0)==(bn|0)){$=(c[V>>2]|0)!=164;as=c[h>>2]|0;aq=bn-as|0;ah=aq>>>0<2147483647>>>0?aq<<1:-1;ag=kI($?as:0,ah)|0;if((ag|0)==0){kS()}do{if($){c[h>>2]=ag;bs=ag}else{as=c[h>>2]|0;c[h>>2]=ag;if((as|0)==0){bs=ag;break}bV[c[V>>2]&511](as);bs=c[h>>2]|0}}while(0);c[V>>2]=82;ag=bs+aq|0;c[o>>2]=ag;bt=(c[h>>2]|0)+ah|0;bu=ag}else{bt=bn;bu=aA}ag=c[g>>2]|0;$=c[ag+12>>2]|0;if(($|0)==(c[ag+16>>2]|0)){ar=(b_[c[(c[ag>>2]|0)+36>>2]&127](ag)|0)&255;bv=ar;bx=c[o>>2]|0}else{bv=a[$]|0;bx=bu}c[o>>2]=bx+1;a[bx]=bv;$=(c[B>>2]|0)-1|0;c[B>>2]=$;ar=c[g>>2]|0;ag=ar+12|0;as=c[ag>>2]|0;if((as|0)==(c[ar+16>>2]|0)){aU=c[(c[ar>>2]|0)+40>>2]|0;b_[aU&127](ar)|0}else{c[ag>>2]=as+1}if(($|0)>0){bn=bt;bo=bq}else{by=bt;break}}}else{by=aj}if((c[o>>2]|0)==(c[h>>2]|0)){aa=528;break L286}else{ak=r;al=bb;am=bc;an=bd;ao=be;ap=by}break};default:{ak=r;al=D;am=X;an=W;ao=p;ap=n}}}while(0);L591:do{if((aa|0)==299){aa=0;if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=530;break L286}else{bz=ab}while(1){Z=c[g>>2]|0;do{if((Z|0)==0){bA=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){bA=Z;break}if((b_[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)==-1){c[g>>2]=0;bA=0;break}else{bA=c[g>>2]|0;break}}}while(0);Z=(bA|0)==0;do{if((bz|0)==0){aa=312}else{if((c[bz+12>>2]|0)!=(c[bz+16>>2]|0)){if(Z){bB=bz;break}else{ak=r;al=D;am=X;an=W;ao=p;ap=n;break L591}}if((b_[c[(c[bz>>2]|0)+36>>2]&127](bz)|0)==-1){c[e>>2]=0;aa=312;break}else{if(Z){bB=bz;break}else{ak=r;al=D;am=X;an=W;ao=p;ap=n;break L591}}}}while(0);if((aa|0)==312){aa=0;if(Z){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L591}else{bB=0}}aA=c[g>>2]|0;ah=c[aA+12>>2]|0;if((ah|0)==(c[aA+16>>2]|0)){bC=(b_[c[(c[aA>>2]|0)+36>>2]&127](aA)|0)&255}else{bC=a[ah]|0}ah=bC<<24>>24;if((bw(ah|0)|0)==0){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L591}if((b[(c[f>>2]|0)+(ah<<1)>>1]&8192)==0){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L591}ah=c[g>>2]|0;aA=ah+12|0;aq=c[aA>>2]|0;if((aq|0)==(c[ah+16>>2]|0)){bD=(b_[c[(c[ah>>2]|0)+40>>2]&127](ah)|0)&255}else{c[aA>>2]=aq+1;bD=a[aq]|0}dL(A,bD);bz=bB}}}while(0);aj=Y+1|0;if(aj>>>0<4>>>0){n=ap;p=ao;W=an;X=am;D=al;r=ak;Y=aj}else{ac=ao;ad=an;ae=am;af=ak;aa=530;break}}L629:do{if((aa|0)==298){c[k>>2]=c[k>>2]|4;bE=0;bF=W;bG=p}else if((aa|0)==366){c[k>>2]=c[k>>2]|4;bE=0;bF=W;bG=p}else if((aa|0)==410){c[k>>2]=c[k>>2]|4;bE=0;bF=W;bG=p}else if((aa|0)==483){c[k>>2]=c[k>>2]|4;bE=0;bF=bd;bG=be}else if((aa|0)==508){c[k>>2]=c[k>>2]|4;bE=0;bF=bd;
bG=be}else if((aa|0)==528){c[k>>2]=c[k>>2]|4;bE=0;bF=bd;bG=be}else if((aa|0)==530){L637:do{if((af|0)!=0){ak=af;am=af+1|0;an=af+8|0;ao=af+4|0;Y=1;L639:while(1){r=d[ak]|0;if((r&1|0)==0){bH=r>>>1}else{bH=c[ao>>2]|0}if(Y>>>0>=bH>>>0){break L637}r=c[g>>2]|0;do{if((r|0)==0){bI=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){bI=r;break}if((b_[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[g>>2]=0;bI=0;break}else{bI=c[g>>2]|0;break}}}while(0);r=(bI|0)==0;Z=c[e>>2]|0;do{if((Z|0)==0){aa=548}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){if(r){break}else{break L639}}if((b_[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)==-1){c[e>>2]=0;aa=548;break}else{if(r){break}else{break L639}}}}while(0);if((aa|0)==548){aa=0;if(r){break}}Z=c[g>>2]|0;al=c[Z+12>>2]|0;if((al|0)==(c[Z+16>>2]|0)){bJ=(b_[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)&255}else{bJ=a[al]|0}if((a[ak]&1)==0){bK=am}else{bK=c[an>>2]|0}if(bJ<<24>>24!=(a[bK+Y|0]|0)){break}al=Y+1|0;Z=c[g>>2]|0;D=Z+12|0;X=c[D>>2]|0;if((X|0)==(c[Z+16>>2]|0)){ap=c[(c[Z>>2]|0)+40>>2]|0;b_[ap&127](Z)|0;Y=al;continue}else{c[D>>2]=X+1;Y=al;continue}}c[k>>2]=c[k>>2]|4;bE=0;bF=ad;bG=ac;break L629}}while(0);if((ad|0)==(ae|0)){bE=1;bF=ae;bG=ac;break}c[C>>2]=0;hJ(v,ad,ae,C);if((c[C>>2]|0)==0){bE=1;bF=ad;bG=ac;break}c[k>>2]=c[k>>2]|4;bE=0;bF=ad;bG=ac}}while(0);dG(A);dG(z);dG(y);dG(x);dG(v);if((bF|0)==0){i=q;return bE|0}bV[bG&511](bF);i=q;return bE|0}function hF(a){a=a|0;var b=0;b=bd(8)|0;dm(b,a);aM(b|0,8344,26)}function hG(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+160|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=164;u=m+100|0;d_(p,h);m=p|0;v=c[m>>2]|0;if((c[6584]|0)!=-1){c[l>>2]=26336;c[l+4>>2]=14;c[l+8>>2]=0;dB(26336,l,98)}l=(c[6585]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(hE(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){a[k+1|0]=0;a[B]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){dL(k,bX[c[(c[B>>2]|0)+28>>2]&31](y,45)|0)}x=bX[c[(c[B>>2]|0)+28>>2]&31](y,48)|0;y=c[o>>2]|0;B=y-1|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((a[C]|0)==x<<24>>24){C=C+1|0}else{break}}hH(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){D=B;break}if((b_[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){E=606}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){break}else{E=608;break}}if((b_[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[z>>2]=0;E=606;break}else{if(x^(A|0)==0){break}else{E=608;break}}}}while(0);if((E|0)==606){if(x){E=608}}if((E|0)==608){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;dg(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}bV[c[t>>2]&511](A);i=d;return}}while(0);d=bd(4)|0;kl(d);aM(d|0,8328,134)}function hH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,
i=0,j=0,k=0,l=0,m=0,n=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=10;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g|0;if((e|0)==(d|0)){return b|0}if((k-j|0)>>>0<h>>>0){dO(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+1|0}else{n=c[b+8>>2]|0}m=e+(j-g)|0;g=d;d=n+j|0;while(1){a[d]=a[g]|0;l=g+1|0;if((l|0)==(e|0)){break}else{g=l;d=d+1|0}}a[n+m|0]=0;m=j+h|0;if((a[f]&1)==0){a[f]=m<<1&255;return b|0}else{c[b+4>>2]=m;return b|0}return 0}function hI(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[6702]|0)!=-1){c[p>>2]=26808;c[p+4>>2]=14;c[p+8>>2]=0;dB(26808,p,98)}p=(c[6703]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=bd(4)|0;L=K;kl(L);aM(K|0,8328,134)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=bd(4)|0;L=K;kl(L);aM(K|0,8328,134)}K=b;bW[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C&255;C=C>>8;a[L+1|0]=C&255;C=C>>8;a[L+2|0]=C&255;C=C>>8;a[L+3|0]=C&255;L=b;bW[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){a[l+1|0]=0;a[q]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}dK(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];kV(s|0,0,12);dG(r);bW[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){a[k+1|0]=0;a[r]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}dK(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];kV(u|0,0,12);dG(t);t=b;a[f]=b_[c[(c[t>>2]|0)+12>>2]&127](K)|0;a[g]=b_[c[(c[t>>2]|0)+16>>2]&127](K)|0;bW[c[(c[L>>2]|0)+20>>2]&127](v,K);t=h;if((a[t]&1)==0){a[h+1|0]=0;a[t]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}dK(h,0);c[t>>2]=c[w>>2];c[t+4>>2]=c[w+4>>2];c[t+8>>2]=c[w+8>>2];kV(w|0,0,12);dG(v);bW[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}dK(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];kV(y|0,0,12);dG(x);M=b_[c[(c[b>>2]|0)+36>>2]&127](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[6704]|0)!=-1){c[o>>2]=26816;c[o+4>>2]=14;c[o+8>>2]=0;dB(26816,o,98)}o=(c[6705]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=bd(4)|0;O=N;kl(O);aM(N|0,8328,134)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=bd(4)|0;O=N;kl(O);aM(N|0,8328,134)}N=K;bW[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C&255;C=C>>8;a[O+1|0]=C&255;C=C>>8;a[O+2|0]=C&255;C=C>>8;a[O+3|0]=C&255;O=K;bW[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){a[l+1|0]=0;a[z]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}dK(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];kV(B|0,0,12);dG(A);bW[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){a[k+1|0]=0;a[A]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}dK(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];kV(E|0,
0,12);dG(D);D=K;a[f]=b_[c[(c[D>>2]|0)+12>>2]&127](N)|0;a[g]=b_[c[(c[D>>2]|0)+16>>2]&127](N)|0;bW[c[(c[O>>2]|0)+20>>2]&127](F,N);D=h;if((a[D]&1)==0){a[h+1|0]=0;a[D]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}dK(h,0);c[D>>2]=c[G>>2];c[D+4>>2]=c[G+4>>2];c[D+8>>2]=c[G+8>>2];kV(G|0,0,12);dG(F);bW[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){a[j+1|0]=0;a[O]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}dK(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];kV(I|0,0,12);dG(H);M=b_[c[(c[K>>2]|0)+36>>2]&127](N)|0;c[m>>2]=M;i=n;return}}function hJ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;h=b;i=a[h]|0;j=i&255;if((j&1|0)==0){k=j>>>1}else{k=c[b+4>>2]|0}if((k|0)==0){return}do{if((d|0)==(e|0)){l=i}else{k=e-4|0;if(k>>>0>d>>>0){m=d;n=k}else{l=i;break}do{k=c[m>>2]|0;c[m>>2]=c[n>>2];c[n>>2]=k;m=m+4|0;n=n-4|0;}while(m>>>0<n>>>0);l=a[h]|0}}while(0);if((l&1)==0){o=g+1|0}else{o=c[b+8>>2]|0}g=l&255;if((g&1|0)==0){p=g>>>1}else{p=c[b+4>>2]|0}b=e-4|0;e=a[o]|0;g=e<<24>>24;l=e<<24>>24<1|e<<24>>24==127;L852:do{if(b>>>0>d>>>0){e=o+p|0;h=o;n=d;m=g;i=l;while(1){if(!i){if((m|0)!=(c[n>>2]|0)){break}}k=(e-h|0)>1?h+1|0:h;j=n+4|0;q=a[k]|0;r=q<<24>>24;s=q<<24>>24<1|q<<24>>24==127;if(j>>>0<b>>>0){h=k;n=j;m=r;i=s}else{t=r;u=s;break L852}}c[f>>2]=4;return}else{t=g;u=l}}while(0);if(u){return}u=c[b>>2]|0;if(!(t>>>0<u>>>0|(u|0)==0)){return}c[f>>2]=4;return}function hK(a){a=a|0;de(a|0);kN(a);return}function hL(a){a=a|0;de(a|0);return}function hM(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+600|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=d+456|0;t=d+496|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=164;w=m+400|0;d_(p,h);m=p|0;x=c[m>>2]|0;if((c[6582]|0)!=-1){c[l>>2]=26328;c[l+4>>2]=14;c[l+8>>2]=0;dB(26328,l,98)}l=(c[6583]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(hN(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+48>>2]|0;b6[D&15](A,2224,2234,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>392){H=kG((G>>2)+2|0)|0;if((H|0)!=0){I=H;J=H;break}kS();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+40|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((c[N>>2]|0)==(c[M>>2]|0)){O=N;break}else{N=N+4|0}}a[L]=a[2224+(O-H>>2)|0]|0;N=M+4|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=aH(D|0,1416,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}kH(J);break}M=bd(8)|0;dm(M,1368);aM(M|0,8344,26)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){S=b_[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{S=c[M>>2]|0}if((S|0)!=-1){R=z;break}c[A>>2]
=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){T=775}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){U=b_[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{U=c[M>>2]|0}if((U|0)==-1){c[B>>2]=0;T=775;break}else{if(A^(z|0)==0){break}else{T=777;break}}}}while(0);if((T|0)==775){if(A){T=777}}if((T|0)==777){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;dg(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}bV[c[v>>2]&511](z);i=d;return}}while(0);d=bd(4)|0;kl(d);aM(d|0,8328,134)}function hN(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0;p=i;i=i+448|0;q=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[q>>2];q=p|0;r=p+8|0;s=p+408|0;t=p+416|0;u=p+424|0;v=p+432|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;c[q>>2]=o;o=r|0;kV(w|0,0,12);D=x;E=y;F=z;G=A;kV(D|0,0,12);kV(E|0,0,12);kV(F|0,0,12);kV(G|0,0,12);hQ(f,g,s,t,u,v,x,y,z,B);g=m|0;c[n>>2]=c[g>>2];f=b|0;b=e|0;e=l;H=z+4|0;I=z+8|0;J=y+4|0;K=y+8|0;L=(h&512|0)!=0;h=x+4|0;M=x+8|0;N=A+4|0;O=A+8|0;P=s+3|0;Q=v+4|0;R=164;S=o;T=o;o=r+400|0;r=0;U=0;L936:while(1){V=c[f>>2]|0;do{if((V|0)==0){W=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){Y=b_[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{Y=c[X>>2]|0}if((Y|0)==-1){c[f>>2]=0;W=1;break}else{W=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=803}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){_=b_[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{_=c[X>>2]|0}if((_|0)==-1){c[b>>2]=0;Z=803;break}else{if(W^(V|0)==0){$=V;break}else{aa=R;ab=S;ac=T;ad=r;Z=1043;break L936}}}}while(0);if((Z|0)==803){Z=0;if(W){aa=R;ab=S;ac=T;ad=r;Z=1043;break}else{$=0}}L960:do{switch(a[s+U|0]|0){case 0:{Z=828;break};case 2:{if(!((r|0)!=0|U>>>0<2>>>0)){if((U|0)==2){ae=(a[P]|0)!=0}else{ae=0}if(!(L|ae)){af=0;ag=o;ah=T;ai=S;aj=R;break L960}}V=a[D]|0;X=(V&1)==0?h:c[M>>2]|0;L968:do{if((U|0)==0){ak=X;al=V;am=$}else{if((d[s+(U-1)|0]|0)>>>0<2>>>0){an=X;ao=V}else{ak=X;al=V;am=$;break}while(1){ap=ao&255;if((an|0)==(((ao&1)==0?h:c[M>>2]|0)+(((ap&1|0)==0?ap>>>1:c[h>>2]|0)<<2)|0)){aq=ao;break}if(!(bY[c[(c[e>>2]|0)+12>>2]&63](l,8192,c[an>>2]|0)|0)){Z=904;break}an=an+4|0;ao=a[D]|0}if((Z|0)==904){Z=0;aq=a[D]|0}ap=(aq&1)==0;ar=an-(ap?h:c[M>>2]|0)>>2;as=a[G]|0;at=as&255;au=(at&1|0)==0;L978:do{if(ar>>>0<=(au?at>>>1:c[N>>2]|0)>>>0){av=(as&1)==0;aw=(av?N:c[O>>2]|0)+((au?at>>>1:c[N>>2]|0)-ar<<2)|0;ax=(av?N:c[O>>2]
|0)+((au?at>>>1:c[N>>2]|0)<<2)|0;if((aw|0)==(ax|0)){ak=an;al=aq;am=$;break L968}else{ay=aw;az=ap?h:c[M>>2]|0}while(1){if((c[ay>>2]|0)!=(c[az>>2]|0)){break L978}aw=ay+4|0;if((aw|0)==(ax|0)){ak=an;al=aq;am=$;break L968}ay=aw;az=az+4|0}}}while(0);ak=ap?h:c[M>>2]|0;al=aq;am=$}}while(0);L985:while(1){V=al&255;if((ak|0)==(((al&1)==0?h:c[M>>2]|0)+(((V&1|0)==0?V>>>1:c[h>>2]|0)<<2)|0)){break}V=c[f>>2]|0;do{if((V|0)==0){aA=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aB=b_[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{aB=c[X>>2]|0}if((aB|0)==-1){c[f>>2]=0;aA=1;break}else{aA=(c[f>>2]|0)==0;break}}}while(0);do{if((am|0)==0){Z=925}else{V=c[am+12>>2]|0;if((V|0)==(c[am+16>>2]|0)){aC=b_[c[(c[am>>2]|0)+36>>2]&127](am)|0}else{aC=c[V>>2]|0}if((aC|0)==-1){c[b>>2]=0;Z=925;break}else{if(aA^(am|0)==0){aD=am;break}else{break L985}}}}while(0);if((Z|0)==925){Z=0;if(aA){break}else{aD=0}}V=c[f>>2]|0;ap=c[V+12>>2]|0;if((ap|0)==(c[V+16>>2]|0)){aE=b_[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{aE=c[ap>>2]|0}if((aE|0)!=(c[ak>>2]|0)){break}ap=c[f>>2]|0;V=ap+12|0;X=c[V>>2]|0;if((X|0)==(c[ap+16>>2]|0)){at=c[(c[ap>>2]|0)+40>>2]|0;b_[at&127](ap)|0}else{c[V>>2]=X+4}ak=ak+4|0;al=a[D]|0;am=aD}if(!L){af=r;ag=o;ah=T;ai=S;aj=R;break L960}X=a[D]|0;V=X&255;if((ak|0)==(((X&1)==0?h:c[M>>2]|0)+(((V&1|0)==0?V>>>1:c[h>>2]|0)<<2)|0)){af=r;ag=o;ah=T;ai=S;aj=R}else{Z=937;break L936}break};case 1:{if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=1043;break L936}V=c[f>>2]|0;X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){aF=b_[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{aF=c[X>>2]|0}if(!(bY[c[(c[e>>2]|0)+12>>2]&63](l,8192,aF)|0)){Z=827;break L936}X=c[f>>2]|0;V=X+12|0;ap=c[V>>2]|0;if((ap|0)==(c[X+16>>2]|0)){aG=b_[c[(c[X>>2]|0)+40>>2]&127](X)|0}else{c[V>>2]=ap+4;aG=c[ap>>2]|0}dV(A,aG);Z=828;break};case 4:{ap=0;V=o;X=T;at=S;au=R;L1033:while(1){ar=c[f>>2]|0;do{if((ar|0)==0){aH=1}else{as=c[ar+12>>2]|0;if((as|0)==(c[ar+16>>2]|0)){aI=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{aI=c[as>>2]|0}if((aI|0)==-1){c[f>>2]=0;aH=1;break}else{aH=(c[f>>2]|0)==0;break}}}while(0);ar=c[b>>2]|0;do{if((ar|0)==0){Z=951}else{as=c[ar+12>>2]|0;if((as|0)==(c[ar+16>>2]|0)){aJ=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{aJ=c[as>>2]|0}if((aJ|0)==-1){c[b>>2]=0;Z=951;break}else{if(aH^(ar|0)==0){break}else{break L1033}}}}while(0);if((Z|0)==951){Z=0;if(aH){break}}ar=c[f>>2]|0;as=c[ar+12>>2]|0;if((as|0)==(c[ar+16>>2]|0)){aK=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{aK=c[as>>2]|0}if(bY[c[(c[e>>2]|0)+12>>2]&63](l,2048,aK)|0){as=c[n>>2]|0;if((as|0)==(c[q>>2]|0)){hR(m,n,q);aL=c[n>>2]|0}else{aL=as}c[n>>2]=aL+4;c[aL>>2]=aK;aM=ap+1|0;aN=V;aO=X;aP=at;aQ=au}else{as=d[w]|0;if((((as&1|0)==0?as>>>1:c[Q>>2]|0)|0)==0|(ap|0)==0){break}if((aK|0)!=(c[u>>2]|0)){break}if((X|0)==(V|0)){as=(au|0)!=164;ar=X-at|0;ax=ar>>>0<2147483647>>>0?ar<<1:-1;if(as){aR=at}else{aR=0}as=kI(aR,ax)|0;aw=as;if((as|0)==0){kS()}aS=aw+(ax>>>2<<2)|0;aT=aw+(ar>>2<<2)|0;aU=aw;aV=82}else{aS=V;aT=X;aU=at;aV=au}c[aT>>2]=ap;aM=0;aN=aS;aO=aT+4|0;aP=aU;aQ=aV}aw=c[f>>2]|0;ar=aw+12|0;ax=c[ar>>2]|0;if((ax|0)==(c[aw+16>>2]|0)){as=c[(c[aw>>2]
|0)+40>>2]|0;b_[as&127](aw)|0;ap=aM;V=aN;X=aO;at=aP;au=aQ;continue}else{c[ar>>2]=ax+4;ap=aM;V=aN;X=aO;at=aP;au=aQ;continue}}if((at|0)==(X|0)|(ap|0)==0){aW=V;aX=X;aY=at;aZ=au}else{if((X|0)==(V|0)){ax=(au|0)!=164;ar=X-at|0;aw=ar>>>0<2147483647>>>0?ar<<1:-1;if(ax){a_=at}else{a_=0}ax=kI(a_,aw)|0;as=ax;if((ax|0)==0){kS()}a$=as+(aw>>>2<<2)|0;a0=as+(ar>>2<<2)|0;a1=as;a2=82}else{a$=V;a0=X;a1=at;a2=au}c[a0>>2]=ap;aW=a$;aX=a0+4|0;aY=a1;aZ=a2}as=c[B>>2]|0;if((as|0)>0){ar=c[f>>2]|0;do{if((ar|0)==0){a3=1}else{aw=c[ar+12>>2]|0;if((aw|0)==(c[ar+16>>2]|0)){a4=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{a4=c[aw>>2]|0}if((a4|0)==-1){c[f>>2]=0;a3=1;break}else{a3=(c[f>>2]|0)==0;break}}}while(0);ar=c[b>>2]|0;do{if((ar|0)==0){Z=1e3}else{ap=c[ar+12>>2]|0;if((ap|0)==(c[ar+16>>2]|0)){a5=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{a5=c[ap>>2]|0}if((a5|0)==-1){c[b>>2]=0;Z=1e3;break}else{if(a3^(ar|0)==0){a6=ar;break}else{Z=1006;break L936}}}}while(0);if((Z|0)==1e3){Z=0;if(a3){Z=1006;break L936}else{a6=0}}ar=c[f>>2]|0;ap=c[ar+12>>2]|0;if((ap|0)==(c[ar+16>>2]|0)){a7=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{a7=c[ap>>2]|0}if((a7|0)!=(c[t>>2]|0)){Z=1006;break L936}ap=c[f>>2]|0;ar=ap+12|0;au=c[ar>>2]|0;if((au|0)==(c[ap+16>>2]|0)){at=c[(c[ap>>2]|0)+40>>2]|0;b_[at&127](ap)|0;a8=a6;a9=as}else{c[ar>>2]=au+4;a8=a6;a9=as}while(1){au=c[f>>2]|0;do{if((au|0)==0){ba=1}else{ar=c[au+12>>2]|0;if((ar|0)==(c[au+16>>2]|0)){bb=b_[c[(c[au>>2]|0)+36>>2]&127](au)|0}else{bb=c[ar>>2]|0}if((bb|0)==-1){c[f>>2]=0;ba=1;break}else{ba=(c[f>>2]|0)==0;break}}}while(0);do{if((a8|0)==0){Z=1023}else{au=c[a8+12>>2]|0;if((au|0)==(c[a8+16>>2]|0)){bc=b_[c[(c[a8>>2]|0)+36>>2]&127](a8)|0}else{bc=c[au>>2]|0}if((bc|0)==-1){c[b>>2]=0;Z=1023;break}else{if(ba^(a8|0)==0){bd=a8;break}else{Z=1030;break L936}}}}while(0);if((Z|0)==1023){Z=0;if(ba){Z=1030;break L936}else{bd=0}}au=c[f>>2]|0;ar=c[au+12>>2]|0;if((ar|0)==(c[au+16>>2]|0)){be=b_[c[(c[au>>2]|0)+36>>2]&127](au)|0}else{be=c[ar>>2]|0}if(!(bY[c[(c[e>>2]|0)+12>>2]&63](l,2048,be)|0)){Z=1030;break L936}if((c[n>>2]|0)==(c[q>>2]|0)){hR(m,n,q)}ar=c[f>>2]|0;au=c[ar+12>>2]|0;if((au|0)==(c[ar+16>>2]|0)){bf=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{bf=c[au>>2]|0}au=c[n>>2]|0;c[n>>2]=au+4;c[au>>2]=bf;au=a9-1|0;c[B>>2]=au;ar=c[f>>2]|0;ap=ar+12|0;at=c[ap>>2]|0;if((at|0)==(c[ar+16>>2]|0)){X=c[(c[ar>>2]|0)+40>>2]|0;b_[X&127](ar)|0}else{c[ap>>2]=at+4}if((au|0)>0){a8=bd;a9=au}else{break}}}if((c[n>>2]|0)==(c[g>>2]|0)){Z=1041;break L936}else{af=r;ag=aW;ah=aX;ai=aY;aj=aZ}break};case 3:{as=a[E]|0;au=as&255;at=(au&1|0)==0;ap=a[F]|0;ar=ap&255;X=(ar&1|0)==0;if(((at?au>>>1:c[J>>2]|0)|0)==(-(X?ar>>>1:c[H>>2]|0)|0)){af=r;ag=o;ah=T;ai=S;aj=R;break L960}do{if(((at?au>>>1:c[J>>2]|0)|0)!=0){if(((X?ar>>>1:c[H>>2]|0)|0)==0){break}V=c[f>>2]|0;aw=c[V+12>>2]|0;if((aw|0)==(c[V+16>>2]|0)){ax=b_[c[(c[V>>2]|0)+36>>2]&127](V)|0;bg=ax;bh=a[E]|0}else{bg=c[aw>>2]|0;bh=as}aw=c[f>>2]|0;ax=aw+12|0;V=c[ax>>2]|0;av=(V|0)==(c[aw+16>>2]|0);if((bg|0)==(c[((bh&1)==0?J:c[K>>2]|0)>>2]|0)){if(av){bi=c[(c[aw>>2]|0)+40>>2]|0;b_[bi&127](
aw)|0}else{c[ax>>2]=V+4}ax=d[E]|0;af=((ax&1|0)==0?ax>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;ag=o;ah=T;ai=S;aj=R;break L960}if(av){bj=b_[c[(c[aw>>2]|0)+36>>2]&127](aw)|0}else{bj=c[V>>2]|0}if((bj|0)!=(c[((a[F]&1)==0?H:c[I>>2]|0)>>2]|0)){Z=893;break L936}V=c[f>>2]|0;aw=V+12|0;av=c[aw>>2]|0;if((av|0)==(c[V+16>>2]|0)){ax=c[(c[V>>2]|0)+40>>2]|0;b_[ax&127](V)|0}else{c[aw>>2]=av+4}a[k]=1;av=d[F]|0;af=((av&1|0)==0?av>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;ag=o;ah=T;ai=S;aj=R;break L960}}while(0);ar=c[f>>2]|0;X=c[ar+12>>2]|0;av=(X|0)==(c[ar+16>>2]|0);if(((at?au>>>1:c[J>>2]|0)|0)==0){if(av){aw=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0;bk=aw;bl=a[F]|0}else{bk=c[X>>2]|0;bl=ap}if((bk|0)!=(c[((bl&1)==0?H:c[I>>2]|0)>>2]|0)){af=r;ag=o;ah=T;ai=S;aj=R;break L960}aw=c[f>>2]|0;V=aw+12|0;ax=c[V>>2]|0;if((ax|0)==(c[aw+16>>2]|0)){bi=c[(c[aw>>2]|0)+40>>2]|0;b_[bi&127](aw)|0}else{c[V>>2]=ax+4}a[k]=1;ax=d[F]|0;af=((ax&1|0)==0?ax>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;ag=o;ah=T;ai=S;aj=R;break L960}if(av){av=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0;bm=av;bn=a[E]|0}else{bm=c[X>>2]|0;bn=as}if((bm|0)!=(c[((bn&1)==0?J:c[K>>2]|0)>>2]|0)){a[k]=1;af=r;ag=o;ah=T;ai=S;aj=R;break L960}X=c[f>>2]|0;av=X+12|0;ar=c[av>>2]|0;if((ar|0)==(c[X+16>>2]|0)){ax=c[(c[X>>2]|0)+40>>2]|0;b_[ax&127](X)|0}else{c[av>>2]=ar+4}ar=d[E]|0;af=((ar&1|0)==0?ar>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;ag=o;ah=T;ai=S;aj=R;break};default:{af=r;ag=o;ah=T;ai=S;aj=R}}}while(0);L1229:do{if((Z|0)==828){Z=0;if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=1043;break L936}else{bo=$}while(1){ar=c[f>>2]|0;do{if((ar|0)==0){bp=1}else{av=c[ar+12>>2]|0;if((av|0)==(c[ar+16>>2]|0)){bq=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{bq=c[av>>2]|0}if((bq|0)==-1){c[f>>2]=0;bp=1;break}else{bp=(c[f>>2]|0)==0;break}}}while(0);do{if((bo|0)==0){Z=842}else{ar=c[bo+12>>2]|0;if((ar|0)==(c[bo+16>>2]|0)){br=b_[c[(c[bo>>2]|0)+36>>2]&127](bo)|0}else{br=c[ar>>2]|0}if((br|0)==-1){c[b>>2]=0;Z=842;break}else{if(bp^(bo|0)==0){bs=bo;break}else{af=r;ag=o;ah=T;ai=S;aj=R;break L1229}}}}while(0);if((Z|0)==842){Z=0;if(bp){af=r;ag=o;ah=T;ai=S;aj=R;break L1229}else{bs=0}}ar=c[f>>2]|0;av=c[ar+12>>2]|0;if((av|0)==(c[ar+16>>2]|0)){bt=b_[c[(c[ar>>2]|0)+36>>2]&127](ar)|0}else{bt=c[av>>2]|0}if(!(bY[c[(c[e>>2]|0)+12>>2]&63](l,8192,bt)|0)){af=r;ag=o;ah=T;ai=S;aj=R;break L1229}av=c[f>>2]|0;ar=av+12|0;X=c[ar>>2]|0;if((X|0)==(c[av+16>>2]|0)){bu=b_[c[(c[av>>2]|0)+40>>2]&127](av)|0}else{c[ar>>2]=X+4;bu=c[X>>2]|0}dV(A,bu);bo=bs}}}while(0);as=U+1|0;if(as>>>0<4>>>0){R=aj;S=ai;T=ah;o=ag;r=af;U=as}else{aa=aj;ab=ai;ac=ah;ad=af;Z=1043;break}}L1266:do{if((Z|0)==827){c[j>>2]=c[j>>2]|4;bv=0;bw=S;bx=R}else if((Z|0)==1030){c[j>>2]=c[j>>2]|4;bv=0;bw=aY;bx=aZ}else if((Z|0)==1041){c[j>>2]=c[j>>2]|4;bv=0;bw=aY;bx=aZ}else if((Z|0)==1043){L1271:do{if((ad|0)!=0){af=ad;ah=ad+4|0;ai=ad+8|0;aj=1;L1273:while(1){U=d[af]|0;if((U&1|0)==0){by=U>>>1}else{by=c[ah>>2]|0}if(aj>>>0>=by>>>0){break L1271}U=c[f>>2]|0;do{if((U|0)==0){bz=1}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bA=b_[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{bA=c[r>>2]|0}if((bA|0)==-1){c[f>>2]=0;bz=1;break}
else{bz=(c[f>>2]|0)==0;break}}}while(0);U=c[b>>2]|0;do{if((U|0)==0){Z=1062}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bB=b_[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{bB=c[r>>2]|0}if((bB|0)==-1){c[b>>2]=0;Z=1062;break}else{if(bz^(U|0)==0){break}else{break L1273}}}}while(0);if((Z|0)==1062){Z=0;if(bz){break}}U=c[f>>2]|0;r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bC=b_[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{bC=c[r>>2]|0}if((a[af]&1)==0){bD=ah}else{bD=c[ai>>2]|0}if((bC|0)!=(c[bD+(aj<<2)>>2]|0)){break}r=aj+1|0;U=c[f>>2]|0;ag=U+12|0;o=c[ag>>2]|0;if((o|0)==(c[U+16>>2]|0)){T=c[(c[U>>2]|0)+40>>2]|0;b_[T&127](U)|0;aj=r;continue}else{c[ag>>2]=o+4;aj=r;continue}}c[j>>2]=c[j>>2]|4;bv=0;bw=ab;bx=aa;break L1266}}while(0);if((ab|0)==(ac|0)){bv=1;bw=ac;bx=aa;break}c[C>>2]=0;hJ(v,ab,ac,C);if((c[C>>2]|0)==0){bv=1;bw=ab;bx=aa;break}c[j>>2]=c[j>>2]|4;bv=0;bw=ab;bx=aa}else if((Z|0)==893){c[j>>2]=c[j>>2]|4;bv=0;bw=S;bx=R}else if((Z|0)==1006){c[j>>2]=c[j>>2]|4;bv=0;bw=aY;bx=aZ}else if((Z|0)==937){c[j>>2]=c[j>>2]|4;bv=0;bw=S;bx=R}}while(0);dR(A);dR(z);dR(y);dR(x);dG(v);if((bw|0)==0){i=p;return bv|0}bV[bx&511](bw);i=p;return bv|0}function hO(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+456|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=164;u=m+400|0;d_(p,h);m=p|0;v=c[m>>2]|0;if((c[6582]|0)!=-1){c[l>>2]=26328;c[l+4>>2]=14;c[l+8>>2]=0;dB(26328,l,98)}l=(c[6583]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(hN(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){c[k+4>>2]=0;a[B]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){dV(k,bX[c[(c[B>>2]|0)+44>>2]&31](y,45)|0)}x=bX[c[(c[B>>2]|0)+44>>2]&31](y,48)|0;y=c[o>>2]|0;B=y-4|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((c[C>>2]|0)==(x|0)){C=C+4|0}else{break}}hP(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{E=c[B+12>>2]|0;if((E|0)==(c[B+16>>2]|0)){F=b_[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{F=c[E>>2]|0}if((F|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){G=1117}else{B=c[A+12>>2]|0;if((B|0)==(c[A+16>>2]|0)){H=b_[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{H=c[B>>2]|0}if((H|0)==-1){c[z>>2]=0;G=1117;break}else{if(x^(A|0)==0){break}else{G=1119;break}}}}while(0);if((G|0)==1117){if(x){G=1119}}if((G|0)==1119){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;dg(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}bV[c[t>>2]&511](A);i=d;return}}while(0);d=bd(4)|0;kl(d);aM(d|0,8328,134)}function hP(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=1;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g>>2;if((h|0)==0){return b|0}if((k-j|0)>>>0<h>>>0){dX(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{
m=l}if((m&1)==0){n=b+4|0}else{n=c[b+8>>2]|0}m=n+(j<<2)|0;if((d|0)==(e|0)){o=m}else{l=j+((e-4+(-g|0)|0)>>>2)+1|0;g=d;d=m;while(1){c[d>>2]=c[g>>2];m=g+4|0;if((m|0)==(e|0)){break}else{g=m;d=d+4|0}}o=n+(l<<2)|0}c[o>>2]=0;o=j+h|0;if((a[f]&1)==0){a[f]=o<<1&255;return b|0}else{c[b+4>>2]=o;return b|0}return 0}function hQ(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[6698]|0)!=-1){c[p>>2]=26792;c[p+4>>2]=14;c[p+8>>2]=0;dB(26792,p,98)}p=(c[6699]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=bd(4)|0;L=K;kl(L);aM(K|0,8328,134)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=bd(4)|0;L=K;kl(L);aM(K|0,8328,134)}K=b;bW[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C&255;C=C>>8;a[L+1|0]=C&255;C=C>>8;a[L+2|0]=C&255;C=C>>8;a[L+3|0]=C&255;L=b;bW[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){c[l+4>>2]=0;a[q]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}dU(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];kV(s|0,0,12);dR(r);bW[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){c[k+4>>2]=0;a[r]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}dU(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];kV(u|0,0,12);dR(t);t=b;c[f>>2]=b_[c[(c[t>>2]|0)+12>>2]&127](K)|0;c[g>>2]=b_[c[(c[t>>2]|0)+16>>2]&127](K)|0;bW[c[(c[b>>2]|0)+20>>2]&127](v,K);b=h;if((a[b]&1)==0){a[h+1|0]=0;a[b]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}dK(h,0);c[b>>2]=c[w>>2];c[b+4>>2]=c[w+4>>2];c[b+8>>2]=c[w+8>>2];kV(w|0,0,12);dG(v);bW[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){c[j+4>>2]=0;a[L]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}dU(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];kV(y|0,0,12);dR(x);M=b_[c[(c[t>>2]|0)+36>>2]&127](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[6700]|0)!=-1){c[o>>2]=26800;c[o+4>>2]=14;c[o+8>>2]=0;dB(26800,o,98)}o=(c[6701]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=bd(4)|0;O=N;kl(O);aM(N|0,8328,134)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=bd(4)|0;O=N;kl(O);aM(N|0,8328,134)}N=K;bW[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C&255;C=C>>8;a[O+1|0]=C&255;C=C>>8;a[O+2|0]=C&255;C=C>>8;a[O+3|0]=C&255;O=K;bW[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){c[l+4>>2]=0;a[z]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}dU(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];kV(B|0,0,12);dR(A);bW[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){c[k+4>>2]=0;a[A]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}dU(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];kV(E|0,0,12);dR(D);D=K;c[f>>2]=b_[c[(c[D>>2]|0)+12>>2]&127](N)|0;c[g>>2]=b_[c[(c[D>>2]|0)+16>>2]&127](N)|0;bW[c[(c[K>>2]|0)+20>>2]&127](F,N);K=h;if((a[K]&1)==0){a[h+1|0]
=0;a[K]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}dK(h,0);c[K>>2]=c[G>>2];c[K+4>>2]=c[G+4>>2];c[K+8>>2]=c[G+8>>2];kV(G|0,0,12);dG(F);bW[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){c[j+4>>2]=0;a[O]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}dU(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];kV(I|0,0,12);dR(H);M=b_[c[(c[D>>2]|0)+36>>2]&127](N)|0;c[m>>2]=M;i=n;return}}function hR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a+4|0;f=(c[e>>2]|0)!=164;g=a|0;a=c[g>>2]|0;h=a;i=(c[d>>2]|0)-h|0;j=i>>>0<2147483647>>>0?i<<1:-1;i=(c[b>>2]|0)-h>>2;if(f){k=a}else{k=0}a=kI(k,j)|0;k=a;if((a|0)==0){kS()}do{if(f){c[g>>2]=k;l=k}else{a=c[g>>2]|0;c[g>>2]=k;if((a|0)==0){l=k;break}bV[c[e>>2]&511](a);l=c[g>>2]|0}}while(0);c[e>>2]=82;c[b>>2]=l+(i<<2);c[d>>2]=(c[g>>2]|0)+(j>>>2<<2);return}function hS(a){a=a|0;de(a|0);kN(a);return}function hT(a){a=a|0;de(a|0);return}function hU(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;e=i;i=i+280|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+232|0;p=e+240|0;q=e+248|0;r=e+256|0;s=e+264|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+100|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=aJ(D|0,100,1360,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);G=f4(n,c[6226]|0,1360,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){kS();I=c[n>>2]|0}else{I=H}H=kG(G)|0;if((H|0)!=0){J=H;K=G;L=I;M=H;break}kS();J=0;K=G;L=I;M=0}else{J=E;K=F;L=0;M=0}}while(0);d_(o,j);F=o|0;E=c[F>>2]|0;if((c[6584]|0)!=-1){c[m>>2]=26336;c[m+4>>2]=14;c[m+8>>2]=0;dB(26336,m,98)}m=(c[6585]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}G=D;H=c[n>>2]|0;N=H+K|0;O=c[(c[D>>2]|0)+32>>2]|0;b6[O&15](G,H,N,J)|0;if((K|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}kV(t|0,0,12);kV(v|0,0,12);kV(x|0,0,12);hV(g,P,o,p,q,r,s,u,w,y);N=z|0;H=c[y>>2]|0;if((K|0)>(H|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(K-H<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+H|0;do{if(O>>>0>100>>>0){D=kG(O)|0;if((D|0)!=0){V=D;W=D;break}kS();V=0;W=0}else{V=N;W=0}}while(0);hW(V,A,B,c[j+4>>2]|0,J,J+K|0,G,P,p,a[q]|0,a[r]|0,s,u,w,H);c[C>>2]=c[f>>2];cu(b,C,V,c[A>>2]|0,c[B>>2]|0,j,k);if((W|0)!=0){kH(W)}dG(w);dG(u);dG(s);N=c[F>>2]|0;dg(N)|0;if((M|0)!=0){kH(M)}if((L|0)==0){i=e;return}kH(L);i=e;return}}while(0);e=bd(4)|0;kl(e);aM(e|0,8328,134)}function hV(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,
M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[6702]|0)!=-1){c[p>>2]=26808;c[p+4>>2]=14;c[p+8>>2]=0;dB(26808,p,98)}p=(c[6703]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=bd(4)|0;R=Q;kl(R);aM(Q|0,8328,134)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=bd(4)|0;R=Q;kl(R);aM(Q|0,8328,134)}Q=e;R=c[e>>2]|0;if(d){bW[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C&255;C=C>>8;a[r+1|0]=C&255;C=C>>8;a[r+2|0]=C&255;C=C>>8;a[r+3|0]=C&255;bW[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){a[l+1|0]=0;a[r]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}dK(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];kV(t|0,0,12);dG(s)}else{bW[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C&255;C=C>>8;a[v+1|0]=C&255;C=C>>8;a[v+2|0]=C&255;C=C>>8;a[v+3|0]=C&255;bW[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){a[l+1|0]=0;a[v]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}dK(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];kV(x|0,0,12);dG(w)}w=e;a[g]=b_[c[(c[w>>2]|0)+12>>2]&127](Q)|0;a[h]=b_[c[(c[w>>2]|0)+16>>2]&127](Q)|0;w=e;bW[c[(c[w>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}dK(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];kV(z|0,0,12);dG(y);bW[c[(c[w>>2]|0)+24>>2]&127](A,Q);w=k;if((a[w]&1)==0){a[k+1|0]=0;a[w]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}dK(k,0);c[w>>2]=c[B>>2];c[w+4>>2]=c[B+4>>2];c[w+8>>2]=c[B+8>>2];kV(B|0,0,12);dG(A);S=b_[c[(c[e>>2]|0)+36>>2]&127](Q)|0;c[m>>2]=S;i=n;return}else{if((c[6704]|0)!=-1){c[o>>2]=26816;c[o+4>>2]=14;c[o+8>>2]=0;dB(26816,o,98)}o=(c[6705]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=bd(4)|0;U=T;kl(U);aM(T|0,8328,134)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=bd(4)|0;U=T;kl(U);aM(T|0,8328,134)}T=P;U=c[P>>2]|0;if(d){bW[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C&255;C=C>>8;a[E+1|0]=C&255;C=C>>8;a[E+2|0]=C&255;C=C>>8;a[E+3|0]=C&255;bW[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){a[l+1|0]=0;a[E]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}dK(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];kV(G|0,0,12);dG(F)}else{bW[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C&255;C=C>>8;a[I+1|0]=C&255;C=C>>8;a[I+2|0]=C&255;C=C>>8;a[I+3|0]=C&255;bW[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){a[l+1|0]=0;a[I]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}dK(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];kV(K|0,0,12);dG(J)}J=P;a[g]=b_[c[(c[J>>2]|0)+12>>2]&127](T)|0;a[h]=b_[c[(c[J>>2]|0)+16>>2]&127](T)|0;J=P;bW[c[(c[J>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}dK(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];kV(M|0,0,12);dG(L);bW[c[(c[J>>2]|0)+24>>2]&127](N,T);J=k;if((a[J]&1)
==0){a[k+1|0]=0;a[J]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}dK(k,0);c[J>>2]=c[O>>2];c[J+4>>2]=c[O+4>>2];c[J+8>>2]=c[O+8>>2];kV(O|0,0,12);dG(N);S=b_[c[(c[P>>2]|0)+36>>2]&127](T)|0;c[m>>2]=S;i=n;return}}function hW(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=j+8|0;B=(r|0)>0;C=o;D=o+1|0;E=o+8|0;F=o+4|0;o=-r|0;G=h;h=0;while(1){L1626:do{switch(a[l+h|0]|0){case 0:{c[e>>2]=c[f>>2];H=G;break};case 1:{c[e>>2]=c[f>>2];I=bX[c[(c[s>>2]|0)+28>>2]&31](j,32)|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=I;H=G;break};case 3:{I=a[t]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[w>>2]|0}if((K|0)==0){H=G;break L1626}if((I&1)==0){L=u}else{L=c[v>>2]|0}I=a[L]|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=I;H=G;break};case 2:{I=a[q]|0;J=I&255;M=(J&1|0)==0;if(M){N=J>>>1}else{N=c[z>>2]|0}if((N|0)==0|x){H=G;break L1626}if((I&1)==0){O=y;P=y}else{I=c[A>>2]|0;O=I;P=I}if(M){Q=J>>>1}else{Q=c[z>>2]|0}J=O+Q|0;M=c[f>>2]|0;if((P|0)==(J|0)){R=M}else{I=P;S=M;while(1){a[S]=a[I]|0;M=I+1|0;T=S+1|0;if((M|0)==(J|0)){R=T;break}else{I=M;S=T}}}c[f>>2]=R;H=G;break};case 4:{S=c[f>>2]|0;I=k?G+1|0:G;J=I;while(1){if(J>>>0>=i>>>0){break}T=a[J]|0;if(T<<24>>24<0){break}if((b[(c[p>>2]|0)+(T<<24>>24<<1)>>1]&2048)==0){break}else{J=J+1|0}}T=J;if(B){if(J>>>0>I>>>0){M=I+(-T|0)|0;T=M>>>0<o>>>0?o:M;M=T+r|0;U=J;V=r;W=S;while(1){X=U-1|0;Y=a[X]|0;c[f>>2]=W+1;a[W]=Y;Y=V-1|0;Z=(Y|0)>0;if(!(X>>>0>I>>>0&Z)){break}U=X;V=Y;W=c[f>>2]|0}W=J+T|0;if(Z){_=M;$=W;aa=1390}else{ab=0;ac=M;ad=W}}else{_=r;$=J;aa=1390}if((aa|0)==1390){aa=0;ab=bX[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;ac=_;ad=$}W=c[f>>2]|0;c[f>>2]=W+1;if((ac|0)>0){V=ac;U=W;while(1){a[U]=ab;Y=V-1|0;X=c[f>>2]|0;c[f>>2]=X+1;if((Y|0)>0){V=Y;U=X}else{ae=X;break}}}else{ae=W}a[ae]=m;af=ad}else{af=J}if((af|0)==(I|0)){U=bX[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;V=c[f>>2]|0;c[f>>2]=V+1;a[V]=U}else{U=a[C]|0;V=U&255;if((V&1|0)==0){ag=V>>>1}else{ag=c[F>>2]|0}if((ag|0)==0){ah=af;ai=0;aj=0;ak=-1}else{if((U&1)==0){al=D}else{al=c[E>>2]|0}ah=af;ai=0;aj=0;ak=a[al]|0}while(1){do{if((ai|0)==(ak|0)){U=c[f>>2]|0;c[f>>2]=U+1;a[U]=n;U=aj+1|0;V=a[C]|0;M=V&255;if((M&1|0)==0){am=M>>>1}else{am=c[F>>2]|0}if(U>>>0>=am>>>0){an=ak;ao=U;ap=0;break}M=(V&1)==0;if(M){aq=D}else{aq=c[E>>2]|0}if((a[aq+U|0]|0)==127){an=-1;ao=U;ap=0;break}if(M){ar=D}else{ar=c[E>>2]|0}an=a[ar+U|0]|0;ao=U;ap=0}else{an=ak;ao=aj;ap=ai}}while(0);U=ah-1|0;M=a[U]|0;V=c[f>>2]|0;c[f>>2]=V+1;a[V]=M;if((U|0)==(I|0)){break}else{ah=U;ai=ap+1|0;aj=ao;ak=an}}}J=c[f>>2]|0;if((S|0)==(J|0)){H=I;break L1626}W=J-1|0;if(S>>>0<W>>>0){as=S;at=W}else{H=I;break L1626}while(1){W=a[as]|0;a[as]=a[at]|0;a[at]=W;W=as+1|0;J=at-1|0;if(W>>>0<J>>>0){as=W;at=J}else{H=I;
break}}break};default:{H=G}}}while(0);I=h+1|0;if(I>>>0<4>>>0){G=H;h=I}else{break}}h=a[t]|0;t=h&255;H=(t&1|0)==0;if(H){au=t>>>1}else{au=c[w>>2]|0}if(au>>>0>1>>>0){if((h&1)==0){av=u;aw=u}else{u=c[v>>2]|0;av=u;aw=u}if(H){ax=t>>>1}else{ax=c[w>>2]|0}w=av+ax|0;ax=c[f>>2]|0;av=aw+1|0;if((av|0)==(w|0)){ay=ax}else{aw=ax;ax=av;while(1){a[aw]=a[ax]|0;av=aw+1|0;t=ax+1|0;if((t|0)==(w|0)){ay=av;break}else{aw=av;ax=t}}}c[f>>2]=ay}ay=g&176;if((ay|0)==32){c[e>>2]=c[f>>2];return}else if((ay|0)==16){return}else{c[e>>2]=d;return}}function hX(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+100|0;i=i+7&-8;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;d_(m,h);B=m|0;C=c[B>>2]|0;if((c[6584]|0)!=-1){c[l>>2]=26336;c[l+4>>2]=14;c[l+8>>2]=0;dB(26336,l,98)}l=(c[6585]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=k;I=a[H]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[k+4>>2]|0}if((K|0)==0){L=0}else{if((I&1)==0){M=G+1|0}else{M=c[k+8>>2]|0}I=a[M]|0;L=I<<24>>24==(bX[c[(c[E>>2]|0)+28>>2]&31](F,45)|0)<<24>>24}kV(r|0,0,12);kV(t|0,0,12);kV(v|0,0,12);hV(g,L,m,n,o,p,q,s,u,w);E=x|0;I=a[H]|0;J=I&255;N=(J&1|0)==0;if(N){O=J>>>1}else{O=c[k+4>>2]|0}P=c[w>>2]|0;if((O|0)>(P|0)){if(N){Q=J>>>1}else{Q=c[k+4>>2]|0}J=d[v]|0;if((J&1|0)==0){R=J>>>1}else{R=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){S=J>>>1}else{S=c[s+4>>2]|0}T=(Q-P<<1|1)+R+S|0}else{J=d[v]|0;if((J&1|0)==0){U=J>>>1}else{U=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){V=J>>>1}else{V=c[s+4>>2]|0}T=U+2+V|0}J=T+P|0;do{if(J>>>0>100>>>0){N=kG(J)|0;if((N|0)!=0){W=N;X=N;Y=I;break}kS();W=0;X=0;Y=a[H]|0}else{W=E;X=0;Y=I}}while(0);if((Y&1)==0){Z=G+1|0;_=G+1|0}else{I=c[k+8>>2]|0;Z=I;_=I}I=Y&255;if((I&1|0)==0){$=I>>>1}else{$=c[k+4>>2]|0}hW(W,y,z,c[h+4>>2]|0,_,Z+$|0,F,L,n,a[o]|0,a[p]|0,q,s,u,P);c[A>>2]=c[f>>2];cu(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){dG(u);dG(s);dG(q);aa=c[B>>2]|0;ab=aa|0;ac=dg(ab)|0;i=e;return}kH(X);dG(u);dG(s);dG(q);aa=c[B>>2]|0;ab=aa|0;ac=dg(ab)|0;i=e;return}}while(0);e=bd(4)|0;kl(e);aM(e|0,8328,134)}function hY(a){a=a|0;de(a|0);kN(a);return}function hZ(a){a=a|0;de(a|0);return}function h_(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+576|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+528|0;p=e+536|0;q=e+544|0;r=e+552|0;s=e+560|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+400|0;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;
E=e+128|0;F=aJ(D|0,100,1360,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);G=f4(n,c[6226]|0,1360,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){kS();I=c[n>>2]|0}else{I=H}H=kG(G<<2)|0;J=H;if((H|0)!=0){K=J;L=G;M=I;N=J;break}kS();K=J;L=G;M=I;N=J}else{K=E;L=F;M=0;N=0}}while(0);d_(o,j);F=o|0;E=c[F>>2]|0;if((c[6582]|0)!=-1){c[m>>2]=26328;c[m+4>>2]=14;c[m+8>>2]=0;dB(26328,m,98)}m=(c[6583]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}J=D;G=c[n>>2]|0;H=G+L|0;O=c[(c[D>>2]|0)+48>>2]|0;b6[O&15](J,G,H,K)|0;if((L|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}kV(t|0,0,12);kV(v|0,0,12);kV(x|0,0,12);h$(g,P,o,p,q,r,s,u,w,y);H=z|0;G=c[y>>2]|0;if((L|0)>(G|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(L-G<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+G|0;do{if(O>>>0>100>>>0){D=kG(O<<2)|0;V=D;if((D|0)!=0){W=V;X=V;break}kS();W=V;X=V}else{W=H;X=0}}while(0);h0(W,A,B,c[j+4>>2]|0,K,K+(L<<2)|0,J,P,p,c[q>>2]|0,c[r>>2]|0,s,u,w,G);c[C>>2]=c[f>>2];gd(b,C,W,c[A>>2]|0,c[B>>2]|0,j,k);if((X|0)!=0){kH(X)}dR(w);dR(u);dG(s);H=c[F>>2]|0;dg(H)|0;if((N|0)!=0){kH(N)}if((M|0)==0){i=e;return}kH(M);i=e;return}}while(0);e=bd(4)|0;kl(e);aM(e|0,8328,134)}function h$(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[6698]|0)!=-1){c[p>>2]=26792;c[p+4>>2]=14;c[p+8>>2]=0;dB(26792,p,98)}p=(c[6699]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=bd(4)|0;R=Q;kl(R);aM(Q|0,8328,134)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=bd(4)|0;R=Q;kl(R);aM(Q|0,8328,134)}Q=e;R=c[e>>2]|0;if(d){bW[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C&255;C=C>>8;a[r+1|0]=C&255;C=C>>8;a[r+2|0]=C&255;C=C>>8;a[r+3|0]=C&255;bW[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){c[l+4>>2]=0;a[r]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}dU(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];kV(t|0,0,12);dR(s)}else{bW[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C&255;C=C>>8;a[v+1|0]=C&255;C=C>>8;a[v+2|0]=C&255;C=C>>8;a[v+3|0]=C&255;bW[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){c[l+4>>2]=0;a[v]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}dU(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];kV(x|0,0,12);dR(w)}w=e;c[g>>2]=b_[c[(c[w>>2]|0)+12>>2]&127](Q)|0;c[h>>2]=b_[c[(c[w>>2]|0)+16>>2]&127](Q)|0;bW[c[(c[e>>2]|0)
+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}dK(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];kV(z|0,0,12);dG(y);bW[c[(c[e>>2]|0)+24>>2]&127](A,Q);e=k;if((a[e]&1)==0){c[k+4>>2]=0;a[e]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}dU(k,0);c[e>>2]=c[B>>2];c[e+4>>2]=c[B+4>>2];c[e+8>>2]=c[B+8>>2];kV(B|0,0,12);dR(A);S=b_[c[(c[w>>2]|0)+36>>2]&127](Q)|0;c[m>>2]=S;i=n;return}else{if((c[6700]|0)!=-1){c[o>>2]=26800;c[o+4>>2]=14;c[o+8>>2]=0;dB(26800,o,98)}o=(c[6701]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=bd(4)|0;U=T;kl(U);aM(T|0,8328,134)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=bd(4)|0;U=T;kl(U);aM(T|0,8328,134)}T=P;U=c[P>>2]|0;if(d){bW[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C&255;C=C>>8;a[E+1|0]=C&255;C=C>>8;a[E+2|0]=C&255;C=C>>8;a[E+3|0]=C&255;bW[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){c[l+4>>2]=0;a[E]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}dU(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];kV(G|0,0,12);dR(F)}else{bW[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C&255;C=C>>8;a[I+1|0]=C&255;C=C>>8;a[I+2|0]=C&255;C=C>>8;a[I+3|0]=C&255;bW[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){c[l+4>>2]=0;a[I]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}dU(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];kV(K|0,0,12);dR(J)}J=P;c[g>>2]=b_[c[(c[J>>2]|0)+12>>2]&127](T)|0;c[h>>2]=b_[c[(c[J>>2]|0)+16>>2]&127](T)|0;bW[c[(c[P>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}dK(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];kV(M|0,0,12);dG(L);bW[c[(c[P>>2]|0)+24>>2]&127](N,T);P=k;if((a[P]&1)==0){c[k+4>>2]=0;a[P]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}dU(k,0);c[P>>2]=c[O>>2];c[P+4>>2]=c[O+4>>2];c[P+8>>2]=c[O+8>>2];kV(O|0,0,12);dR(N);S=b_[c[(c[J>>2]|0)+36>>2]&127](T)|0;c[m>>2]=S;i=n;return}}function h0(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=i;y=(q|0)>0;z=n;A=n+1|0;B=n+8|0;C=n+4|0;n=g;g=0;while(1){L1947:do{switch(a[k+g|0]|0){case 0:{c[d>>2]=c[e>>2];D=n;break};case 1:{c[d>>2]=c[e>>2];E=bX[c[(c[r>>2]|0)+44>>2]&31](i,32)|0;F=c[e>>2]|0;c[e>>2]=F+4;c[F>>2]=E;D=n;break};case 3:{E=a[s]|0;F=E&255;if((F&1|0)==0){G=F>>>1}else{G=c[t>>2]|0}if((G|0)==0){D=n;break L1947}if((E&1)==0){H=t}else{H=c[u>>2]|0}E=c[H>>2]|0;F=c[e>>2]|0;c[e>>2]=F+4;c[F>>2]=E;D=n;break};case 2:{E=a[p]|0;F=E&255;I=(F&1|0)==0;if(I){J=F>>>1}else{J=c[w>>2]|0}if((J|0)==0|v){D=n;break L1947}if((E&1)==0){K=w;L=w;M=w}else{E=c[x>>2]|0;K=E;L=E;M=E}if(I){N=F>>>1}else{N=c[w>>2]|0}F=K+(N<<2)|0;I=c[e>>2]|0;if((L|0)==(F|0)){O=I}else{E=(K+(N-1<<2)+(-M|0)|0)>>>2;P=L;Q=I;
while(1){c[Q>>2]=c[P>>2];R=P+4|0;if((R|0)==(F|0)){break}P=R;Q=Q+4|0}O=I+(E+1<<2)|0}c[e>>2]=O;D=n;break};case 4:{Q=c[e>>2]|0;P=j?n+4|0:n;F=P;while(1){if(F>>>0>=h>>>0){break}if(bY[c[(c[o>>2]|0)+12>>2]&63](i,2048,c[F>>2]|0)|0){F=F+4|0}else{break}}if(y){if(F>>>0>P>>>0){E=F;I=q;do{E=E-4|0;R=c[E>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=R;I=I-1|0;T=(I|0)>0;}while(E>>>0>P>>>0&T);if(T){U=I;V=E;W=1666}else{X=0;Y=I;Z=E}}else{U=q;V=F;W=1666}if((W|0)==1666){W=0;X=bX[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;Y=U;Z=V}R=c[e>>2]|0;c[e>>2]=R+4;if((Y|0)>0){S=Y;_=R;while(1){c[_>>2]=X;$=S-1|0;aa=c[e>>2]|0;c[e>>2]=aa+4;if(($|0)>0){S=$;_=aa}else{ab=aa;break}}}else{ab=R}c[ab>>2]=l;ac=Z}else{ac=F}if((ac|0)==(P|0)){_=bX[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=_}else{_=a[z]|0;S=_&255;if((S&1|0)==0){ad=S>>>1}else{ad=c[C>>2]|0}if((ad|0)==0){ae=ac;af=0;ag=0;ah=-1}else{if((_&1)==0){ai=A}else{ai=c[B>>2]|0}ae=ac;af=0;ag=0;ah=a[ai]|0}while(1){do{if((af|0)==(ah|0)){_=c[e>>2]|0;c[e>>2]=_+4;c[_>>2]=m;_=ag+1|0;S=a[z]|0;E=S&255;if((E&1|0)==0){aj=E>>>1}else{aj=c[C>>2]|0}if(_>>>0>=aj>>>0){ak=ah;al=_;am=0;break}E=(S&1)==0;if(E){an=A}else{an=c[B>>2]|0}if((a[an+_|0]|0)==127){ak=-1;al=_;am=0;break}if(E){ao=A}else{ao=c[B>>2]|0}ak=a[ao+_|0]|0;al=_;am=0}else{ak=ah;al=ag;am=af}}while(0);_=ae-4|0;E=c[_>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4;c[S>>2]=E;if((_|0)==(P|0)){break}else{ae=_;af=am+1|0;ag=al;ah=ak}}}F=c[e>>2]|0;if((Q|0)==(F|0)){D=P;break L1947}R=F-4|0;if(Q>>>0<R>>>0){ap=Q;aq=R}else{D=P;break L1947}while(1){R=c[ap>>2]|0;c[ap>>2]=c[aq>>2];c[aq>>2]=R;R=ap+4|0;F=aq-4|0;if(R>>>0<F>>>0){ap=R;aq=F}else{D=P;break}}break};default:{D=n}}}while(0);P=g+1|0;if(P>>>0<4>>>0){n=D;g=P}else{break}}g=a[s]|0;s=g&255;D=(s&1|0)==0;if(D){ar=s>>>1}else{ar=c[t>>2]|0}if(ar>>>0>1>>>0){if((g&1)==0){as=t;at=t;au=t}else{g=c[u>>2]|0;as=g;at=g;au=g}if(D){av=s>>>1}else{av=c[t>>2]|0}t=as+(av<<2)|0;s=c[e>>2]|0;D=at+4|0;if((D|0)==(t|0)){aw=s}else{at=((as+(av-2<<2)+(-au|0)|0)>>>2)+1|0;au=s;av=D;while(1){c[au>>2]=c[av>>2];D=av+4|0;if((D|0)==(t|0)){break}else{au=au+4|0;av=D}}aw=s+(at<<2)|0}c[e>>2]=aw}aw=f&176;if((aw|0)==16){return}else if((aw|0)==32){c[d>>2]=c[e>>2];return}else{c[d>>2]=b;return}}function h1(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+400|0;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;d_(m,h);B=m|0;C=c[B>>2]|0;if((c[6582]|0)!=-1){c[l>>2]=26328;c[l+4>>2]=14;c[l+8>>2]=0;dB(26328,l,98)}l=(c[6583]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=a[G]|0;I=H&255;if((I&1|0)==0){J=I>>>1}else{J=c[k+4>>2]|0}if((J|0)==0){K=0}else{if((H&1)==0){L=k+4|0}else{
L=c[k+8>>2]|0}H=c[L>>2]|0;K=(H|0)==(bX[c[(c[E>>2]|0)+44>>2]&31](F,45)|0)}kV(r|0,0,12);kV(t|0,0,12);kV(v|0,0,12);h$(g,K,m,n,o,p,q,s,u,w);E=x|0;H=a[G]|0;I=H&255;M=(I&1|0)==0;if(M){N=I>>>1}else{N=c[k+4>>2]|0}O=c[w>>2]|0;if((N|0)>(O|0)){if(M){P=I>>>1}else{P=c[k+4>>2]|0}I=d[v]|0;if((I&1|0)==0){Q=I>>>1}else{Q=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){R=I>>>1}else{R=c[s+4>>2]|0}S=(P-O<<1|1)+Q+R|0}else{I=d[v]|0;if((I&1|0)==0){T=I>>>1}else{T=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){U=I>>>1}else{U=c[s+4>>2]|0}S=T+2+U|0}I=S+O|0;do{if(I>>>0>100>>>0){M=kG(I<<2)|0;V=M;if((M|0)!=0){W=V;X=V;Y=H;break}kS();W=V;X=V;Y=a[G]|0}else{W=E;X=0;Y=H}}while(0);if((Y&1)==0){Z=k+4|0;_=k+4|0}else{H=c[k+8>>2]|0;Z=H;_=H}H=Y&255;if((H&1|0)==0){$=H>>>1}else{$=c[k+4>>2]|0}h0(W,y,z,c[h+4>>2]|0,_,Z+($<<2)|0,F,K,n,c[o>>2]|0,c[p>>2]|0,q,s,u,O);c[A>>2]=c[f>>2];gd(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){dR(u);dR(s);dG(q);aa=c[B>>2]|0;ab=aa|0;ac=dg(ab)|0;i=e;return}kH(X);dR(u);dR(s);dG(q);aa=c[B>>2]|0;ab=aa|0;ac=dg(ab)|0;i=e;return}}while(0);e=bd(4)|0;kl(e);aM(e|0,8328,134)}function h2(a){a=a|0;de(a|0);kN(a);return}function h3(a){a=a|0;de(a|0);return}function h4(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=bK(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function h5(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+16|0;j=d|0;k=j;kV(k|0,0,12);l=b;m=h;n=a[h]|0;if((n&1)==0){o=m+1|0;p=m+1|0}else{m=c[h+8>>2]|0;o=m;p=m}m=n&255;if((m&1|0)==0){q=m>>>1}else{q=c[h+4>>2]|0}h=o+q|0;do{if(p>>>0<h>>>0){q=p;do{dL(j,a[q]|0);q=q+1|0;}while(q>>>0<h>>>0);q=(e|0)==-1?-1:e<<1;if((a[k]&1)==0){r=q;s=1798;break}t=c[j+8>>2]|0;u=q}else{r=(e|0)==-1?-1:e<<1;s=1798}}while(0);if((s|0)==1798){t=j+1|0;u=r}r=bh(u|0,f|0,g|0,t|0)|0;kV(l|0,0,12);l=kW(r|0)|0;t=r+l|0;if((l|0)>0){v=r}else{dG(j);i=d;return}do{dL(b,a[v]|0);v=v+1|0;}while(v>>>0<t>>>0);dG(j);i=d;return}function h6(a,b){a=a|0;b=b|0;aX(((b|0)==-1?-1:b<<1)|0)|0;return}function h7(a){a=a|0;de(a|0);kN(a);return}function h8(a){a=a|0;de(a|0);return}function h9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=bK(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function ia(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+224|0;j=d|0;k=d+8|0;l=d+40|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+192|0;q=d+200|0;r=d+208|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;kV(s|0,0,12);v=b;w=t|0;c[t+4>>2]=0;c[t>>2]=4232;x=a[h]|0;if((x&1)==0){y=h+4|0;z=h+4|0}else{A=c[h+8>>2]|0;y=A;z=A}A=x&255;if((A&1|0)==0){B=A>>>1}else{B=c[h+4>>2]|0}h=y+(B<<2)|0;L2180:do{if(z>>>0<h>>>0){B=t;y=k|0;A=k+32|0;x=z;C=4232;while(1){c[m>>2]=x;D=(b2[c[C+12>>2]&31](w,j,x,h,m,y,A,l)|0)==2;E=c[m>>2]|0;if(D|(E|0)==(x|0)){break}if(y>>>0<(c[l>>2]|0)>>>0){D=y;do{dL(r,a[D]|0);D=D+1|0;}while(D>>>0<(c[l>>2]|0)>>>0);F=c[m>>2]|0}else{F=E}if(F>>>0>=h>>>0){break L2180}x=F;C=c[B>>2]|0}B=bd(8)|0;dm(B,904);aM(B|0,8344,26)}}while(0)
;de(t|0);if((a[s]&1)==0){G=r+1|0}else{G=c[r+8>>2]|0}s=bh(((e|0)==-1?-1:e<<1)|0,f|0,g|0,G|0)|0;kV(v|0,0,12);v=u|0;c[u+4>>2]=0;c[u>>2]=4176;G=kW(s|0)|0;g=s+G|0;if((G|0)<1){H=u|0;de(H);dG(r);i=d;return}G=u;f=g;e=o|0;t=o+128|0;o=s;s=4176;while(1){c[q>>2]=o;F=(b2[c[s+16>>2]&31](v,n,o,(f-o|0)>32?o+32|0:g,q,e,t,p)|0)==2;h=c[q>>2]|0;if(F|(h|0)==(o|0)){break}if(e>>>0<(c[p>>2]|0)>>>0){F=e;do{dV(b,c[F>>2]|0);F=F+4|0;}while(F>>>0<(c[p>>2]|0)>>>0);I=c[q>>2]|0}else{I=h}if(I>>>0>=g>>>0){J=1865;break}o=I;s=c[G>>2]|0}if((J|0)==1865){H=u|0;de(H);dG(r);i=d;return}d=bd(8)|0;dm(d,904);aM(d|0,8344,26)}function ib(a,b){a=a|0;b=b|0;aX(((b|0)==-1?-1:b<<1)|0)|0;return}function ic(b){b=b|0;var d=0,e=0,f=0;c[b>>2]=3696;d=b+8|0;e=c[d>>2]|0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);if((e|0)==(c[6226]|0)){f=b|0;de(f);return}bc(c[d>>2]|0);f=b|0;de(f);return}function id(a){a=a|0;a=bd(8)|0;dh(a,1352);c[a>>2]=2632;aM(a|0,8360,36)}function ie(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+448|0;f=e|0;g=e+16|0;h=e+32|0;j=e+48|0;k=e+64|0;l=e+80|0;m=e+96|0;n=e+112|0;o=e+128|0;p=e+144|0;q=e+160|0;r=e+176|0;s=e+192|0;t=e+208|0;u=e+224|0;v=e+240|0;w=e+256|0;x=e+272|0;y=e+288|0;z=e+304|0;A=e+320|0;B=e+336|0;C=e+352|0;D=e+368|0;E=e+384|0;F=e+400|0;G=e+416|0;H=e+432|0;c[b+4>>2]=d-1;c[b>>2]=3952;d=b+8|0;I=b+12|0;a[b+136|0]=1;J=b+24|0;K=J;c[I>>2]=K;c[d>>2]=K;c[b+16>>2]=J+112;J=28;L=K;do{if((L|0)==0){M=0}else{c[L>>2]=0;M=c[I>>2]|0}L=M+4|0;c[I>>2]=L;J=J-1|0;}while((J|0)!=0);dE(b+144|0,1344,1);J=c[d>>2]|0;d=c[I>>2]|0;if((J|0)!=(d|0)){c[I>>2]=d+(~((d-4+(-J|0)|0)>>>2)<<2)}c[6259]=0;c[6258]=3656;if((c[6504]|0)!=-1){c[H>>2]=26016;c[H+4>>2]=14;c[H+8>>2]=0;dB(26016,H,98)}ig(b,25032,(c[6505]|0)-1|0);c[6257]=0;c[6256]=3616;if((c[6502]|0)!=-1){c[G>>2]=26008;c[G+4>>2]=14;c[G+8>>2]=0;dB(26008,G,98)}ig(b,25024,(c[6503]|0)-1|0);c[6309]=0;c[6308]=4064;c[6310]=0;a[25244]=0;c[6310]=c[(ba()|0)>>2];if((c[6584]|0)!=-1){c[F>>2]=26336;c[F+4>>2]=14;c[F+8>>2]=0;dB(26336,F,98)}ig(b,25232,(c[6585]|0)-1|0);c[6307]=0;c[6306]=3984;if((c[6582]|0)!=-1){c[E>>2]=26328;c[E+4>>2]=14;c[E+8>>2]=0;dB(26328,E,98)}ig(b,25224,(c[6583]|0)-1|0);c[6261]=0;c[6260]=3752;if((c[6508]|0)!=-1){c[D>>2]=26032;c[D+4>>2]=14;c[D+8>>2]=0;dB(26032,D,98)}ig(b,25040,(c[6509]|0)-1|0);c[553]=0;c[552]=3696;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);c[554]=c[6226];if((c[6506]|0)!=-1){c[C>>2]=26024;c[C+4>>2]=14;c[C+8>>2]=0;dB(26024,C,98)}ig(b,2208,(c[6507]|0)-1|0);c[6263]=0;c[6262]=3808;if((c[6510]|0)!=-1){c[B>>2]=26040;c[B+4>>2]=14;c[B+8>>2]=0;dB(26040,B,98)}ig(b,25048,(c[6511]|0)-1|0);c[6265]=0;c[6264]=3864;if((c[6512]|0)!=-1){c[A>>2]=26048;c[A+4>>2]=14;c[A+8>>2]=0;dB(26048,A,98)}ig(b,25056,(c[6513]|0)-1|0);c[6239]=0;c[6238]=3160;a[24960]=46;a[24961]=44;kV(24964,0,12);if((c[6488]|0)!=-1){c[z>>2]=25952;c[z+4>>2]=14;c[z+8>>2]=0;dB(25952,z,98)}
ig(b,24952,(c[6489]|0)-1|0);c[545]=0;c[544]=3112;c[546]=46;c[547]=44;kV(2192,0,12);if((c[6486]|0)!=-1){c[y>>2]=25944;c[y+4>>2]=14;c[y+8>>2]=0;dB(25944,y,98)}ig(b,2176,(c[6487]|0)-1|0);c[6255]=0;c[6254]=3544;if((c[6500]|0)!=-1){c[x>>2]=26e3;c[x+4>>2]=14;c[x+8>>2]=0;dB(26e3,x,98)}ig(b,25016,(c[6501]|0)-1|0);c[6253]=0;c[6252]=3472;if((c[6498]|0)!=-1){c[w>>2]=25992;c[w+4>>2]=14;c[w+8>>2]=0;dB(25992,w,98)}ig(b,25008,(c[6499]|0)-1|0);c[6251]=0;c[6250]=3408;if((c[6496]|0)!=-1){c[v>>2]=25984;c[v+4>>2]=14;c[v+8>>2]=0;dB(25984,v,98)}ig(b,25e3,(c[6497]|0)-1|0);c[6249]=0;c[6248]=3344;if((c[6494]|0)!=-1){c[u>>2]=25976;c[u+4>>2]=14;c[u+8>>2]=0;dB(25976,u,98)}ig(b,24992,(c[6495]|0)-1|0);c[6319]=0;c[6318]=4992;if((c[6704]|0)!=-1){c[t>>2]=26816;c[t+4>>2]=14;c[t+8>>2]=0;dB(26816,t,98)}ig(b,25272,(c[6705]|0)-1|0);c[6317]=0;c[6316]=4928;if((c[6702]|0)!=-1){c[s>>2]=26808;c[s+4>>2]=14;c[s+8>>2]=0;dB(26808,s,98)}ig(b,25264,(c[6703]|0)-1|0);c[6315]=0;c[6314]=4864;if((c[6700]|0)!=-1){c[r>>2]=26800;c[r+4>>2]=14;c[r+8>>2]=0;dB(26800,r,98)}ig(b,25256,(c[6701]|0)-1|0);c[6313]=0;c[6312]=4800;if((c[6698]|0)!=-1){c[q>>2]=26792;c[q+4>>2]=14;c[q+8>>2]=0;dB(26792,q,98)}ig(b,25248,(c[6699]|0)-1|0);c[6237]=0;c[6236]=2816;if((c[6476]|0)!=-1){c[p>>2]=25904;c[p+4>>2]=14;c[p+8>>2]=0;dB(25904,p,98)}ig(b,24944,(c[6477]|0)-1|0);c[6235]=0;c[6234]=2776;if((c[6474]|0)!=-1){c[o>>2]=25896;c[o+4>>2]=14;c[o+8>>2]=0;dB(25896,o,98)}ig(b,24936,(c[6475]|0)-1|0);c[6233]=0;c[6232]=2736;if((c[6472]|0)!=-1){c[n>>2]=25888;c[n+4>>2]=14;c[n+8>>2]=0;dB(25888,n,98)}ig(b,24928,(c[6473]|0)-1|0);c[6231]=0;c[6230]=2696;if((c[6470]|0)!=-1){c[m>>2]=25880;c[m+4>>2]=14;c[m+8>>2]=0;dB(25880,m,98)}ig(b,24920,(c[6471]|0)-1|0);c[541]=0;c[540]=3016;c[542]=3064;if((c[6484]|0)!=-1){c[l>>2]=25936;c[l+4>>2]=14;c[l+8>>2]=0;dB(25936,l,98)}ig(b,2160,(c[6485]|0)-1|0);c[537]=0;c[536]=2920;c[538]=2968;if((c[6482]|0)!=-1){c[k>>2]=25928;c[k+4>>2]=14;c[k+8>>2]=0;dB(25928,k,98)}ig(b,2144,(c[6483]|0)-1|0);c[533]=0;c[532]=3920;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);c[534]=c[6226];c[532]=2888;if((c[6480]|0)!=-1){c[j>>2]=25920;c[j+4>>2]=14;c[j+8>>2]=0;dB(25920,j,98)}ig(b,2128,(c[6481]|0)-1|0);c[529]=0;c[528]=3920;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);c[530]=c[6226];c[528]=2856;if((c[6478]|0)!=-1){c[h>>2]=25912;c[h+4>>2]=14;c[h+8>>2]=0;dB(25912,h,98)}ig(b,2112,(c[6479]|0)-1|0);c[6247]=0;c[6246]=3248;if((c[6492]|0)!=-1){c[g>>2]=25968;c[g+4>>2]=14;c[g+8>>2]=0;dB(25968,g,98)}ig(b,24984,(c[6493]|0)-1|0);c[6245]=0;c[6244]=3208;if((c[6490]|0)!=-1){c[f>>2]=25960;c[f+4>>2]=14;c[f+8>>2]=0;dB(25960,f,98)}ig(b,24976,(c[6491]|0)-1|0);i=e;return}function ig(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;df(b|0);e=a+8|0;f=a+12|0;a=c[f>>2]|0;g=e|0;h=c[g>>2]|0;i=a-h>>2;do{if(i>>>0>d>>>0){j=h}else{k=d+1|0;if(i>>>0<k>>>0){j1(e,k-i|0);j=c[g>>2]|0;break}if(i>>>0<=k>>>0){j=h;break}l=h+(k<<2)|0;if((l|0)==(a|0)){j=h;break}c[f>>2]=a+(~((
a-4+(-l|0)|0)>>>2)<<2);j=h}}while(0);h=c[j+(d<<2)>>2]|0;if((h|0)==0){m=j;n=m+(d<<2)|0;c[n>>2]=b;return}dg(h|0)|0;m=c[g>>2]|0;n=m+(d<<2)|0;c[n>>2]=b;return}function ih(a){a=a|0;ii(a);kN(a);return}function ii(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;c[b>>2]=3952;d=b+12|0;e=c[d>>2]|0;f=b+8|0;g=c[f>>2]|0;if((e|0)!=(g|0)){h=0;i=g;g=e;while(1){e=c[i+(h<<2)>>2]|0;if((e|0)==0){j=g;k=i}else{l=e|0;dg(l)|0;j=c[d>>2]|0;k=c[f>>2]|0}l=h+1|0;if(l>>>0<j-k>>2>>>0){h=l;i=k;g=j}else{break}}}dG(b+144|0);j=c[f>>2]|0;if((j|0)==0){m=b|0;de(m);return}f=c[d>>2]|0;if((j|0)!=(f|0)){c[d>>2]=f+(~((f-4+(-j|0)|0)>>>2)<<2)}if((j|0)==(b+24|0)){a[b+136|0]=0;m=b|0;de(m);return}else{kN(j);m=b|0;de(m);return}}function ij(){var b=0,d=0;if((a[26880]|0)!=0){b=c[6218]|0;return b|0}if((bt(26880)|0)==0){b=c[6218]|0;return b|0}do{if((a[26888]|0)==0){if((bt(26888)|0)==0){break}ie(25064,1);c[6222]=25064;c[6220]=24888}}while(0);d=c[c[6220]>>2]|0;c[6224]=d;df(d|0);c[6218]=24896;b=c[6218]|0;return b|0}function ik(a){a=a|0;var b=0;b=c[(ij()|0)>>2]|0;c[a>>2]=b;df(b|0);return}function il(a,b){a=a|0;b=b|0;var d=0;d=c[b>>2]|0;c[a>>2]=d;df(d|0);return}function im(a){a=a|0;dg(c[a>>2]|0)|0;return}function io(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=c[a>>2]|0;a=b|0;if((c[a>>2]|0)!=-1){c[e>>2]=b;c[e+4>>2]=14;c[e+8>>2]=0;dB(a,e,98)}e=(c[b+4>>2]|0)-1|0;b=c[f+8>>2]|0;if((c[f+12>>2]|0)-b>>2>>>0<=e>>>0){g=bd(4)|0;h=g;kl(h);aM(g|0,8328,134);return 0}f=c[b+(e<<2)>>2]|0;if((f|0)==0){g=bd(4)|0;h=g;kl(h);aM(g|0,8328,134);return 0}else{i=d;return f|0}return 0}function ip(a){a=a|0;de(a|0);kN(a);return}function iq(a){a=a|0;if((a|0)==0){return}bV[c[(c[a>>2]|0)+4>>2]&511](a);return}function ir(a){a=a|0;c[a+4>>2]=(I=c[6514]|0,c[6514]=I+1,I)+1;return}function is(a){a=a|0;de(a|0);kN(a);return}function it(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128>>>0){f=0;return f|0}f=(b[(c[(ba()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function iu(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128>>>0){j=b[(c[(ba()|0)>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function iv(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128>>>0){if((b[(c[(ba()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=2089;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=2087;break}else{h=e}}if((i|0)==2089){return g|0}else if((i|0)==2087){return g|0}return 0}function iw(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a=e;while(1){if((a|0)==(f|0)){g=f;h=2098;break}e=c[a>>2]|0;if(e>>>0>=128>>>0){g=a;h=2099;break}if((b[(c[(ba()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16==0){g=a;h=2097;break}else{a=a+4|0}}if((h|0)==2098){return g|0}else if((h|0)==2097){return g|0}else if((h|0)==2099){return g|0}return 0}function ix(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(bs()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function iy(a,b,d){a=a|0;b=b|0;
d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(bs()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function iz(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(aI()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function iA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(aI()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function iB(a,b){a=a|0;b=b|0;return b<<24>>24|0}function iC(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function iD(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function iE(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=((e-4+(-d|0)|0)>>>2)+1|0;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128>>>0?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b<<2)|0;return h|0}function iF(b){b=b|0;var d=0;c[b>>2]=4064;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}kO(d)}}while(0);de(b|0);kN(b);return}function iG(b){b=b|0;var d=0;c[b>>2]=4064;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}kO(d)}}while(0);de(b|0);return}function iH(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(bs()|0)>>2]|0)+((b&255)<<2)>>2]&255;return d|0}function iI(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(bs()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function iJ(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(aI()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return d|0}function iK(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(aI()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function iL(a,b){a=a|0;b=b|0;return b|0}function iM(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function iN(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24<0?c:b)|0}function iO(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24<0?e:f;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function iP(a){a=a|0;de(a|0);kN(a);return}function iQ(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function iR(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function iS(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function iT(a)
{a=a|0;return 1}function iU(a){a=a|0;return 1}function iV(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function iW(a){a=a|0;return 1}function iX(a){a=a|0;ic(a);kN(a);return}function iY(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+8|0;m=l|0;n=m;o=i;i=i+4|0;i=i+7&-8;p=e;while(1){if((p|0)==(f|0)){q=f;break}if((c[p>>2]|0)==0){q=p;break}else{p=p+4|0}}c[k>>2]=h;c[g>>2]=e;L118:do{if((e|0)==(f|0)|(h|0)==(j|0)){r=e}else{p=d;s=j;t=b+8|0;u=o|0;v=h;w=e;x=q;while(1){y=c[p+4>>2]|0;c[m>>2]=c[p>>2];c[m+4>>2]=y;y=bN(c[t>>2]|0)|0;z=ke(v,g,x-w>>2,s-v|0,d)|0;if((y|0)!=0){bN(y|0)|0}if((z|0)==(-1|0)){A=122;break}else if((z|0)==0){B=1;A=159;break}y=(c[k>>2]|0)+z|0;c[k>>2]=y;if((y|0)==(j|0)){A=155;break}if((x|0)==(f|0)){C=f;D=y;E=c[g>>2]|0}else{y=bN(c[t>>2]|0)|0;z=kd(u,0,d)|0;if((y|0)!=0){bN(y|0)|0}if((z|0)==-1){B=2;A=160;break}y=c[k>>2]|0;if(z>>>0>(s-y|0)>>>0){B=1;A=161;break}L137:do{if((z|0)!=0){F=z;G=u;H=y;while(1){I=a[G]|0;c[k>>2]=H+1;a[H]=I;I=F-1|0;if((I|0)==0){break L137}F=I;G=G+1|0;H=c[k>>2]|0}}}while(0);y=(c[g>>2]|0)+4|0;c[g>>2]=y;z=y;while(1){if((z|0)==(f|0)){J=f;break}if((c[z>>2]|0)==0){J=z;break}else{z=z+4|0}}C=J;D=c[k>>2]|0;E=y}if((E|0)==(f|0)|(D|0)==(j|0)){r=E;break L118}else{v=D;w=E;x=C}}if((A|0)==122){c[k>>2]=v;L149:do{if((w|0)==(c[g>>2]|0)){K=w}else{x=w;u=v;while(1){s=c[x>>2]|0;p=bN(c[t>>2]|0)|0;z=kd(u,s,n)|0;if((p|0)!=0){bN(p|0)|0}if((z|0)==-1){K=x;break L149}p=(c[k>>2]|0)+z|0;c[k>>2]=p;z=x+4|0;if((z|0)==(c[g>>2]|0)){K=z;break}else{x=z;u=p}}}}while(0);c[g>>2]=K;B=2;i=l;return B|0}else if((A|0)==155){r=c[g>>2]|0;break}else if((A|0)==159){i=l;return B|0}else if((A|0)==160){i=l;return B|0}else if((A|0)==161){i=l;return B|0}}}while(0);B=(r|0)!=(f|0)|0;i=l;return B|0}function iZ(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;l=i;i=i+8|0;m=l|0;n=m;o=e;while(1){if((o|0)==(f|0)){p=f;break}if((a[o]|0)==0){p=o;break}else{o=o+1|0}}c[k>>2]=h;c[g>>2]=e;L170:do{if((e|0)==(f|0)|(h|0)==(j|0)){q=e}else{o=d;r=j;s=b+8|0;t=h;u=e;v=p;while(1){w=c[o+4>>2]|0;c[m>>2]=c[o>>2];c[m+4>>2]=w;x=v;w=bN(c[s>>2]|0)|0;y=ka(t,g,x-u|0,r-t>>2,d)|0;if((w|0)!=0){bN(w|0)|0}if((y|0)==(-1|0)){z=177;break}else if((y|0)==0){A=2;z=216;break}w=(c[k>>2]|0)+(y<<2)|0;c[k>>2]=w;if((w|0)==(j|0)){z=209;break}y=c[g>>2]|0;if((v|0)==(f|0)){B=f;C=w;D=y}else{E=bN(c[s>>2]|0)|0;F=j9(w,y,1,d)|0;if((E|0)!=0){bN(E|0)|0}if((F|0)!=0){A=2;z=217;break}c[k>>2]=(c[k>>2]|0)+4;F=(c[g>>2]|0)+1|0;c[g>>2]=F;E=F;while(1){if((E|0)==(f|0)){G=f;break}if((a[E]|0)==0){G=E;break}else{E=E+1|0}}B=G;C=c[k>>2]|0;D=F}if((D|0)==(f|0)|(C|0)==(j|0)){q=D;break L170}else{t=C;u=D;v=B}}if((z|0)==177){c[k>>2]=t;L194:do{if((u|0)==(c[g>>2]|0)){H=u}else{v=t;r=u;while(1){o=bN(c[s>>2]|0)|0;E=j9(v,r,x-r|0,n)|0;if((o|0)!=0){bN(o|0)|0}if((E|0)==0){I=r+1|0}else if((E|0)==(-
1|0)){z=188;break}else if((E|0)==(-2|0)){z=189;break}else{I=r+E|0}E=(c[k>>2]|0)+4|0;c[k>>2]=E;if((I|0)==(c[g>>2]|0)){H=I;break L194}else{v=E;r=I}}if((z|0)==188){c[g>>2]=r;A=2;i=l;return A|0}else if((z|0)==189){c[g>>2]=r;A=1;i=l;return A|0}}}while(0);c[g>>2]=H;A=(H|0)!=(f|0)|0;i=l;return A|0}else if((z|0)==209){q=c[g>>2]|0;break}else if((z|0)==216){i=l;return A|0}else if((z|0)==217){i=l;return A|0}}}while(0);A=(q|0)!=(f|0)|0;i=l;return A|0}function i_(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+8|0;c[g>>2]=e;e=h|0;j=bN(c[b+8>>2]|0)|0;b=kd(e,0,d)|0;if((j|0)!=0){bN(j|0)|0}if((b|0)==(-1|0)|(b|0)==0){k=2;i=h;return k|0}j=b-1|0;b=c[g>>2]|0;if(j>>>0>(f-b|0)>>>0){k=1;i=h;return k|0}if((j|0)==0){k=0;i=h;return k|0}else{l=j;m=e;n=b}while(1){b=a[m]|0;c[g>>2]=n+1;a[n]=b;b=l-1|0;if((b|0)==0){k=0;break}l=b;m=m+1|0;n=c[g>>2]|0}i=h;return k|0}function i$(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;a=bN(c[b>>2]|0)|0;d=kc(0,0,4)|0;if((a|0)!=0){bN(a|0)|0}if((d|0)!=0){e=-1;return e|0}d=c[b>>2]|0;if((d|0)==0){e=1;return e|0}b=bN(d|0)|0;if((b|0)==0){e=0;return e|0}bN(b|0)|0;e=0;return e|0}function i0(a){a=a|0;return 0}function i1(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=d;d=0;j=0;while(1){k=bN(c[i>>2]|0)|0;l=j8(a,h-a|0,b)|0;if((k|0)!=0){bN(k|0)|0}if((l|0)==0){m=1;n=a+1|0}else if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;o=273;break}else{m=l;n=a+l|0}l=m+d|0;k=j+1|0;if(k>>>0>=f>>>0|(n|0)==(e|0)){g=l;o=274;break}else{a=n;d=l;j=k}}if((o|0)==273){return g|0}else if((o|0)==274){return g|0}return 0}function i2(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=bN(b|0)|0;if((a|0)==0){d=4;break}bN(a|0)|0;d=4}}while(0);return d|0}function i3(a){a=a|0;de(a|0);kN(a);return}function i4(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=i5(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function i5(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0;c[g>>2]=d;c[j>>2]=h;do{if((l&2|0)!=0){if((i-h|0)<3){m=1;return m|0}else{c[j>>2]=h+1;a[h]=-17;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-69;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-65;break}}}while(0);h=f;l=c[g>>2]|0;if(l>>>0>=f>>>0){m=0;return m|0}d=i;i=l;L287:while(1){l=b[i>>1]|0;n=l&65535;if(n>>>0>k>>>0){m=2;o=323;break}do{if((l&65535)>>>0<128>>>0){p=c[j>>2]|0;if((d-p|0)<1){m=1;o=320;break L287}c[j>>2]=p+1;a[p]=l&255}else{if((l&65535)>>>0<2048>>>0){p=c[j>>2]|0;if((d-p|0)<2){m=1;o=317;break L287}c[j>>2]=p+1;a[p]=(n>>>6|192)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0<55296>>>0){p=c[j>>2]|0;if((d-p|0)<3){m=1;o=315;break L287}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0>=56320>>>0){if((l&65535)>>>0<57344>>>0){m=2;o=314;break L287}p=c[j>>2]|0;if((d-p|0)
<3){m=1;o=321;break L287}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((h-i|0)<4){m=1;o=311;break L287}p=i+2|0;q=e[p>>1]|0;if((q&64512|0)!=56320){m=2;o=312;break L287}if((d-(c[j>>2]|0)|0)<4){m=1;o=313;break L287}r=n&960;if(((r<<10)+65536|n<<10&64512|q&1023)>>>0>k>>>0){m=2;o=319;break L287}c[g>>2]=p;p=(r>>>6)+1|0;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(p>>>2|240)&255;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(n>>>2&15|p<<4&48|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n<<4&48|q>>>6&15|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(q&63|128)&255}}while(0);n=(c[g>>2]|0)+2|0;c[g>>2]=n;if(n>>>0<f>>>0){i=n}else{m=0;o=322;break}}if((o|0)==311){return m|0}else if((o|0)==312){return m|0}else if((o|0)==313){return m|0}else if((o|0)==314){return m|0}else if((o|0)==315){return m|0}else if((o|0)==317){return m|0}else if((o|0)==319){return m|0}else if((o|0)==320){return m|0}else if((o|0)==321){return m|0}else if((o|0)==322){return m|0}else if((o|0)==323){return m|0}return 0}function i6(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=i7(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=b;return l|0}function i7(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;c[g>>2]=e;c[j>>2]=h;h=c[g>>2]|0;do{if((l&4|0)==0){m=h}else{if((f-h|0)<=2){m=h;break}if((a[h]|0)!=-17){m=h;break}if((a[h+1|0]|0)!=-69){m=h;break}if((a[h+2|0]|0)!=-65){m=h;break}e=h+3|0;c[g>>2]=e;m=e}}while(0);L333:do{if(m>>>0<f>>>0){h=f;l=i;e=c[j>>2]|0;n=m;L335:while(1){if(e>>>0>=i>>>0){o=n;break L333}p=a[n]|0;q=p&255;if(q>>>0>k>>>0){r=2;s=386;break}do{if(p<<24>>24>-1){b[e>>1]=p&255;c[g>>2]=(c[g>>2]|0)+1}else{if((p&255)>>>0<194>>>0){r=2;s=374;break L335}if((p&255)>>>0<224>>>0){if((h-n|0)<2){r=1;s=372;break L335}t=d[n+1|0]|0;if((t&192|0)!=128){r=2;s=373;break L335}u=t&63|q<<6&1984;if(u>>>0>k>>>0){r=2;s=384;break L335}b[e>>1]=u&65535;c[g>>2]=(c[g>>2]|0)+2;break}if((p&255)>>>0<240>>>0){if((h-n|0)<3){r=1;s=385;break L335}u=a[n+1|0]|0;t=a[n+2|0]|0;if((q|0)==224){if((u&-32)<<24>>24!=-96){r=2;s=375;break L335}}else if((q|0)==237){if((u&-32)<<24>>24!=-128){r=2;s=376;break L335}}else{if((u&-64)<<24>>24!=-128){r=2;s=377;break L335}}v=t&255;if((v&192|0)!=128){r=2;s=378;break L335}t=(u&255)<<6&4032|q<<12|v&63;if((t&65535)>>>0>k>>>0){r=2;s=379;break L335}b[e>>1]=t&65535;c[g>>2]=(c[g>>2]|0)+3;break}if((p&255)>>>0>=245>>>0){r=2;s=369;break L335}if((h-n|0)<4){r=1;s=370;break L335}t=a[n+1|0]|0;v=a[n+2|0]|0;u=a[n+3|0]|0;if((q|0)==240){if((t+112&255)>>>0>=48>>>0){r=2;s=366;break L335}}else if((q|0)==244){if((t&-16)<<24>>24!=-128){r=2;s=367;break L335}}else{if((t&-64)<<24>>24!=-128){r=2;s=368;break L335}}w=v&255;if((w&192|0)!=128){r=2;s=371;break L335}v=u&255;if((v&192|0)!=128){r=2;s=381;break L335}if((l-e|0)<4){r=1;s=382;break L335}u=q&7;x=t&255;t=w<<6;y=v&63;if((x<<12&258048|u<<18|t&4032|y)
>>>0>k>>>0){r=2;s=383;break L335}b[e>>1]=(x<<2&60|w>>>4&3|((x>>>4&3|u<<2)<<6)+16320|55296)&65535;u=(c[j>>2]|0)+2|0;c[j>>2]=u;b[u>>1]=(y|t&960|56320)&65535;c[g>>2]=(c[g>>2]|0)+4}}while(0);q=(c[j>>2]|0)+2|0;c[j>>2]=q;p=c[g>>2]|0;if(p>>>0<f>>>0){e=q;n=p}else{o=p;break L333}}if((s|0)==366){return r|0}else if((s|0)==367){return r|0}else if((s|0)==368){return r|0}else if((s|0)==369){return r|0}else if((s|0)==370){return r|0}else if((s|0)==371){return r|0}else if((s|0)==372){return r|0}else if((s|0)==373){return r|0}else if((s|0)==374){return r|0}else if((s|0)==375){return r|0}else if((s|0)==376){return r|0}else if((s|0)==377){return r|0}else if((s|0)==378){return r|0}else if((s|0)==379){return r|0}else if((s|0)==381){return r|0}else if((s|0)==382){return r|0}else if((s|0)==383){return r|0}else if((s|0)==384){return r|0}else if((s|0)==385){return r|0}else if((s|0)==386){return r|0}}else{o=m}}while(0);r=o>>>0<f>>>0|0;return r|0}function i8(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function i9(a){a=a|0;return 0}function ja(a){a=a|0;return 0}function jb(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return jc(c,d,e,1114111,0)|0}function jc(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L406:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=0;j=h;L408:while(1){k=a[j]|0;l=k&255;if(l>>>0>f>>>0){m=j;break L406}do{if(k<<24>>24>-1){n=j+1|0;o=i}else{if((k&255)>>>0<194>>>0){m=j;break L406}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L406}p=d[j+1|0]|0;if((p&192|0)!=128){m=j;break L406}if((p&63|l<<6&1984)>>>0>f>>>0){m=j;break L406}n=j+2|0;o=i;break}if((k&255)>>>0<240>>>0){q=j;if((g-q|0)<3){m=j;break L406}p=a[j+1|0]|0;r=a[j+2|0]|0;if((l|0)==237){if((p&-32)<<24>>24!=-128){s=413;break L408}}else if((l|0)==224){if((p&-32)<<24>>24!=-96){s=411;break L408}}else{if((p&-64)<<24>>24!=-128){s=415;break L408}}t=r&255;if((t&192|0)!=128){m=j;break L406}if(((p&255)<<6&4032|l<<12&61440|t&63)>>>0>f>>>0){m=j;break L406}n=j+3|0;o=i;break}if((k&255)>>>0>=245>>>0){m=j;break L406}u=j;if((g-u|0)<4){m=j;break L406}if((e-i|0)>>>0<2>>>0){m=j;break L406}t=a[j+1|0]|0;p=a[j+2|0]|0;r=a[j+3|0]|0;if((l|0)==240){if((t+112&255)>>>0>=48>>>0){s=424;break L408}}else if((l|0)==244){if((t&-16)<<24>>24!=-128){s=426;break L408}}else{if((t&-64)<<24>>24!=-128){s=428;break L408}}v=p&255;if((v&192|0)!=128){m=j;break L406}p=r&255;if((p&192|0)!=128){m=j;break L406}if(((t&255)<<12&258048|l<<18&1835008|v<<6&4032|p&63)>>>0>f>>>0){m=j;break L406}n=j+4|0;o=i+1|0}}while(0);l=o+1|0;if(n>>>0<c>>>0&l>>>0<e>>>0){i=l;j=n}else{m=n;break L406}}if((s|0)==415){w=q-b|0;return w|0}else if((s|0)==426){w=u-b|0;return w|0}else if((s|0)==428){w=u-b|0;return w|0}else if((s|0)==411){w=q-b|0;return w|0}else if((s|0)==413){w=q-b|0;return w|0}else if((s|0)==424){w=u-b|0;return w|0}}else{m=h}}while(0);w=m-b|0;return w|0}function 
jd(a){a=a|0;return 4}function je(a){a=a|0;de(a|0);kN(a);return}function jf(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=jg(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function jg(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0;c[e>>2]=b;c[h>>2]=f;do{if((j&2|0)!=0){if((g-f|0)<3){k=1;return k|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);f=c[e>>2]|0;if(f>>>0>=d>>>0){k=0;return k|0}j=g;g=f;L472:while(1){f=c[g>>2]|0;if((f&-2048|0)==55296|f>>>0>i>>>0){k=2;l=469;break}do{if(f>>>0<128>>>0){b=c[h>>2]|0;if((j-b|0)<1){k=1;l=468;break L472}c[h>>2]=b+1;a[b]=f&255}else{if(f>>>0<2048>>>0){b=c[h>>2]|0;if((j-b|0)<2){k=1;l=466;break L472}c[h>>2]=b+1;a[b]=(f>>>6|192)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}b=c[h>>2]|0;m=j-b|0;if(f>>>0<65536>>>0){if((m|0)<3){k=1;l=470;break L472}c[h>>2]=b+1;a[b]=(f>>>12|224)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f>>>6&63|128)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f&63|128)&255;break}else{if((m|0)<4){k=1;l=471;break L472}c[h>>2]=b+1;a[b]=(f>>>18|240)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>12&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>6&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}}}while(0);f=(c[e>>2]|0)+4|0;c[e>>2]=f;if(f>>>0<d>>>0){g=f}else{k=0;l=472;break}}if((l|0)==468){return k|0}else if((l|0)==469){return k|0}else if((l|0)==470){return k|0}else if((l|0)==471){return k|0}else if((l|0)==472){return k|0}else if((l|0)==466){return k|0}return 0}function jh(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=ji(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=b;return l|0}function ji(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;c[f>>2]=b;c[i>>2]=g;g=c[f>>2]|0;do{if((k&4|0)==0){l=g}else{if((e-g|0)<=2){l=g;break}if((a[g]|0)!=-17){l=g;break}if((a[g+1|0]|0)!=-69){l=g;break}if((a[g+2|0]|0)!=-65){l=g;break}b=g+3|0;c[f>>2]=b;l=b}}while(0);L505:do{if(l>>>0<e>>>0){g=e;k=c[i>>2]|0;b=l;L507:while(1){if(k>>>0>=h>>>0){m=b;break L505}n=a[b]|0;o=n&255;do{if(n<<24>>24>-1){if(o>>>0>j>>>0){p=2;q=520;break L507}c[k>>2]=o;c[f>>2]=(c[f>>2]|0)+1}else{if((n&255)>>>0<194>>>0){p=2;q=521;break L507}if((n&255)>>>0<224>>>0){if((g-b|0)<2){p=1;q=524;break L507}r=d[b+1|0]|0;if((r&192|0)!=128){p=2;q=516;break L507}s=r&63|o<<6&1984;if(s>>>0>j>>>0){p=2;q=518;break L507}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+2;break}if((n&255)>>>0<240>>>0){if((g-b|0)<3){p=1;q=531;break L507}s=a[b+1|0]|0;r=a[b+2|0]|0;if((o|0)==237){if((s&-32)<<24>>24!=-128){p=2;q=519;break L507}}else if((o|0)==224){if((s&-32)<<24>>24!=-96){p=2;q=530;break L507}}else{if((s&-64)<<24>>24!=-128){p=2;q=527;break L507}}t=r&255;if((t&192|0)!=128){p=2;q=523;break L507}r=(s&255)<<6&
4032|o<<12&61440|t&63;if(r>>>0>j>>>0){p=2;q=514;break L507}c[k>>2]=r;c[f>>2]=(c[f>>2]|0)+3;break}if((n&255)>>>0>=245>>>0){p=2;q=528;break L507}if((g-b|0)<4){p=1;q=529;break L507}r=a[b+1|0]|0;t=a[b+2|0]|0;s=a[b+3|0]|0;if((o|0)==244){if((r&-16)<<24>>24!=-128){p=2;q=515;break L507}}else if((o|0)==240){if((r+112&255)>>>0>=48>>>0){p=2;q=522;break L507}}else{if((r&-64)<<24>>24!=-128){p=2;q=525;break L507}}u=t&255;if((u&192|0)!=128){p=2;q=526;break L507}t=s&255;if((t&192|0)!=128){p=2;q=533;break L507}s=(r&255)<<12&258048|o<<18&1835008|u<<6&4032|t&63;if(s>>>0>j>>>0){p=2;q=517;break L507}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+4}}while(0);o=(c[i>>2]|0)+4|0;c[i>>2]=o;n=c[f>>2]|0;if(n>>>0<e>>>0){k=o;b=n}else{m=n;break L505}}if((q|0)==514){return p|0}else if((q|0)==515){return p|0}else if((q|0)==516){return p|0}else if((q|0)==517){return p|0}else if((q|0)==518){return p|0}else if((q|0)==519){return p|0}else if((q|0)==520){return p|0}else if((q|0)==521){return p|0}else if((q|0)==522){return p|0}else if((q|0)==523){return p|0}else if((q|0)==524){return p|0}else if((q|0)==525){return p|0}else if((q|0)==526){return p|0}else if((q|0)==527){return p|0}else if((q|0)==528){return p|0}else if((q|0)==529){return p|0}else if((q|0)==530){return p|0}else if((q|0)==531){return p|0}else if((q|0)==533){return p|0}}else{m=l}}while(0);p=m>>>0<e>>>0|0;return p|0}function jj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function jk(a){a=a|0;return 0}function jl(a){a=a|0;return 0}function jm(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return jn(c,d,e,1114111,0)|0}function jn(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L576:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=1;j=h;L578:while(1){k=a[j]|0;l=k&255;do{if(k<<24>>24>-1){if(l>>>0>f>>>0){m=j;break L576}n=j+1|0}else{if((k&255)>>>0<194>>>0){m=j;break L576}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L576}o=d[j+1|0]|0;if((o&192|0)!=128){m=j;break L576}if((o&63|l<<6&1984)>>>0>f>>>0){m=j;break L576}n=j+2|0;break}if((k&255)>>>0<240>>>0){p=j;if((g-p|0)<3){m=j;break L576}o=a[j+1|0]|0;q=a[j+2|0]|0;if((l|0)==224){if((o&-32)<<24>>24!=-96){r=558;break L578}}else if((l|0)==237){if((o&-32)<<24>>24!=-128){r=560;break L578}}else{if((o&-64)<<24>>24!=-128){r=562;break L578}}s=q&255;if((s&192|0)!=128){m=j;break L576}if(((o&255)<<6&4032|l<<12&61440|s&63)>>>0>f>>>0){m=j;break L576}n=j+3|0;break}if((k&255)>>>0>=245>>>0){m=j;break L576}t=j;if((g-t|0)<4){m=j;break L576}s=a[j+1|0]|0;o=a[j+2|0]|0;q=a[j+3|0]|0;if((l|0)==244){if((s&-16)<<24>>24!=-128){r=572;break L578}}else if((l|0)==240){if((s+112&255)>>>0>=48>>>0){r=570;break L578}}else{if((s&-64)<<24>>24!=-128){r=574;break L578}}u=o&255;if((u&192|0)!=128){m=j;break L576}o=q&255;if((o&192|0)!=128){m=j;break L576}if(((s&255)<<12&258048|l<<18&1835008|u<<6&4032|o&63)>>>0>f>>>0){m=j;break L576}n=j+4|0}}
while(0);if(!(n>>>0<c>>>0&i>>>0<e>>>0)){m=n;break L576}i=i+1|0;j=n}if((r|0)==572){v=t-b|0;return v|0}else if((r|0)==574){v=t-b|0;return v|0}else if((r|0)==570){v=t-b|0;return v|0}else if((r|0)==560){v=p-b|0;return v|0}else if((r|0)==562){v=p-b|0;return v|0}else if((r|0)==558){v=p-b|0;return v|0}}else{m=h}}while(0);v=m-b|0;return v|0}function jo(a){a=a|0;return 4}function jp(a){a=a|0;de(a|0);kN(a);return}function jq(a){a=a|0;de(a|0);kN(a);return}function jr(a){a=a|0;c[a>>2]=3160;dG(a+12|0);de(a|0);kN(a);return}function js(a){a=a|0;c[a>>2]=3160;dG(a+12|0);de(a|0);return}function jt(a){a=a|0;c[a>>2]=3112;dG(a+16|0);de(a|0);kN(a);return}function ju(a){a=a|0;c[a>>2]=3112;dG(a+16|0);de(a|0);return}function jv(b){b=b|0;return a[b+8|0]|0}function jw(a){a=a|0;return c[a+8>>2]|0}function jx(b){b=b|0;return a[b+9|0]|0}function jy(a){a=a|0;return c[a+12>>2]|0}function jz(a,b){a=a|0;b=b|0;dD(a,b+12|0);return}function jA(a,b){a=a|0;b=b|0;dD(a,b+16|0);return}function jB(a,b){a=a|0;b=b|0;dE(a,1296,4);return}function jC(a,b){a=a|0;b=b|0;dP(a,1272,kg(1272)|0);return}function jD(a,b){a=a|0;b=b|0;dE(a,1264,5);return}function jE(a,b){a=a|0;b=b|0;dP(a,1232,kg(1232)|0);return}function jF(b){b=b|0;var d=0;if((a[26976]|0)!=0){d=c[6344]|0;return d|0}if((bt(26976)|0)==0){d=c[6344]|0;return d|0}do{if((a[26864]|0)==0){if((bt(26864)|0)==0){break}kV(24416,0,168);aP(266,0,u|0)|0}}while(0);dH(24416,1536)|0;dH(24428,1528)|0;dH(24440,1520)|0;dH(24452,1504)|0;dH(24464,1488)|0;dH(24476,1480)|0;dH(24488,1464)|0;dH(24500,1456)|0;dH(24512,1448)|0;dH(24524,1440)|0;dH(24536,1432)|0;dH(24548,1424)|0;dH(24560,1392)|0;dH(24572,1384)|0;c[6344]=24416;d=c[6344]|0;return d|0}function jG(b){b=b|0;var d=0;if((a[26920]|0)!=0){d=c[6322]|0;return d|0}if((bt(26920)|0)==0){d=c[6322]|0;return d|0}do{if((a[26840]|0)==0){if((bt(26840)|0)==0){break}kV(23672,0,168);aP(150,0,u|0)|0}}while(0);dS(23672,1912)|0;dS(23684,1880)|0;dS(23696,1848)|0;dS(23708,1808)|0;dS(23720,1768)|0;dS(23732,1736)|0;dS(23744,1696)|0;dS(23756,1680)|0;dS(23768,1624)|0;dS(23780,1608)|0;dS(23792,1592)|0;dS(23804,1576)|0;dS(23816,1560)|0;dS(23828,1544)|0;c[6322]=23672;d=c[6322]|0;return d|0}function jH(b){b=b|0;var d=0;if((a[26968]|0)!=0){d=c[6342]|0;return d|0}if((bt(26968)|0)==0){d=c[6342]|0;return d|0}do{if((a[26856]|0)==0){if((bt(26856)|0)==0){break}kV(24128,0,288);aP(168,0,u|0)|0}}while(0);dH(24128,288)|0;dH(24140,272)|0;dH(24152,264)|0;dH(24164,256)|0;dH(24176,248)|0;dH(24188,240)|0;dH(24200,232)|0;dH(24212,224)|0;dH(24224,168)|0;dH(24236,160)|0;dH(24248,144)|0;dH(24260,128)|0;dH(24272,120)|0;dH(24284,112)|0;dH(24296,104)|0;dH(24308,96)|0;dH(24320,248)|0;dH(24332,88)|0;dH(24344,80)|0;dH(24356,1976)|0;dH(24368,1968)|0;dH(24380,1960)|0;dH(24392,1952)|0;dH(24404,1944)|0;c[6342]=24128;d=c[6342]|0;return d|0}function jI(b){b=b|0;var d=0;if((a[26912]|0)!=0){d=c[6320]|0;return d|0}if((bt(26912)|0)==0){d=c[6320]|0;return d|0}do{if((a[26832]|0)==0){if((bt(26832)|0)==0){break}kV(23384,0,288);aP(124,0,u|0)|0}}while(0);dS(23384,824)|0;dS(
23396,784)|0;dS(23408,760)|0;dS(23420,736)|0;dS(23432,424)|0;dS(23444,712)|0;dS(23456,688)|0;dS(23468,656)|0;dS(23480,616)|0;dS(23492,584)|0;dS(23504,544)|0;dS(23516,504)|0;dS(23528,488)|0;dS(23540,472)|0;dS(23552,456)|0;dS(23564,440)|0;dS(23576,424)|0;dS(23588,408)|0;dS(23600,392)|0;dS(23612,376)|0;dS(23624,360)|0;dS(23636,344)|0;dS(23648,328)|0;dS(23660,312)|0;c[6320]=23384;d=c[6320]|0;return d|0}function jJ(b){b=b|0;var d=0;if((a[26984]|0)!=0){d=c[6346]|0;return d|0}if((bt(26984)|0)==0){d=c[6346]|0;return d|0}do{if((a[26872]|0)==0){if((bt(26872)|0)==0){break}kV(24584,0,288);aP(122,0,u|0)|0}}while(0);dH(24584,864)|0;dH(24596,856)|0;c[6346]=24584;d=c[6346]|0;return d|0}function jK(b){b=b|0;var d=0;if((a[26928]|0)!=0){d=c[6324]|0;return d|0}if((bt(26928)|0)==0){d=c[6324]|0;return d|0}do{if((a[26848]|0)==0){if((bt(26848)|0)==0){break}kV(23840,0,288);aP(238,0,u|0)|0}}while(0);dS(23840,888)|0;dS(23852,872)|0;c[6324]=23840;d=c[6324]|0;return d|0}function jL(b){b=b|0;if((a[26992]|0)!=0){return 25392}if((bt(26992)|0)==0){return 25392}dE(25392,1216,8);aP(258,25392,u|0)|0;return 25392}function jM(b){b=b|0;if((a[26936]|0)!=0){return 25304}if((bt(26936)|0)==0){return 25304}dP(25304,1176,kg(1176)|0);aP(192,25304,u|0)|0;return 25304}function jN(b){b=b|0;if((a[27016]|0)!=0){return 25440}if((bt(27016)|0)==0){return 25440}dE(25440,1160,8);aP(258,25440,u|0)|0;return 25440}function jO(b){b=b|0;if((a[26960]|0)!=0){return 25352}if((bt(26960)|0)==0){return 25352}dP(25352,1104,kg(1104)|0);aP(192,25352,u|0)|0;return 25352}function jP(b){b=b|0;if((a[27008]|0)!=0){return 25424}if((bt(27008)|0)==0){return 25424}dE(25424,1080,20);aP(258,25424,u|0)|0;return 25424}function jQ(b){b=b|0;if((a[26952]|0)!=0){return 25336}if((bt(26952)|0)==0){return 25336}dP(25336,992,kg(992)|0);aP(192,25336,u|0)|0;return 25336}function jR(b){b=b|0;if((a[27e3]|0)!=0){return 25408}if((bt(27e3)|0)==0){return 25408}dE(25408,976,11);aP(258,25408,u|0)|0;return 25408}function jS(b){b=b|0;if((a[26944]|0)!=0){return 25320}if((bt(26944)|0)==0){return 25320}dP(25320,928,kg(928)|0);aP(192,25320,u|0)|0;return 25320}function jT(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bI()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=+kU(b,g,c[6226]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function jU(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bI()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=+kU(b,g,c[6226]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function jV(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,
l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bI()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);l=+kU(b,g,c[6226]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function jW(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=bI()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);n=a6(b|0,h|0,f|0,c[6226]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=K;k=n;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(K=j,k)|0}function jX(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bI()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);m=a6(b|0,h|0,f|0,c[6226]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function jY(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bI()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);m=a6(b|0,h|0,f|0,c[6226]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function jZ(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bI()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);m=a6(b|0,h|0,f|0,c[6226]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function j_(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}l=bI()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);n=bf(b|0,h|0,f|0,c[6226]|0)|0;f=K;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}if((b|0)!=34){j=f;k=n;i=g;return(K=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&n>>>0>0>>>0;j=b?
2147483647:-2147483648;k=b?-1:0;i=g;return(K=j,k)|0}function j$(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=bI()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[26896]|0)==0){if((bt(26896)|0)==0){break}c[6226]=bH(2147483647,1344,0)|0}}while(0);m=bf(b|0,h|0,f|0,c[6226]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&m>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&m>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function j0(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+4|0;d=(c[a>>2]|0)+(c[b+4>>2]|0)|0;a=d;e=c[b>>2]|0;if((e&1|0)==0){f=e;bV[f&511](a);return}else{f=c[(c[d>>2]|0)+(e-1)>>2]|0;bV[f&511](a);return}}function j1(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(h-i>>2>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[f>>2]|0}k=l+4|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b+16|0;k=b|0;l=c[k>>2]|0;g=i-l>>2;i=g+d|0;if(i>>>0>1073741823>>>0){id(0)}m=h-l|0;do{if(m>>2>>>0>536870910>>>0){n=1073741823;o=1018}else{l=m>>1;h=l>>>0<i>>>0?i:l;if((h|0)==0){p=0;q=0;break}l=b+128|0;if(!((a[l]&1)==0&h>>>0<29>>>0)){n=h;o=1018;break}a[l]=1;p=j;q=h}}while(0);if((o|0)==1018){p=kL(n<<2)|0;q=n}n=d;d=p+(g<<2)|0;do{if((d|0)==0){r=0}else{c[d>>2]=0;r=d}d=r+4|0;n=n-1|0;}while((n|0)!=0);n=p+(q<<2)|0;q=c[k>>2]|0;r=(c[f>>2]|0)-q|0;o=p+(g-(r>>2)<<2)|0;g=o;p=q;kX(g|0,p|0,r)|0;c[k>>2]=o;c[f>>2]=d;c[e>>2]=n;if((q|0)==0){return}if((q|0)==(j|0)){a[b+128|0]=0;return}else{kN(p);return}}function j2(a){a=a|0;dR(24116);dR(24104);dR(24092);dR(24080);dR(24068);dR(24056);dR(24044);dR(24032);dR(24020);dR(24008);dR(23996);dR(23984);dR(23972);dR(23960);dR(23948);dR(23936);dR(23924);dR(23912);dR(23900);dR(23888);dR(23876);dR(23864);dR(23852);dR(23840);return}function j3(a){a=a|0;dG(24860);dG(24848);dG(24836);dG(24824);dG(24812);dG(24800);dG(24788);dG(24776);dG(24764);dG(24752);dG(24740);dG(24728);dG(24716);dG(24704);dG(24692);dG(24680);dG(24668);dG(24656);dG(24644);dG(24632);dG(24620);dG(24608);dG(24596);dG(24584);return}function j4(a){a=a|0;dR(23660);dR(23648);dR(23636);dR(23624);dR(23612);dR(23600);dR(23588);dR(23576);dR(23564);dR(23552);dR(23540);dR(23528);dR(23516);dR(23504);dR(23492);dR(23480);dR(23468);dR(23456);dR(23444);dR(23432);dR(23420);dR(23408);dR(23396);dR(23384);return}function j5(a){a=a|0;dG(24404);dG(24392);dG(24380);dG(24368);dG(24356);dG(24344);dG(24332);dG(24320);dG(24308);dG(24296);dG(24284);dG(24272);dG(24260);dG(24248);dG(24236);dG(24224);dG(24212);dG(24200);dG(24188);dG(24176);dG(24164);dG(24152);dG(24140);dG(24128);return}function j6(a){a=a|0;dR(23828);dR(23816);dR(23804);dR(23792);dR(23780);dR(23768);dR(23756);dR(23744);dR(23732);dR(23720);dR(23708);dR(23696);dR(23684);dR(23672);return}function j7(a){a=a|0;dG(24572);dG(24560);dG(
24548);dG(24536);dG(24524);dG(24512);dG(24500);dG(24488);dG(24476);dG(24464);dG(24452);dG(24440);dG(24428);dG(24416);return}function j8(a,b,c){a=a|0;b=b|0;c=c|0;return j9(0,a,b,(c|0)!=0?c:22904)|0}function j9(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;j=((f|0)==0?22896:f)|0;f=c[j>>2]|0;L1125:do{if((d|0)==0){if((f|0)==0){k=0}else{break}i=g;return k|0}else{if((b|0)==0){l=h;c[h>>2]=l;m=l}else{m=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){l=a[d]|0;n=l&255;if(l<<24>>24>-1){c[m>>2]=n;k=l<<24>>24!=0|0;i=g;return k|0}else{l=n-194|0;if(l>>>0>50>>>0){break L1125}o=d+1|0;p=c[s+(l<<2)>>2]|0;q=e-1|0;break}}else{o=d;p=f;q=e}}while(0);L1141:do{if((q|0)==0){r=p}else{l=a[o]|0;n=(l&255)>>>3;if((n-16|n+(p>>26))>>>0>7>>>0){break L1125}else{t=o;u=p;v=q;w=l}while(1){t=t+1|0;u=(w&255)-128|u<<6;v=v-1|0;if((u|0)>=0){break}if((v|0)==0){r=u;break L1141}w=a[t]|0;if(((w&255)-128|0)>>>0>63>>>0){break L1125}}c[j>>2]=0;c[m>>2]=u;k=e-v|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(bI()|0)>>2]=84;k=-1;i=g;return k|0}function ka(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;i=i+1032|0;h=g|0;j=g+1024|0;k=c[b>>2]|0;c[j>>2]=k;l=(a|0)!=0;m=l?e:256;e=l?a:h|0;L1156:do{if((k|0)==0|(m|0)==0){n=0;o=d;p=m;q=e;r=k}else{a=h|0;s=m;t=d;u=0;v=e;w=k;while(1){x=t>>>2;y=x>>>0>=s>>>0;if(!(y|t>>>0>131>>>0)){n=u;o=t;p=s;q=v;r=w;break L1156}z=y?s:x;A=t-z|0;x=kb(v,j,z,f)|0;if((x|0)==-1){break}if((v|0)==(a|0)){B=a;C=s}else{B=v+(x<<2)|0;C=s-x|0}z=x+u|0;x=c[j>>2]|0;if((x|0)==0|(C|0)==0){n=z;o=A;p=C;q=B;r=x;break L1156}else{s=C;t=A;u=z;v=B;w=x}}n=-1;o=A;p=0;q=v;r=c[j>>2]|0}}while(0);L1167:do{if((r|0)==0){D=n}else{if((p|0)==0|(o|0)==0){D=n;break}else{E=p;F=o;G=n;H=q;I=r}while(1){J=j9(H,I,F,f)|0;if((J+2|0)>>>0<3>>>0){break}A=(c[j>>2]|0)+J|0;c[j>>2]=A;B=E-1|0;C=G+1|0;if((B|0)==0|(F|0)==(J|0)){D=C;break L1167}else{E=B;F=F-J|0;G=C;H=H+4|0;I=A}}if((J|0)==0){c[j>>2]=0;D=G;break}else if((J|0)==(-1|0)){D=-1;break}else{c[f>>2]=0;D=G;break}}}while(0);if(!l){i=g;return D|0}c[b>>2]=c[j>>2];i=g;return D|0}function kb(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;h=c[e>>2]|0;do{if((g|0)==0){i=1088}else{j=g|0;k=c[j>>2]|0;if((k|0)==0){i=1088;break}if((b|0)==0){l=k;m=h;n=f;i=1099;break}c[j>>2]=0;o=k;p=h;q=b;r=f;i=1119}}while(0);if((i|0)==1088){if((b|0)==0){t=h;u=f;i=1090}else{v=h;w=b;x=f;i=1089}}L1188:while(1){if((i|0)==1089){i=0;if((x|0)==0){y=f;i=1137;break}else{z=x;A=w;B=v}while(1){h=a[B]|0;do{if(((h&255)-1|0)>>>0<127>>>0){if((B&3|0)==0&z>>>0>3>>>0){C=z;D=A;E=B}else{F=B;G=A;H=z;I=h;break}while(1){J=c[E>>2]|0;if(((J-16843009|J)&-2139062144|0)!=0){i=1113;break}c[D>>2]=J&255;c[D+4>>2]
=d[E+1|0]|0;c[D+8>>2]=d[E+2|0]|0;K=E+4|0;L=D+16|0;c[D+12>>2]=d[E+3|0]|0;M=C-4|0;if(M>>>0>3>>>0){C=M;D=L;E=K}else{i=1114;break}}if((i|0)==1113){i=0;F=E;G=D;H=C;I=J&255;break}else if((i|0)==1114){i=0;F=K;G=L;H=M;I=a[K]|0;break}}else{F=B;G=A;H=z;I=h}}while(0);N=I&255;if((N-1|0)>>>0>=127>>>0){break}c[G>>2]=N;h=H-1|0;if((h|0)==0){y=f;i=1138;break L1188}else{z=h;A=G+4|0;B=F+1|0}}h=N-194|0;if(h>>>0>50>>>0){O=H;P=G;Q=F;i=1130;break}o=c[s+(h<<2)>>2]|0;p=F+1|0;q=G;r=H;i=1119;continue}else if((i|0)==1099){i=0;h=(d[m]|0)>>>3;if((h-16|h+(l>>26))>>>0>7>>>0){i=1100;break}h=m+1|0;do{if((l&33554432|0)==0){R=h}else{if(((d[h]|0)-128|0)>>>0>63>>>0){i=1103;break L1188}g=m+2|0;if((l&524288|0)==0){R=g;break}if(((d[g]|0)-128|0)>>>0>63>>>0){i=1106;break L1188}R=m+3|0}}while(0);t=R;u=n-1|0;i=1090;continue}else if((i|0)==1090){i=0;h=a[t]|0;do{if(((h&255)-1|0)>>>0<127>>>0){if((t&3|0)!=0){S=t;T=u;U=h;break}g=c[t>>2]|0;if(((g-16843009|g)&-2139062144|0)==0){V=u;W=t}else{S=t;T=u;U=g&255;break}do{W=W+4|0;V=V-4|0;X=c[W>>2]|0;}while(((X-16843009|X)&-2139062144|0)==0);S=W;T=V;U=X&255}else{S=t;T=u;U=h}}while(0);h=U&255;if((h-1|0)>>>0<127>>>0){t=S+1|0;u=T-1|0;i=1090;continue}g=h-194|0;if(g>>>0>50>>>0){O=T;P=b;Q=S;i=1130;break}l=c[s+(g<<2)>>2]|0;m=S+1|0;n=T;i=1099;continue}else if((i|0)==1119){i=0;g=d[p]|0;h=g>>>3;if((h-16|h+(o>>26))>>>0>7>>>0){i=1120;break}h=p+1|0;Y=g-128|o<<6;do{if((Y|0)<0){g=(d[h]|0)-128|0;if(g>>>0>63>>>0){i=1123;break L1188}k=p+2|0;Z=g|Y<<6;if((Z|0)>=0){_=Z;$=k;break}g=(d[k]|0)-128|0;if(g>>>0>63>>>0){i=1126;break L1188}_=g|Z<<6;$=p+3|0}else{_=Y;$=h}}while(0);c[q>>2]=_;v=$;w=q+4|0;x=r-1|0;i=1089;continue}}if((i|0)==1126){aa=Z;ab=p-1|0;ac=q;ad=r;i=1129}else if((i|0)==1100){aa=l;ab=m-1|0;ac=b;ad=n;i=1129}else if((i|0)==1103){aa=l;ab=m-1|0;ac=b;ad=n;i=1129}else if((i|0)==1123){aa=Y;ab=p-1|0;ac=q;ad=r;i=1129}else if((i|0)==1106){aa=l;ab=m-1|0;ac=b;ad=n;i=1129}else if((i|0)==1120){aa=o;ab=p-1|0;ac=q;ad=r;i=1129}else if((i|0)==1137){return y|0}else if((i|0)==1138){return y|0}if((i|0)==1129){if((aa|0)==0){O=ad;P=ac;Q=ab;i=1130}else{ae=ac;af=ab}}do{if((i|0)==1130){if((a[Q]|0)!=0){ae=P;af=Q;break}if((P|0)!=0){c[P>>2]=0;c[e>>2]=0}y=f-O|0;return y|0}}while(0);c[(bI()|0)>>2]=84;if((ae|0)==0){y=-1;return y|0}c[e>>2]=af;y=-1;return y|0}function kc(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){k=h;c[h>>2]=k;l=k}else{l=b}k=a[e]|0;m=k&255;if(k<<24>>24>-1){c[l>>2]=m;j=k<<24>>24!=0|0;i=g;return j|0}k=m-194|0;if(k>>>0>50>>>0){break}m=e+1|0;n=c[s+(k<<2)>>2]|0;if(f>>>0<4>>>0){if((n&-2147483648>>>(((f*6|0)-6|0)>>>0)|0)!=0){break}}k=d[m]|0;m=k>>>3;if((m-16|m+(n>>26))>>>0>7>>>0){break}m=k-128|n<<6;if((m|0)>=0){c[l>>2]=m;j=2;i=g;return j|0}n=(d[e+2|0]|0)-128|0;if(n>>>0>63>>>0){break}k=n|m<<6;if((k|0)>=0){c[l>>2]=k;j=3;i=g;return j|0}m=(d[e+3|0]|0)-128|0;if(m>>>0>63>>>0){break}c[l>>2]=m|k<<6;j=4;i=g;return j|0}}while(0);c[(bI()|0)>>2]=84;j=-1;i=g;return j|0}function kd(b,d,e){b=b|0;d=d|0;
e=e|0;var f=0;if((b|0)==0){f=1;return f|0}if(d>>>0<128>>>0){a[b]=d&255;f=1;return f|0}if(d>>>0<2048>>>0){a[b]=(d>>>6|192)&255;a[b+1|0]=(d&63|128)&255;f=2;return f|0}if(d>>>0<55296>>>0|(d-57344|0)>>>0<8192>>>0){a[b]=(d>>>12|224)&255;a[b+1|0]=(d>>>6&63|128)&255;a[b+2|0]=(d&63|128)&255;f=3;return f|0}if((d-65536|0)>>>0<1048576>>>0){a[b]=(d>>>18|240)&255;a[b+1|0]=(d>>>12&63|128)&255;a[b+2|0]=(d>>>6&63|128)&255;a[b+3|0]=(d&63|128)&255;f=4;return f|0}else{c[(bI()|0)>>2]=84;f=-1;return f|0}return 0}function ke(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+264|0;g=f|0;h=f+256|0;j=c[b>>2]|0;c[h>>2]=j;k=(a|0)!=0;l=k?e:256;e=k?a:g|0;L1309:do{if((j|0)==0|(l|0)==0){m=0;n=d;o=l;p=e;q=j}else{a=g|0;r=l;s=d;t=0;u=e;v=j;while(1){w=s>>>0>=r>>>0;if(!(w|s>>>0>32>>>0)){m=t;n=s;o=r;p=u;q=v;break L1309}x=w?r:s;y=s-x|0;w=kf(u,h,x,0)|0;if((w|0)==-1){break}if((u|0)==(a|0)){z=a;A=r}else{z=u+w|0;A=r-w|0}x=w+t|0;w=c[h>>2]|0;if((w|0)==0|(A|0)==0){m=x;n=y;o=A;p=z;q=w;break L1309}else{r=A;s=y;t=x;u=z;v=w}}m=-1;n=y;o=0;p=u;q=c[h>>2]|0}}while(0);L1320:do{if((q|0)==0){B=m}else{if((o|0)==0|(n|0)==0){B=m;break}else{C=o;D=n;E=m;F=p;G=q}while(1){H=kd(F,c[G>>2]|0,0)|0;if((H+1|0)>>>0<2>>>0){break}y=(c[h>>2]|0)+4|0;c[h>>2]=y;z=D-1|0;A=E+1|0;if((C|0)==(H|0)|(z|0)==0){B=A;break L1320}else{C=C-H|0;D=z;E=A;F=F+H|0;G=y}}if((H|0)!=0){B=-1;break}c[h>>2]=0;B=E}}while(0);if(!k){i=f;return B|0}c[b>>2]=c[h>>2];i=f;return B|0}function kf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+8|0;g=f|0;if((b|0)==0){h=c[d>>2]|0;j=g|0;k=c[h>>2]|0;if((k|0)==0){l=0;i=f;return l|0}else{m=0;n=h;o=k}while(1){if(o>>>0>127>>>0){k=kd(j,o,0)|0;if((k|0)==-1){l=-1;p=1229;break}else{q=k}}else{q=1}k=q+m|0;h=n+4|0;r=c[h>>2]|0;if((r|0)==0){l=k;p=1233;break}else{m=k;n=h;o=r}}if((p|0)==1229){i=f;return l|0}else if((p|0)==1233){i=f;return l|0}}L1346:do{if(e>>>0>3>>>0){o=e;n=b;m=c[d>>2]|0;while(1){q=c[m>>2]|0;if((q|0)==0){s=o;t=n;break L1346}if(q>>>0>127>>>0){j=kd(n,q,0)|0;if((j|0)==-1){l=-1;break}u=n+j|0;v=o-j|0;w=m}else{a[n]=q&255;u=n+1|0;v=o-1|0;w=c[d>>2]|0}q=w+4|0;c[d>>2]=q;if(v>>>0>3>>>0){o=v;n=u;m=q}else{s=v;t=u;break L1346}}i=f;return l|0}else{s=e;t=b}}while(0);L1358:do{if((s|0)==0){x=0}else{b=g|0;u=s;v=t;w=c[d>>2]|0;while(1){m=c[w>>2]|0;if((m|0)==0){p=1226;break}if(m>>>0>127>>>0){n=kd(b,m,0)|0;if((n|0)==-1){l=-1;p=1231;break}if(n>>>0>u>>>0){p=1222;break}o=c[w>>2]|0;kd(v,o,0)|0;y=v+n|0;z=u-n|0;A=w}else{a[v]=m&255;y=v+1|0;z=u-1|0;A=c[d>>2]|0}m=A+4|0;c[d>>2]=m;if((z|0)==0){x=0;break L1358}else{u=z;v=y;w=m}}if((p|0)==1222){l=e-u|0;i=f;return l|0}else if((p|0)==1231){i=f;return l|0}else if((p|0)==1226){a[v]=0;x=u;break}}}while(0);c[d>>2]=0;l=e-x|0;i=f;return l|0}function kg(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function kh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((d|0)==0){return a|0}
else{e=b;f=d;g=a}while(1){d=f-1|0;c[g>>2]=c[e>>2];if((d|0)==0){break}else{e=e+4|0;f=d;g=g+4|0}}return a|0}function ki(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(e){return a|0}else{f=d}do{f=f-1|0;c[a+(f<<2)>>2]=c[b+(f<<2)>>2];}while((f|0)!=0);return a|0}else{if(e){return a|0}else{g=b;h=d;i=a}while(1){d=h-1|0;c[i>>2]=c[g>>2];if((d|0)==0){break}else{g=g+4|0;h=d;i=i+4|0}}return a|0}return 0}function kj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;if((d|0)==0){return a|0}else{e=d;f=a}while(1){d=e-1|0;c[f>>2]=b;if((d|0)==0){break}else{e=d;f=f+4|0}}return a|0}function kk(a){a=a|0;return}function kl(a){a=a|0;c[a>>2]=2568;return}function km(a){a=a|0;kN(a);return}function kn(a){a=a|0;return}function ko(a){a=a|0;return 1312}function kp(a){a=a|0;kk(a|0);return}function kq(a){a=a|0;return}function kr(a){a=a|0;return}function ks(a){a=a|0;kk(a|0);kN(a);return}function kt(a){a=a|0;kk(a|0);kN(a);return}function ku(a){a=a|0;kk(a|0);kN(a);return}function kv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=kz(b,9856,9840,-1)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}kV(f|0,0,56);c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;b8[c[(c[h>>2]|0)+28>>2]&15](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function kw(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function kx(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;b8[c[(c[g>>2]|0)+28>>2]&15](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function ky(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;b8[c[(c[j>>2]|0)+28>>2]&15](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;b8[c[(c[j>>2]|0)+28>>2]&15](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=1326;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=1327;break}}if((m|0)==1326){return}else if((m|0)==1327){return}}function kz(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;
e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;kV(e|0,0,39);if((k|0)==(d|0)){c[g+48>>2]=1;b5[c[(c[k>>2]|0)+20>>2]&31](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}bT[c[(c[k>>2]|0)+24>>2]&7](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==0){if((c[n>>2]|0)!=1){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}o=(c[m>>2]|0)==1?c[b>>2]|0:0;i=f;return o|0}else if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)!=0){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}if((c[m>>2]|0)==1){break}else{o=0}i=f;return o|0}}while(0);o=c[e>>2]|0;i=f;return o|0}else{o=0;i=f;return o|0}return 0}function kA(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L1540:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L1542:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;b5[c[(c[v>>2]|0)+20>>2]&31](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L1542}else{z=1;A=r;break}}if((c[p>>2]|0)==1){B=1377;break L1540}if((c[o>>2]&2|0)==0){B=1377;break L1540}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if(y){C=x;B=1376}else{D=x;B=1373}}else{D=0;B=1373}}while(0);do{if((B|0)==1373){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){C=D;B=1376;break}if((c[d+24>>2]|0)!=2){C=D;B=1376;break}a[d+54|0]=1;if(D){B=1377}else{B=1378}}}while(0);if((B|0)==1376){if(C){B=1377}else{B=1378}}if((B|0)==1377){c[i>>2]=3;return}else if((B|0)==1378){c[i>>2]=4;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}C=c[b+12>>2]|0;D=b+16+(C<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;bT[c[(c[y>>2]|0)+24>>2]&7](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((C|0)<=1){return}C=c[b+8>>2]|0;do{if((C&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((C&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){B=1414;break}if((c[b>>2]|0)==1){B=1415;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;bT[c[(c[w>>2]|0)+24>>2]&7](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<D>>>0){A=z}else{B=1416;break}}if((B|0)==1414){return}else if((B|0)==1415){return}else if((B|0)==1416){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){B=1411;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){B=1412;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;bT[c[(c[w>>2]|0)+24>>2]&7](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<D>>>0){i=z}else{B=1413;break}}if((B|0)==1411){return}else if((B|0)==1412){return}else if((B|0)
==1413){return}}}while(0);G=d+54|0;F=e;C=x;while(1){if((a[G]&1)!=0){B=1418;break}x=c[C+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[C>>2]|0;bT[c[(c[i>>2]|0)+24>>2]&7](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=C+8|0;if(x>>>0<D>>>0){C=x}else{B=1419;break}}if((B|0)==1418){return}else if((B|0)==1419){return}}function kB(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;bT[c[(c[h>>2]|0)+24>>2]&7](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;b5[c[(c[l>>2]|0)+20>>2]&31](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=1433}else{if((a[j]&1)==0){m=1;n=1433}}L1642:do{if((n|0)==1433){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=1436;break}a[d+54|0]=1;if(m){break L1642}}else{n=1436}}while(0);if((n|0)==1436){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function kC(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function kD(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;b5[c[(c[p>>2]|0)+20>>2]&31](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L1691:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L1691}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L1691}}else{if((c[o>>2]|0)==1){break L1691}if((c[q>>2]&2|0)==0){break L1691}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;b5[c[(c[u>>2]|0)+20>>2]&31](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function kE(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;b5[c[(c[i>>2]|0)+20>>2]&31](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[
d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function kF(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function kG(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[5728]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=22952+(h<<2)|0;j=22952+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[5728]=e&~(1<<g)}else{if(l>>>0<(c[5732]|0)>>>0){aQ();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{aQ();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[5730]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=22952+(p<<2)|0;m=22952+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[5728]=e&~(1<<r)}else{if(l>>>0<(c[5732]|0)>>>0){aQ();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{aQ();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[5730]|0;if((l|0)!=0){q=c[5733]|0;d=l>>>3;l=d<<1;f=22952+(l<<2)|0;k=c[5728]|0;h=1<<d;do{if((k&h|0)==0){c[5728]=k|h;s=f;t=22952+(l+2<<2)|0}else{d=22952+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[5732]|0)>>>0){s=g;t=d;break}aQ();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[5730]=m;c[5733]=e;n=i;return n|0}l=c[5729]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[23216+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[5732]|0;if(r>>>0<i>>>0){aQ();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){aQ();return 0}e=c[d+24>>2]|0;
f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){aQ();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){aQ();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){aQ();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{aQ();return 0}}}while(0);L1858:do{if((e|0)!=0){f=d+28|0;i=23216+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[5729]=c[5729]&~(1<<c[f>>2]);break L1858}else{if(e>>>0<(c[5732]|0)>>>0){aQ();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L1858}}}while(0);if(v>>>0<(c[5732]|0)>>>0){aQ();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[5730]|0;if((f|0)!=0){e=c[5733]|0;i=f>>>3;f=i<<1;q=22952+(f<<2)|0;k=c[5728]|0;g=1<<i;do{if((k&g|0)==0){c[5728]=k|g;y=q;z=22952+(f+2<<2)|0}else{i=22952+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[5732]|0)>>>0){y=l;z=i;break}aQ();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[5730]=p;c[5733]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[5729]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[23216+(A<<2)>>2]|0;L1906:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L1906}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[23216+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[5730]|0)-g|0)>>>0){o=g;break}q=K;m=c[5732]|0;if(q>>>0<m>>>0){aQ();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){aQ();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}
}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){aQ();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){aQ();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){aQ();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{aQ();return 0}}}while(0);L1956:do{if((e|0)!=0){i=K+28|0;m=23216+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[5729]=c[5729]&~(1<<c[i>>2]);break L1956}else{if(e>>>0<(c[5732]|0)>>>0){aQ();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L1956}}}while(0);if(L>>>0<(c[5732]|0)>>>0){aQ();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=22952+(e<<2)|0;r=c[5728]|0;j=1<<i;do{if((r&j|0)==0){c[5728]=r|j;O=m;P=22952+(e+2<<2)|0}else{i=22952+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[5732]|0)>>>0){O=d;P=i;break}aQ();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=23216+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[5729]|0;l=1<<Q;if((m&l|0)==0){c[5729]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1693;break}else{l=l<<1;m=j}}if((T|0)==1693){if(S>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[5732]|0;if(m>>>0<i>>>0){aQ();return 0}if(j>>>0<i>>>0){aQ();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[5730]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[5733]|0;if(S>>>0>15>>>0){R=J;c[5733]=R+o;c[5730]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[5730]=0;c[5733]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[5731]|0;if(o>>>0<J>>>0){S=J-o|0;c[5731]=S;J=c[5734]|0;K=J;c[5734]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[5718]|0)==0){J=aZ(30)|0;if((J-1&J|0)==0){c[5720]=J;c[5719]=J;c[5721]=-1;c[5722]=-1;c[5723]=0;c[5839]=0;c[5718]=(bi(0)|0)&-16^1431655768;break}else{aQ();return 0}}}while(0);J=o+48|0;S=c[5720]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[5838]|0;do{if((O|0)!=0){P=c[5836]|0;L=P+S|0;if(
L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2048:do{if((c[5839]&4|0)==0){O=c[5734]|0;L2050:do{if((O|0)==0){T=1723}else{L=O;P=23360;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1723;break L2050}else{P=M}}if((P|0)==0){T=1723;break}L=R-(c[5731]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=bF(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=1732}}while(0);do{if((T|0)==1723){O=bF(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[5719]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[5836]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[5838]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=bF($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=1732}}while(0);L2070:do{if((T|0)==1732){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1743;break L2048}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[5720]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((bF(O|0)|0)==-1){bF(m|0)|0;W=Y;break L2070}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1743;break L2048}}}while(0);c[5839]=c[5839]|4;ad=W;T=1740}else{ad=0;T=1740}}while(0);do{if((T|0)==1740){if(S>>>0>=2147483647>>>0){break}W=bF(S|0)|0;Z=bF(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=1743}}}while(0);do{if((T|0)==1743){ad=(c[5836]|0)+aa|0;c[5836]=ad;if(ad>>>0>(c[5837]|0)>>>0){c[5837]=ad}ad=c[5734]|0;L2090:do{if((ad|0)==0){S=c[5732]|0;if((S|0)==0|ab>>>0<S>>>0){c[5732]=ab}c[5840]=ab;c[5841]=aa;c[5843]=0;c[5737]=c[5718];c[5736]=-1;S=0;do{Y=S<<1;ac=22952+(Y<<2)|0;c[22952+(Y+3<<2)>>2]=ac;c[22952+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[5734]=ab+ae;c[5731]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[5735]=c[5722]}else{S=23360;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1755;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1755){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[5734]|0;Y=(c[5731]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[5734]=Z+ai;c[5731]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[5735]=c[5722];break L2090}}while(0);if(ab>>>0<(c[5732]|0)>>>0){c[5732]=ab}S=ab+aa|0;Y=23360;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1765;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1765){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[5734]|0)){J=(c[5731]|0)+K|0;c[5731]=J;c[5734]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[5733]|0)){J=(c[5730]|0)+K|0;c[5730]=J;c[5733]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L2135:do{if(X>>>0<256>>>0){U=c[ab+((
al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=22952+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[5732]|0)>>>0){aQ();return 0}if((c[U+12>>2]|0)==(Z|0)){break}aQ();return 0}}while(0);if((Q|0)==(U|0)){c[5728]=c[5728]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[5732]|0)>>>0){aQ();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}aQ();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[5732]|0)>>>0){aQ();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){aQ();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{aQ();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=23216+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[5729]=c[5729]&~(1<<c[P>>2]);break L2135}else{if(m>>>0<(c[5732]|0)>>>0){aQ();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L2135}}}while(0);if(an>>>0<(c[5732]|0)>>>0){aQ();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=22952+(V<<2)|0;P=c[5728]|0;m=1<<J;do{if((P&m|0)==0){c[5728]=P|m;as=X;at=22952+(V+2<<2)|0}else{J=22952+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[5732]|0)>>>0){as=U;at=J;break}aQ();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=23216+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[5729]|0;Q=1<<au;if((X&Q|0)==0){c[5729]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=1838;break}else{Q=Q<<1;X=m}}if((T|0)==1838){if(aw>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[5732]|0;if(X>>>0<$>>>0){aQ();return 0}if(m>>>0<$>>>0){aQ();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=23360;while(1){ax=c[
W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[5734]=ab+aB;c[5731]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[5735]=c[5722];c[ac+4>>2]=27;c[W>>2]=c[5840];c[W+4>>2]=c[5841];c[W+8>>2]=c[5842];c[W+12>>2]=c[5843];c[5840]=ab;c[5841]=aa;c[5843]=0;c[5842]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=22952+(K<<2)|0;S=c[5728]|0;m=1<<W;do{if((S&m|0)==0){c[5728]=S|m;aC=Z;aD=22952+(K+2<<2)|0}else{W=22952+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[5732]|0)>>>0){aC=Q;aD=W;break}aQ();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215>>>0){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=23216+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[5729]|0;Q=1<<aE;if((Z&Q|0)==0){c[5729]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=1873;break}else{Q=Q<<1;Z=m}}if((T|0)==1873){if(aG>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[5732]|0;if(Z>>>0<m>>>0){aQ();return 0}if(_>>>0<m>>>0){aQ();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[5731]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[5731]=_;ad=c[5734]|0;Q=ad;c[5734]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(bI()|0)>>2]=12;n=0;return n|0}function kH(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[5732]|0;if(b>>>0<e>>>0){aQ()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){aQ()}h=f&-8;i=a+(h-8)|0;j=i;L2307:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){aQ()}if((n|0)==(c[5733]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[5730]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=22952+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){aQ()}if((c[k+12>>2]|0)==(n|0)){break}aQ()}}while(0);if((s|0)==(k|0)){c[5728]=c[5728]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){aQ()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}aQ()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)
|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){aQ()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){aQ()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){aQ()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{aQ()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=23216+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[5729]=c[5729]&~(1<<c[v>>2]);q=n;r=o;break L2307}else{if(p>>>0<(c[5732]|0)>>>0){aQ()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L2307}}}while(0);if(A>>>0<(c[5732]|0)>>>0){aQ()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5732]|0)>>>0){aQ()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[5732]|0)>>>0){aQ()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){aQ()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){aQ()}do{if((e&2|0)==0){if((j|0)==(c[5734]|0)){B=(c[5731]|0)+r|0;c[5731]=B;c[5734]=q;c[q+4>>2]=B|1;if((q|0)!=(c[5733]|0)){return}c[5733]=0;c[5730]=0;return}if((j|0)==(c[5733]|0)){B=(c[5730]|0)+r|0;c[5730]=B;c[5733]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L2409:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=22952+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[5732]|0)>>>0){aQ()}if((c[u+12>>2]|0)==(j|0)){break}aQ()}}while(0);if((g|0)==(u|0)){c[5728]=c[5728]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[5732]|0)>>>0){aQ()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}aQ()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[5732]|0)>>>0){aQ()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[5732]|0)>>>0){aQ()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){aQ()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{aQ()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=23216+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[5729]=c[5729]&~(1<<c[t>>2]);break L2409}else{if(f>>>0<(c[5732]|0)>>>0){aQ()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L2409}}}while(0);if(E>>>0<(c[5732]|0)>>>0){aQ()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[5732]|0)>>>0){aQ()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[5732]|0)>>>0){aQ()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[5733]|0)){H=B;break}c[5730]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=22952+(d<<2)
|0;A=c[5728]|0;E=1<<r;do{if((A&E|0)==0){c[5728]=A|E;I=e;J=22952+(d+2<<2)|0}else{r=22952+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[5732]|0)>>>0){I=h;J=r;break}aQ()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=23216+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[5729]|0;d=1<<K;do{if((r&d|0)==0){c[5729]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=2050;break}else{A=A<<1;J=E}}if((N|0)==2050){if(M>>>0<(c[5732]|0)>>>0){aQ()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[5732]|0;if(J>>>0<E>>>0){aQ()}if(B>>>0<E>>>0){aQ()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[5736]|0)-1|0;c[5736]=q;if((q|0)==0){O=23368}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[5736]=-1;return}function kI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=kG(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(bI()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=kJ(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=kG(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;kX(f|0,a|0,e)|0;kH(a);d=f;return d|0}function kJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[5732]|0;if(g>>>0<j>>>0){aQ();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){aQ();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){aQ();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[5720]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;kK(g+b|0,k);n=a;return n|0}if((i|0)==(c[5734]|0)){k=(c[5731]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[5734]=g+b;c[5731]=l;n=a;return n|0}if((i|0)==(c[5733]|0)){l=(c[5730]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[5730]=q;c[5733]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L2596:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=22952+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){aQ();return 0}if((c[l+12>>2]|0)==(i|0)){break}aQ();return 0}}while(0);if((k|0)==(l|0)){c[5728]=c[5728]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){aQ();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}
aQ();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){aQ();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){aQ();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){aQ();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{aQ();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=23216+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[5729]=c[5729]&~(1<<c[t>>2]);break L2596}else{if(s>>>0<(c[5732]|0)>>>0){aQ();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L2596}}}while(0);if(y>>>0<(c[5732]|0)>>>0){aQ();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[5732]|0)>>>0){aQ();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;kK(g+b|0,q);n=a;return n|0}return 0}function kK(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L2672:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[5732]|0;if(i>>>0<l>>>0){aQ()}if((j|0)==(c[5733]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[5730]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=22952+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){aQ()}if((c[p+12>>2]|0)==(j|0)){break}aQ()}}while(0);if((q|0)==(p|0)){c[5728]=c[5728]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){aQ()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}aQ()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){aQ()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){aQ()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){aQ()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{aQ()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=23216+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[5729]=c[5729]&~(1<<c[t>>2]);n=j;o=k;break L2672}else{if(m>>>0<(c[5732]|0)>>>0){aQ()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break 
L2672}}}while(0);if(y>>>0<(c[5732]|0)>>>0){aQ()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[5732]|0)>>>0){aQ()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[5732]|0)>>>0){aQ()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[5732]|0;if(e>>>0<a>>>0){aQ()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[5734]|0)){A=(c[5731]|0)+o|0;c[5731]=A;c[5734]=n;c[n+4>>2]=A|1;if((n|0)!=(c[5733]|0)){return}c[5733]=0;c[5730]=0;return}if((f|0)==(c[5733]|0)){A=(c[5730]|0)+o|0;c[5730]=A;c[5733]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L2771:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=22952+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){aQ()}if((c[g+12>>2]|0)==(f|0)){break}aQ()}}while(0);if((t|0)==(g|0)){c[5728]=c[5728]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){aQ()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}aQ()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){aQ()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){aQ()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){aQ()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{aQ()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=23216+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[5729]=c[5729]&~(1<<c[l>>2]);break L2771}else{if(m>>>0<(c[5732]|0)>>>0){aQ()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L2771}}}while(0);if(C>>>0<(c[5732]|0)>>>0){aQ()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[5732]|0)>>>0){aQ()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[5732]|0)>>>0){aQ()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[5733]|0)){F=A;break}c[5730]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=22952+(z<<2)|0;C=c[5728]|0;b=1<<o;do{if((C&b|0)==0){c[5728]=C|b;G=y;H=22952+(z+2<<2)|0}else{o=22952+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[5732]|0)>>>0){G=d;H=o;break}aQ()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=23216+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[5729]|0;z=1<<I;if((o&z|0)==0){c[5729]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=2330;break}
else{I=I<<1;J=G}}if((L|0)==2330){if(K>>>0<(c[5732]|0)>>>0){aQ()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[5732]|0;if(J>>>0<I>>>0){aQ()}if(L>>>0<I>>>0){aQ()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function kL(a){a=a|0;var b=0,d=0,e=0;b=(a|0)==0?1:a;while(1){d=kG(b)|0;if((d|0)!=0){e=2374;break}a=(I=c[6706]|0,c[6706]=I+0,I);if((a|0)==0){break}b1[a&1]()}if((e|0)==2374){return d|0}d=bd(4)|0;c[d>>2]=2536;aM(d|0,8312,34);return 0}function kM(a){a=a|0;return kL(a)|0}function kN(a){a=a|0;if((a|0)==0){return}kH(a);return}function kO(a){a=a|0;kN(a);return}function kP(a){a=a|0;kN(a);return}function kQ(a){a=a|0;return}function kR(a){a=a|0;return 1144}function kS(){var a=0;a=bd(4)|0;c[a>>2]=2536;aM(a|0,8312,34)}function kT(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0.0,R=0.0,S=0.0;e=b;while(1){f=e+1|0;if((be(a[e]|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==43){i=f;j=0}else if((g<<24>>24|0)==45){i=f;j=1}else{i=e;j=0}e=-1;f=0;g=i;while(1){k=a[g]|0;if(((k<<24>>24)-48|0)>>>0<10>>>0){l=e}else{if(k<<24>>24!=46|(e|0)>-1){break}else{l=f}}e=l;f=f+1|0;g=g+1|0}l=g+(-f|0)|0;i=(e|0)<0;m=((i^1)<<31>>31)+f|0;n=(m|0)>18;o=(n?-18:-m|0)+(i?f:e)|0;e=n?18:m;do{if((e|0)==0){p=b;q=0.0}else{if((e|0)>9){m=l;n=e;f=0;while(1){i=a[m]|0;r=m+1|0;if(i<<24>>24==46){s=a[r]|0;t=m+2|0}else{s=i;t=r}u=(f*10|0)-48+(s<<24>>24)|0;r=n-1|0;if((r|0)>9){m=t;n=r;f=u}else{break}}v=+(u|0)*1.0e9;w=9;x=t;y=2405}else{if((e|0)>0){v=0.0;w=e;x=l;y=2405}else{z=0.0;A=0.0}}if((y|0)==2405){f=x;n=w;m=0;while(1){r=a[f]|0;i=f+1|0;if(r<<24>>24==46){B=a[i]|0;C=f+2|0}else{B=r;C=i}D=(m*10|0)-48+(B<<24>>24)|0;i=n-1|0;if((i|0)>0){f=C;n=i;m=D}else{break}}z=+(D|0);A=v}E=A+z;do{if((k<<24>>24|0)==69|(k<<24>>24|0)==101){m=g+1|0;n=a[m]|0;if((n<<24>>24|0)==45){F=g+2|0;G=1}else if((n<<24>>24|0)==43){F=g+2|0;G=0}else{F=m;G=0}m=a[F]|0;if(((m<<24>>24)-48|0)>>>0<10>>>0){H=F;I=0;J=m}else{K=0;L=F;M=G;break}while(1){m=(I*10|0)-48+(J<<24>>24)|0;n=H+1|0;f=a[n]|0;if(((f<<24>>24)-48|0)>>>0<10>>>0){H=n;I=m;J=f}else{K=m;L=n;M=G;break}}}else{K=0;L=g;M=0}}while(0);n=o+((M|0)==0?K:-K|0)|0;m=(n|0)<0?-n|0:n;if((m|0)>511){c[(bI()|0)>>2]=34;N=1.0;O=8;P=511;y=2422}else{if((m|0)==0){Q=1.0}else{N=1.0;O=8;P=m;y=2422}}if((y|0)==2422){while(1){y=0;if((P&1|0)==0){R=N}else{R=N*+h[O>>3]}m=P>>1;if((m|0)==0){Q=R;break}else{N=R;O=O+8|0;P=m;y=2422}}}if((n|0)>-1){p=L;q=E*Q;break}else{p=L;q=E/Q;break}}}while(0);if((d|0)!=0){c[d>>2]=p}if((j|0)==0){S=q;return+S}S=-0.0-q;return+S}function kU(a,b,c){a=a|0;b=b|0;c=c|0;return+(+kT(a,b))}function kV(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function kW(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function kX(b,d,e){
b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function kY(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{kX(b,c,d)|0}}function kZ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(K=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function k_(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(K=e,a-c>>>0|0)|0}function k$(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}K=a<<c-32;return 0}function k0(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=0;return b>>>c-32|0}function k1(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=(b|0)<0?-1:0;return b>>c-32|0}function k2(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function k3(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function k4(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ag(d,c)|0;f=a>>>16;a=(e>>>16)+(ag(d,f)|0)|0;d=b>>>16;b=ag(d,c)|0;return(K=(a>>>16)+(ag(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function k5(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=k_(e^a,f^b,e,f)|0;b=K;a=g^e;e=h^f;f=k_((la(i,b,k_(g^c,h^d,g,h)|0,K,0)|0)^a,K^e,a,e)|0;return(K=K,f)|0}function k6(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=k_(h^a,j^b,h,j)|0;b=K;a=k_(k^d,l^e,k,l)|0;la(m,b,a,K,g)|0;a=k_(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=K;i=f;return(K=j,a)|0}function k7(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=k4(e,a)|0;f=K;return(K=(ag(b,a)|0)+(ag(d,e)|0)+f|f&0,c|0|0)|0}function k8(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=la(a,b,c,d,0)|0;return(K=K,e)|0}function k9(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;la(a,b,d,e,g)|0;i=f;return(K=c[g+4>>2]|0,c[g>>2]|0)|0}function la(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(K=n,o)|0}else{if(!m){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(K=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if(
(f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(K=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(K=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((k3(l|0)|0)>>>0);return(K=n,o)|0}p=(k2(l|0)|0)-(k2(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}else{if(!m){r=(k2(l|0)|0)-(k2(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(k2(j|0)|0)+33-(k2(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(K=n,o)|0}else{p=k3(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(K=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;G=0}else{g=d|0|0;d=k|e&0;e=kZ(g,d,-1,-1)|0;k=K;i=w;w=v;v=u;u=t;t=s;s=0;while(1){H=w>>>31|i<<1;I=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;k_(e,k,j,a)|0;b=K;h=b>>31|((b|0)<0?-1:0)<<1;J=h&1;L=k_(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=K;b=t-1|0;if((b|0)==0){break}else{i=H;w=I;v=M;u=L;t=b;s=J}}B=H;C=I;D=M;E=L;F=0;G=J}J=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(J|0)>>>31|(B|C)<<1|(C<<1|J>>>31)&0|F;o=(J<<1|0>>>31)&-2|G;return(K=n,o)|0}function lb(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;bT[a&7](b|0,c|0,d|0,e|0,f|0)}function lc(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;bU[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function ld(a,b){a=a|0;b=b|0;bV[a&511](b|0)}function le(a,b,c){a=a|0;b=b|0;c=c|0;bW[a&127](b|0,c|0)}function lf(a,b,c){a=a|0;b=b|0;c=c|0;return bX[a&31](b|0,c|0)|0}function lg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return bY[a&63](b|0,c|0,d|0)|0}function lh(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;bZ[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function li(a,b){a=a|0;b=b|0;return b_[a&127](b|0)|0}function lj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b$[a&7](b|0,c|0,d|0)}function lk(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;b0[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function ll(a){a=a|0;b1[a&1]()}function lm(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return b2[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function ln(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;b3[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function lo(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;b4[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function lp(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;b5[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function lq(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return b6[a&15](b|0,c|0,d|0,e|0)|0}
function lr(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return b7[a&31](b|0,c|0,d|0,e|0,f|0)|0}function ls(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b8[a&15](b|0,c|0,d|0,e|0)}function lt(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(0)}function lu(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ah(1)}function lv(a){a=a|0;ah(2)}function lw(a,b){a=a|0;b=b|0;ah(3)}function lx(a,b){a=a|0;b=b|0;ah(4);return 0}function ly(a,b,c){a=a|0;b=b|0;c=c|0;ah(5);return 0}function lz(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ah(6)}function lA(a){a=a|0;ah(7);return 0}function lB(a,b,c){a=a|0;b=b|0;c=c|0;ah(8)}function lC(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ah(9)}function lD(){ah(10)}function lE(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(11);return 0}function lF(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ah(12)}function lG(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(13)}function lH(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ah(14)}function lI(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(15);return 0}function lJ(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(16);return 0}function lK(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(17)}
// EMSCRIPTEN_END_FUNCS
var bT=[lt,lt,kB,lt,kC,lt,kA,lt];var bU=[lu,lu,gt,lu,gD,lu,gF,lu,h1,lu,gg,lu,ge,lu,hX,lu,gp,lu,gs,lu,gG,lu,f2,lu,fO,lu,gr,lu,fj,lu,fC,lu,gE,lu,f0,lu,fG,lu,fy,lu,fA,lu,fp,lu,fE,lu,fw,lu,fu,lu,fM,lu,fK,lu,fI,lu,gH,lu,fd,lu,gq,lu,fh,lu,e9,lu,fb,lu,ff,lu,e7,lu,fn,lu,fl,lu,e5,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu,lu];var bV=[lv,lv,h7,lv,e3,lv,f9,lv,dr,lv,d1,lv,ic,lv,ir,lv,c6,lv,cV,lv,fW,lv,di,lv,i3,lv,dp,lv,fs,lv,eV,lv,eR,lv,kQ,lv,dj,lv,ip,lv,iF,lv,gB,lv,ft,lv,kl,lv,eJ,lv,h3,lv,iq,lv,eu,lv,e4,lv,he,lv,cw,lv,ii,lv,js,lv,kq,lv,jr,lv,eP,lv,dp,lv,e$,lv,gV,lv,ju,lv,is,lv,kH,lv,hY,lv,jq,lv,ez,lv,cU,lv,e_,lv,gQ,lv,dj,lv,j0,lv,fX,lv,je,lv,hf,lv,et,lv,eG,lv,gN,lv,gA,lv,eS,lv,g3,lv,kP,lv,d0,lv,j3,lv,j4,lv,eK,lv,ef,lv,kt,lv,iP,lv,kn,lv,ev,lv,eQ,lv,hA,lv,cM,lv,hp,lv,eL,lv,im,lv,j6,lv,kr,lv,c$,lv,ih,lv,gO,lv,hL,lv,km,lv,hD,lv,hZ,lv,j5,lv,gU,lv,f8,lv,eU,lv,c0,lv,eW,lv,eB,lv,dz,lv,iX,lv,hS,lv,hK,lv,jt,lv,dR,lv,kn,lv,ku,lv,eF,lv,dA,lv,es,lv,cJ,lv,eI,lv,h2,lv,cx,lv,dZ,lv,eE,lv,c7,lv,ik,lv,eT,lv,hq,lv,gm,lv,g4,lv,cO,lv,eA,lv,ee,lv,eD,lv,jp,lv,j2,lv,gn,lv,ks,lv,h8,lv,cN,lv,kp,lv,gR,lv,cF,lv,hT,lv,hB,lv,dG,lv,iG,lv,dn,lv,ey,lv,j7,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv,lv];var bW=[lw,lw,jD,lw,hv,lw,g7,lw,jA,lw,ho,lw,jz,lw,hd,lw,cP,lw,h6,lw,eg,lw,g$,lw,hy,lw,hl,lw,g_,lw,ht,lw,gY,lw,hw,lw,il,lw,c1,lw,hz,lw,jC,lw,g8,lw,dm,lw,jE,lw,hn,lw,ha,lw,jB,lw,hc,lw,cW,lw,d2,lw,c8,lw,ib,lw,hi,lw,g2,lw,g1,lw,gZ,lw,hj,lw,hk,lw,hu,lw,g9,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw,lw];var bX=[lx,lx,db,lx,iB,lx,ep,lx,iL,lx,iH,lx,cZ,lx,c4,lx,ix,lx,iJ,lx,ed,lx,er,lx,iz,lx,eb,lx,cS,lx,lx,lx];var bY=[ly,ly,eZ,ly,iI,ly,iA,ly,kv,ly,iD,ly,e2,ly,du,ly,ec,ly,d8,ly,it,ly,eh,ly,h9,ly,iN,ly,iy,ly,cR,ly,dv,ly,em,ly,iK,ly,h4,ly,d3,ly,c3,ly,eq,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly,ly];var bZ=[lz,lz,h_,lz,hU,lz,lz,lz];var b_=[lA,lA,jS,lA,hh,lA,d9,lA,iU,lA,jI,lA,ea,lA,jQ,lA,g5,lA,go,lA,jG,lA,da,lA,eo,lA,en,lA,jk,lA,jM,lA,jK,lA,ko,lA,dq,lA,jy,lA,jv,lA,jL,lA,jw,lA,d6,lA,iT,lA,hx,lA,jN,lA,cQ,lA,g6,lA,ja,lA,hr,lA,jF,lA,cX,lA,jl,lA,kR,lA,eN,lA,g0,lA,cY,lA,jx,lA,d7,lA,ek,lA,c2,lA,iW,lA,hb,lA,jR,lA,c9,lA,i9,lA,i0,lA,
el,lA,gW,lA,jH,lA,gX,lA,dk,lA,hg,lA,i2,lA,hm,lA,jJ,lA,hs,lA,i$,lA,gC,lA,jP,lA,jO,lA,jd,lA,jo,lA];var b$=[lB,lB,dt,lB,eO,lB,lB,lB];var b0=[lC,lC,gj,lC,gh,lC,f6,lC,f3,lC,lC,lC,lC,lC,lC,lC];var b1=[lD,lD];var b2=[lE,lE,iY,lE,i6,lE,i4,lE,jh,lE,iZ,lE,jf,lE,iQ,lE,iR,lE,lE,lE,lE,lE,lE,lE,lE,lE,lE,lE,lE,lE,lE,lE];var b3=[lF,lF,gI,lF,gu,lF,lF,lF];var b4=[lG,lG,gS,lG,gP,lG,hC,lG,hM,lG,hG,lG,hO,lG,lG,lG];var b5=[lH,lH,kD,lH,gf,lH,gb,lH,ga,lH,kE,lH,gk,lH,h5,lH,ei,lH,f7,lH,fY,lH,f1,lH,fZ,lH,kF,lH,d4,lH,ia,lH];var b6=[lI,lI,iu,lI,iv,lI,iM,lI,iC,lI,iw,lI,lI,lI,lI,lI];var b7=[lJ,lJ,iE,lJ,i8,lJ,e0,lJ,jm,lJ,jb,lJ,iO,lJ,i_,lJ,eX,lJ,iS,lJ,iV,lJ,jj,lJ,i1,lJ,lJ,lJ,lJ,lJ,lJ,lJ];var b8=[lK,lK,kx,lK,ky,lK,kw,lK,d5,lK,e1,lK,ej,lK,eY,lK];return{_strlen:kW,_free:kH,_memcpy:kX,_realloc:kI,__Z14AES_encryptionPcS_S_S_j:cH,__GLOBAL__I_a:cK,_memset:kV,_malloc:kG,__Z14AES_decryptionPcS_S_jPj:cI,_memmove:kY,__GLOBAL__I_a28:dd,__Z28AES_get_encrypted_array_sizej:cG,runPostSets:cp,stackAlloc:b9,stackSave:ca,stackRestore:cb,setThrew:cc,setTempRet0:cf,setTempRet1:cg,setTempRet2:ch,setTempRet3:ci,setTempRet4:cj,setTempRet5:ck,setTempRet6:cl,setTempRet7:cm,setTempRet8:cn,setTempRet9:co,dynCall_viiiii:lb,dynCall_viiiiiii:lc,dynCall_vi:ld,dynCall_vii:le,dynCall_iii:lf,dynCall_iiii:lg,dynCall_viiiiiid:lh,dynCall_ii:li,dynCall_viii:lj,dynCall_viiiiid:lk,dynCall_v:ll,dynCall_iiiiiiiii:lm,dynCall_viiiiiiiii:ln,dynCall_viiiiiiii:lo,dynCall_viiiiii:lp,dynCall_iiiii:lq,dynCall_iiiiii:lr,dynCall_viiii:ls}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iii": invoke_iii, "invoke_iiii": invoke_iiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iiiii": invoke_iiiii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_llvm_lifetime_end": _llvm_lifetime_end, "_llvm_va_end": _llvm_va_end, "_vsscanf": _vsscanf, "_sscanf": _sscanf, "___ctype_tolower_loc": ___ctype_tolower_loc, "_snprintf": _snprintf, "_vsnprintf": _vsnprintf, "_fgetc": _fgetc, "___cxa_throw": ___cxa_throw, "_strerror": _strerror, "_pthread_mutex_lock": _pthread_mutex_lock, "_atexit": _atexit, "_abort": _abort, "___cxa_end_catch": ___cxa_end_catch, "___cxa_free_exception": ___cxa_free_exception, "_isdigit": _isdigit, "_pread": _pread, "_fflush": _fflush, "__addDays": __addDays, "_catclose": _catclose, "__arraySum": __arraySum, "_sysconf": _sysconf, "___cxa_rethrow": ___cxa_rethrow, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_llvm_eh_exception": _llvm_eh_exception, "_isxdigit": _isxdigit, "_write": _write, "__scanString": __scanString, "_strtoull": _strtoull, "_exit": _exit, "_sprintf": _sprintf, "_asprintf": _asprintf, "___ctype_b_loc": ___ctype_b_loc, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "_freelocale": _freelocale, "___cxa_allocate_exception": ___cxa_allocate_exception, "_isspace": _isspace, "_strtoll": _strtoll, "_fread": _fread, "_catgets": _catgets, "_time": _time, "_vasprintf": _vasprintf, "__isLeapYear": __isLeapYear, "_read": _read, "__formatString": __formatString, "__reallyNegative": __reallyNegative, "___resumeException": ___resumeException, "___cxa_is_number_type": ___cxa_is_number_type, "_pthread_cond_broadcast": _pthread_cond_broadcast, "___cxa_begin_catch": ___cxa_begin_catch, "___ctype_toupper_loc": ___ctype_toupper_loc, "___cxa_guard_acquire": ___cxa_guard_acquire, "__ZSt9terminatev": __ZSt9terminatev, "___cxa_does_inherit": ___cxa_does_inherit, "_isascii": _isascii, "_pthread_mutex_unlock": _pthread_mutex_unlock, "__getFloat": __getFloat, "_recv": _recv, "__parseInt64": __parseInt64, "___cxa_guard_abort": ___cxa_guard_abort, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_pwrite": _pwrite, "___cxa_call_unexpected": ___cxa_call_unexpected, "_sbrk": _sbrk, "_strerror_r": _strerror_r, "_newlocale": _newlocale, "___errno_location": ___
errno_location, "___gxx_personality_v0": ___gxx_personality_v0, "_catopen": _catopen, "_pthread_cond_wait": _pthread_cond_wait, "_llvm_lifetime_start": _llvm_lifetime_start, "_uselocale": _uselocale, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "__exit": __exit, "_strftime": _strftime, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "___fsmu8": ___fsmu8, "_stdout": _stdout, "___dso_handle": ___dso_handle }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var __Z14AES_encryptionPcS_S_S_j = Module["__Z14AES_encryptionPcS_S_S_j"] = asm["__Z14AES_encryptionPcS_S_S_j"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var __Z14AES_decryptionPcS_S_jPj = Module["__Z14AES_decryptionPcS_S_jPj"] = asm["__Z14AES_decryptionPcS_S_jPj"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a28 = Module["__GLOBAL__I_a28"] = asm["__GLOBAL__I_a28"];
var __Z28AES_get_encrypted_array_sizej = Module["__Z28AES_get_encrypted_array_sizej"] = asm["__Z28AES_get_encrypted_array_sizej"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless requiresd by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
exports.Module = Module;