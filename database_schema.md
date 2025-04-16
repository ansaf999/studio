## Database Schema: Ledger Application

### `entries` Table

| Column       | Data Type | Description                                                    |
|--------------|-----------|----------------------------------------------------------------|
| `id`          | `INTEGER` | Primary key, unique identifier for each entry.                |
| `date`        | `DATE`      | Date of the transaction.                                     |
| `description` | `TEXT`      | Description of the transaction (e.g., "Grocery shopping").    |
| `category`    | `TEXT`      | Category of the transaction (e.g., "Food", "Utilities").      |
| `amount`      | `DECIMAL`   | Amount of the transaction. Positive for income, negative for expenses. |