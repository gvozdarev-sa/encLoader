/*
	Этот файл содержит описание класса AES, который наследует класс CRijndael.
	Класс AES написан для удобства шифрования.
	
//Rijndael (pronounced Reindaal) is a block cipher, designed by Joan Daemen and Vincent Rijmen as a candidate algorithm for the AES.
//The cipher has a variable block length and key length. The authors currently specify how to use keys with a length
//of 128, 192, or 256 bits to encrypt blocks with al length of 128, 192 or 256 bits (all nine combinations of
//key length and block length are possible). Both block length and key length can be extended very easily to
// multiples of 32 bits.
//Rijndael can be implemented very efficiently on a wide range of processors and in hardware. 
//This implementation is based on the Java Implementation used with the Cryptix toolkit found at:
//http://www.esat.kuleuven.ac.be/~rijmen/rijndael/rijndael.zip
//Java code authors: Raif S. Naffah, Paulo S. L. M. Barreto
//This Implementation was tested against KAT test published by the authors of the method and the
//results were identical.

*/	


#include "Rijndael.h"

#define BLOCK_SIZE 16
#define KEY_LENGTH 16
#define CHAIN_LENGTH 16

class AES: CRijndael
{
public:
	unsigned int get_encrypted_array_size(unsigned int user_array_size);
	void encryption(char* chain, char *key, char * user_array, char* encrypted_array, unsigned int user_array_size);
	void decryption(char *key, char * encrypted_array, char* decrypted_array, unsigned int encrypted_array_size, unsigned int* data_size);
};

