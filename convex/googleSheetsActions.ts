import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const fetchSheetData = action({
    args: {
        csvUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const csvUrl = args.csvUrl || process.env.GOOGLE_SHEET_CSV_URL;

            if (!csvUrl) {
                console.warn("URL CSV của Google Sheets chưa được cấu hình");
                return null;
            }

            console.log("Lấy dữ liệu CSV từ:", csvUrl);

            const response = await fetch(csvUrl);

            if (!response.ok) {
                console.error("Không thể tải tệp CSV.:", response.statusText);
                return null;
            }

            const csvText = await response.text();
            console.log("Đã tải xuống tệp CSV, độ dài:", csvText.length);
            console.log("Xem trước nội dung CSV:", csvText.substring(0, 200));

            const rows = parseCSV(csvText);
            console.log("Hàng được phân tích cú pháp:", rows.length);
            console.log("Hàng đầu tiên:", JSON.stringify(rows.slice(0, 3)));

            if (!rows || rows.length === 0) {
                console.log("No data found in CSV");
                return null;
            }

            const formattedData = formatSheetDataForAI(rows);
            console.log("Độ dài dữ liệu được định dạng:", formattedData.length);
            console.log("Xem trước dữ liệu được định dạng:", formattedData.substring(0, 300));

            const identity = await ctx.auth.getUserIdentity();
            if (identity && csvUrl) {
                const sheetId = extractSheetIdFromUrl(csvUrl);
                await ctx.runMutation(api.googleSheets.cacheSheetData, {
                    userId: identity.subject,
                    sheetId: sheetId,
                    range: "CSV",
                    data: formattedData,
                });
                console.log("Dữ liệu được lưu vào bộ nhớ đệm thành công");
            }

            return formattedData;
        } catch (error) {
            console.error("Lỗi khi tải tệp CSV của Google Sheets:", error);
            return null;
        }
    },
});

function parseCSV(csvText: string): string[][] {
    const lines = csvText.split(/\r?\n/);
    const rows: string[][] = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        const row: string[] = [];
        let currentField = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                row.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }

        row.push(currentField.trim());
        rows.push(row);
    }

    return rows;
}

function extractSheetIdFromUrl(url: string): string {
    // Trích xuất từ ​​URL dạng: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : 'unknown';
}

// Chức năng trợ giúp định dạng dữ liệu bảng cho AI
function formatSheetDataForAI(rows: string[][]): string {
    if (!rows || rows.length === 0) {
        return "";
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    let formatted = "=== KNOWLEDGE BASE DATA ===\n\n";

    if (headers.length === 2) {
        formatted += `${headers[0]} | ${headers[1]}\n`;
        formatted += "---\n";
        dataRows.forEach((row) => {
            if (row.length >= 2 && row[0] && row[1]) {
                formatted += `Q: ${row[0]}\nA: ${row[1]}\n\n`;
            }
        });
    } else {
        formatted += headers.join(" | ") + "\n";
        formatted += headers.map(() => "---").join(" | ") + "\n";
        dataRows.forEach((row) => {
            if (row.length > 0) {
                formatted += row.join(" | ") + "\n";
            }
        });
    }

    formatted += "\n=== END KNOWLEDGE BASE ===\n";

    return formatted;
}
