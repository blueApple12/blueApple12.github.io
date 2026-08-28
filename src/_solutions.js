const SOLUTIONS = {
  q2: {
    archetype: "binary-search",
    complexity: "Θ(log n) time, Θ(1) space",
    code: `int examT_q2(int arr[], int n, int x) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == x) return mid;
        if (arr[lo] <= arr[mid]) {
            if (arr[lo] <= x && x < arr[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (arr[mid] < x && x <= arr[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`
  },
  q3: {
    archetype: "in-place-two-pointers",
    complexity: "Θ(n) time, Θ(1) space",
    code: `int examT_q3(char *s) {
    int length = 0;
    while (s[length] != '\\0') length++;
    int source = length + 1;
    for (int i = length; i >= 0; i--) {
        s[source + i] = s[i];
    }
    int read = source, end = source + length, write = 0;
    while (read < end) {
        char ch = s[read];
        int count = 0;
        while (read < end && s[read] == ch) {
            read++;
            count++;
        }
        s[write++] = ch;
        s[write++] = (char)('0' + count);
    }
    s[write] = '\\0';
    return write;
}`
  },
  q4: {
    archetype: "tail-recursion",
    complexity: "Θ(d) time, Θ(d) stack space",
    code: `int examT_q4(int n, int acc) {
    if (n == 0) return acc;
    return examT_q4(n / 10, acc * 10 + n % 10);
}`
  }
};
