/*
	Этот файл содержит описание функций класса AES.
*/	

#include <iostream>
#include <stdio.h>
#include "AES.hpp"
using namespace std;

// возвращает размер массива, необходимый для хранения шифрованного пользовательского массива 
unsigned int AES::get_encrypted_array_size(unsigned int user_array_size)
{
	// если размер массива кратен размеру блока, то нужно на два блока больше
	// (один хранит количество добавленных символов (нуль в данном случае), другой хранит chain)
	if(!(user_array_size % BLOCK_SIZE))
		return user_array_size + 2*BLOCK_SIZE;
	else // на два блока больше + количество добавленных символов
		return (user_array_size + BLOCK_SIZE - (user_array_size % BLOCK_SIZE) + 2*BLOCK_SIZE);
}			

// шифрует пользовательский массив (помещает шифрованный пользовательский массив в encrypted_array)
// !!! для encrypted_array нужно больше памяти, чем для user_array (см. предыд. ф-ю), однако ф-я принимет размер user_array
void AES::encryption(char* chain, char *key, char* user_array, char* encrypted_array, unsigned int user_array_size)
{
	char *temp_user_array;
	char *temp_encrypted_array;
	unsigned int encrypted_array_size;
	unsigned int additional_bytes_number;
	unsigned int temp_user_array_size;
	char *p1;
	char *p2;
	char *p3;
	int i; 
	
	encrypted_array_size = get_encrypted_array_size(user_array_size);
	temp_user_array_size = encrypted_array_size - BLOCK_SIZE;
	additional_bytes_number = encrypted_array_size - user_array_size - 2*BLOCK_SIZE;
	temp_user_array = new char [temp_user_array_size];
	temp_encrypted_array = new char [temp_user_array_size];
	
	
	/* Заполняем массив для шифрования.
		[данные] + [доп. байты, значения которых равны их количеству] + [блок количества доп. байтов]
		[блок количества доп. байтов] = [0x80, 0x80, 0x80, ... 0x8X], где X - кол-во доп. байтов   
	*/	
	p1 = user_array;
	p2 = temp_user_array;
	// записываем данные
	i = 0;
	while (i < user_array_size)
	{
		*p2 = *p1;
		p1++;
		p2++;
		i++;
	}
	// записываем доп. байты и их количество
	i = 0;
	switch (additional_bytes_number)
	{
		case 0:
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x80;
		case 1:	
			while (i < 1)
			{
				*p2 = 0x01;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x81;
			i = 0;
			break;
		case 2:	
			while (i < 2)
			{
				*p2 = 0x02;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x82;
			i = 0;
			break;
		case 3:	
			while (i < 3)
			{
				*p2 = 0x03;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x83;
			i = 0;
			break;
		case 4:	
			while (i < 4)
			{
				*p2 = 0x04;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x84;
			i = 0;
			break;
		case 5:	
			while (i < 5)
			{
				*p2 = 0x05;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x85;
			i = 0;
			break;
		case 6:	
			while (i < 6)
			{
				*p2 = 0x06;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x86;
			i = 0;
			break;
		case 7:	
			while (i < 7)
			{
				*p2 = 0x07;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x87;
			i = 0;
			break;
		case 8:	
			while (i < 8)
			{
				*p2 = 0x08;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x88;
			i = 0;
			break;
		case 9:	
			while (i < 9)
			{
				*p2 = 0x09;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x89;
			i = 0;
			break;
		case 10:	
			while (i < 10)
			{
				*p2 = 0x0a;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x8a;
			i = 0;
			break;
		case 11:	
			while (i < 11)
			{
				*p2 = 0x0b;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x8b;
			i = 0;
			break;
		case 12:	
			while (i < 12)
			{
				*p2 = 0x0c;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x8c;
			i = 0;
			break;
		case 13:	
			while (i < 13)
			{
				*p2 = 0x0d;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x8d;
			i = 0;
			break;
		case 14:	
			while (i < 14)
			{
				*p2 = 0x0e;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x8e;
			i = 0;
			break;
		case 15:	
			while (i < 15)
			{
				*p2 = 0x0f;
				p2++;
				i++;
			}
			temp_user_array[encrypted_array_size - BLOCK_SIZE - 1] = 0x8f;
			i = 0;
			break;
		default:
			cout << "ERROR: wrong additional bytes number while encryption process\n";
	}	
	// записываем блок количества доп. байтов (последний элемент этого блока уже записали на предыдущей стадии)		
	i = 0;																																									
	while (i < BLOCK_SIZE - 1)
	{
		*p2 = 0x80;
		p2++;
		i++;
	}	
	// массив для шифрования (temp_user_array) создан
	
	// создаем расширенный ключ шифрования
	MakeKey(key, chain, KEY_LENGTH, BLOCK_SIZE);
	
	// шифруем (записываем в массив temp_encrypted_array шифрованный temp_user_array)
	Encrypt(temp_user_array, temp_encrypted_array, temp_user_array_size, CBC);
	
	// создаем окончательный зашифрованный массив (temp_encrypted_array + chain)
	
	p1 = temp_encrypted_array;
	p2 = chain;
	p3 = encrypted_array;
	i = 0;
	while (i < temp_user_array_size)
	{
		*p3 = *p1;
		p1++;
		p3++;
		i++;
	}
	i = 0;
	while (i < BLOCK_SIZE)
	{
		*p3 = *p2;
		p2++;
		p3++;
		i++;
	}
	// [шифрованный массив] = [зашифрованные (данные и доп. байты) + chain] создан		
	
	delete [] temp_user_array;
	delete [] temp_encrypted_array;
}

// расшифровывает зашифрованный массив (encrypted_array)
// !!! decrypted_array_size и user_array_size (см. предыд. ф-ю) должны совпадать 
void AES::decryption(char *key, char * encrypted_array, char* decrypted_array, unsigned int encrypted_array_size, unsigned int* data_size)
{
	char *chain;
	char *temp_encrypted_array;
	char *p1;
	char *p2;
	unsigned int temp_encrypted_array_size;
	char additional_bytes_number;
	int i; 
	char last_decrypted_byte[16] =
	{
        	0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
        	0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f
    	};
	
	temp_encrypted_array_size = encrypted_array_size - BLOCK_SIZE;
	chain = new char [CHAIN_LENGTH];
	temp_encrypted_array = new char [temp_encrypted_array_size];
	
	// достаем вектор инициализации из encrypted_array;
	p1 = chain;
	p2 = encrypted_array + encrypted_array_size - BLOCK_SIZE; 
	i = 0;
	while (i < BLOCK_SIZE)
	{
		*p1 = *p2;
		p1++;
		p2++;
		i++;
	}
	
	// создаем временный массив для расшифрования (encrypted_array, кроме chain)
	p1 = temp_encrypted_array;
	p2 = encrypted_array;
	i = 0;
	while (i < temp_encrypted_array_size)
	{
		*p1 = *p2;
		p1++;
		p2++;
		i++;
	}
		
	// создаем расширенный ключ расшифрования
	MakeKey(key, chain, KEY_LENGTH, BLOCK_SIZE);
	
	// расшифровываем (записываем в массив decrypted_array расшифрованный temp_encrypted_array)
	Decrypt(temp_encrypted_array, decrypted_array, temp_encrypted_array_size, CBC);
	
	// узнаем, сколько доп. байтов было добалено к пользовательскому массиву и возвращаем размер пользовательских данных	
	if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *last_decrypted_byte)
			*data_size = encrypted_array_size - 2*BLOCK_SIZE;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 1))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 1;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 2))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 2;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 3))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 3;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 4))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 4;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 5))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 5;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 6))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 6;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 7))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 7;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 8))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 8;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 9))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 9;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 10))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 10;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 11))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 11;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 12))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 12;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 13))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 13;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 14))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 14;
	else if (*(decrypted_array + encrypted_array_size - 1 - BLOCK_SIZE) == *(last_decrypted_byte + 15))
			*data_size = encrypted_array_size - 2*BLOCK_SIZE - 15;																																													
	else 
		cout << "ERROR: wrong additional bytes number while decryption process\n";

	// в итоге получаем расшифрованный массив (decrypted_array) в котором первые *data_size байт - пользовательские данные
																																											
	delete [] temp_encrypted_array;
	delete [] chain;	
}			 


