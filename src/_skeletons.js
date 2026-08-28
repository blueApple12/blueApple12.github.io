const SKELETONS = {
  q2: `#include <stdio.h>
#include <stdlib.h>

#define N 3

int examT_q2(int mat[][N], int m, int x) {
    /* write your solution here */
    return 0;
}

int main(void) {
    int m, x;
    if (scanf("%d", &m) != 1) return 1;
    int mat[m][N];
    for (int row = 0; row < m; row++)
        for (int col = 0; col < N; col++)
            scanf("%d", &mat[row][col]);
    scanf("%d", &x);
    printf("%d\\n", examT_q2(mat, m, x));
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
