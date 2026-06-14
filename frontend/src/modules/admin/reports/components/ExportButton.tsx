"use client";

interface ExportButtonProps {
  loading?: boolean;
}

export default function ExportButton({ loading = false }: ExportButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        rounded-lg
        bg-blue-600
        px-5
        py-2.5
        font-medium
        text-white
        transition
        hover:bg-blue-700
        disabled:cursor-not-allowed
        disabled:opacity-60
        whitespace-nowrap
      "
    >
      {loading ? "Đang xuất..." : "Xuất báo cáo"}
    </button>
  );
}