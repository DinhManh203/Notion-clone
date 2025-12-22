const CHAT_TITLES = [
    "Trò chuyện thông minh",
    "Cuộc hội thoại mới",
    "Ý tưởng sáng tạo",
    "Giải đáp thắc mắc",
    "Khám phá kiến thức",
    "Tư vấn thông minh",
    "Hỏi đáp nhanh",
    "Brainstorming",
    "Học hỏi mới",
    "Giải pháp sáng tạo",
    "Trao đổi ý kiến",
    "Phân tích vấn đề",
    "Nghiên cứu chủ đề",
    "Thảo luận chuyên sâu",
    "Tìm hiểu thêm",
    "Câu hỏi thú vị",
    "Khám phá mới",
    "Suy nghĩ cùng AI",
    "Trợ lý thông minh",
    "Giải mã vấn đề",
    "Ý tưởng đột phá",
    "Học tập hiệu quả",
    "Tư duy sáng tạo",
    "Giải quyết thách thức",
    "Phát triển ý tưởng",
    "Tìm kiếm giải pháp",
    "Hội thoại sáng tạo",
    "Khám phá tri thức",
    "Tư vấn chuyên nghiệp",
    "Phân tích chi tiết",
];

export function getRandomChatTitle(): string {
    const randomIndex = Math.floor(Math.random() * CHAT_TITLES.length);
    return CHAT_TITLES[randomIndex];
}
