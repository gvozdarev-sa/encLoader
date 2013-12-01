#include <iostream>
#include "derive_key.hpp"


int main( )
{
    unsigned char *      derived    = new unsigned char [ 32];
    unsigned char *  password = (unsigned char*)"123";
    size_t      passwordLen = 3;

    DeriveKey( derived, password, passwordLen);
    std::cout << "boundary" << std::endl << derived << std::endl << "boundary" << std::endl;

    delete [] derived;
}
