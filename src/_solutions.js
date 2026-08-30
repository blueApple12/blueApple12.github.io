const SOLUTIONS = {
  q2: {
    archetype: "parity-binary-search",
    complexity: "Θ(log n) time, Θ(1) space",
    code: `int examT_q2(int arr[], int n) {
    int lo = 0, hi = n - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (mid % 2 == 1) mid--;
        if (arr[mid] == arr[mid + 1]) lo = mid + 2;
        else hi = mid;
    }
    return arr[lo];
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
    archetype: "include-exclude-recursion",
    complexity: "Θ(2^n) time, Θ(n) stack space",
    code: `int examT_q4(int *arr, int n, int k) {
    if (n == 0) return k == 0 ? 1 : 0;
    return examT_q4(arr + 1, n - 1, k - arr[0])
        + examT_q4(arr + 1, n - 1, k);
}`
  }
};
