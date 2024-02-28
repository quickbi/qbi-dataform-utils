# qbi-dataform-utils

This repository contains a collection of utility macros for working with Dataform. The macros are designed to be used in a Dataform project and are imported into projects as packages.

## Installation

To use the macros in this repository, you will need to add this repository to the [dependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#dependencies) in your `packages.json` file:

```json
{
    "name": "jaffle_shop",
    "dependencies": {
        "@dataform/core": "2.4.2",
        "qbi-dataform-utils": "<package_url_or_local_path>"
    }
}
```

Because this repository is not published to the npm registry, you will need to specify the URL of the Github repository. And also, because the Github repository is private and requires authentication, you will need to specify the authentication method to use. Basically, there are three ways to authenticate with Github:

1. using a personal access token (`https://<token>@github.com/github.com/quickbi/qbi-dataform-utils.git`)
2. using SSH (`git+ssh://git@github.com:quickbi/qbi-dataform-utils.git`), or
3. username+password (`git://github.com/quickbi/qbi-dataform-utils.git`).

Additionally, you can install the package from a local directory (`file:../qbi-dataform-utils`).

❗❗ **WARNING: These methods only work locally and not on Google Cloud Platform (GCP). For GCP, you will need a private NPM package. For more information, see https://cloud.google.com/dataform/docs/private-packages.**

Once you have added the package to your `packages.json` file, you can install the package by running the following command:

```bash
dataform install
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

js {
  const { deduplicate } = require("qbi-dataform-utils");
}

-- Deduplicate the stg_users table by user_id, keeping the most recent record
${deduplicate(ref('stg_users'), 'user_id', 'loaded_at desc')}
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

js {
  const { deduplicate } = require("qbi-dataform-utils");
}

with users as (
  select
    *
  from ${ref('stg_users')}
),

-- Deduplicate the users CTE by user_id, keeping the most recent record
deduplicated as (
  ${deduplicate('users', 'user_id', 'loaded_at desc')}
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

js {
  const { generate_surrogate_key } = require("qbi-dataform-utils");
}

select
  ${generate_surrogate_key(['exchange_rate', 'currency'])} as exchange_rate_id,
  *
from ${ref('raw_exchange_rates')}
```

### union_relations

This macro is used to union two or more relations (or CTEs) together. It is useful when you have multiple relations that have the same schema and you want to combine them into a single relation. The relations to union are specified as a map, where the keys are arbitrary names and the values are the relations to union. The macro will automatically add `_dataform_source_key` and `_dataform_source_relation` columns to the output relation to indicate which relation the row came from. If the relations have different schemas, you need to specify the fields to union on.

Usage:

```sql
config {
    type: 'table',
}

js {
  const { union_relations } = require("qbi-dataform-utils");
}

with unioned as (
    ${
        union_relations(
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

js {
  const { union_relations } = require("qbi-dataform-utils");
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
        union_relations(
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
