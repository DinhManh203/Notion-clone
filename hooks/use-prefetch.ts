'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function usePrefetchDocuments() {
    const documents = useQuery(api.documents.getSearch);

    const pinnedDocs = useQuery(api.documents.getPinned);

    useEffect(() => {
        if (documents || pinnedDocs) {
        }
    }, [documents, pinnedDocs]);

    return { documents, pinnedDocs };
}

export function usePrefetchChat() {
    const sessions = useQuery(api.chat.getSessions);

    useEffect(() => {
        if (sessions) {
        }
    }, [sessions]);

    return { sessions };
}
