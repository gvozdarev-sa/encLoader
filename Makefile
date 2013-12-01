all: extension
INCLUDE = -Icryptopp -Isrc
CXXFLAGS= -O2

EXPORT_JS= EXPORTED_FUNCTIONS="[ \
'__Z28AES_get_encrypted_array_sizej', \
'__Z14AES_encryptionPcS_S_S_j', \
'__Z14AES_decryptionPcS_S_jPj', \
'__Z9DeriveKeyPhPKhj', \
'__Z19get_compressed_sizem', \
'__Z21get_decompressed_sizePc', \
'__Z8CompressPKcmPcPm', \
'__Z10DecompressPKcmPcPm', \
'_main' \
]"

JSFLAGS = --closure 1 -s ASM_JS=1 -s $(EXPORT_JS)

FLAGS = $(CXXFLAGS) $(JSFLAGS)

OBJS  = ./cpp/obj/asm.bc

$(OBJS):
	cd cpp && make all TARGET=BC


OBJS = $(OBJS_ENCRYPT)

asm.js: extension/src/lib/asm.js
extension/src/lib/asm.js: $(OBJS)
	emcc $(FLAGS) $(OBJS) -o extension/src/lib/asm_tmp_.js
	sed -e 's/require/requires/g' extension/src/lib/asm_tmp_.js > extension/src/lib/asm.js
	rm extension/src/lib/asm_tmp_.js
	echo "function print( str) {console.log( str);}" >> extension/src/lib/asm.js
	echo "exports.Module = Module;" >> extension/src/lib/asm.js
	echo "exports.getValue = v.getValue;" >> extension/src/lib/asm.js
	echo "exports.setValue = v.setValue;" >> extension/src/lib/asm.js


extension: asm.js
	cd extension && make run


clean:
	cd cpp && make clean
