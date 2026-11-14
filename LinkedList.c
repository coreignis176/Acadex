# include <stdio.h>
# include <stdlib.h>

//? making the structure of the Node of the Linked List
struct Node{
    int Value;
    struct Node *next;
};


//? typedef the structure of the Node
typedef struct Node ND;


//? function to return the size of the linked list
int returnSize(ND** Head){

    if(*Head == NULL){
        return 0;
    }

    int siz = 0;
    ND* Temp = *Head;

    while(Temp != NULL){
        siz++;
        Temp = Temp->next;
    }


    return siz;
}



//? function to insert the element at the front of the linked list..
void insert_front(ND** Head){

    ND* Temp = (ND*)malloc(sizeof(ND));

    if(Temp == NULL){
        printf("Error to get memory in heap!!\n\n");
        return;
    }

    printf("Enter Element :- ");
    scanf("%d" , &Temp->Value);

    if(*Head == NULL){
        *Head = Temp;
        (*Head)->next = NULL;
    }
    else{
        Temp->next = *Head;
        *Head = Temp;
    }


    printf("Value inserted at the starting position!!\n\n");
}






//? function to insert the elmeent at the end of the linked list
void insert_end(ND** Head){

    ND* Temp = (ND*) malloc(sizeof(ND));

    if(Temp == NULL){
        printf("Unable to access memory in the heap!\n");
        return;
    }

    printf("Enter Element :- ");
    scanf("%d" , &Temp->Value);

    if(*Head == NULL){
        *Head = Temp;
        (*Head)->next = NULL;
    }
    else{

        ND* Temp1 = *Head;

        while(Temp1->next != NULL){
            Temp1 = Temp1->next;
        }

        Temp1->next = Temp;
        Temp->next = NULL;
    }


    printf("Value Successfully inserted at the end of the linked list!!\n\n");
}







//? Function to insert the value at the given index of the linked list
void insertIndex(ND** Head , int index){

    if(index <= 0 || index > returnSize(&(*Head))+1){
        printf("Please Enter the Valid Index!!\n\n");
        return;
    }

    if(index == 1 || *Head == NULL){
        return insert_front(&(*Head));
    }
    else if(index == returnSize(&(*Head))+1){
        return insert_end(&(*Head));
    }

    ND* Temp = (ND*) malloc(sizeof(ND));

    if(Temp == NULL){
        printf("Failed to get memory from heap!!\n\n");
        return;
    }
    else{

        printf("Enter Element :- ");
        scanf("%d" , &Temp->Value);

        ND* Temp2 = *Head;
        ND* Temp3 = *Head;
        int a = 1;

        while(a != index){
            Temp3 = Temp2;
            Temp2 = Temp2->next;
            a++;
        }

        Temp3->next = Temp;
        Temp->next = Temp2;
    }


    printf("Value Successfully inserted at the %d position\n\n" , index);

}



//? functino to delete the element at the starting of the linked list

void deleteStart(ND** Head){

    if(*Head == NULL){
        printf("No Linked List Exists!!\n\n");
        return;
    }

    ND* Temp = *Head;
    *Head = (*Head)->next;
    free(Temp);


    printf("front node successfully deleted!!\n\n");
}



//? function to delete the element at the ending of the linked list

void deleteEnd(ND** Head){

    if(*Head == NULL){
        printf("No Linked List Exists!!\n\n");
        return;
    }

    if((*Head)->next == NULL){
        ND* Temp = *Head;
        free(Temp);
        *Head = NULL;
        return;
    }

    ND* Temp = *Head;
    ND* Temp1 = NULL;

    while(Temp->next != NULL){
        Temp1 = Temp;
        Temp = Temp->next;
    }

    Temp1->next = NULL;
    free(Temp);


    printf("last node successfully deleted!!\n\n");
}



//? function to delete the node at the specific index of the linked list

void delete_position(ND** Head , int index){

    if(index <= 0 || index > returnSize(&(*Head))){
        printf("Please Enter the valid index!!\n\n");
        return;
    }

    if((*Head) == NULL){
        printf("No Linked List Exists!!\n\n");
        return;
    }
    else if(index == 1){
        return deleteStart(&(*Head));
    }
    else if(index == returnSize(&(*Head))){
        return deleteEnd(&(*Head));
    }
    

    ND* Temp = *Head;
    ND* Prev = Temp;
    int a = 1;
    
    while(a != index){
        Prev =  Temp;
        Temp = Temp->next;
        a++;
    }

    Prev->next = Temp->next;
    free(Temp);


    printf("Node successfully deleted at the %d position of the linked list !!\n\n" , index);
}



//? function to display the linked list
void display(ND** Head){

    if(*Head == NULL){
        printf("No Linked List Exists!!\n\n");
        return;
    }

    ND* Temp = *Head;

    while(Temp != NULL){
        printf("%d " , Temp->Value);
        Temp = Temp->next;
    }

    printf("\n\n");
}


//? function to display the linked list

void Display(ND** Head){

    if(*Head == NULL){
        printf("There is no linked list exist so we have no node to display....");
        return *Head;
    }
}


int main(){

    ND* Head = NULL;

    while(1){


        int option;
        printf("Enter 1 to insert at start\nEnter 2 to insert at end\nEnter 3 to insert at any position\nEnter 4 to delete at start\nEnter 5 to delete at end\nEnter 6 to delete at any position\nEnter 7 to display\nEnter your option :- ");
        scanf("%d" , &option);

        switch(option){

            case 1:{
                insert_front(&Head);
                break;
            }

            case 2:{
                insert_end(&Head);
                break;
            }


            case 3:{
                int index;
                printf("Enter index :- ");
                scanf("%d" , &index);
                insertIndex(&Head , index);
                break;
            }


            case 4:{
                deleteStart(&Head);
                break;
            }


            case 5:{
                deleteEnd(&Head);
                break;
            }


            case 6:{
                int index;
                printf("enter your index :- ");
                scanf("%d" , &index);
                delete_position(&Head , index);
                break;
            }

            case 7:{
                display(&Head);
                break;
            }

        }
    }
}