all: js
tests: test_derive_key test_aes

#allmost crypto++ files
OBJS :=  esign.o randpool.o blowfish.o base32.o ec2n.o dll.o fips140.o misc.o eprecomp.o dsa.o \
 winpipes.o files.o vmac.o hrtimer.o rc5.o mars.o simple.o osrng.o queue.o xtrcrypt.o gf256.o   \
 cmac.o authenc.o idea.o zdeflate.o squaretb.o pkcspad.o emsa2.o sha.o network.o eax.o base64.o \
 luc.o rc2.o  dessp.o crc.o des.o mqueue.o zlib.o dh2.o  oaep.o hmac.o polynomi.o marss.o algparam.o \
 wait.o iterhash.o safer.o default.o camellia.o  adler32.o gf2n.o elgamal.o square.o ida.o shark.o \
 sha3.o md5.o shacal2.o tea.o serpent.o eccrypto.o fipsalgt.o ripemd.o gcm.o pubkey.o arc4.o trdlocal.o \
 salsa.o seal.o blumshub.o ttmac.o  tigertab.o mqv.o md2.o ccm.o dh.o pssr.o md4.o whrlpool.o asn.o \
 cast.o channels.o zinflate.o algebra.o basecode.o casts.o nbtheory.o  hex.o gfpcrypt.o cryptlib.o \
 gost.o rijndael.o strciphr.o modes.o panama.o rng.o socketft.o twofish.o tftables.o pch.o cbcmac.o  \
 rsa.o rdtables.o rw.o  gf2_32.o gzip.o rabin.o bfinit.o filters.o cpu.o  sosemanuk.o xtr.o integer.o \
 seed.o rc6.o wake.o sharkbox.o ecp.o skipjack.o  tiger.o cryptlib_bds.o

#_CRYPTOPP := algparam.o misc.o filters.o iterhash.o sha.o cryptlib.o
_CRYPTOPP := $(OBJS)
OBJS_CRYPTOPP := $(patsubst %.o, obj/cryptopp_%.o, $(_CRYPTOPP))
SRCS_CRYPTOPP := $(patsubst %.o, cryptopp/%.cpp, $(_CRYPTOPP))

_SRC := AES.o Rijndael.o AES_wrapper.o derive_key.o
OBJS_SRC := $(patsubst %.o, obj/src_%.o, $(_SRC))
SRCS_SRC := $(patsubst %.o, src/%.cpp, $(_SRC))

INCLUDE = -Icryptopp -Isrc
CXXFLAGS= -O2

EXPORT_JS= EXPORTED_FUNCTIONS="[ \
'__Z28AES_get_encrypted_array_sizej', \
'__Z14AES_encryptionPcS_S_S_j', \
'__Z14AES_decryptionPcS_S_jPj', \
'__Z9DeriveKeyPhPKhj' \
]"

JSFLAGS= --closure 1 -s ASM_JS=1 -s $(EXPORT_JS)


ifeq ( $(TARGET),JS)
  FLAGS = $(CXXFLAGS) $(JSFLAGS)
  SUF = .js
  CC = emcc
else ifeq ($(TARGET),HTML)
  FLAGS = $(CXXFLAGS) $(JSFLAGS)
  SUF = .html
  CC = emcc
else ifeq ($(TARGET),BC)
  FLAGS = $(CXXFLAGS) $(JSFLAGS)
  SUF = .bc
  CC = emcc
else
  FLAGS = $(CXXFLAGS)
  SUF =exe -lpthread
  CC = g++
  #CC = clang
endif

OBJS_JS = $(OBJS_SRC) $(OBJS_CRYPTOPP)
js: $(OBJS_JS)
	$(CC) $(FLAGS) $(OBJS_JS) -o obj/encrypt$(SUF)

obj/src_%.o: src/%.cpp
	$(CC) -c $(FLAGS) $< -o $@ $(INCLUDE)

obj/cryptopp_%.o: cryptopp/%.cpp
	$(CC) -c $(FLAGS) $< -o $@ $(INCLUDE)

obj/tests_%.o: tests/%.cpp
	$(CC) -c $(FLAGS) $< -o $@ $(INCLUDE)

OBJS_TEST_DERIVE_KEY = $(OBJS_CRYPTOPP) obj/src_derive_key.o obj/tests_test_derive_key.o
test_derive_key: $(OBJS_TEST_DERIVE_KEY)
	$(CC) $(FLAGS) $(OBJS_TEST_DERIVE_KEY) -o test_derive_key$(SUF)

OBJS_TEST_AES = obj/src_AES.o obj/src_AES.o obj/src_AES_wrapper.o obj/src_Rijndael.o obj/tests_test_aes.o
test_aes: $(OBJS_TEST_AES)
	$(CC) $(FLAGS) $(OBJS_TEST_AES) -o test_aes$(SUF)



clean:
	rm -f obj/*
