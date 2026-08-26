const SOLUTIONS = {
q2: {
  archetype: "בינארי על מבנה עולה-יורד (מערך הררי)",
  complexity: "דרישה: זמן Θ(log n) · מקום Θ(1)",
  code: `int examT_q2(int arr[], int n, int x) {
    int low = 0, high = n - 1;
    while (low < high) {
        int mid = (low + high) / 2;
        if (arr[mid] < arr[mid + 1]) low = mid + 1;
        else high = mid;
    }
    int p = low, count = 0;
    int lo = 0, hi = p, L = -1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] > x) { L = mid; hi = mid - 1; }
        else lo = mid + 1;
    }
    if (L != -1) count += p - L + 1;
    lo = p + 1; hi = n - 1;
    int R = -1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] > x) { R = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    if (R != -1) count += R - p;
    return count;
}`
},
q3: {
  archetype: "היסטוגרמה על כל תת-המחרוזות",
  complexity: "דרישה: זמן O(n²) · מקום נוסף O(1)",
  code: `int examT_q3(char* s, int k) {
    int n = 0;
    while (s[n] != '\\0') n++;
    int count = 0;
    for (int start = 0; start < n; start++) {
        int hist[26];
        for (int i = 0; i < 26; i++) hist[i] = 0;
        int distinct = 0, exactK = 0;
        for (int end = start; end < n; end++) {
            int c = s[end] - 'a';
            if (hist[c] == 0) distinct++;
            if (hist[c] == k) exactK--;
            hist[c]++;
            if (hist[c] == k) exactK++;
            if (distinct == exactK) count++;
        }
    }
    return count;
}`
},
q4: {
  archetype: "ספירה רקורסיבית ללא עטיפה",
  complexity: "אין דרישת סיבוכיות בשאלה זו",
  code: `int countPrefixes(int* arr, int n, int k) {
    if (n == 0) return 0;
    return (arr[0] == k ? 1 : 0) + countPrefixes(arr + 1, n - 1, k - arr[0]);
}

int examT_q4(int* arr, int n, int k) {
    if (n <= 0) return 0;
    return countPrefixes(arr, n, k) + examT_q4(arr + 1, n - 1, k);
}`
}
};
