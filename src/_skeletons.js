const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>

int examT_q2(int weights[], int n, int D) {
    /* write your solution here */
    return 0;
}

int main(void) {
    int n, D;
    if (scanf("%d", &n) != 1) return 1;
    int *weights = malloc((size_t)n * sizeof(*weights));
    if (n > 0 && weights == NULL) return 1;
    for (int i = 0; i < n; i++) scanf("%d", &weights[i]);
    scanf("%d", &D);
    printf("%d\\n", examT_q2(weights, n, D));
    free(weights);
    return 0;
}`,
  q3: `#include <stdio.h>
#include <stdlib.h>

int examT_q3(char *s) {
    /* write your solution here */
    return 0;
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

int examT_q4(int n) {
    /* write your recursive solution here */
    return 0;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 1;
    printf("%d\\n", examT_q4(n));
    return 0;
}`
};
