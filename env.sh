#/bin/sh
PWD=`pwd`
export PATH=$PWD/externals/llvm_build/Release+Asserts/bin:$PATH
export PATH=$PWD/externals/llvm_build/Release+Asserts/bin:$PATH
export PATH=$PWD/externals/emscripten:$PATH
export PATH=$PWD/externals/addon-sdk/bin:$PATH
echo "New path:"
echo $PATH
