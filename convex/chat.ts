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
                model: "gemini-2.5-flash-lite",
            });

            const chat = model.startChat({
                history: conversationHistory.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: 4000,
                    temperature: 0.7,
                },
            });

            let promptInstruction = "Bạn đang đóng vai nhân viên hỗ trợ khách hàng của ứng dụng ghi chú trực tuyến MiNote.Hãy luôn trả lời bằng tiếng Việt (trừ khi người dùng yêu cầu ngôn ngữ khác).Giữ giọng điệu thân thiện, gần gũi, dễ hiểu, giống như đang hỗ trợ người dùng thực tế trong ứng dụng.";

            if (session.systemPrompt) {
                promptInstruction = session.systemPrompt + "\n\n" + promptInstruction;
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
                    const titlePrompt = `Tạo một tiêu đề ngắn gọn (tối đa 6 từ) bằng tiếng Việt cho cuộc trò chuyện này dựa trên câu hỏi: "${args.message}". Chỉ trả về tiêu đề, không giải thích.`;

                    const titleResult = await model.generateContent(titlePrompt);
                    const titleResponse = titleResult.response;
                    let generatedTitle = titleResponse.text().trim();

                    generatedTitle = generatedTitle.replace(/^["']|["']$/g, '');

                    // Giới hạn 50 ký tự
                    if (generatedTitle.length > 50) {
                        generatedTitle = generatedTitle.slice(0, 47) + "...";
                    }

                    await ctx.runMutation(api.chat.updateSession, {
                        sessionId: args.sessionId,
                        title: generatedTitle,
                    });
                } catch (titleError) {
                    console.error("Lỗi khi đang tạo Tiêu đề:", titleError);

                    // Sử dụng 50 tin nhắn đầu tiên của tin nhắn
                    const fallbackTitle = args.message.slice(0, 47) + "...";
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
            console.error("Gemini API error:", error);

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
