'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LoadingBar() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timeout);
    }, [pathname]);

    if (!loading) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse z-50"
            style={{
                animation: 'loading 0.3s ease-in-out'
            }}
        />
    );
}
