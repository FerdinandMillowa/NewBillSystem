import { useState, useRef, useEffect } from "react";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { ExportFormat } from "../../hooks/useExport";

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  isDisabled?: boolean;
  /** Total records that will be exported — shown in tooltip/label */
  recordCount?: number;
}

const FORMAT_OPTIONS: { format: ExportFormat; label: string; icon: string }[] =
  [
    { format: "pdf", label: "Export as PDF", icon: "📄" },
    { format: "excel", label: "Export as Excel", icon: "📊" },
    { format: "csv", label: "Export as CSV", icon: "📋" },
  ];

export const ExportButton = ({
  onExport,
  isExporting,
  isDisabled = false,
  recordCount,
}: ExportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (format: ExportFormat) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        disabled={isDisabled || isExporting}
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={recordCount != null ? `Export ${recordCount} records` : "Export"}
      >
        {isExporting ? (
          <>
            <span className="w-4 h-4 border-2 border-gray-400 border-t-primary-600 rounded-full animate-spin" />
            Exporting…
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
            {recordCount != null && (
              <span className="ml-0.5 text-xs text-gray-500">
                ({recordCount})
              </span>
            )}
            <ChevronDownIcon className="w-3 h-3 text-gray-400" />
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 z-50 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {FORMAT_OPTIONS.map(({ format, label, icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => handleSelect(format)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
