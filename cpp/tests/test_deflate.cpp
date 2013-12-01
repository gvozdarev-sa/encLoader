/*
 * Compression testing.
 * AUTHOR: Maramzin Alexander
 * DESCRIPTION:
 *      To build the test unix std libraries are required.
 *      It results in 2 files: compressed.deflate, decompressed.deflate
 */

#include <cstring>
#include <iostream>

#include "Compress.hpp"
#include "test_deflate.hpp"


int main( int argc, char *argv[])
{
    char *buffer_compressed, *buffer_decompressed; // buffers on the heap
    unsigned long filesize_input, filesize_compressed, filesize_decompressed;
    CompressCode ret;

    filesize_input = strlen( buffer_input);

    
    filesize_compressed = get_compressed_size( filesize_input);
    
//    std::cout << filesize_compressed << " " << filesize_input;

    buffer_compressed   = new char [ filesize_compressed];

    
    ret = Compress( buffer_input, filesize_input, buffer_compressed, &filesize_compressed);

    if ( ret != COMPRESS_SUCCESS)
    {
        std::cerr << "Error: compression error! " << ret << std::endl;
        return 1;
    }

    filesize_decompressed = get_decompressed_size( buffer_compressed);
//    std::cout << filesize_decompressed << std::endl;

    buffer_decompressed = new  char [ filesize_decompressed];

    ret = Decompress( buffer_compressed, filesize_compressed, buffer_decompressed, &filesize_decompressed);
    if ( ret != COMPRESS_SUCCESS)
    {
        std::cerr << "Error: decompression error! " << ret << std::endl;
        return 1;
    }


    if ( ( filesize_decompressed == filesize_input) && ( memcmp( buffer_input, buffer_decompressed, filesize_input) != 0))
    {
        std::cerr << "Error: mem bytes aren't identical in input and decompressed!\n";
        return 1;
    }

    std::cout << "Deflate passed( compressed " << filesize_compressed << " decompressed " << filesize_decompressed << " ratio " << (float)filesize_decompressed / filesize_compressed <<  ")" << std::endl;

    delete [] buffer_compressed;
    delete [] buffer_decompressed;

    return 0;
}

