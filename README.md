# Picture the Patient

A small clinical provocation about how a picture of a patient is assembled from partial information.

The prototype generates a patient from five independently changeable strips:

- **In the note** — clinical shorthand
- **What is seen** — observable behaviour in the encounter
- **Outside the room** — life context that may not enter the note
- **What they think** — the patient's working model of illness or recovery
- **Still unknown** — the question the assembled picture cannot answer

Press **PICTURE THE PATIENT** to regenerate the whole picture, or use the ↻ button beside any strip to change only that fragment. The point is not to generate plausible synthetic cases. It is to notice how one altered fragment changes the interpretation of the others.

## Why this shape?

The first version is deliberately toy-sized, immediate and contained. It is intended for conversation rather than assessment. In a teaching or workshop setting, people with different levels of clinical experience can compare what they infer, what they privilege, what they notice is missing, and which assumptions become visible when the fragments do not quite cohere.

## Edit the content

All prototype text lives in [`data.js`](./data.js). New fragments can be added without changing the interface code.

The current material is fictional placeholder content. It is designed to test the mechanism before introducing material drawn from real notes, interviews or workshop contributions.

## Run it

There is no build step and no dependency installation. Open `index.html` in a browser, or publish the repository as a static site.

## Status

**v0.1 — mechanism prototype**

Next useful experiments may include:

- contrasting pictures assembled by students, junior doctors and senior clinicians;
- a facilitator mode that reveals where each fragment came from;
- curated source sets built from one patient's notes and retrospective account;
- saving two generated pictures side by side for discussion;
- printable cards or a workshop export.
