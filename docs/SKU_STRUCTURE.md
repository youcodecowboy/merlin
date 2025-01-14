# SKU Structure Documentation

## Format Overview

SKUs follow the format: `[Style]-[Waist]-[Shape]-[Length]-[Wash]`

Example: `ST-32-X-32-IND` (Straight fit, 32" waist, X shape, 32" length, Indigo wash)

## Component Details

### 1. Style (ST)
- Base identifier for the product design
- **Values**:
  - `ST`: Straight Jeans

### 2. Waist Size
- Indicates waist measurement in inches
- **Range**: 24" to 52"
- **Format**: Two-digit number
- **Examples**: `24`, `32`, `44`, `52`

### 3. Shape
- Specifies the product's fit profile
- **Values**:
  - `X`: X Shape
  - `H`: H Shape

### 4. Length
- Indicates inseam length in inches
- **Range**: 24" to 36"
- **Format**: Two-digit number
- **Examples**: `24`, `30`, `34`, `36`

### 5. Wash
- Describes the wash treatment or color
- **Values**:
  - `RAW`: Raw Denim
  - `BRW`: Black Raw
  - `IND`: Indigo
  - `STA`: Stardust
  - `JAG`: Jagger
  - `ONX`: Onyx

## Validation Rules

1. **Waist Size**:
   - Must be even numbers
   - Minimum: 24"
   - Maximum: 52"

2. **Length**:
   - Must be even numbers
   - Minimum: 24"
   - Maximum: 36"

3. **Format Rules**:
   - All components must be separated by hyphens
   - No spaces allowed
   - All letters must be uppercase
   - Wash codes must be exactly 3 characters

## Examples

Valid SKUs:
```
ST-32-X-32-IND  (Straight, 32" waist, X shape, 32" length, Indigo wash)
ST-28-H-30-RAW  (Straight, 28" waist, H shape, 30" length, Raw denim)
ST-44-X-34-ONX  (Straight, 44" waist, X shape, 34" length, Onyx wash)
ST-24-H-24-BRW  (Straight, 24" waist, H shape, 24" length, Black raw)
ST-52-X-36-JAG  (Straight, 52" waist, X shape, 36" length, Jagger wash)
```

Invalid SKUs:
```
ST-33-X-32-IND  (Invalid: Odd waist number)
ST-32-Y-32-IND  (Invalid: Invalid shape)
ST-32-X-37-IND  (Invalid: Length > 36)
ST-32-X-32-BLK  (Invalid: Invalid wash code)
st-32-x-32-ind  (Invalid: Lowercase letters)
```

## Usage Notes

1. All measurements are in inches
2. Only even numbers are used for measurements
3. All components are required
4. No variations or substitutions allowed
5. Case sensitivity must be maintained (all uppercase) 