const SKELETONS = {
q2: `#include <stdio.h>
#include <stdlib.h>

#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q2(int arr[], int n, int x);

int main(void) {
    // uncomment next line if you don't know the answer
    // printIDontKnow();

    int n;
    if (scanf("%d", &n) != 1) return 1;
    int* arr = malloc(n * sizeof(int));
    if (!arr) return 1;
    for (int i = 0; i < n; i++) {
        if (scanf("%d", &arr[i]) != 1) {
            free(arr);
            return 1;
        }
    }
    int x;
    if (scanf("%d", &x) != 1) {
        free(arr);
        return 1;
    }
    printf("%d", examT_q2(arr, n, x));
    free(arr);
    return 0;
}

int examT_q2(int arr[], int n, int x) {
    // write your code here
    return 0;
}
`,
q3: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q3(char* s, int k);

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
    int k;
    if (scanf("%d", &k) != 1) {
        free(s);
        return 1;
    }
    printf("%d\\n", examT_q3(s, k));
    free(s);
    return 0;
}

int examT_q3(char* s, int k) {
    // write your code here
    return 0;
}
`,
q4: `#include <stdio.h>
#include <stdlib.h>

#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q4(int* arr, int n, int k);

int main(void) {
    // uncomment next line if you don't know the answer
    // printIDontKnow();

    int n;
    if (scanf("%d", &n) != 1) return 1;
    int* arr = NULL;
    if (n > 0) {
        arr = malloc(n * sizeof(int));
        if (!arr) return 1;
        for (int i = 0; i < n; i++) {
            if (scanf("%d", &arr[i]) != 1) {
                free(arr);
                return 1;
            }
        }
    }
    int k;
    if (scanf("%d", &k) != 1) {
        free(arr);
        return 1;
    }
    printf("%d\\n", examT_q4(arr, n, k));
    free(arr);
    return 0;
}

int examT_q4(int* arr, int n, int k) {
    // write your code here
    return 0;
}
`
};