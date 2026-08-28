const SOLUTIONS = {
  q2: {
    archetype: "two-pointers",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q2(int arr[], int n) {
    int left = 0, right = n - 1, best = 0;
    while (left < right) {
        int height = arr[left] < arr[right] ? arr[left] : arr[right];
        int area = (right - left) * height;
        if (area > best) best = area;
        if (arr[left] <= arr[right]) left++;
        else right--;
    }
    return best;
}`
  },
  q3: {
    archetype: "fixed-sliding-histogram",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q3(char *s, char *p) {
    int wanted[26] = {0}, window[26] = {0};
    int n = 0, m = 0;
    while (s[n] != '\\0') n++;
    while (p[m] != '\\0') {
        wanted[p[m] - 'a']++;
        m++;
    }
    for (int i = 0; i < m; i++) window[s[i] - 'a']++;
    int total = 0;
    for (int start = 0; start + m <= n; start++) {
        int equal = 1;
        for (int ch = 0; ch < 26; ch++) {
            if (window[ch] != wanted[ch]) equal = 0;
        }
        total += equal;
        if (start + m < n) {
            window[s[start] - 'a']--;
            window[s[start + m] - 'a']++;
        }
    }
    return total;
}`
  },
  q4: {
    archetype: "direct-subsequence-recursion",
    complexity: "Θ(na) time, Θ(na) stack space",
    code: `int examT_q4(int *a, int na, int *b, int nb) {
    if (nb == 0) return 1;
    if (na == 0) return 0;
    if (a[0] == b[0]) return examT_q4(a + 1, na - 1, b + 1, nb - 1);
    return examT_q4(a + 1, na - 1, b, nb);
}`
  }
};
