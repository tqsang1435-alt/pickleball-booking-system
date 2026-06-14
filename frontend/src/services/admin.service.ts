// frontend/src/services/admin.service.ts

import {
    ExportReportPayload,
    ExportReportResult,
} from "@/types/report.types";

const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? ""
).replace(/\/$/, "");

export async function exportAdminReport(
    payload: ExportReportPayload
): Promise<ExportReportResult> {
    const response = await fetch(
        `${API_URL}/api/admin/reports/export`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },

            /*
             * Dùng khi backend xác thực bằng cookie.
             */
            credentials: "include",

            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
            message?: string;
        } | null;

        throw new Error(
            errorData?.message ?? "Không thể xuất báo cáo"
        );
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get(
        "Content-Disposition"
    );

    const fallbackFilename =
        `${payload.reportType}-report.${payload.format}`;

    return {
        blob,
        filename:
            getFilenameFromHeader(contentDisposition) ??
            fallbackFilename,
    };
}

function getFilenameFromHeader(
    contentDisposition: string | null
): string | null {
    if (!contentDisposition) {
        return null;
    }

    const utf8FilenameMatch = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/
    );

    if (utf8FilenameMatch?.[1]) {
        return decodeURIComponent(utf8FilenameMatch[1]);
    }

    const normalFilenameMatch = contentDisposition.match(
        /filename="?([^"]+)"?/
    );

    return normalFilenameMatch?.[1] ?? null;
}