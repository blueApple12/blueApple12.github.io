const SOLUTIONS = {
  q2: {
    archetype: "חיפוש בינארי על התשובה (minimise the maximum)",
    complexity: "זמן Θ(n · log(Σarr)) · מקום נוסף Θ(1)",
    code: `int examT_q2(int arr[], int n, int D) {
    int low = 0, high = 0;
    for (int i = 0; i < n; i++) {
        if (arr[i] > low) {
            low = arr[i];
        }
        high += arr[i];
    }
    while (low < high) {
        int mid = low + (high - low) / 2;
        int groups = 1, sum = 0;
        for (int i = 0; i < n; i++) {
            if (sum + arr[i] > mid) {
                groups++;
                sum = arr[i];
            } else {
                sum += arr[i];
            }
        }
        if (groups > D) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}`
  },
  q3: {
    archetype: "זיהוי רצפים במקום עם שני סמנים — השוואת אורך הרצף לאורך המילה שלפניו",
    complexity: "זמן Θ(n) · מקום נוסף Θ(1)",
    code: `int examT_q3(char* s) {
    int write = 0, read = 0, wordLen = 0, plusCount = 0;
    while (s[read] != '\\0') {
        if (s[read] != '$') {
            s[write] = s[read];
            write++;
            read++;
            wordLen++;
        } else {
            int runLen = 0;
            while (s[read] == '$') {
                runLen++;
                read++;
            }
            if (runLen > wordLen) {
                s[write] = '+';
                plusCount++;
            } else {
                s[write] = '*';
            }
            write++;
            wordLen = 0;
        }
    }
    s[write] = '\\0';
    return plusCount;
}`
  },
  q4: {
    archetype: "רקורסיה על שני פרמטרים: חלוקה חוזרת בגורם, אחרת הקטנת החסם",
    complexity: "אין דרישת סיבוכיות",
    code: `int examT_q4(int n, int k) {
    if (n == 1) {
        return 1;
    }
    if (k <= 1) {
        return 0;
    }
    if (n % k == 0) {
        return examT_q4(n / k, k);
    }
    return examT_q4(n, k - 1);
}`
  }
};
