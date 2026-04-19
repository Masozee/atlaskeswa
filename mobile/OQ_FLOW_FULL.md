# QL1 = [R, D, O, A, I] - Full Multiple Selection Flow

## Scenario: User selects ALL 5 options in QL1, and O has OQ1=[AKUT, NON_AKUT] (multiple)

```
QL1 = ['R', 'D', 'O', 'A', 'I']  (all selected)
       │
       ├── R ──▶ RQ1 → RQ2 → ... → RQ13 → RQA...RQJ (detail)
       │
       ├── D ──▶ DQ1 → ... → DQ15 → DQA...DQJ (detail)
       │
       ├── O ──▶ OQ1 = [AKUT, NON_AKUT]
       │          │
       │          ├── AKUT: OQ2 → OQ3 → OQ4 → OQA...RQJ (detail)
       │          │                      │
       │          │              after detail: back to OQ1's second choice NON_AKUT
       │          │
       │          └── NON_AKUT: OQ9 → OQ10 → ... → OQ19 → OQA...RQJ (detail)
       │
       ├── A ──▶ AQ1 → ... → AQ19 → AQA...AQJ (detail)
       │
       └── I ──▶ IQ1 → ... → IQ19 → IQA...IQJ (detail)
```

---

## O Branch Detail (OQ1 = [AKUT, NON_AKUT])

```
OQ1 [AKUT, NON_AKUT]
    │
    ├── AKUT branch:
    │   OQ2 → OQ3 → OQ4 → OQA(R) → RQB → RQC → RQD → RQF → RQG → RQH → RQI → RQJ
    │                                    │
    │                          after detail complete
    │                          check OQ1 → NON_AKUT still available → go to OQ9
    │
    └── NON_AKUT branch:
        OQ9 → OQ10 → OQ11 → OQ12
               │              │
               │              └──▶ OQA(R) → ... → RQJ (detail 2)
               │
               └── OQ13 → OQA... (detail 3) → OQ14 → OQA... (detail 4)
                       → OQ15 → OQA... (detail 5)
                       → OQ16 → OQ17 → OQ18 → OQ19
                                                       └──▶ OQA(R) → ... → RQJ (detail 6) → END
```

---

## Complete Flow Order

```
Entry points (from QL1): RQ1, DQ1, OQ1, AQ1, IQ1

Processing by order:
═══════════════════════════════════════════════════════════════════
1.  RQ1 (MULTIPLE: AKUT, NON-AKUT)
2.  RQ2
3.  RQ3
4.  RQA ── detail block ──▶ RQB → RQC → RQD → RQF → RQG → RQH → RQI → RQJ
5.  RQ5
6.  RQ6
7.  RQA ── detail block ──▶ RQB → RQC → RQD → RQF → RQG → RQH → RQI → RQJ
8.  RQ7
═══════════════════════════════════════════════════════════════════
9.  DQ1 (MULTIPLE)
    → DQA ── detail block ──▶ DQB → ... → DQJ
═══════════════════════════════════════════════════════════════════
10. OQ1 (MULTIPLE: AKUT, NON_AKUT)
    ├── AKUT branch:
    11. OQ2
    12. OQ3
    13. OQ4
    14. OQA ── detail block ──▶ RQB → ... → RQJ
            │
            └── after detail → OQ1 still has NON_AKUT → go to OQ9

    └── NON_AKUT branch:
    15. OQ9
    16. OQ10
    17. OQ11
    18. OQ12
    19. OQA ── detail block ──▶ RQB → ... → RQJ
    20. OQ13 ── detail block
    21. OQ14 ── detail block
    22. OQ15 ── detail block
    23. OQ16
    24. OQ17
    25. OQ18
    26. OQ19
    27. OQA ── detail block ──▶ END
═══════════════════════════════════════════════════════════════════
28. AQ1 (MULTIPLE)
    → AQA ── detail block ──▶ AQB → ... → AQJ
═══════════════════════════════════════════════════════════════════
29. IQ1 (MULTIPLE)
    → IQA ── detail block ──▶ IQB → ... → IQJ → END
═══════════════════════════════════════════════════════════════════
```

---

## Navigation Rules for QL1 Multiple Selection

| Situation | Action |
|-----------|--------|
| QL1 = [R, D, O, A, I] | Process in order: R, D, O, A, I |
| Each QL entry is a MULTIPLE_CHOICE | Process all selected branches sequentially |
| OQ1 = [AKUT, NON_AKUT] | Process AKUT branch first, then NON_AKUT branch |
| After detail block (OQ4 → OQA) | Check if OQ1 has more unvisited branches → continue |
| After NON_AKUT detail (OQ12 → OQA) | OQ1 branches exhausted → check if more O questions unvisited → continue sequentially |
| After final detail (OQ19 → OQA) | END (no more questions) |

---

## Code Changes Made

### Backend (RQ7 fix)
```python
# RQ7 show_condition: only show for Non-Hospital when QL1='R'
rq7.show_condition = {
    'operator': 'and',
    'conditions': [
        {'question_code': 'QL1', 'operator': 'contains', 'value': 'R'},
        {'question_code': 'Q4', 'operator': 'not_in', 'value': ['RSU', 'RSJ']}
    ]
}
```

### Mobile (question-logic.ts)

1. **Compound `and/or` show_condition support**:
   ```typescript
   if (showCondition.operator === 'and' || showCondition.operator === 'or') {
     const conditions = showCondition.conditions || [];
     if (showCondition.operator === 'and') {
       return conditions.every((cond) => evaluateSingleCondition(cond, allResponses));
     } else {
       return conditions.some((cond) => evaluateSingleCondition(cond, allResponses));
     }
   }
   ```

2. **MC branch continuation after detail block**:
   ```typescript
   if (mcFound) {
     const unvisitedInSection = visibleQuestions.filter(q => !visited.has(q.code));
     if (unvisitedInSection.length > 0) {
       // Continue sequentially to unvisited questions
       let nextIdx = visibleQuestions.indexOf(current) + 1;
       while (nextIdx < visibleQuestions.length && visited.has(visibleQuestions[nextIdx].code)) {
         nextIdx++;
       }
       if (nextIdx < visibleQuestions.length) {
         current = visibleQuestions[nextIdx];
         continue;
       }
     }
     // No unvisited → END
   }
   ```

3. **Removed duplicate check for _visitedSectionIds** (line 475)

4. **Fixed early return for inline DETAIL sections** (line 345-358)
   - Changed from checking ALL questions answered to checking only UNVISITED questions
   - This allows full detail chain traversal even when all questions appear answered