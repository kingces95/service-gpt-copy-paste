# 💾 ULF: Unix Line Format

**ULF (Unix Line Format)** is a human-readable, delimiter-separated serialization format native to the Unix philosophy:

> 🤩 *Simple enough to write by hand, structured enough to parse with a shell.*

---

## 🧠 Overview

ULF is the de facto text-based data interchange format used by many Unix command-line tools. Though never formally standardized or named, ULF is the backbone of countless shell pipelines, log files, and configuration systems.

ULF differs from formats like JSON or XML in that it is flat, line-oriented, and typically does not include type annotations or structural nesting.

---

## 🛡️ Characteristics

| Feature              | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| **Line-oriented**    | One logical record per line                                                  |
| **Delimited**        | Fields separated by a consistent delimiter (`IFS` — usually tab, space, colon) |
| **Greedy field**     | Final field may absorb remaining content (common in logs and process output) |
| **Null-safe**        | Empty fields preserved with delimiter (e.g., `a::c`)                         |
| **Textual**          | All data is plain text                                                       |
| **Shell-native**     | Easily parsed using `read`, `cut`, `awk`, `IFS`, etc.                        |
| **No type system**   | Strings only; no built-in numbers, objects, or booleans                      |

---

## 📝 Example (colon-delimited ULF)

```
nginx:x:101:102:Web Server:/var/www:/usr/sbin/nologin
```

```bash
# Reading with shell built-ins
IFS=":" read -r user pass uid gid desc home shell <<< "$line"
```

---

## 🥉 Why ULF Matters

ULF is the native serialization format of Unix tooling. It embodies the Unix principles of simplicity, composability, and human-accessibility.

It's how data flows between programs in pipelines, in `/etc/*` files, and in one-liner shell scripts.

> JSON is to JavaScript what **ULF** is to **Unix**.

---

## 💡 Why ULF Deserves Recognition

Despite being foundational to Unix workflows, ULF has remained unnamed and unsung:

- It's older than JSON, simpler than XML, and more flexible than CSV
- It's generated and parsed effortlessly by standard tools like `awk`, `cut`, `read`, `grep`, and `printf`
- It's used daily by system admins, shell scripts, log parsers, and package managers
- It enables human-readable and machine-parseable structures without extra tooling
- It thrives in environments where simplicity and composability matter most

> ULF may be the most widely used serialization format in Unix — and the only one that never had a name. Until now.

---

## 💡 Use Cases
- CLI tool output (e.g. `ps`, `ls`, `getent`)
- System files (`/etc/passwd`, `/etc/group`)
- Shell scripting I/O
- Grep-friendly logs
- Human-writable tables

---

## 🔧 Possible File PartialObject

```plaintext
*.ulf
```

---

## 🚀 Future Ideas
- `ulfify`: Convert structured data to ULF
- `.ulf` parsers and validators
- Syntax-aware editors for ULF
- MIME type: `text/ulf`

---

## 🏁 Summary
ULF is Unix's quiet serialization hero — ubiquitous, unsung, and perfectly suited for its domain.

Give your shell data a name: **ULF**.

