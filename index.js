// filename index.js
// package name qbi-dataform-utils

function deduplicate(relation, partition_by, order_by) {
    return `
        select
            *
        from ${relation}
        qualify row_number() over (
            partition by ${partition_by}
            order by ${order_by }
        ) = 1
    `;
}

module.exports = { deduplicate };

// see https://cloud.google.com/dataform/docs/create-package