const SOLUTIONS = {
  q2: {
    archetype: "binary-search-slope",
    complexity: "Θ(log n) time, Θ(1) space",
    code: `int examT_q2(int arr[], int n) {
    int lo = 0, hi = n - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] < arr[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`
  },
  q3: {
    archetype: "two-pass-frequency",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q3(char *s) {
    int count[26] = {0};
    for (int i = 0; s[i] != '\\0'; i++) {
        count[s[i] - 'a']++;
    }
    for (int i = 0; s[i] != '\\0'; i++) {
        if (count[s[i] - 'a'] == 1) return i;
    }
    return -1;
}`
  },
  q4: {
    archetype: "nested-direct-recursion",
    complexity: "recursive enumeration",
    code: `int exam5_max_prefix(int *arr, int length) {
    if (length == 1) return arr[0];
    int previous = exam5_max_prefix(arr, length - 1);
    return arr[length - 1] > previous ? arr[length - 1] : previous;
}

int exam5_count_from(int *arr, int n, int x, int length) {
    if (length > n) return 0;
    return (exam5_max_prefix(arr, length) == x)
        + exam5_count_from(arr, n, x, length + 1);
}

int examT_q4(int *arr, int n, int x) {
    if (n == 0) return 0;
    return exam5_count_from(arr, n, x, 1)
        + examT_q4(arr + 1, n - 1, x);
}`
  }
};
