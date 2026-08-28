const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>

int examT_q2(int arr[], int n, int x) {
    /* write your solution here */
    return 0;
}

int main(void) {
    int n, x;
    if (scanf("%d", &n) != 1) return 1;
    int *arr = malloc((size_t)n * sizeof(*arr));
    if (n > 0 && arr == NULL) return 1;
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    scanf("%d", &x);
    printf("%d\\n", examT_q2(arr, n, x));
    free(arr);
    return 0;
}`,
  q3: `#include <stdio.h>
#include <stdlib.h>

int examT_q3(char *s, int k) {
    /* write your solution here */
    return 0;
}

int main(void) {
    int n, k;
    if (scanf("%d", &n) != 1) return 1;
    char *s = malloc((size_t)n + 1U);
    if (s == NULL) return 1;
    scanf("%s", s);
    scanf("%d", &k);
    printf("%d\\n", examT_q3(s, k));
    free(s);
    return 0;
}`,
  q4: `#include <stdio.h>
#include <stdlib.h>

int examT_q4(char *a, char *b) {
    /* write your recursive solution here */
    return 0;
}

int main(void) {
    int na, nb;
    if (scanf("%d", &na) != 1) return 1;
    char *a = malloc((size_t)na + 1U);
    scanf("%s", a);
    if (scanf("%d", &nb) != 1) return 1;
    char *b = malloc((size_t)nb + 1U);
    scanf("%s", b);
    printf("%d\\n", examT_q4(a, b));
    free(a);
    free(b);
    return 0;
}`
};
