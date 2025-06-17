import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

function useInstantValue<T>(value: T) {
	const valueRef = useRef(value);

	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	return valueRef;
}

const isFunction = (value: any): value is Function => typeof value === 'function';

export interface FastContextProvider<T> {
	children: ReactNode;
	value?: Partial<T>;
}

export function createFastContext<Store extends Record<string, any>>(
	initialValue: Store,
) {
	type SubscribeFn = () => void;

	function useStore(additionalValue?: Partial<Store>) {
		const storeRef = useRef({
			...initialValue,
			...additionalValue,
		});
		const subscribersRef = useRef(new Set<SubscribeFn>());

		const returnValue = useMemo(
			() => ({
				get: () => storeRef.current,
				set: (value: Partial<Store> | ((store: Store) => Partial<Store>)) => {
					const newValue = isFunction(value) ? value(storeRef.current) : value;

					Object.assign(storeRef.current, newValue);
					subscribersRef.current.forEach((fn) => fn());
				},
				subscribe: (callback: SubscribeFn) => {
					subscribersRef.current.add(callback);

					return () => {
						subscribersRef.current.delete(callback);
					};
				},
			}),
			[],
		);

		useEffect(() => {
			const data = additionalValue || ({} as Partial<Store>);
			Object.keys(data).forEach((key) => {
				if (
					typeof data[key] === "function" &&
					data[key] !== storeRef.current[key]
				) {
					returnValue.set({
						[key]: data[key],
					} as Partial<Store>);
				}
			});
		}, [additionalValue, returnValue]);

		return returnValue;
	}

	type UseStoreReturnType = ReturnType<typeof useStore>;

	const Context = createContext<UseStoreReturnType | null>(null);

	function Provider({ children, value }: FastContextProvider<Store>) {
		const data = useStore(value);

		return <Context.Provider value={data}>{children}</Context.Provider>;
	}

	function useSelector<SelectorOutput>(
		selector: (store: Store) => SelectorOutput,
	) {
		const store = useContext(Context);
		const selectorRef = useInstantValue(selector);

		if (!store) {
			throw new Error("Store not found");
		}

		const [state, setState] = useState(() => selector(store.get()));

		useEffect(
			() =>
				store.subscribe(() =>
					setState(() => selectorRef.current!(store.get())),
				),
			[selectorRef, store],
		);

		return state;
	}

	function useLazySelector<SelectorOutput>(
		selector: (store: Store) => SelectorOutput,
	) {
		const store = useContext(Context);
		const selectorRef = useInstantValue(selector);

		if (!store) {
			throw new Error("Store not found");
		}

		const getter = useCallback(
			() => selectorRef.current?.(store!.get()),
			[store, selectorRef],
		);

		return getter;
	}

	function useCommit() {
		const store = useContext(Context);

		if (!store) {
			throw new Error("Store not found");
		}

		return store.set;
	}

	type StoreSelector = (store: Store) => any;
	type ReturnTypes<T extends StoreSelector[]> = {
		[P in keyof T]: T[P] extends (...a: any[]) => infer R ? R : never;
	};

	const createSelector = <T extends StoreSelector[], O>(
		deps: [...T],
		selector: (...values: ReturnTypes<T>) => O,
	) => {
		let cachedDeps: ReturnTypes<T> | undefined;
		let cachedValue: O;

		return (store: Store) => {
			const mappedDeps = deps.map((dep) => dep(store)) as ReturnTypes<T>;
			const isUpdated = mappedDeps.some(
				(value, i) => !cachedDeps || value !== cachedDeps[i],
			);

			if (isUpdated) {
				cachedDeps = mappedDeps;
				cachedValue = selector(...mappedDeps);
			}

			return cachedValue;
		};
	};

	return {
		Provider,
		useSelector,
		useLazySelector,
		useCommit,
		createSelector,
	};
}
