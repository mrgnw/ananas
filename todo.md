# Functionality
## In progress
  
- [ ] [user_authentication] allow basic user authentication. pick_language_per_session is now linked to the user's language selection

- [ ] [passkey_authentication] [Passlock.dev](Passlock.dev)

- [single_language_view] when only one language is selected, condense the layout. Remove the card wrapper completely in single language mode

## Todo

- [tgt_language_translations] the selected target languages affect the translations that are requested
- [about] 1st load: show & tell how it works
- [drag_user_langs] LanguagePicker - drag to reorder

## idea

- [api_upsert_one_translation_item] add a single language translation to an existing card of translations

- [flip_original] if only one tgt language is selected, and the translation's original request language matches that tgt language, show the translation for the next available language in the tgt_languages list instead of the original.

- study mode

  (single card, hide some translations so you can test your knowledge)


- phrase lists, or group of cards of translations


- table view instead of cards


- when not logged in: which languages to show?


- bulk backfill translations [pro]


- update translation with new languages


- handle typos - discard or suggest alternatives


- card: highlight differences between translations


- card: simplify view, reduce redundancy - colorize languages?
- [original_language_hint] Let the user say what language the original is

## Done

- [pick_language_per_session]() Language picker - select languages per session/user

  select from the large list of possible languages to show which are currently displayed or translated

- persistent results (localStorage)

- Language picker » translation cards

- basic RTL support

- Copy translation

- Delete card
