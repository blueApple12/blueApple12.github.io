const SOLUTIONS = {
  q2: {
    archetype: "staircase-search",
    complexity: "O(m+N) time, O(1) space",
    code: `int examT_q2(int mat[][N], int m, int x) {
    int row = 0, col = N - 1;
    while (row < m && col >= 0) {
        if (mat[row][col] == x) return 1;
        if (mat[row][col] > x) col--;
        else row++;
    }
    return 0;
}`
  },
  q3: {
    archetype: "in-place-deduplication",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q3(char *s) {
    int seen[26] = {0};
    int read = 0, write = 0;
    while (s[read] != '\\0') {
        int index = s[read] - 'a';
        if (!seen[index]) {
            seen[index] = 1;
            s[write++] = s[read];
        }
        read++;
    }
    s[write] = '\\0';
    return write;
}`
  },
  q4: {
    archetype: "fibonacci-recursion",
    complexity: "exponential time, Θ(n) stack space",
    code: `int examT_q4(int n) {
    if (n == 0 || n == 1) return 1;
    return examT_q4(n - 1) + examT_q4(n - 2);
}`
  }
};
