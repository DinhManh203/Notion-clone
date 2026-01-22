import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const getSessions = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Chưa được xác thực");
        }

        const userId = identity.subject;

        const sessions = await ctx.db
            .query("chatSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        return sessions;
    }
});

export const getSessionById = query({
    args: { sessionId: v.id("chatSessions") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return null;
        }

        const userId = identity.subject;

        const session = await ctx.db.get(args.sessionId);

        if (!session) {
            return null;
        }

        if (session.userId !== userId) {
            return null;
        }

        return session;
    }
});

export const getMessages = query({
    args: { sessionId: v.id("chatSessions") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return [];
        }

        const userId = identity.subject;

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId) {
            return [];
        }

        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_session_time", (q) =>
                q.eq("sessionId", args.sessionId)
            )
            .collect();

        return messages;
    }
});

export const createSession = mutation({
    args: {
        title: v.optional(v.string()),
        systemPrompt: v.optional(v.string()),
        documentId: v.optional(v.id("documents")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Chưa được xác thực");
        }

        const userId = identity.subject;
        const now = Date.now();

        const sessionId = await ctx.db.insert("chatSessions", {
            userId,
            title: args.title,
            documentId: args.documentId,
            systemPrompt: args.systemPrompt,
            createdAt: now,
            updatedAt: now,
        });

        return sessionId;
    }
});

export const updateSession = mutation({
    args: {
        sessionId: v.id("chatSessions"),
        title: v.optional(v.string()),
        systemPrompt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Chưa được xác thực");
        }

        const userId = identity.subject;

        const session = await ctx.db.get(args.sessionId);

        if (!session) {
            throw new Error("Không tìm thấy phiên làm việc");
        }

        if (session.userId !== userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.sessionId, {
            title: args.title !== undefined ? args.title : session.title,
            systemPrompt: args.systemPrompt !== undefined ? args.systemPrompt : session.systemPrompt,
            updatedAt: Date.now(),
        });

        return args.sessionId;
    }
});

export const deleteSession = mutation({
    args: { sessionId: v.id("chatSessions") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Chưa được xác thực");
        }

        const userId = identity.subject;

        const session = await ctx.db.get(args.sessionId);

        if (!session) {
            throw new Error("Không tìm thấy phiên làm việc");
        }

        if (session.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        await ctx.db.delete(args.sessionId);

        return args.sessionId;
    }
});

export const addMessage = mutation({
    args: {
        sessionId: v.id("chatSessions"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        documentIds: v.optional(v.array(v.id("documents"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Chưa được xác thực");
        }

        const userId = identity.subject;

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const messageId = await ctx.db.insert("chatMessages", {
            sessionId: args.sessionId,
            role: args.role,
            content: args.content,
            documentIds: args.documentIds,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.sessionId, {
            updatedAt: Date.now(),
        });

        return messageId;
    }
});

export const sendMessage = action({
    args: {
        sessionId: v.id("chatSessions"),
        message: v.string(),
        documentIds: v.optional(v.array(v.id("documents"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Chưa được xác thực");
        }

        await ctx.runMutation(api.chat.addMessage, {
            sessionId: args.sessionId,
            role: "user",
            content: args.message,
            documentIds: args.documentIds,
        });

        const session = await ctx.runQuery(api.chat.getSessionById, {
            sessionId: args.sessionId,
        });

        if (!session) {
            throw new Error("Không tìm thấy phiên làm việc");
        }

        const messages = await ctx.runQuery(api.chat.getMessages, {
            sessionId: args.sessionId,
        });

        const conversationHistory = messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
            });

            const chat = model.startChat({
                history: conversationHistory.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: 4000,
                    temperature: 0.7,
                },
            });

            let promptInstruction = `
                    Bạn là trợ lý của ứng dụng ghi chú MiNote.

                    PHẠM VI CHUYÊN MÔN:
                    1. VĂN HỌC VIỆT NAM:
                    - Văn học cổ điển (thơ ca, văn xuôi, truyện Nôm...)
                    - Văn học hiện đại và đương đại
                    - Tác giả, tác phẩm, phong trào văn học
                    - Phân tích tác phẩm, nhân vật, nghệ thuật
                    - Lịch sử văn học, trường phái
                    - Tiểu sử tác giả, nhà thơ, nhà văn
                    - Bối cảnh lịch sử, văn hóa liên quan đến văn học

                    2. VĂN HỌC NƯỚC NGOÀI:
                    - Văn học các nước (Âu, Mỹ, Á, Phi...)
                    - Tác giả và tác phẩm nổi tiếng
                    - Trường phái văn học thế giới
                    - So sánh văn học các nền văn hóa
                    - Dịch thuật và tiếp nhận văn học
                    - Tiểu sử các nhà văn, nhà thơ thế giới

                    3. LỊCH SỬ & VĂN HÓA (liên quan văn học):
                    - Nhân vật lịch sử có ảnh hưởng đến văn học
                    - Bối cảnh lịch sử của các tác phẩm văn học
                    - Văn hóa, phong tục trong văn học
                    - Sự kiện lịch sử được phản ánh trong văn học

                    4. HƯỚNG DẪN SỬ DỤNG MINOTE:
                    - Cách tạo, chỉnh sửa, quản lý ghi chú
                    - Tính năng của ứng dụng
                    - Mẹo và thủ thuật sử dụng hiệu quả
                    - Giải đáp thắc mắc về ứng dụng

                    NGUYÊN TẮC TRẢ LỜI:
                    ✅ CHẤP NHẬN:
                    - Mọi câu hỏi về văn học Việt Nam và thế giới
                    - Phân tích, giải thích tác phẩm văn học
                    - Tiểu sử tác giả, nhà thơ, nhà văn
                    - Nhân vật lịch sử liên quan văn học/văn hóa
                    - Bối cảnh lịch sử, xã hội của tác phẩm văn học
                    - Hướng dẫn sử dụng MiNote
                    - Tư vấn cách ghi chú, tổ chức tài liệu văn học

                    ❌ TỪ CHỐI LỊCH SỰ (chỉ khi hoàn toàn không liên quan văn học):
                    - Toán học, vật lý, hóa học, sinh học thuần túy
                    - Lập trình, công nghệ (trừ hướng dẫn MiNote)
                    - Kinh tế, tài chính
                    - Y học, sức khỏe
                    - Các chủ đề hoàn toàn không liên quan văn học

                    KHI NHẬN CÂU HỎI NGOÀI PHẠM VI:
                    "Xin lỗi bạn, mình chỉ chuyên về văn học Việt Nam, văn học nước ngoài và hướng dẫn sử dụng MiNote thôi. Bạn có câu hỏi nào về văn học hoặc cần hướng dẫn sử dụng ứng dụng không?"

                    PHONG CÁCH:
                    - Xưng hô: mình - bạn
                    - Thân thiện, nhiệt tình, chuyên nghiệp
                    - Trả lời bằng tiếng Việt (trừ khi yêu cầu khác)
                    - Ghi nhớ toàn bộ ngữ cảnh cuộc trò chuyện
                    - Tham chiếu tin nhắn trước nếu liên quan
                    - Trích dẫn cụ thể khi phân tích văn học
                    - Hạn chế chào hỏi lặp lại mỗi câu trả lời
                    `.trim();

            if (session.systemPrompt) {
                promptInstruction = session.systemPrompt + "\n\n" + promptInstruction;
            }

            // Truy xuất nội dung tài liệu nếu tài liệu được gắn thẻ.
            let documentContext = "";
            if (args.documentIds && args.documentIds.length > 0) {
                console.log("Fetching content for", args.documentIds.length, "documents");

                for (const docId of args.documentIds) {
                    try {
                        const document = await ctx.runQuery(api.documents.getById, {
                            documentId: docId,
                        });

                        if (document && document.content) {
                            // Giới hạn độ dài nội dung để tránh vượt quá giới hạn token (tối đa 3000 ký tự mỗi tài liệu).
                            const content = document.content.length > 3000
                                ? document.content.substring(0, 3000) + "..."
                                : document.content;

                            documentContext += `\n\n=== TÀI LIỆU: ${document.title} ===\n${content}\n=== KẾT THÚC TÀI LIỆU ===\n`;
                        }
                    } catch (error) {
                        console.error("Error fetching document:", docId, error);
                    }
                }

                if (documentContext) {
                    console.log("Document context added:", documentContext.length, "chars");

                    const documentInstruction = `

                        Các tài liệu sau đây đã được người dùng gắn thẻ trong cuộc trò chuyện:
                        ${documentContext}

                        Nhiệm vụ của bạn:
                        - Phân tích kỹ các tài liệu trên
                        - Sử dụng thông tin từ tài liệu để trả lời câu hỏi
                        - Nếu câu hỏi liên quan đến nội dung tài liệu, hãy trích dẫn và giải thích cụ thể
                        - Trả lời chính xác dựa trên nội dung tài liệu, không bịa đặt thông tin
                        `.trim();
                    promptInstruction = promptInstruction + "\n\n" + documentInstruction;
                }
            }

            // Lấy dữ liệu từ Google Sheets để bổ sung vào cơ sở kiến ​​thức.
            let sheetData = null;
            try {
                const csvUrl = process.env.GOOGLE_SHEET_CSV_URL;
                console.log("CSV URL from env:", csvUrl ? "Found" : "Not found");

                if (csvUrl) {
                    console.log("Fetching fresh sheet data...");
                    sheetData = await ctx.runAction(api.googleSheetsActions.fetchSheetData, {});
                    console.log("Sheet data fetched:", sheetData ? `${sheetData.length} chars` : "null");
                }
            } catch (error) {
                console.error("Error loading sheet data:", error);
            }

            // Thêm dữ liệu trang tính vào lời nhắc nếu có.
            if (sheetData) {
                console.log("Thêm dữ liệu trang tính vào prompt");
                promptInstruction = promptInstruction + "\n\n" + sheetData + "\n\nSử dụng dữ liệu sẵn có làm nguồn tham khảo để phản hồi tin nhắn cho người dùng. Trả lời bằng ngôn ngữ tự nhiên, sáng tạo và thân thiện (Hạn chế chào người dùng khi đang hỏi). Nội dung cần đúng trọng tâm, rõ ràng, đúng bối cảnh, vừa đủ độ dài, tránh trả lời lan man hoặc thô cứng.";
            } else {
                console.log("Không có sẵn dữ liệu trang tính");
            }

            // Tự động tìm kiếm Wikipedia cho các từ khóa văn học
            let wikipediaContext = "";
            try {
                const literatureKeywords = extractLiteratureKeywords(args.message);

                if (literatureKeywords.length > 0) {
                    console.log("Searching Wikipedia for:", literatureKeywords);

                    // Limit to 2 searches to avoid slowdown
                    for (const keyword of literatureKeywords.slice(0, 2)) {
                        const wikiResult = await ctx.runAction(api.wikipediaActions.searchWikipedia, {
                            query: keyword,
                            lang: "vi",
                        });

                        if (wikiResult) {
                            wikipediaContext += `\n\n📖 [Wikipedia: ${wikiResult.title}]\n${wikiResult.extract}\nNguồn: ${wikiResult.url}\n`;
                            console.log(`Wikipedia found: ${wikiResult.title}`);
                            console.log(`Extract: ${wikiResult.extract.substring(0, 100)}...`);
                            console.log(`URL: ${wikiResult.url}`);
                        } else {
                            console.log(`❌ Wikipedia not found for: ${keyword}`);
                        }
                    }
                }
            } catch (error) {
                console.error("Wikipedia search error:", error);
            }

            // Thêm Wikipedia context vào prompt nếu có
            if (wikipediaContext) {
                promptInstruction += `\n\n═══════════════════════════════════════════════════════════════\n📚 THÔNG TIN TỪ WIKIPEDIA (Tham khảo bổ sung):\n${wikipediaContext}\n\nSử dụng thông tin trên để bổ sung câu trả lời nếu liên quan. Kết hợp với kiến thức của bạn để trả lời đầy đủ, chính xác.\n═══════════════════════════════════════════════════════════════`;
            }

            let prompt = `${promptInstruction}\n\nUser: ${args.message}`;

            const result = await chat.sendMessage(prompt);
            const response = result.response;
            const aiMessage = response.text();

            await ctx.runMutation(api.chat.addMessage, {
                sessionId: args.sessionId,
                role: "assistant",
                content: aiMessage,
            });

            if (!session.title || session.title === "Đoạn chat mới") {
                try {
                    // Hãy yêu cầu AI tạo ra một tiêu đề ngắn.
                    const titlePrompt = `Tạo một tiêu đề ngắn gọn bằng tiếng Việt cho cuộc trò chuyện này dựa trên câu hỏi: "${args.message}". Chỉ trả về tiêu đề, không giải thích.`;

                    const titleResult = await model.generateContent(titlePrompt);
                    const titleResponse = titleResult.response;
                    let generatedTitle = titleResponse.text().trim();

                    generatedTitle = generatedTitle.replace(/^["']|["']$/g, '');

                    // Giới hạn 105 ký tự
                    if (generatedTitle.length > 105) {
                        generatedTitle = generatedTitle.slice(0, 100) + "...";
                    }

                    await ctx.runMutation(api.chat.updateSession, {
                        sessionId: args.sessionId,
                        title: generatedTitle,
                    });
                } catch (titleError) {
                    console.error("Lỗi khi đang tạo Tiêu đề:", titleError);

                    // Sử dụng 50 tin nhắn đầu tiên của tin nhắn
                    const fallbackTitle = args.message.slice(0, 100) + "...";
                    await ctx.runMutation(api.chat.updateSession, {
                        sessionId: args.sessionId,
                        title: fallbackTitle,
                    });
                }
            }

            return {
                success: true,
                message: aiMessage,
            };
        } catch (error) {
            console.error("Gemini API lỗi:", error);

            const errorMessage = "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại.";
            await ctx.runMutation(api.chat.addMessage, {
                sessionId: args.sessionId,
                role: "assistant",
                content: errorMessage,
            });

            return {
                success: false,
                message: errorMessage,
            };
        }
    }
});


function extractLiteratureKeywords(message: string): string[] {
    // Từ khóa liên quan đến văn học và tiểu sử
    const literatureKeywords = [
        'tác giả', 'nhà thơ', 'nhà văn', 'tiểu thuyết', 'truyện', 'thơ',
        'văn học', 'tác phẩm', 'bài thơ', 'cuốn sách', 'tiểu sử',
        'sinh năm', 'mất năm', 'phong trào', 'trường phái',
        'ngày sinh', 'ngày mất', 'sinh ngày', 'mất ngày',
        'bao nhiêu', 'nào', 'khi nào', 'năm nào'
    ];

    // Kiểm tra xem tin nhắn có chứa các thuật ngữ liên quan đến văn học hay không
    const hasLiteratureContext = literatureKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
    );

    if (!hasLiteratureContext) {
        return [];
    }

    const namePattern = /\b[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+){0,4}\b/g;

    const potentialNames = message.match(namePattern) || [];

    // Danh sách các cụm từ thông dụng cần loại bỏ
    const commonPhrases = [
        'Việt Nam', 'Hà Nội', 'Sài Gòn', 'Thành Phố Hồ Chí Minh',
        'Đà Nẵng', 'Huế', 'Cần Thơ', 'Hải Phòng',
        'Trung Quốc', 'Nhật Bản', 'Hàn Quốc', 'Thái Lan',
        'Châu Âu', 'Châu Á', 'Châu Phi', 'Châu Mỹ',
        'Thế Giới', 'Quốc Gia', 'Đất Nước'
    ];

    // Các từ đơn thông dụng cần loại bỏ
    const commonSingleWords = [
        'Việt', 'Hà', 'Sài', 'Thành', 'Phố', 'Chí', 'Minh', 'Đà', 'Nẵng',
        'Cần', 'Thơ', 'Hải', 'Phòng', 'Quốc', 'Gia', 'Đất', 'Nước',
        'Người', 'Ông', 'Bà', 'Anh', 'Chị', 'Em', 'Cô', 'Chú', 'Bác',
        'Tác', 'Phẩm', 'Bài', 'Cuốn', 'Quyển', 'Tập'
    ];

    // Lọc và ưu tiên tên người
    const filtered = potentialNames.filter(name => {
        // Loại bỏ các cụm từ địa danh thông dụng
        if (commonPhrases.includes(name)) {
            return false;
        }

        // Nếu là tên nhiều từ (2+ từ), giữ lại trừ khi là địa danh
        if (name.includes(' ')) {
            return true;
        }

        // Nếu là từ đơn, loại bỏ các từ thông dụng và từ quá ngắn
        return !commonSingleWords.includes(name) && name.length > 2;
    });

    // Ưu tiên tên người (có 2-3 từ) lên đầu
    const sortedNames = filtered.sort((a, b) => {
        const aWordCount = a.split(' ').length;
        const bWordCount = b.split(' ').length;

        // Ưu tiên tên 2-3 từ (thường là tên người Việt)
        if (aWordCount >= 2 && aWordCount <= 3 && (bWordCount < 2 || bWordCount > 3)) {
            return -1;
        }
        if (bWordCount >= 2 && bWordCount <= 3 && (aWordCount < 2 || aWordCount > 3)) {
            return 1;
        }

        // Ưu tiên tên dài hơn
        return bWordCount - aWordCount;
    });

    // Trả về tối đa 2 tên để tránh quá nhiều request Wikipedia
    return sortedNames.slice(0, 2);
}
