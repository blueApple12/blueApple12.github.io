const SOLUTIONS = {
  q2: {
    archetype: "binary-search-on-answer",
    complexity: "O(n log(sum(weights))) time, O(1) space",
    code: `int examT_q2(int weights[], int n, int D) {
    int low = weights[0], high = 0;
    for (int i = 0; i < n; i++) {
        if (weights[i] > low) low = weights[i];
        high += weights[i];
    }
    while (low < high) {
        int capacity = low + (high - low) / 2;
        int groups = 1, current = 0;
        for (int i = 0; i < n; i++) {
            if (current + weights[i] > capacity) {
                groups++;
                current = weights[i];
            } else {
                current += weights[i];
            }
        }
        if (groups <= D) high = capacity;
        else low = capacity + 1;
    }
    return low;
}`
  },
  q3: {
    archetype: "in-place-two-pointers",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q3(char *s) {
    int read = 0, write = 0, replacements = 0;
    while (s[read] != '\\0') {
        if (s[read] == 'a' && s[read + 1] == 'b') {
            s[write++] = '#';
            read += 2;
            replacements++;
        } else {
            s[write++] = s[read++];
        }
    }
    s[write] = '\\0';
    return replacements;
}`
  },
  q4: {
    archetype: "direct-recursion",
    complexity: "Θ(log n) time, Θ(log n) stack space",
    code: `int examT_q4(int n) {
    if (n == 0) return 0;
    return (n % 2) + examT_q4(n / 2);
}`
  }
};
