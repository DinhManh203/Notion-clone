export function generateChatTitle(firstMessage: string): string {
    const truncated = firstMessage.slice(0, 50);
    return truncated.length < firstMessage.length ? truncated + "..." : truncated;
}
