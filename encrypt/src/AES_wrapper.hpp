/*
	Этот файл содержит обертки функций класса AES.
*/

#include "AES.hpp"

AES Crypt;

unsigned int AES_get_encrypted_array_size(unsigned int user_array_size)
{
	return Crypt.get_encrypted_array_size(user_array_size);
}
void AES_encryption(char* chain, char *key, char * user_array, char* encrypted_array, unsigned int user_array_size)
{
	Crypt.encryption(chain, key, user_array, encrypted_array, user_array_size);
}	
void AES_decryption(char *key, char * encrypted_array, char* decrypted_array, unsigned int encrypted_array_size, unsigned int* data_size)
{
	Crypt.decryption(key, encrypted_array, decrypted_array, encrypted_array_size, data_size);
}		
