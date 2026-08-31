const SOLUTIONS = {
  q2: {
    archetype: "חיפוש דוהר (galloping) למציאת חסם, ואז חיפוש בינארי",
    complexity: "זמן Θ(log n) · מקום Θ(1)",
    code: `int examT_q2(int* arr, int x) {
    if (arr[0] == EMPTY) {
        return -1;
    }
    int high = 1;
    while (arr[high] != EMPTY && arr[high] < x) {
        high *= 2;
    }
    int low = high / 2;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == EMPTY || arr[mid] > x) {
            high = mid - 1;
        } else if (arr[mid] < x) {
            low = mid + 1;
        } else {
            return mid;
        }
    }
    return -1;
}`
  },
  q3: {
    archetype: "מעבר יחיד עם היסטוגרמה ומערך אינדקסי הופעה ראשונה",
    complexity: "זמן Θ(n) · מקום נוסף Θ(1)",
    code: `int examT_q3(char* s) {
    int count[26] = {0};
    int first[26];
    for (int c = 0; c < 26; c++) {
        first[c] = -1;
    }
    for (int i = 0; s[i] != '\\0'; i++) {
        int c = s[i] - 'a';
        if (count[c] == 0) {
            first[c] = i;
        }
        count[c]++;
    }
    int best = -1;
    for (int c = 0; c < 26; c++) {
        if (count[c] == 1 && (best == -1 || first[c] < best)) {
            best = first[c];
        }
    }
    return best;
}`
  },
  q4: {
    archetype: "הכלה עם ריבוי ברקורסיה: ספירת תו ברקורסיה, ואז צעד קדימה",
    complexity: "אין דרישת סיבוכיות",
    code: `int count_char(char* s, char c) {
    if (*s == '\\0') {
        return 0;
    }
    return ((*s == c) ? 1 : 0) + count_char(s + 1, c);
}

int examT_q4(char* a, char* b) {
    if (*a == '\\0') {
        return 1;
    }
    if (count_char(a, *a) > count_char(b, *a)) {
        return 0;
    }
    return examT_q4(a + 1, b);
}`
  }
};
