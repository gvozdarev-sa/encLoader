/*
 * Compression testing.
 * AUTHOR: Maramzin Alexander
 * USAGE: ./test file_to_compress 
 * DESCRIPTION:
 *      To build the test unix std libraries are required.
 *      It results in 2 files: compressed.deflate, decompressed.deflate     
 */

#include <stdio.h> 
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>

#include "../src/Compress.hpp"

static const char *filename_compressed = "compressed.deflate";
static const char *filename_decompressed = "decompressed.deflate";

int main( int argc, char *argv[])
{
    int fd_input, fd_compressed, fd_decompressed; // unix file descriptors
    unsigned char *buffer_input, *buffer_compressed, *buffer_decompressed; // buffers on the heap
    const char *filename_input; // file to compress ( passed through shell command line)
    struct stat fileinfo_input;
                // , fileinfo_compressed, fileinfo_decompressed;
    unsigned long filesize_input, filesize_compressed, filesize_decompressed;
    CompressCode ret;
    clock_t start_compression, end_compression;
    clock_t start_decompression, end_decompression;

    if ( argc != 2)
    {
        fprintf( stderr, "Usage: ./test [file to compression]\n");
        exit( EXIT_FAILURE);
    } else
    {
        filename_input = argv[1];
    }

    if ( (fd_input = open( filename_input, O_RDONLY)) == -1)
    {
        fprintf( stderr, "Error: can't open %s\n!", filename_input);
        exit( EXIT_FAILURE);
    }

    if ( (fd_compressed = open( filename_compressed, O_RDWR | O_CREAT)) == -1)
    {
        fprintf( stderr, "Error: can't open %s\n!", filename_compressed);
        exit( EXIT_FAILURE);
    }
    
    if ( (fd_decompressed = open( filename_decompressed, O_RDWR | O_CREAT)) == -1)
    {
        fprintf( stderr, "Error: can't open %s\n!", filename_decompressed);
        exit( EXIT_FAILURE);
    }
    
    if ( fstat( fd_input, &fileinfo_input) == -1)
    {
        fprintf( stderr, "Error: can't get stat of the file %s\n!", filename_input);
        exit( EXIT_FAILURE);
    }   
   
    filesize_input = fileinfo_input.st_size; 
    filesize_compressed = get_upper_size_bound( filesize_input);
    filesize_decompressed = filesize_input;

    buffer_input = (unsigned char*)malloc( (size_t)filesize_input*sizeof(unsigned char));
    buffer_compressed = (unsigned char*)malloc( (size_t)filesize_compressed*sizeof(unsigned char));
    buffer_decompressed = (unsigned char*)malloc( (size_t)filesize_decompressed*sizeof(unsigned char));

    if ( read( fd_input, buffer_input, filesize_input) != (ssize_t)filesize_input)
    {
        fprintf( stderr, "Error: can't read the file %s\n!", filename_input);
        exit( EXIT_FAILURE);
    }   

    start_compression = clock();
    if ( ( ret = Compress( buffer_input, filesize_input, buffer_compressed, &filesize_compressed)) != COMPRESS_SUCCESS)
    {
        fprintf( stderr, "Error: compression error!\n");
        exit( EXIT_FAILURE);
    }
    end_compression = clock(); 
    
    if ( write( fd_compressed, buffer_compressed, filesize_compressed) != (ssize_t)filesize_compressed)
    {
        fprintf( stderr, "Error: can't write the file %s\n!", filename_compressed);
        exit( EXIT_FAILURE);
    }   
    
    start_decompression = clock();
    if ( ( ret = Decompress( buffer_compressed, filesize_compressed, buffer_decompressed, &filesize_decompressed)) != COMPRESS_SUCCESS)
    {
        fprintf(stderr,"Error: decompression error!\n");
        exit( EXIT_FAILURE);
    }
    end_decompression = clock();
    
    if ( write( fd_decompressed, buffer_decompressed, filesize_decompressed) != (ssize_t)filesize_decompressed)
    {
        fprintf( stderr, "Error: can't write the file %s\n!", filename_decompressed);
        exit( EXIT_FAILURE);
    } 

    if ( filesize_decompressed != filesize_input)        
    {
        fprintf( stderr, "Error: input file size differs from decompressed file size!\n");
        exit( EXIT_FAILURE);
    } 

    if ( memcmp( buffer_input, buffer_decompressed, filesize_input) != 0)
    {
        fprintf( stderr, "Error: mem bytes aren't identical in input and decompressed!\n");
        exit( EXIT_FAILURE);
    } 

    // Status report
    fprintf( stdout, "Test passed!\nCompression time: %f ms\nDecompression time: %f ms\nInput file size: %ld bytes\nCompressed file size: %ld bytes\nDecompressed file size : %ld bytes\n",
              (double)1000*(end_compression - start_compression)/CLOCKS_PER_SEC, (double)1000*(end_decompression - start_decompression)/CLOCKS_PER_SEC, 
               filesize_input, filesize_compressed, filesize_decompressed);

    free( buffer_input);
    free( buffer_compressed);
    free( buffer_decompressed);

    close( fd_input);
    close( fd_compressed);
    close( fd_decompressed);

    exit( EXIT_SUCCESS);
}

