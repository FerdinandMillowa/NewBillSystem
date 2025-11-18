import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { reportsService } from "../../services/reports.service";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportFormData {
  startDate: string;
  endDate: string;
  reportType: "daily" | "monthly" | "revenue" | "outstanding";
  format: "csv" | "pdf";
}

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const { register, handleSubmit, watch } = useForm<ExportFormData>({
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reportType: "daily",
      format: "csv",
    },
  });

  const onSubmit = async (data: ExportFormData) => {
    try {
      setIsExporting(true);

      const params = {
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.reportType,
      };

      const blob = await reportsService.exportReport(data.format, params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `report-${data.reportType}-${data.startDate}-to-${data.endDate}.${data.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `Report exported successfully as ${data.format.toUpperCase()}!`
      );
      onClose();
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Export Report
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Start Date</label>
                      <Input
                        type="date"
                        {...register("startDate", { required: true })}
                      />
                    </div>
                    <div>
                      <label className="label">End Date</label>
                      <Input
                        type="date"
                        {...register("endDate", { required: true })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Report Type</label>
                    <select className="input" {...register("reportType")}>
                      <option value="daily">Daily Report</option>
                      <option value="monthly">Monthly Report</option>
                      <option value="revenue">Revenue Report</option>
                      <option value="outstanding">Outstanding Balances</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Format</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="csv"
                          {...register("format")}
                          className="mr-2"
                        />
                        CSV
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="pdf"
                          {...register("format")}
                          className="mr-2"
                        />
                        PDF
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      📊 The exported report will include all data within the
                      selected date range in the chosen format.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      disabled={isExporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isExporting}
                    >
                      Export Report
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
