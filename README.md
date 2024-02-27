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