/*
 * Compression interface.
 *
 * AUTHOR: Maramzin Alexander
 * GROUP: 016
 * DESCRIPTION:
*/

#ifndef COMPRESS_HPP
#define COMPRESS_HPP

typedef enum
{
    COMPRESS_SUCCESS,
    COMPRESS_FAIL,
    COMPRESS_BAD_INPUT,
    COMPRESS_BAD_OUTPUT,
    COMPRESS_UNCOMPRESSED_DATA,
    COMPRESS_LAST
} CompressCode;

unsigned long get_compressed_size( unsigned long inputSize);
unsigned long get_decompressed_size( char * input);

CompressCode Compress( const  char *input, unsigned long input_size,  char *output, unsigned long *output_size);
CompressCode Decompress( const  char *input, unsigned long input_size,  char *output, unsigned long *output_size);

#endif // #ifndef COMPRESS_HPP
