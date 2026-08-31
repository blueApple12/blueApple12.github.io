const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

#define EMPTY INT_MIN
#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q2(int* arr, int x);

int main(void) {
    // uncomment next line if you don't know the answer
    // printIDontKnow();

    int n;
    if (scanf("%d", &n) != 1 || n < 0) return 1;
    // the array is padded with EMPTY so that its true length is not visible
    int cap = 1;
    while (cap <= n) cap *= 2;
    int* arr = malloc((cap + 1) * sizeof(int));
    if (!arr) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &arr[i]) != 1) {
            free(arr);
            return 1;
        }
    }
    for (int i = n; i <= cap; i++) {
        arr[i] = EMPTY;
    }
    int x;
    if (scanf("%d", &x) != 1) {
        free(arr);
        return 1;
    }
    printf("%d", examT_q2(arr, x));
    free(arr);
    return 0;
}

int examT_q2(int* arr, int x) {
    // write your code here
    return 0;
}`,
  q3: `#include <stdio.h>
#include <stdlib.h>

#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q3(char* s);

int main(void) {
    // uncomment next line if you don't know the answer
    // printIDontKnow();

    int n;
    if (scanf("%d", &n) != 1) return 1;
    char* s = malloc((n + 1) * sizeof(char));
    if (!s) return 1;
    if (scanf("%s", s) != 1) {
        free(s);
        return 1;
    }
    printf("%d\\n", examT_q3(s));
    free(s);
    return 0;
}

int examT_q3(char* s) {
    // write your code here
    return 0;
}`,
  q4: `#include <stdio.h>
#include <stdlib.h>

#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q4(char* a, char* b);

//Do not change this function
char* read_string(void) {
    int len;
    if (scanf("%d", &len) != 1) return NULL;
    char* str = malloc((len + 1) * sizeof(char));
    if (!str) return NULL;
    if (scanf("%s", str) != 1) {
        free(str);
        return NULL;
    }
    return str;
}

int main(void) {
    // uncomment next line if you don't know the answer
    // printIDontKnow();

    char* a = read_string();
    if (!a) return 1;
    char* b = read_string();
    if (!b) {
        free(a);
        return 1;
    }
    printf("%d\\n", examT_q4(a, b));
    free(a);
    free(b);
    return 0;
}

int examT_q4(char* a, char* b) {
    // write your code here
    return 0;
}`
};
