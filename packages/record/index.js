class Record {
  /**
   * Constructs a Record with the specified fields, delimiter, and escape character.
   * @param {string[]} fields - The field names for the record.
   * @param {string} delimiter - The delimiter used to split the input line (default is whitespace).
   * @param {string} escapeChar - The escape character used to preserve delimiters (default is '\\').
   */
  constructor(fields, delimiter = '\s+', escapeChar = '\\') {
    this.fields = fields;
    this.delimiter = delimiter;
    this.escapeChar = escapeChar;

    // Construct a regex pattern for matching tokens and escape sequences
    this.tokenRegex = new RegExp(
      `\\${escapeChar}(.)|([^${delimiter}]+)|(${delimiter})`,
      'g'
    );
  }

  /**
   * Splits a line into a record (POJO) using the configured fields, delimiter, and escape character.
   * @param {string} line - The input line to split.
   * @returns {object} - A POJO where keys are field names and values are parsed from the line.
   */
  split(line) {
    const record = {};
    let index = 0;
    let currentField = '';
    let match;

    // Use regex to parse tokens iteratively
    while ((match = this.tokenRegex.exec(line)) !== null) {
      const [_, escaped, token, delimiter] = match;

      if (escaped) {
        // Escaped character, append it to the current field
        currentField += escaped;
      } else if (token) {
        // Regular token, append it to the current field
        currentField += token;
      } else if (delimiter) {
        if (index < this.fields.length - 1) {
          // Finalize the current field
          record[this.fields[index]] = currentField;
          currentField = '';
          index++;
        } else {
          // Append delimiter to the last field
          currentField += delimiter;
        }
      }
    }

    // Handle the last field: include remaining content
    if (index < this.fields.length) {
      record[this.fields[index]] = currentField;
      index++;
    }

    // Set remaining fields to null if line doesn't cover all fields
    for (; index < this.fields.length; index++) {
      record[this.fields[index]] = null;
    }

    return record;
  }
}

export default Record;
