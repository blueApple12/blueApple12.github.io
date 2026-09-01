const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>

#define DONT_KNOW "I_dont_know"

void printIDontKnow() {
    printf("%s", DONT_KNOW);
    exit(0);
}

int examT_q2(int arr[], int n, int D);

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
    int D;
    if (scanf("%d", &D) != 1) {
        free(arr);
        return 1;
    }
    printf("%d", examT_q2(arr, n, D));
    free(arr);
    return 0;
}

int examT_q2(int arr[], int n, int D) {
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
    printf("%s\\n", s);
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

int examT_q4(int n, int k);

int main(void) {
    // uncomment next line if you don't know the answer
    // printIDontKnow();

    int n, k;
    if (scanf("%d %d", &n, &k) != 2) return 1;

    printf("%d", examT_q4(n, k));
    return 0;
}

int examT_q4(int n, int k) {
    // write your code here
    return 0;
}`
};
