# odatafy MongoDB documentation



## Feature Support

:white_check_mark: Supported

:large_orange_diamond: Partially Supported

:red_circle: (Currently) Not Supported

### Types

### Logical Operators

#### :white_check_mark: Comparison
- :white_check_mark: eq (Equals)
- :white_check_mark: ne (Not Equals)
- :white_check_mark: gt (Greater Than)
- :white_check_mark: lt (Less Than)

#### :white_check_mark: Logical Experssions
- :white_check_mark: and (Logical and)
- :white_check_mark: or (Logical or)
- :white_check_mark: not (Logical not)

#### :red_circle: Other
- :red_circle: has (Has operator)
- :red_circle: in (In operator)

### Arithmetic Operators

#### :large_orange_diamond: Addition
- :white_check_mark: add (Numeric Types)
- :large_orange_diamond: add (Date Types)

#### :large_orange_diamond: Subtraction
- :white_check_mark: sub (Numeric Types)
- :large_orange_diamond: sub (Date Types)

#### :large_orange_diamond: Multiplication
- :white_check_mark: mul (Numeric Types)
- :red_circle: mul (Date Types)

#### :large_orange_diamond: Division
- :white_check_mark: div (Numeric Types)
- :red_circle: div (Date Types)
- :white_check_mark: divby (Numeric Types)
- :white_check_mark: mod (Numeric Types)

#### :white_check_mark: Negation
- :white_check_mark: - (Numeric Types)

### :white_check_mark: Grouping with parenthesis

### String and Collection Functions

#### :red_circle: concat
- :red_circle: concat(String, String)
- :red_circle: concat(Collection, Collection)

#### :white_check_mark: contains
- :white_check_mark: contains(String, String)
- :white_check_mark: contains(Collection, Collection)

#### :large_orange_diamond: endswith
- :white_check_mark: endswith(String, String)
- :red_circle: endswith(Collection, Collection)

#### :red_circle: indexof
- :red_circle: concat(String, String)
- :red_circle: concat(Collection, Collection)

#### :white_check_mark: length
- :white_check_mark: length(Edm.String)
- :white_check_mark: length(Collection)

#### :large_orange_diamond: startswith
- :white_check_mark: endswith(String, String)
- :red_circle: endswith(Collection, Collection)

#### :red_circle: substring
- :red_circle: substring(String, Number)
- :red_circle: substring(String, Number, Number)
- :red_circle: substring(Collection, Number)
- :red_circle: substring(Collection, Number, Number)

### String and Collection Functions