/* Для работы этого теста необходимо три файла (файл пользователя, файл, куда будут записаны шифрованные данные, 
   	файл, куда будут записаны расшифрованные данные).
   Этот тест считывает данные из файла пользователя в массив user_array, шифрует эти данные AES шифрованием,
   	записывает зашифрованные данные в массив encrypted_array, записывает массив encrypted_array  в указаный файл
   	(создает зашифрованный файл пользователя), считывает данные из зашифрованного файла в массив encfile_array
   	(он должен совпадать с encrypted_array (делается для проверки правильности считывания)), расшифровывает данные
   	encfile_array и записывает их в массив decrypted_array. Далее массив decrypted_array записывается в указанный файл
   	(создается расшифрованный файл пользователя).
   Проверяется, что user_array совпадает с decrypted_array, если один и тот же ключ используется для шифрования и расшифрования,
   	и не совпадает, если ипсользуются разные ключи.
   На вход: файл, который хотим зашифровать; файл, куда запишем зашифрованные данные; файл, куда запишем расшифрованныйе данные.
   Результат: 2-ой входной файл - зашифрованный файл пользователя
   		3-ий входной файл - расшифрованный зашифрованный файл пользователя 		
*/


#include "../src/Rijndael.cpp"
#include <iostream>
#include <cstring>
#include <stdio.h>
#include <unistd.h>

using namespace std;

int read_user_file_size(char * user_file_name);
void write_user_array(char* user_file_name, int uf_size, int uf_array_size, char *user_array);
void write_encrypted_file(char *encrypted_file_name, int uf_array_size, char *encrypted_array);
void write_encfile_array(char *encrypted_file_name, int uf_array_size, char *encfile_array);
void write_decrypted_file(char *decrypted_file_name, int uf_array_size, char *decrypted_array);
bool check_decrypted_array(char *user_array, char *decrypted_array, int array_size);
				

#define BLOCK_SIZE 16
#define KEY_LENGTH 16
#define CHAIN_LENGTH 32

unsigned int errors = 0;

int main(int argc, char* argv[])
{
	char *user_file_name = argv[1];
	char *encrypted_file_name = argv[2];
	char *decrypted_file_name = argv[3];
	
	int user_file_size; // размер в байтах файла пользователя (количество символов в файле)
	int user_file_add_size; // кол-во байт, которое нужно добавить до размера файла, чтобы итоговый размер был кратен размеру блока шифрования
	int array_size; // размер массива шифруемых данных (размер файла + кол-во добавленных символов)

	user_file_size = read_user_file_size(user_file_name);
	user_file_add_size = BLOCK_SIZE - (user_file_size % BLOCK_SIZE);
	array_size = user_file_size + user_file_add_size;
	cout << "array size = " << array_size << "\n";
	
	char *user_array;
	char *encrypted_array;
	char *encfile_array;
	char *decrypted_array;
	user_array = new char [array_size]; // шифруемые данные (данные пользовательского файла + добавленные)
	encrypted_array = new char [array_size]; // зашифрованные данные
	encfile_array = new char [array_size]; // зашифрованные данные, считанные из зашифрованного файла (должны совпадать с зашифрованными данными)
	decrypted_array = new char [array_size]; // расшифрованные данные
	
	// записываем в user_array файл пользователя + добавочные данные (нулевые символы)
	write_user_array(user_file_name, user_file_size, array_size, user_array); 
	
	// создаем ключи
	char const encrypt_key[KEY_LENGTH] = "*keyforthetest*";
	char const right_decrypt_key[KEY_LENGTH] = "*keyforthetest*";
	char const wrong_decrypt_key[KEY_LENGTH] = "*wrongtestkey0*";
	
	char const chain[CHAIN_LENGTH] = "testchaintestchaintestchain1234";
	
	
	CRijndael AES;
	
	// шифрование: ключ - encrypt_key, шифруемые данные - user_array, зашифрованные данные - encrypted_array
	AES.MakeKey(encrypt_key, chain, KEY_LENGTH, BLOCK_SIZE); // создаем расширенный ключ шифрования
	AES.Encrypt(user_array, encrypted_array, array_size, AES.CBC); // шифруем, используя созданный расширенный ключ
	write_encrypted_file(encrypted_file_name, array_size, encrypted_array); // записываем зашифрованные данные в созданный файл
	// мы создали шифрованный файл пользователя 
	
	// считываем шифрованный файл в массив encfile_array
	write_encfile_array(encrypted_file_name, array_size, encfile_array);
	
	// расшифровываем шифрованный файл (записанный в массив) неправильным ключем
	AES.MakeKey(wrong_decrypt_key, chain, KEY_LENGTH, BLOCK_SIZE);
	AES.Decrypt(encfile_array, decrypted_array, array_size, AES.CBC);
	// массиве decrypted_array не должен совпадать с 
	if(check_decrypted_array(user_array, decrypted_array, array_size))
	{
		cout << "*ERROR: User_array encrypted by the key and decrypted_array decrypted by another key are the same*\n";
		errors++;
	}	
	
	// расшифровываем шифрованный файл правильным ключом
	AES.MakeKey(right_decrypt_key, chain, KEY_LENGTH, BLOCK_SIZE);
	AES.Decrypt(encfile_array, decrypted_array, array_size, AES.CBC);
	if(!check_decrypted_array(user_array, decrypted_array, array_size))
	{
		cout << "*ERROR: User_array encrypted by the key differs from decrypted_array decrypted by the same key*\n";
		errors++;
	}	
	
	// создаем (на самом деле пишем в пустой созданный) расшифрованный файл 
	write_decrypted_file(decrypted_file_name, array_size, decrypted_array);
	// теперь файл пользователя должен совпадать с расшифрованным файлом
	
	//cout << "Encfile_array = \n" << encfile_array << "\n";
	//cout << "Decrypted array = \n" << decrypted_array << "\n";
	
	if(errors)
		cout << "*Test 1 FAILED*\n";
	else
		cout <<	"*Test 1 PASSED*\n";
		
	delete [] user_array;
	delete [] encrypted_array;
	delete [] encfile_array;
	delete [] decrypted_array;	
	
	return 0;
}

int read_user_file_size(char * user_file_name)
{
	FILE *uf = NULL;
	uf = fopen(user_file_name, "r");
	int size = 0;
	while(fgetc(uf) != EOF)
		size = size++;
	cout << "File size = " << size << " bytes\n";
	fclose(uf);
	return size;
}	

void write_user_array(char* user_file_name, int user_file_size, int array_size, char *user_array)
{
	FILE *uf = NULL;
	char *p = user_array;
	int i = 0;
	
	uf = fopen(user_file_name, "r");
	fread(user_array, 1, user_file_size, uf); // теперь в user_array находятся все символы исходного файла
	
	// В оставшуюся часть массива записываем нули, т. е. шивровать будем файл + нули 
	p = p + user_file_size;
	while(i < array_size - user_file_size)
	{
		*p = '\0';
		p++;
		i++;
	}	 
	
	fclose(uf); 	
	//cout << "User array =\n" << user_array <<"\n";
}	

void write_encrypted_file(char *encrypted_file_name, int array_size, char *encrypted_array)
{
	FILE *ef = NULL;
	
	ef = fopen(encrypted_file_name, "w");
	fwrite(encrypted_array, 1, array_size, ef);
	
	fclose(ef);
}	

void write_encfile_array(char *encrypted_file_name, int array_size, char *encfile_array)
{
	FILE *ef = NULL;

	ef = fopen(encrypted_file_name, "r");
	fread(encfile_array, 1, array_size, ef);
}	

void write_decrypted_file(char *decrypted_file_name, int array_size, char *decrypted_array)
{
	FILE *df = NULL;
	
	df = fopen(decrypted_file_name, "w");
	fwrite(decrypted_array, 1, array_size, df);
	
	fclose(df);
}	

bool check_decrypted_array(char *user_array, char *decrypted_array, int array_size)
{
	char *uap = user_array;
	char *dap = decrypted_array; 
	for (int i = 0; i < array_size; i++)
	{
		if(*uap != *dap)
			return false;
	}
	return true;
}		

