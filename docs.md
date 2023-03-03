# odatafy MongoDB documentation



## Feature Support

:white_check_mark: Supported

:large_orange_diamond: Partially Supported

:red_circle: (Currently) Not Supported

### Types

### Logical Operators

#### Comparison
- :white_check_mark: eq (Equals)
- :white_check_mark: ne (Not Equals)
- :white_check_mark: gt (Greater Than)
- :white_check_mark: lt (Less Than)

#### Logical Experssions
- :white_check_mark: and (Logical and)
- :white_check_mark: or (Logical or)
- :white_check_mark: not (Logical not)

#### Other
- :red_circle: has (Has operator)
- :red_circle: in (In operator)

### Arithmetic Operators

#### Addition
- :white_check_mark: add (Numeric Types)
- :large_orange_diamond: add (Date Types)

#### Subtraction
- :white_check_mark: sub (Numeric Types)
- :large_orange_diamond: sub (Date Types)

#### Multiplication
- :white_check_mark: mul (Numeric Types)
- :red_circle: mul (Date Types)

#### Division
- :white_check_mark: div (Numeric Types)
- :red_circle: div (Date Types)
- :white_check_mark: divby (Numeric Types)
- :white_check_mark: mod (Numeric Types)

#### Negation
- :white_check_mark: - (Numeric Types)

### :white_check_mark: Grouping with parenthesis

### String and Collection Functions

#### concat
- :red_circle: concat(String, String)
- :red_circle: concat(Collection, Collection)

#### contains
- :white_check_mark: contains(String, String)
- :white_check_mark: contains(Collection, Collection)

#### endswith
- :white_check_mark: endswith(String, String)
- :red_circle: endswith(Collection, Collection)

#### indexof
- :red_circle: concat(String, String)
- :red_circle: concat(Collection, Collection)

#### length
- :white_check_mark: length(Edm.String)
- :white_check_mark: length(Collection)

#### startswith
- :white_check_mark: endswith(String, String)
- :red_circle: endswith(Collection, Collection)

#### substring
- :red_circle: substring(String, Number)
- :red_circle: substring(String, Number, Number)
- :red_circle: substring(Collection, Number)
- :red_circle: substring(Collection, Number, Number)

### Collection Functions
- :red_circle: hassubset(Collection, Collection)
- :red_circle: hassubsequence(Collection, Collection)

### String Functions
- :white_check_mark: matchesPattern(String, String)
- :white_check_mark: tolower(String)
- :white_check_mark: toupper(String)
- :white_check_mark: trim(String)

### Date and Time Functions
- :red_circle: date(Datetime)
- :white_check_mark: year(Date)
- :white_check_mark: year(Datetime)
- :white_check_mark: month(Date)
- :white_check_mark: month(Datetime)
- :white_check_mark: day(Date)
- :white_check_mark: day(Datetime)
- :red_circle: time(Date)
- :red_circle: time(Datetime)
- :white_check_mark: hour(Date)
- :white_check_mark: hour(Datetime)
- :white_check_mark: minute(Datetime)
- :white_check_mark: second(Datetime)
- :white_check_mark: fractionalseconds(Datetime)
- :red_circle: totaloffsetminutes(Datetime)
- :red_circle: totalseconds(Datetime)
- :white_check_mark: maxdatetime()
- :white_check_mark: now()
- :white_check_mark: mindatetime()

### Arithmetic Functions
- :white_check_mark: ceiling(Number)
- :white_check_mark: floor(Number)
- :white_check_mark: round(Number)

### Type Functions
- :red_circle: cast(Type)
- :red_circle: cast(Expression, Type)
- :red_circle: isof(Type)
- :red_circle: isof(Expression, Type)

### Geo Functions

#### geo.distance
- :red_circle: geo.distance(GeographyPoint, GeographyPoint)
- :red_circle: geo.distance(GeometryPoint, GeometryPoint)

#### geo.intersects
- :red_circle: geo.intersects(GeographyPoint, GeographyPolygon)
- :red_circle: geo.intersects(GeometryPoint, GeometryPolygon)

#### geo.length
- :red_circle: geo.length(GeographyLineString)
- :red_circle: geo.length(GeometryLineString)

### Conditional Functions
- :red_circle: case(Edm.Boolean:expression, ..., Edm.Boolean:expression)

### Lambda Operators
- :red_circle: any(Symbol:Edm.Boolean:expression)
- :red_circle: all(Symbol:Edm.Boolean:expression)