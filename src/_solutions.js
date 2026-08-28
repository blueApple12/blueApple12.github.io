const SOLUTIONS = {
  q2: {
    archetype: "two-binary-searches",
    complexity: "Θ(log n) time, Θ(1) space",
    code: `int examT_q2(int arr[], int n, int x) {
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] < x) lo = mid + 1;
        else hi = mid;
    }
    int first = lo;
    lo = 0;
    hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] <= x) lo = mid + 1;
        else hi = mid;
    }
    return lo - first;
}`
  },
  q3: {
    archetype: "quadratic-frequency-enumeration",
    complexity: "O(n^2) time, O(1) space",
    code: `int examT_q3(char *s, int k) {
    int total = 0;
    for (int start = 0; s[start] != '\\0'; start++) {
        int frequency[256] = {0};
        int maximum = 0;
        for (int end = start; s[end] != '\\0'; end++) {
            unsigned char ch = (unsigned char)s[end];
            frequency[ch]++;
            if (frequency[ch] > maximum) maximum = frequency[ch];
            if (maximum <= k) total++;
        }
    }
    return total;
}`
  },
  q4: {
    archetype: "direct-pointer-recursion",
    complexity: "Θ(p) time, Θ(p) stack space",
    code: `int examT_q4(char *a, char *b) {
    if (*a == '\\0' || *b == '\\0' || *a != *b) return 0;
    return 1 + examT_q4(a + 1, b + 1);
}`
  }
};
