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

### Accounts

Overview of an account's positions where `id` is the address.

```graphql
query {
  accounts {
    id
    totalOptions
    totalObligations
    totalSatoshis
  }
}
```

### Active Options

Return non-expired option pairs which are eligible to be written to or bought from.

```graphql
query ActiveOptions($expiry: BigInt!) {
  optionPairs(where: {expiryTime_gte: $expiry}) {
    option
    obligation
  }
}
```

> It is the consumer's responsibility to aggregate the total market count.

### Satoshis Transferred

Compute the total number of satoshis transacted through the platform.

```graphql
query {
  optionPairFactories {
    id
    totalSatoshis
  }
}
```

### User Exercise Requests

Return all active requests for an account (i.e. those pending BTC proofs).

```graphql
query Requests($addr: Bytes!) {
  requests(where: {buyer: $addr}) {
    id
    seller
    amount
  }
}
```

### Obligation Writers

Return all writers for a particular obligation contract, useful for determining who to exercise against.

```graphql
query ObligationWriters($addr: Bytes!)  {
  positions(where: {obligation: $addr}) {
    writer{
      id
    }
    balance
  }
}
```