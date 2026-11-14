# include <stdio.h>
# include <string.h>




int main(){

    char message[1000];



    if(fgets(message , sizeof(message) , stdin) == NULL){
        printf("C program got nothing\n");
        return 0;
    }



    message[strcspn(message , "\n")] = '\0';


    message[strcspn(message , "\r")] = '\0';


    printf("C program got: %s\n" , message);


    return 0;
}
