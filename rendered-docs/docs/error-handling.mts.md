
# Error handling in Pendle SDK

---

Pendle SDK is based on Ethersjs, which is a very versatile library. But while handling all the interactions with the contract, Ethersjs’ error handling process is very cryptic. Ethersjs Error does not support typing, as well as the actual error is often nested very deeply. Pendle SDK includes some utilities that helps aid the error handling process while interacting with the contracts.

## PendleSdkError

```ts
import { PendleSdkError } from '@pendle/sdk-v2';
```

This is the super class for all Error classes in Pendle SDK. It is a very simple class, its only has a constructor that accepts the error message.

```ts
try {
  throw new PendleSdkError('Hello there');
} catch (e) {
  if (e instanceof PendleSdkError) {
      console.log(e.message);
  }
}
```

Output:

```
Hello there
```

## The builtin contract errors - `Error(message)` and `Panic(code)`

```ts
import { BuiltinContractError, PanicBuiltinContractError, ErrorBuiltinContractError } from '@pendle/sdk-v2';
```

```ts
class BuiltinContractError extends PendleSdkError;
class ErrorBuiltinContractError extends BuiltinContractError;
class PanicBuiltinContractError extends BuiltinContractError;
```
On the contract, there are two builtin error: `Error(string message)` and `Panic(uint256 code)`. This `BuiltinContractError` is the super class for `ErrorBuiltinContractError` and `PanicBuiltinContractError` respectively.

```ts
try {
  // some contract operation.
} catch (e) {
  if (e instanceof PanicBuiltinContractError) {
      console.log('Panic with code', e.code);
  }
  if (e instanceof ErrorBuiltinContractError) {
      console.log('Error with message', e.message);
  }
}
```

## `PendleContractError` - the error from Pendle Contracts

```ts
import { PendleContractError } from '@pendle/sdk-v2';
```

When error, Pendle contracts will thrown an Error message defined in [this contract](https://github.com/pendle-finance/pendle-core-internal-v2/blob/main/contracts/core/libraries/Errors.sol). Those error will be wrapped into the `PendleContractError`. The instance of this class has two main properties:
- `errorName` - the name of the error. The type of this property is not `string`, but an union of all Pendle contracts error's name for type safety. For example:
  - `'marketExpired'`, `'RouterInsufficientLpOut'`, `'RouterExceededLimitYtIn'`, ... are valid values for `errorName`
  - `'RandomError'` - is not a valid value, as it is not defined in the contracts. 
- `args` - the arguments that passed to the error on the contract side. You can think it is like `any[]`, but in reality it is also an union of tuples of the errors' parameters. 

### Catching the error
`PendleContractError` has a method called `isType(errorName): this is PendleContractError<errorName>`, which check if the current instance's `errorName` to the passed one. This method is a type predicate to check for both error name **and** the arguments. For example:

```ts
import { BN } from '@pendle/sdk-v2';
try {
    // ...
} catch (e) {
    if (e instanceof PendleContractError) {
        if (e.isType('YieldContractInsufficientSy')) {
            // e.args will now have type [BN, BN] (BN represents uint256 on the contract)
            const actualSy: BN = e.args[0];
            const requiredSy: BN = e.args[1];
            console.log(actualSy.toString(), requiredSy.toString());
        } else if (e.isType('MarketExpired')) {
            // e.args will now have type [] (an empty tuple)
        }
        // ...
    }
}
```
