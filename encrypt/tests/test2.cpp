#include "../src/AES.cpp"
#include <iostream>
#include <cstring>
#include <stdio.h>
#include <unistd.h>
#include <cstring>
#include <memory.h>

using namespace std;

unsigned int errors = 0;

int main()
{

	AES Crypt;

	// создаем ключи
	char encrypt_key[KEY_LENGTH] = "&test2keytest@@";
	char right_decrypt_key[KEY_LENGTH] = "&test2keytest@@";
	char wrong_decrypt_key[KEY_LENGTH] = "!wronltest2key!";
	
	char user_array[25] = "userarrayforencryption#@";
	unsigned int user_array_size = 25;

	char *encrypted_array;
	char *decrypted_array;
	
	char *p1;
	char *p2;
	int i;
	int j;
	
	unsigned int encrypted_array_size = Crypt.get_encrypted_array_size(user_array_size);
	
	encrypted_array = new char [encrypted_array_size];
	decrypted_array = new char [user_array_size];
	
	// шифруем
	Crypt.encryption(encrypt_key, user_array, encrypted_array, user_array_size);
	
	
	// расшифровываем правильным ключом
	Crypt.decryption(right_decrypt_key, encrypted_array, decrypted_array, user_array_size);
	
	
	// сравниваем decrypted_array, содержащий расшифрованный правильным ключом пользовательский массив, с user_array
	p1 = user_array;
	p2 = decrypted_array;
	i = 0;
	while (i < user_array_size)
	{
		if(*p1 != *p2)
			errors++;
		p1++;
		p2++;
		i++;
	}
	if( memcmp(user_array, decrypted_array, user_array_size) )
		errors++;
	
	// расшифровываем неправильным ключом
	Crypt.decryption(wrong_decrypt_key, encrypted_array, decrypted_array, user_array_size);
	
	
	// сравниваем decrypted_array, содержащий расшифрованный неправильным ключом пользовательский массив, c user_array
	p1 = user_array;
	p2 = decrypted_array;
	i = 0;
	j = 0;
	while (i < user_array_size)
	{
		if(*p1 == *p2)
			j++;
		p1++;
		p2++;
		i++;
	}
	if (j == (user_array_size - 1))
		errors++;
	if( !memcmp(user_array, decrypted_array, user_array_size) )
		errors++;
		
	if(errors)
		cout << "*Test 2 FAILED*\n";
	else
		cout <<	"*Test 2 PASSED*\n";			 
	
	
	delete [] encrypted_array;
	delete [] decrypted_array;
		
	return 0;
}	
	
