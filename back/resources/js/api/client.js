function readCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
    constructor(message, { status, errors = {}, data = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
        this.data = data;
    }
}

export async function api(path, { method = 'GET', body, params, headers = {} } = {}) {
    const url = new URL(`/api${path}`, window.location.origin);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        });
    }

    const requestHeaders = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
    };

    const xsrfToken = readCookie('XSRF-TOKEN');

    if (xsrfToken) {
        requestHeaders['X-XSRF-TOKEN'] = xsrfToken;
    }

    if (body !== undefined) {
        requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        credentials: 'same-origin',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        window.location.assign('/login');

        throw new ApiError('Unauthenticated.', { status: 401 });
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(data?.message || 'Request failed.', {
            status: response.status,
            errors: data?.errors || {},
            data,
        });
    }

    return data;
}

export function get(path, params) {
    return api(path, { params });
}

export function post(path, body) {
    return api(path, { method: 'POST', body });
}

export function patch(path, body) {
    return api(path, { method: 'PATCH', body });
}

export function del(path) {
    return api(path, { method: 'DELETE' });
}
