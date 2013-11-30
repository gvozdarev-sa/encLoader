
.PHONY: test

test: ./tests/main.cpp ./src/Compress.cpp ./src/Compress.hpp ./src/miniz.c
	g++ ./tests/main.cpp ./src/Compress.cpp -o tests/test   

.PHONY: clean

clean:
	rm -rf ./src/*.o
	rm -rf ./tests/*.o
	rm -rf ./tests/test
	rm -rf ./tests/*.deflate



