import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(fn, deps = []) {
    const [state, setState] = useState({ data: null, loading: true, error: null });
    const fnRef = useRef(fn);

    fnRef.current = fn;

    const run = useCallback(async () => {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        try {
            const data = await fnRef.current();

            setState({ data, loading: false, error: null });

            return data;
        } catch (error) {
            setState((previous) => ({ ...previous, loading: false, error }));

            throw error;
        }
    }, []);

    useEffect(() => {
        let active = true;

        const execute = async () => {
            try {
                await run();
            } catch {
                if (!active) {
                    return;
                }
            }
        };

        execute();

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { ...state, refetch: run };
}
