# REACT FAST CONTEXT

Inspired of Jack Herrington Fast Context: https://github.com/jherr/fast-react-context

This small package will help projects run with Context without worring about performance and controlling big State Management like Redux.

And fully **typescript** support!


## Installation:
Using npm:

```bash
$ npm i --save @keinguyen/react-fast-context
```

## Why use this package?
1. It's applying the subcribing method which will only trigger change on the component which is listening the changed value.
2. Typescript support 100%.
3. As a Context, this help splitting big components to smaller ones but can control the state value without considering about performance.

## Requirement:
- Node.js 16+
- React.js 17.0.2+
- Typescript 4.4.4+

## Usage:
### 1. Create context
```ts
// context.ts
import { createFastContext } from "@keinguyen/react-fast-context";

interface State {
	keyA: number;
	keyB: string;
	keyC?: boolean;
}

const initialState: State = {
	keyA: 0,
	keyB: "something",
};

export const {
	Provider, // Context Provider
	useCommit, // Commit changes to the context
	useSelector, // Subcribe the value from the context
	useLazySelector, // Get the function that could get the value from the context by the time is executed
	createSelector, // Create a caching selector which help reducing complex computing during query
} = createFastContext(initialState);
```

### 2. Get and update values from Context
```tsx
// index.tsx
import { Provider, useSelector, useCommit } from "./context";

function Component() {
	const commit = useCommit();
	const keyA = useSelector((store) => store.keyA); // fully typescript support

	const handleClick = () => {
		commit({ keyA: keyA + 1 });
		/*
		Or you can pass function into commit function to get the current store state
		You don't need to return all values in the context, just a part of them, it is smart enough to understand about overriding, not replace whole new store value.

		commit((store) => ({ keyA: store.keyA + 1 }))
		*/
	};

	return (
		<>
			Current value {keyA}
			<button onClick={handleClick}>
				Click me to increase value to {keyA + 1}
			</button>
		</>
	);
}

export default function Main() {
	return (
		<Provider>
			<Component />
		</Provider>
	);
}
```

### 3. Create selectors
```ts
// selectors.ts
import { createSelector } from "./context";

export const getComplexCalcKeyA = createSelector(
	[(store) => store.keyA],
	(keyA) => keyA * 15 + 1000 / 30,
);

export const getKeyBAndCalcKeyA = createSelector(
	[
		getComplexCalcKeyA,
		(store) => store.keyB,
	],
	(complexKeyA, keyB) => `${keyB} with calc value ${complexKeyA}`,
)


// index.tsx
import { getKeyBAndCalcKeyA } from "./selectors";

function AnotherComponent() {
	const complexValue = useSelector(getKeyBAndCalcKeyA);

	return (
		<>
			Complex value {complexValue}
		</>
	);
}
```
