#include "Compress.hpp"
#include "miniz.c"

unsigned long get_upper_size_bound( unsigned long inputSize)
{
    return compressBound( inputSize);
}

CompressCode Compress( const unsigned char *input, unsigned long input_size, unsigned char *output, unsigned long *output_size)
{
    int compress_status;

    if ( input == NULL)
    {
        return COMPRESS_BAD_INPUT;
    } else if ( output == NULL)
    {
        return COMPRESS_BAD_OUTPUT;
    }

    compress_status = compress( output, output_size, input, input_size);
    
    if ( compress_status != Z_OK)
    {
        return COMPRESS_FAIL;
    }
    return COMPRESS_SUCCESS;
}

CompressCode Decompress( const unsigned char *input, unsigned long input_size, unsigned char *output, unsigned long *output_size)
{
    int compress_status;

    if ( input == NULL)
    {
        return COMPRESS_BAD_INPUT;
    } else if ( output == NULL)
    {
        return COMPRESS_BAD_OUTPUT;
    }

    compress_status = uncompress( output, output_size, input, input_size);
    
    if ( compress_status != Z_OK)
    {
        return COMPRESS_FAIL;
    }
    return COMPRESS_SUCCESS;
}

