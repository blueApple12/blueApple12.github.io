const SOLUTIONS = {
  q2: {
    archetype: "galloping-then-binary-search",
    complexity: "Θ(log n) time, Θ(1) space",
    code: `int examT_q2(int arr[], int x) {
    if (arr[0] == INT_MIN) return -1;
    if (arr[0] == x) return 0;
    int high = 1;
    while (arr[high] != INT_MIN && arr[high] < x) {
        high *= 2;
    }
    int low = high / 2;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == x) return mid;
        if (arr[mid] == INT_MIN || arr[mid] > x) high = mid - 1;
        else low = mid + 1;
    }
    return -1;
}`
  },
  q3: {
    archetype: "presence-mask-with-counts",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q3(char *s) {
    int remaining[26] = {0};
    int suffix = 0, prefix = 0;
    for (int i = 0; s[i] != '\\0'; i++) {
        int bit = s[i] - 'a';
        remaining[bit]++;
        suffix |= 1 << bit;
    }
    for (int i = 0; s[i] != '\\0'; i++) {
        int bit = s[i] - 'a';
        prefix |= 1 << bit;
        remaining[bit]--;
        if (remaining[bit] == 0) suffix &= ~(1 << bit);
        if (prefix == suffix) return i;
    }
    return -1;
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
