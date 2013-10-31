all:
	rm -rf llvm/tools/clang       && ln -s ../../clang       llvm/tools/clang
	rm -rf llvm/tools/compiler-rt && ln -s ../../compiler-rt llvm/tools/compiler-rt
	mkdir -p llvm_build
	cd llvm_build && ../llvm/configure --enable-optimized
	cd llvm_build && make -j2

