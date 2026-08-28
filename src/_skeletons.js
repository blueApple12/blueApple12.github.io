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

int examT_q3(char *s, char *p) {
    /* write your solution here */
    return 0;
}

int main(void) {
    int n, m;
    if (scanf("%d", &n) != 1) return 1;
    char *s = malloc((size_t)n + 1U);
    scanf("%s", s);
    if (scanf("%d", &m) != 1) return 1;
    char *p = malloc((size_t)m + 1U);
    scanf("%s", p);
    printf("%d\\n", examT_q3(s, p));
    free(s);
    free(p);
    return 0;
}`,
  q4: `#include <stdio.h>
#include <stdlib.h>

int examT_q4(int *a, int na, int *b, int nb) {
    /* write your recursive solution here */
    return 0;
}

int main(void) {
    int na, nb;
    if (scanf("%d", &na) != 1) return 1;
    int *a = malloc((size_t)na * sizeof(*a));
    for (int i = 0; i < na; i++) scanf("%d", &a[i]);
    if (scanf("%d", &nb) != 1) return 1;
    int *b = malloc((size_t)nb * sizeof(*b));
    for (int i = 0; i < nb; i++) scanf("%d", &b[i]);
    printf("%d\\n", examT_q4(a, na, b, nb));
    free(a);
    free(b);
    return 0;
}`
};
