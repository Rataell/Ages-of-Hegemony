Buttons for every action; `is-primary` (gold) marks the one dominant action of the current state.

Use `aoh-btn` for every button. Add `is-primary` to exactly one enabled button per state (the tray's confirmation while planning, "Jogar carta" while a card is in focus, "Continuar" while the round resolves). `is-sm` inside cards and lists, `is-ghost` for quiet secondary actions, `is-danger` for leaving or declaring war, `is-round` in the tray. The consumer provides the label (a verb phrase in PT-BR) and the handler.
