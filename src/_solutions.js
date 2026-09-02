const SOLUTIONS = {
  q2: {
    archetype: "שני חיפושים בינאריים משורשרים: תחילת החיוביים, ואז ההיסט הראשון",
    complexity: "זמן Θ(log n) · מקום Θ(1)",
    code: `int examT_q2(int arr[], int n) {
    int lo = 0, hi = n - 1, p = n;
    while (lo <= hi) {
        int m = lo + (hi - lo) / 2;
        if (arr[m] > 0) {
            p = m;
            hi = m - 1;
        } else {
            lo = m + 1;
        }
    }
    int cnt = n - p;
    lo = 0;
    hi = cnt - 1;
    int ans = cnt;
    while (lo <= hi) {
        int m = lo + (hi - lo) / 2;
        if (arr[p + m] > m + 1) {
            ans = m;
            hi = m - 1;
        } else {
            lo = m + 1;
        }
    }
    return ans + 1;
}`
  },
  q3: {
    archetype: "אינדקסי הופעה ראשונה ואחרונה — בדיקת הכלה ממש בין שתי קבוצות התווים",
    complexity: "זמן Θ(n) · מקום נוסף Θ(1)",
    code: `int examT_q3(char* s) {
    int first[26], last[26];
    for (int k = 0; k < 26; k++) {
        first[k] = -1;
        last[k] = -1;
    }
    int n = 0;
    while (s[n] != '\\0') {
        int c = s[n] - 'a';
        if (first[c] == -1) {
            first[c] = n;
        }
        last[c] = n;
        n++;
    }
    int count = 0;
    for (int i = 1; i < n; i++) {
        int subset = 1, strict = 0;
        for (int k = 0; k < 26; k++) {
            if (last[k] == -1) {
                continue;
            }
            int inL = (first[k] != -1 && first[k] <= i - 1);
            int inR = (last[k] >= i);
            if (inL && !inR) {
                subset = 0;
            }
            if (!inL && inR) {
                strict = 1;
            }
        }
        if (subset && strict) {
            count++;
        }
    }
    return count;
}`
  },
  q4: {
    archetype: "רקורסיה כפולה — כל דרך מתחילה בצעד של 1 או של 2",
    complexity: "אין דרישת סיבוכיות",
    code: `int examT_q4(int n) {
    if (n < 0) {
        return 0;
    }
    if (n <= 1) {
        return 1;
    }
    return examT_q4(n - 1) + examT_q4(n - 2);
}`
  }
};
