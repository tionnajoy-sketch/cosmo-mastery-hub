

## Plan: Update Skin Block 1 Terms & Questions

### What's changing

Two data updates to the existing Skin Block 1 records:

**1. Terms — Metaphors & Affirmations rewrite**

All 5 terms get new `metaphor` and `affirmation` text written in a warm, intimate, "big sister" voice. Examples:

| Term | New Metaphor (direction) | New Affirmation (direction) |
|---|---|---|
| Epidermis | "the layer that meets the world first — like how you choose to show up every day" | "I'm allowed to protect my glow and still be soft." |
| Dermis | "everything running underneath — the strength no one sees, like your support system" | "I trust the layers of support working beneath what people see." |
| Subcutaneous Tissue | "the softness that cushions you — like giving yourself permission to rest" | "I honor the parts of me that absorb pressure so I can keep going." |
| Sebaceous Gland | "your skin's own self-care routine — it already knows how to nourish itself" | "I don't have to do the most to glow — my body already knows how." |
| Sudoriferous Gland | "your body's way of releasing what it doesn't need — like letting go of stress" | "I release what doesn't serve me and I stay cool under pressure." |

**2. Questions — Rewrite to board-exam style**

All 5 questions get updated `question_text`, `option_a`–`option_d`, `correct_option`, and `explanation` fields following the user's provided exam-style examples almost verbatim. The `explanation` field will keep the warm teaching tone while the `question_text` stays neutral/professional.

### Implementation steps

1. **UPDATE `terms`** — 5 UPDATE statements setting new `metaphor` and `affirmation` for each term ID.
2. **UPDATE `questions`** — 5 UPDATE statements rewriting each question using the user's provided examples, matched by `related_term_id`.

Both operations use the data insert/update tool (not migrations, since this is data, not schema).

### No code changes needed

The frontend already renders these fields dynamically — updating the database rows is sufficient.

