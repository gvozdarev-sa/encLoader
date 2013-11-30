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

unsigned long get_upper_size_bound( unsigned long input_size);

CompressCode Compress( const unsigned char *input, unsigned long input_size, unsigned char *output, unsigned long *output_size);
CompressCode Decompress( const unsigned char *input, unsigned long input_size, unsigned char *output, unsigned long *output_size);

#endif // #ifndef COMPRESS_HPP
