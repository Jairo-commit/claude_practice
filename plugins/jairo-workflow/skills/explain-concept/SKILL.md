---
name: explain-concept
description: Explain a technical concept so it sticks - an analogy, applied to the user's own code, then the user explains it back and gets corrected. Use when the user asks to explain, teach or help them understand a concept, or why their code works the way it does.
---

# Explaining a concept

How to explain a technical concept so it sticks: give an analogy, apply it to the user's own
case, then have the user explain it back and correct what they got wrong.

## 1. Give an analogy

- Pick one everyday analogy that has the same moving parts as the concept, and map each part
  explicitly: "the catalog is the migration state", "the shelves are the database".
- Keep the same analogy all the way through. Don't switch metaphors halfway.
- Point out where the analogy breaks down, if that matters for the user's case.

## 2. Apply it to the user's case

- Go back over the analogy using the real names from the user's code: the files, migrations,
  functions and columns they're working on.
- Walk through what actually happens, step by step, and tie each step to a part of the analogy.
- Answer the question the user really asked, such as why the code is written this way,
  what would break otherwise, or what the risks are.

## 3. Ask if they got it

- End with one question asking the user to explain the idea back in their own words.
  For example: "Can you tell me in your own words what 0012 did and what 0015 does?"
- Ask nothing else in that message, and add nothing after the question.

## 4. Wait for their answer

- Stop and wait. Don't answer the question yourself, give hints, or move on to the next topic.

## 5. Check and correct

- Say plainly whether their explanation is right, partly right or wrong.
- Confirm the parts they got right, briefly and in their own words.
- Correct each wrong or missing part: quote what they said, then say what's actually true and
  why. Use the analogy again if it helps.
- Add nuance only when it changes the picture. Don't pile on details they didn't need.
- If the correction was substantial, ask them to explain it back again (go back to step 3).
  If they got it, say so and stop.

## Example

**Concept:** why migration 0015 drops the old columns with raw SQL instead of
`RemoveField`.

1. **Analogy:** a library catalog and its shelves. Throwing a book's card away doesn't
   remove the book. A librarian who works only from the catalog can't find a book that
   has no card.
2. **Applied:** 0012 removed the four fields from Django's migration state (the catalog)
   and left the columns in Postgres (the shelves). In 0015, `RemoveField` can't find the
   fields, but `RunSQL` goes straight to the table and drops them.
3. **Ask:** "Can you tell me in your own words what 0012 did and what 0015 does?"
4. **Wait.**
5. **Check:** "Right: 0012 removed them only from Django's picture, and 0015 drops them in
   Postgres. One correction: a plain `RemoveField` does drop the column. It skipped
   Postgres in 0012 only because it was inside `state_operations`."
