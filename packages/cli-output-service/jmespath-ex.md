# JMESPath Extensions in Azure CLI (`az.exe`)

Azure CLI (`az.exe`) extends standard JMESPath functionality by adding several functions for sorting, filtering, and transforming JSON output. Below is a comprehensive list of these **Azure CLI-specific** JMESPath extensions.

## **1. Sorting and Reversing**

### `sort_by`
- **Description:** Sorts an array of objects by a specified property in ascending order.
- **Usage Example:**
  ```bash
  az vm list --query "sort_by([].{Name:name, Location:location}, &Location)" -o table
  ```
  - This sorts the list of virtual machines by `Location`.
- **Notes:**
  - Use `reverse(sort_by(...))` for descending order.

### `reverse`
- **Description:** Reverses the order of an array.
- **Usage Example:**
  ```bash
  az vm list --query "reverse(sort_by([].{Name:name, Location:location}, &Location))" -o table
  ```
  - This sorts by `Location` in **descending order**.

---

## **2. String Operations**

### `contains`
- **Description:** Checks if a string contains a substring or if an array contains an element.
- **Usage Example:**
  ```bash
  az resource list --query "[?contains(type, 'network')].{Name:name, Type:type}"
  ```
  - Filters resources where `type` includes "network".

### `starts_with`
- **Description:** Returns `true` if a string starts with a given prefix.
- **Usage Example:**
  ```bash
  az resource list --query "[?starts_with(name, 'test')].{ResourceName:name}"
  ```

### `ends_with`
- **Description:** Returns `true` if a string ends with a given suffix.
- **Usage Example:**
  ```bash
  az resource list --query "[?ends_with(name, 'Prod')].{ResourceName:name}"
  ```

### `join`
- **Description:** Joins array elements into a string with a specified separator.
- **Usage Example:**
  ```bash
  az vm list --query "join(', ', [].name)"
  ```

### `split`
- **Description:** Splits a string into an array using a delimiter.
- **Usage Example:**
  ```bash
  az vm list --query "split('/', id)"
  ```
  - Splits VM `id` strings into parts.

---

## **3. Aggregation Functions**

### `min_by` / `max_by`
- **Description:** Returns the object with the minimum/maximum value for a specified property.
- **Usage Example:**
  ```bash
  az vm list --query "max_by([].{Name:name, Size:hardwareProfile.vmSize}, &Size)"
  ```
  - Finds the VM with the largest `vmSize`.

### `min` / `max`
- **Description:** Returns the smallest/largest number or string from an array.
- **Usage Example:**
  ```bash
  az monitor metrics list --query "max([].timeseries[0].data[].total)"
  ```

### `length`
- **Description:** Returns the length of a string, array, or object.
- **Usage Example:**
  ```bash
  az vm list --query "length(@)"
  ```
  - Counts the number of VMs.

---

## **4. Object Operations**

### `keys`
- **Description:** Returns the keys of an object as an array.
- **Usage Example:**
  ```bash
  az resource list --query "[].{Resource:name, PropertyKeys: keys(properties)}"
  ```

### `values`
- **Description:** Returns the values of an object as an array.
- **Usage Example:**
  ```bash
  az resource list --query "[].{Resource:name, PropertyValues: values(properties)}"
  ```

### `group_by`
- **Description:** Groups an array of objects by a specified property.
- **Usage Example:**
  ```bash
  az resource list --query "group_by([].{Name:name, Type:type, Location:location}, &Location)"
  ```

---

## **5. Type Conversion and Handling Nulls**

### `to_string`
- **Description:** Converts a value to a string.
- **Usage Example:**
  ```bash
  az keyvault list --query "[].{Name:name, Enabled:to_string(properties.enablePurgeProtection)}"
  ```

### `to_number`
- **Description:** Converts a string to a number.
- **Usage Example:**
  ```bash
  az resource show --query "to_number(tags.CostCenter)"
  ```

### `not_null`
- **Description:** Returns the first non-null value from a list of arguments.
- **Usage Example:**
  ```bash
  az resource list --query "[?not_null(tags.Environment)]"
  ```

---

## **Summary**
These Azure CLI query extensions enhance JMESPath filtering and data transformation. The most commonly used functions include:

✅ `sort_by()` and `reverse()` for sorting
✅ `contains()`, `starts_with()`, and `ends_with()` for string filtering
✅ `min_by()` and `max_by()` for selecting objects based on properties
✅ `to_string()` and `to_number()` for type conversions
✅ `group_by()` for organizing results

These functions enable more powerful and flexible queries when working with Azure CLI data.

For more details, refer to [Microsoft's documentation](https://learn.microsoft.com/en-us/cli/azure/query-azure-cli?tabs=cli).

