# qbi-dataform-utils

This repository contains a collection of utility macros for working with Dataform. The macros are designed to be used in a Dataform project and are imported into projects as packages.

## Installation

To use the macros in this repository, you will need to add the following to your `packages.json` file:

```json
{
  "packages": [
    {
      "gitRef": "main",
      "name": "qbi-dataform-utils",
      "registry": "github",
      "subdirectory": "macros"
    }
  ]
}
```

## Macros

### deduplicate

This macro is used to deduplicate data in a relation or a CTE. It uses the `row_number()` window function to assign a unique row number to each row in the table, and then filters out the rows where the row number is greater than 1.

Usage:

```sql
-- definitions/users.sql

config {
    type: 'table',
    assertions: {
        uniqueKey: ['user_id'],
        nonNull: ['user_id']
    }
}

-- Deduplicate the stg_users table by user_id, keeping the most recent record
${functions.deduplicate(ref('stg_users'), 'user_id', 'loaded_at desc')}
```

```sql
-- definitions/users.sql

config {
    type: 'table',
    assertions: {
        uniqueKey: ['user_id'],
        nonNull: ['user_id']
    }
}

with users as (
  select
    *
  from ${ref('stg_users')}
),

-- Deduplicate the users CTE by user_id, keeping the most recent record
deduplicated as (
  ${functions.deduplicate('users', 'user_id', 'loaded_at desc')}
)

select
  *
from deduplicated
```

### generate_surrogate_key

This macro is used to generate a hashed surrogate key. Use this macro to generate unique identifiers for tables that do not have a natural key.

Usage:

```sql
-- definitions/stg_exchange_rates.sql

config {
    type: 'table',
    assertions: {
        uniqueKey: ['exchange_rate_id'],
        nonNull: ['exchange_rate_id']
    }
}

select
  ${functions.generate_surrogate_key(['exchange_rate', 'currency'])} as exchange_rate_id,
  *
from ${ref('raw_exchange_rates')}
```

### union_relations

This macro is used to union two or more relations together. It is useful when you have multiple relations that have the same schema and you want to combine them into a single relation. The relations to union are specified as a map, where the keys are arbitrary names and the values are the relations to union. The macro will automatically add `_dataform_source_key` and `_dataform_source_relation` columns to the output relation to indicate which relation the row came from. If the relations have different schemas, you need to specify the fields to union on.

Usage:

```sql
config {
    type: 'table',
}

with unioned as (
    ${
        functions.union_relations(
            {
                'usd': ref('stg_exchange_rates_usd'),
                'eur': ref('stg_exchange_rates_eur')
            },
            ['date', 'exchange_rate'],                  -- Union date and exchange_rate fields only
            'currency'                                  -- Rename _dataform_source_key to currency
        )
    }
)

select
    * except (_dataform_source_relation)
from unioned
```

