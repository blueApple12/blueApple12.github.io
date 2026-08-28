const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>

int examT_q2(int arr[], int n) {
    /* write your solution here */
    return 0;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 1;
    int *arr = malloc((size_t)n * sizeof(*arr));
    if (arr == NULL) return 1;
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    printf("%d\\n", examT_q2(arr, n));
    free(arr);
    return 0;
}`,
  q3: `#include <stdio.h>
#include <stdlib.h>

int examT_q3(char *s) {
    /* write your solution here */
    return -1;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 1;
    char *s = malloc((size_t)n + 1U);
    if (s == NULL) return 1;
    scanf("%s", s);
    printf("%d\\n", examT_q3(s));
    free(s);
    return 0;
}`,
  q4: `#include <stdio.h>
#include <stdlib.h>

int examT_q4(int *arr, int n, int x) {
    /* you may add the two required recursive helpers above this function */
    return 0;
}

int main(void) {
    int n, x;
    if (scanf("%d", &n) != 1) return 1;
    int *arr = malloc((size_t)n * sizeof(*arr));
    if (n > 0 && arr == NULL) return 1;
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    scanf("%d", &x);
    printf("%d\\n", examT_q4(arr, n, x));
    free(arr);
    return 0;
}`
};
