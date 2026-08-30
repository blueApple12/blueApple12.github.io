const SOLUTIONS = {
  q2: {
    archetype: "חיפוש בינארי על השיפוע — arr[mid] < arr[mid+1] מעיד שהשיא מימין",
    complexity: "זמן Θ(log n) · מקום Θ(1)",
    code: `int examT_q2(int arr[], int n) {
    int low = 0, high = n - 1;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] < arr[mid + 1]) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}`
  },
  q3: {
    archetype: "הרחבה מכל התחלה — מונים נצברים ועצירה מוקדמת כשהתנאי נשבר לתמיד",
    complexity: "זמן O(n²) · מקום נוסף O(1)",
    code: `int examT_q3(char* s) {
    int n = 0;
    while (s[n] != '\\0') {
        n++;
    }
    int total = 0;
    for (int i = 0; i < n; i++) {
        int count[26] = {0};
        int vowels = 0, consonants = 0;
        for (int j = i; j < n; j++) {
            int c = s[j] - 'a';
            count[c]++;
            if (count[c] > 2) {
                break;
            }
            if (is_vowel(s[j])) {
                vowels++;
            } else {
                consonants++;
            }
            if (j - i + 1 >= 3 && vowels > 0 && consonants > 0) {
                total++;
            }
        }
    }
    return total;
}`
  },
  q4: {
    archetype: "רקורסיה כפולה — אורך הרצף שמתחיל כאן, מול המיטב שבהמשך",
    complexity: "אין דרישת סיבוכיות",
    code: `int run_from(int* arr, int n) {
    if (n <= 1) {
        return n;
    }
    if (arr[0] < arr[1]) {
        return 1 + run_from(arr + 1, n - 1);
    }
    return 1;
}

int examT_q4(int* arr, int n) {
    if (n <= 0) {
        return 0;
    }
    int here = run_from(arr, n);
    int rest = examT_q4(arr + 1, n - 1);
    return (here > rest) ? here : rest;
}`
  }
};
