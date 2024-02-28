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

function generate_surrogate_key(fields, default_null_value='_qbi_dataform_utils_surrogate_key_null') {
    var sql = ``;
    for (let i = 0; i < fields.length; i++) {
        sql = sql + `coalesce(cast(${fields[i]} as string), '${default_null_value}')`;
        if (i < fields.length - 1) {
            sql = sql + ` || '-' || `;
        }
    }
    return `to_hex(md5(${sql}))`;
}

module.exports = { deduplicate, generate_surrogate_key };

// see https://cloud.google.com/dataform/docs/create-package