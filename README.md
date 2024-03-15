# qbi-dataform-utils

This repository contains a collection of utility macros for working with Dataform. The macros are designed to be used in a Dataform project and are imported into projects as packages.

## Installation

To use the macros in this repository, you will need to add this repository to the [dependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#dependencies) in your `packages.json` file:

```json
{
    "name": "jaffle_shop",
    "dependencies": {
        "@dataform/core": "2.9",
        "qbi-dataform-utils": "https://github.com/quickbi/qbi-dataform-utils/archive/main.tar.gz"
    }
}
```

To use a specific version of the package, you can specify the version tag or commit hash in the URL:

```json
{
    "name": "jaffle_shop",
    "dependencies": {
        "@dataform/core": "2.9",
        "qbi-dataform-utils": "https://github.com/quickbi/qbi-dataform-utils/archive/v0.1.0.tar.gz"
    }
}
```

Once you have added the package to your `packages.json` file, you can install the package by running the following command:

```bash
dataform install
```

## Macros

To use the macros in this repository, you will need to import them into your Dataform project. To import, add a `includes/qbi_dataform_utils.js` file to your Dataform project and import the macros into the file. For example:

```javascript
// includes/qbi_dataform_utils.js
const { deduplicate, generate_surrogate_key, union_relations } = require("qbi-dataform-utils");
module.exports = { deduplicate, generate_surrogate_key, union_relations };
```

The name of the includes file acts as a namespace for the imported macros. In other words, if the includes file is named `qbi_dataform_utils.js`, you can refer to the imported macros using the `${qbi_dataform_utils.<macro_name>}` syntax. For example, to refer to the `deduplicate` macro, use the `${qbi_dataform_utils.deduplicate(<relation>, <partition_by>, <order_by>)}` syntax.

### deduplicate

This macro is used to deduplicate data in a relation or a CTE. It uses the `row_number()` window function to assign a unique row number to each row in the table, and then filters out the rows where the row number is greater than 1.

Arguments:

- `relation` (string): The relations or CTEs to deduplicate.
- `partition_by` (string): The field or fields to partition by. Multiple fields must be separated by commas.
- `order_by` (string): The field or fields to order by. Multiple fields must be separated by commas.

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
${qbi_dataform_utils.deduplicate(ref('stg_users'), 'user_id', 'loaded_at desc')}
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
  ${qbi_dataform_utils.deduplicate('users', 'user_id', 'loaded_at desc')}
)

select
  *
from deduplicated
```

### generate_surrogate_key

This macro is used to generate a hashed surrogate key. Use this macro to generate unique identifiers for tables that do not have a natural key.

Arguments:

- `fields` (array): An array of fields to hash.
- `default_null_value` (string): The value to use when the fields to hash are null. Default is `_qbi_dataform_utils_surrogate_key_null`.

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
  ${qbi_dataform_utils.generate_surrogate_key(['exchange_rate', 'currency'])} as exchange_rate_id,
  *
from ${ref('raw_exchange_rates')}
```

### union_relations

This macro is used to union two or more relations (or CTEs) together. It is useful when you have multiple relations that have the same schema and you want to combine them into a single relation. The relations to union are specified as a map, where the keys are arbitrary names and the values are the relations to union. The macro will automatically add `_dataform_source_key` and `_dataform_source_relation` columns to the output relation to indicate which relation the row came from. If the relations have different schemas, you need to specify the fields to union on.

Arguments:

- `relations` (object): A map of relation keys and their corresponding relations or CTEs.
- `fields` (array): An array of fields to union on. If not specified, the macro will union all fields (i.e., `[*]`).
- `key_column_name` (string): The name of the column to use for the relation key column. Default is `_dataform_source_key`.
- `value_column_name` (string): The name of the column to use for the relation value column. Default is `_dataform_source_value`.

Usage:

```sql
config {
    type: 'table',
}

with unioned as (
    ${
        qbi_dataform_utils.union_relations(
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

```sql
config {
    type: 'table',
}

with usd as (
    select
        *,
        'usd' as target_currency
    from ${ref('stg_exchange_rates_usd')}
),

eur as (
    select
        *,
        'usd' as target_currency
    from ${ref('stg_exchange_rates_eur')}
),

unioned as (
    ${
        qbi_dataform_utils.union_relations(
            {
                'usd': 'usd',
                'eur': 'eur'
            },
            ['date', 'exchange_rate', 'target_currency'],
            'currency'
        )
    }
)

select
    * except (_dataform_source_relation)
from unioned
```
