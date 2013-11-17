all: clang

clang: git_llvm git_clang git_compiler-rt
	rm -rf llvm/tools/clang       && ln -s ../../clang       llvm/tools/clang
	rm -rf llvm/tools/compiler-rt && ln -s ../../compiler-rt llvm/tools/compiler-rt
	mkdir -p llvm_build
	cd llvm_build && ../llvm/configure --enable-optimized
	cd llvm_build && make -j2

git_all: git_llvm git_clang git_compiler-rt git_emscripten git_addon-sdk

git_llvm:
	git submodule update --init ./llvm
git_clang:
	git submodule update --init ./clang
git_compiler-rt:
	git submodule update --init ./compiler-rt
git_emscripten:
	git submodule update --init ./emscripten
git_addon-sdk:
	git submodule update --init ./addon-sdk

