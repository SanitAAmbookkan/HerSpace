export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const fetcher = async (url: string, options: RequestInit = {}) => {
    try {
        const res = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
        } else {
            const text = await res.text();
            console.error("API Error (Non-JSON response):", text);
            throw new Error(`Server Error: ${text.substring(0, 50)}...`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};
