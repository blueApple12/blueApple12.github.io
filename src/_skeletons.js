const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

int examT_q2(int arr[], int x) {
    /* write your solution here */
    return -1;
}

int main(void) {
    int n, x;
    if (scanf("%d", &n) != 1) return 1;
    int *arr = malloc((size_t)(2 * n + 2) * sizeof(*arr));
    if (arr == NULL) return 1;
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    for (int i = n; i < 2 * n + 2; i++) arr[i] = INT_MIN;
    scanf("%d", &x);
    printf("%d\\n", examT_q2(arr, x));
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

int examT_q4(int *arr, int n, int k) {
    /* write your recursive solution here */
    return 0;
}

int main(void) {
    int n, k;
    if (scanf("%d", &n) != 1) return 1;
    int *arr = malloc((size_t)n * sizeof(*arr));
    if (n > 0 && arr == NULL) return 1;
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    scanf("%d", &k);
    printf("%d\\n", examT_q4(arr, n, k));
    free(arr);
    return 0;
}`
};
