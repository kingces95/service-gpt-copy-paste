The `CliFdReadable` class bridges the gap between Unix shell-style I/O and JavaScript streams by resolving two key mismatches: **byte vs. character representation** and **single-character vs. multi-character reading**. Unix file descriptors operate on raw bytes, often read one character at a time with precise positioning, while JavaScript streams optimize for buffered, asynchronous reads to improve performance. This class reconciles these paradigms by starting in a single-byte mode for Unix-style precision and transitioning to buffered reads when higher-level operations are requested.

### Single-Byte Mode
At initialization, `CliFdReadable` operates in single-byte mode to support Unix-style precise consumption. This allows it to accurately implement the following core methods, each analogous to Unix shell commands using the `read` or `readline` utilities:

1. **`readString`**  
   Reads a specified number of characters, handling multi-byte UTF-8 sequences.  
   **Unix Equivalent:** The `read` command with a `-N` option reads exactly `n` characters.  
   ```bash
   read -N 10 var < file.txt
   echo "$var"
   ```

2. **`readLine`**  
   Reads until a newline character (`0x0A`) or EOF, decoding bytes into characters.  
   **Unix Equivalent:** The `readline` utility reads a single line from the input.  
   ```bash
   IFS= read -r line < file.txt
   echo "$line"
   ```

3. **`readArray`**  
   Reads a line and splits it into an array of fields, based on a specified delimiter.  
   **Unix Equivalent:** The `read` command with the `-a` option splits a line into an array.  
   ```bash
   read -a array < file.txt
   echo "${array[@]}"
   ```

4. **`readRecord`**  
   Reads a line, splits it into fields, and maps them to a structured record using a provided set of keys.  
   **Unix Equivalent:** The `read` command assigns fields to named variables.  
   ```bash
   read key1 key2 key3 < file.txt
   echo "$key1, $key2, $key3"
   ```

By exclusively using these methods, the file descriptor can be consumed precisely, byte by byte, maintaining its position. This precision ensures compatibility with other Unix tools or utilities that might subsequently use the same file descriptor.

### Transition to Buffered Mode
When higher-level operations require larger reads, such as multi-character processing, `CliFdReadable` transitions to a buffered mode, expanding its buffer size (defaulting to 1024 bytes). This change significantly improves performance for bulk reads but sacrifices precise tracking of the file descriptor’s position. Once buffered reading begins, the exact position of the file descriptor can no longer be determined reliably, and it is typical for the consumer to exhaust the stream entirely.

### Internal Functionality
To handle the **byte vs. character impedance**, the class employs `readByte`, an internal utility that reads a single byte from the stream and feeds it to higher-level methods like `readString` and `readLine`. This abstraction ensures proper handling of multi-byte UTF-8 characters while maintaining the simplicity of Unix-style I/O.

### Key Features and Considerations
- **Unix Precision**: When in single-byte mode, the file descriptor is consumed in a controlled manner, allowing seamless handoff to other tools.
- **Buffered Performance**: For efficiency, the class dynamically expands its buffer size when operations demand higher throughput.
- **UTF-8 Awareness**: Character-level operations like `readString` and `readLine` correctly handle multi-byte characters, ensuring robust text processing.
- **Stream Exhaustion**: After transitioning to buffered mode, consumers typically process the entire stream, as the exact file descriptor position becomes indeterminate.

The `CliFdReadable` class harmonizes Unix's precision and JavaScript's performance, offering a versatile, UTF-8-aware interface for file descriptor processing while accommodating the unique constraints and expectations of each paradigm.