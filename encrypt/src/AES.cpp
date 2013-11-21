/*
	Этот файл содержит описание функций класса AES.
*/	

#include <iostream>
#include "AES.hpp"
using namespace std;

// возвращает размер массива, необходимый для хранения шифрованного пользовательского массива 
unsigned int AES::get_encrypted_array_size(unsigned int user_array_size)
{
	if(!(user_array_size % BLOCK_SIZE))
		return user_array_size;
	else
		return (user_array_size + BLOCK_SIZE - (user_array_size % BLOCK_SIZE));
}			

// шифрует пользовательский массив (помещает шифрованный пользовательский массив в encrypted_array)
// !!! для encrypted_array нужно больше памяти, чем для user_array (см. предыд. ф-ю), однако ф-я принимет размер user_array
void AES::encryption(char *key, char * user_array, char* encrypted_array, unsigned int user_array_size)
{
	char *chain;
	char *temp_user_array;
	unsigned int encrypted_array_size;
	char *p1;
	char *p2;
	int i; 
	
	encrypted_array_size = get_encrypted_array_size(user_array_size);
	chain = new char [CHAIN_LENGTH];
	temp_user_array = new char [encrypted_array_size];
	
	// строим вектор инициализации как отрицание ключа
	p1 = key;
	p2 = chain;
	i = 0;
	while (i < KEY_LENGTH)
	{
		*p2 = ~(*p1);
		p1++;
		p2++;
		i++;
	}
	
	// заполняем массив для шифрования (пользовательский массив + необходимое количество нулей)
	p1 = user_array;
	p2 = temp_user_array;
	i = 0;
	while (i < user_array_size)
	{
		*p2 = *p1;
		p1++;
		p2++;
		i++;
	}
	i = 0;
	while (i < encrypted_array_size - user_array_size)
	{
		*p2 = '\0';
		p2++;
		i++;
	}
	
	
	// создаем расширенный ключ шифрования
	MakeKey(key, chain, KEY_LENGTH, BLOCK_SIZE);
	
	// шифруем (записываем в массив encrypted_array шифрованные пользовательские данные предварительно дополненные нулями)
	Encrypt(temp_user_array, encrypted_array, encrypted_array_size, CBC);
	
	delete [] temp_user_array;
}

// расшифровывает зашифрованный массив (encrypted_array)
// !!! decrypted_array_size и user_array_size (см. предыд. ф-ю) должны совпадать 
void AES::decryption(char *key, char * encrypted_array, char* decrypted_array, unsigned int decrypted_array_size)
{
	char *chain;
	char *temp_decrypted_array;
	unsigned int encrypted_array_size;
	char *p1;
	char *p2;
	int i; 
	
	encrypted_array_size = get_encrypted_array_size(decrypted_array_size);
	chain = new char [CHAIN_LENGTH];
	temp_decrypted_array = new char [encrypted_array_size];
	
	// строим вектор инициализации как отрицание ключа
	p1 = key;
	p2 = chain;
	i = 0;
	while (i < KEY_LENGTH)
	{
		*p2 = ~(*p1);
		p1++;
		p2++;
		i++;
	}
	
	
	// создаем расширенный ключ шифрования
	MakeKey(key, chain, KEY_LENGTH, BLOCK_SIZE);
	
	// зашифровывавем (записываем в массив temp_decrypted_array расшифрованные данные расширенного пользовательского массива)
	Decrypt(encrypted_array, temp_decrypted_array, encrypted_array_size, CBC);
	
	// записываем в decrypted_array зашифрованный массив с отрезанными нулями (восстановленный пользовательский массив)
	p1 = temp_decrypted_array;
	p2 = decrypted_array;

	i = 0;
	while (i < decrypted_array_size)
	{
		*p2 = *p1;
		p1++;
		p2++;
		i++;
	}	
	
	delete [] temp_decrypted_array;	
}			
		 

