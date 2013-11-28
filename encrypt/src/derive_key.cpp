#include "cryptlib.h"
#include "sha.h"
#include "pwdbased.h"

#include "derive_key.hpp"

void DeriveKey( unsigned char * derived, const unsigned char *    password, size_t          passwordLen)
{
    size_t          derivedLen = 32;
    char            purpose = '0';
    unsigned char *          salt = (unsigned char*)"!!!encLoader!!!";
    size_t          saltLen  = 15;
    unsigned int    iterations = 1024;
    double          timeInSeconds = 0;

    CryptoPP::PKCS12_PBKDF< CryptoPP::SHA256 > O;
    O.DeriveKey( derived, derivedLen, purpose, password, passwordLen, salt, saltLen, iterations, 0.0);
}

