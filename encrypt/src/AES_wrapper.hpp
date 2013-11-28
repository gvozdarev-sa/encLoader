/*
	Этот файл содержит обертки функций класса AES.
*/

#ifndef _AES_WRAPPER_HPP_
#define _AES_WRAPPER_HPP_

#define CHAIN_LENGTH 16
#define KEY_LENGTH 16

unsigned int AES_get_encrypted_array_size(unsigned int user_array_size);
void AES_encryption(char* chain, char *key, char * user_array, char* encrypted_array, unsigned int user_array_size);
void AES_decryption(char *key, char * encrypted_array, char* decrypted_array, unsigned int encrypted_array_size, unsigned int* data_size);

#endif