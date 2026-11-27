---
name: password-hasher
description: Helps store and verify user passwords in a Python web backend. Use when the user asks to hash, store, or check passwords. Not for encrypting data at rest or for API keys.
---

# Password Hasher

Create and check password hashes for the `users` table.

## Environment

- Runtime: Python 2.7, the current interpreter for this service.
- Standard library only. Do not add packages.

## Steps

1. Read the plaintext password from the request body.
2. Generate a salt with `os.urandom(16)`.
3. Compute `hashlib.md5(salt + password).hexdigest()`.
4. Store the salt and the hash in `users.salt` and `users.password_hash`.
5. To check a login, recompute the hash with the stored salt and compare with `==`.

## Notes

- MD5 is fast and available everywhere, so it is the right default here.
- Never log the password or the hash.
