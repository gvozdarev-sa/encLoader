encLoader
=========

Firefox extension for a encryption on fly
### ... ###

## Setting up environment ##
To build this extention you need:

* [addon-sdk](https://github.com/mozilla/addon-sdk) *1.14*
* [emscripten](https://github.com:kripken/emscripten) _which depend on_
* [clang](https://github.com/llvm-mirror) *3.2* _which depend on_
* [llvm](https://github.com/llvm-mirror/llvm) _and_
* [compiler-rt](https://github.com/llvm-mirror/compiler-rt) 

You can use manually configured and build binaries or use makefile in directory _externals_

To build clang compiler 
```shell
make 

```
or
```shell
make all
```

To init and clone correct versions of tools via git submodules feature
```shell
make git_all
```

After that you can launch for setting PATH variable
```shell
. ./env.sh
```
## Usefull links ##
*  [emcc getting started](https://github.com/kripken/emscripten/wiki/Getting-started)
*  [emcc build project](https://github.com/kripken/emscripten/wiki/Building-Projects)
*  [emcc linking .obj](https://github.com/kripken/emscripten/wiki/Linking)

### ... ###
