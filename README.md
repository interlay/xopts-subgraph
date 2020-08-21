# XOpts Subgraph

Follow the [tutorial](https://thegraph.com/docs/quick-start#local-development) to start a graph node and deploy the [contracts](https://github.com/interlay/xopts).
Use [GraphiQL](https://github.com/graphql/graphiql) to test the queries below.

Update the `OptionPairFactory` address in `subgraph.yaml` and `src/constants.ts` before running the following commands.

```bash
yarn codegen
yarn create-local
yarn deploy-local
```

## Example Queries

### Options After Expiry

```graphql
query ActiveOptions($expiry: BigInt) {
  optionPairs(where: {expiryTime_gte: $expiry}) {
    option
    obligation
  }
}
```

> For the total count we will need to aggregate on the front-end.

### Total Satoshis Transferred

```graphql
query SatoshisTransferred($id: ID!) {
  optionPairFactory(id: $id) {
    totalSatoshis
  }
}
```

> A similar query can be used for calculating the total number per writer.