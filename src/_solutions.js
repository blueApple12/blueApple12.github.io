const SOLUTIONS = {
  q2: {
    archetype: "חיפוש דוהר לגבול k, ואז חיפוש בינארי יורד על הסף",
    complexity: "זמן Θ(log k) · מקום Θ(1)",
    code: `int examT_q2(int arr[], int n, int x) {
    if (n == 0 || arr[0] == 0) {
        return 0;
    }
    int high = 1;
    while (high < n && arr[high] != 0) {
        high *= 2;
    }
    int lo = high / 2;
    int hi = (high < n) ? high : n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == 0) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }
    int k = lo;
    int a = 0, b = k - 1, cnt = 0;
    while (a <= b) {
        int mid = a + (b - a) / 2;
        if (arr[mid] > x) {
            cnt = mid + 1;
            a = mid + 1;
        } else {
            b = mid - 1;
        }
    }
    return cnt;
}`
  },
  q3: {
    archetype: "חלוקה יציבה במקום עם סמן כתיבה, ואז מילוי הזנב",
    complexity: "זמן Θ(n) · מקום נוסף Θ(1)",
    code: `int examT_q3(char* s, char c) {
    int write = 0, count = 0;
    for (int read = 0; s[read] != '\\0'; read++) {
        if (s[read] != c) {
            s[write] = s[read];
            write++;
        } else {
            count++;
        }
    }
    for (int i = 0; i < count; i++) {
        s[write + i] = c;
    }
    return count;
}`
  },
  q4: {
    archetype: "איתור אי-ההתאמה הראשונה, ואז בדיקת שוויון מלא של השאר",
    complexity: "אין דרישת סיבוכיות",
    code: `int sameRec(char* a, char* b) {
    if (*a == '\\0' && *b == '\\0') {
        return 1;
    }
    if (*a == '\\0' || *b == '\\0') {
        return 0;
    }
    if (*a != *b) {
        return 0;
    }
    return sameRec(a + 1, b + 1);
}

int examT_q4(char* a, char* b) {
    if (*b == '\\0') {
        return 0;
    }
    if (*a == '\\0') {
        return (*(b + 1) == '\\0') ? 1 : 0;
    }
    if (*a == *b) {
        return examT_q4(a + 1, b + 1);
    }
    return sameRec(a, b + 1);
}`
  }
};
