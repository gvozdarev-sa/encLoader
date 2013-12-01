#include "Compress.hpp"
#include "miniz.c"
#include <cstring>
#include <iostream>

unsigned long get_compressed_size( unsigned long inputSize)
{
    return compressBound( inputSize) + 2 * sizeof( unsigned int);
}

unsigned long get_decompressed_size( char * input)
{
    return *((unsigned int*)(input)+1);

}


CompressCode Compress( const char *input, unsigned long input_size,  char *output, unsigned long *output_size)
{
    int compress_status;

    if ( input == NULL)
    {
        return COMPRESS_BAD_INPUT;
    } else if ( output == NULL)
    {
        return COMPRESS_BAD_OUTPUT;
    }

    compress_status = mz_compress( (unsigned char*)((unsigned int*)output+2), output_size, (unsigned char*)input, input_size);
//    std::cout << "!!!" << compress_status << "\n";

    if ( ( compress_status != MZ_OK) || ((float)input_size / *output_size  < 1.2))
    {
        *output_size = input_size + 2*sizeof( unsigned int);

//        std::cout << "!!!" << *output_size << "???" << input_size << std::endl;

        memcpy( (char*)((unsigned int*)output+2), input, input_size);
        *((unsigned int*)(output)+0) = 0;
        *((unsigned int*)(output)+1) = input_size;
    }
    else
    {
        *output_size += 2*sizeof( unsigned int);
//        std::cout << "!!!" << *output_size << "???" << input_size << std::endl;

        *((unsigned int*)(output)+0) = 1;
        *((unsigned int*)(output)+1) = input_size;
    }

    return COMPRESS_SUCCESS;
}

CompressCode Decompress( const char *input, unsigned long input_size,  char *output, unsigned long *output_size)
{
    if ( input == NULL)
    {
        return COMPRESS_BAD_INPUT;
    } else if ( output == NULL)
    {
        return COMPRESS_BAD_OUTPUT;
    }

    unsigned int tmp = *((unsigned int*)(input)+0);
//    std::cout << "!!!" << tmp << "???" << *((unsigned int*)(input)+1) << std::endl;

    *output_size = *((unsigned int*)(input)+1);
//    std::cout << *output_size << std::endl;
    input_size -= 2*sizeof( unsigned int);
    switch ( tmp)
    {
        case 0:
            memcpy( output, (char*)((unsigned int*)input+2), *output_size);
            break;
        case 1:
            int compress_status = mz_uncompress( (unsigned char*)output, output_size, (unsigned char*)((unsigned int*)input+2), input_size);
            //    std::cout << "!!!" << compress_status << "\n";

            if ( compress_status != MZ_OK)
            {
                return COMPRESS_FAIL;
            }
            break;
    }

    return COMPRESS_SUCCESS;
}