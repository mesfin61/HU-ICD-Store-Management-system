import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildRequestItem,
  getStoredRequestItems,
  saveStoredRequestItems,
} from "./requestStorage";

function NewRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    requester: "",
    department: "",
    itemCategory: "",
    itemName: "",
    quantity: "",
    priorityLevel: "",
    purpose: "",
    neededByDate: "",
    supportingDocumentName: "",
    supportingDocumentUrl: "",
    supportingDocumentType: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setForm((currentForm) => ({
        ...currentForm,
        supportingDocumentName: "",
        supportingDocumentUrl: "",
        supportingDocumentType: "",
      }));
      return;
    }

    const fileDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(selectedFile);
    });

    setForm((currentForm) => ({
      ...currentForm,
      supportingDocumentName: selectedFile.name,
      supportingDocumentUrl: fileDataUrl,
      supportingDocumentType: selectedFile.type,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.supportingDocumentUrl) {
      return;
    }

    const newRequest = buildRequestItem(form);
    const currentRequests = getStoredRequestItems();

    saveStoredRequestItems([newRequest, ...currentRequests]);
    navigate("/requests");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-primary">
              New Supply Request
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Submit a new request for ICT equipment or consumables
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Requester Name
              </span>
              <input
                type="text"
                name="requester"
                value={form.requester}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Department
              </span>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Item Category
              </span>
              <input
                type="text"
                name="itemCategory"
                value={form.itemCategory}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Equipment Name
              </span>
              <input
                type="text"
                name="itemName"
                value={form.itemName}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Quantity
              </span>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                min="1"
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Priority Level
              </span>
              <input
                type="text"
                name="priorityLevel"
                value={form.priorityLevel}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Request Purpose
              </span>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                rows={4}
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Needed By Date
              </span>
              <input
                type="date"
                name="neededByDate"
                value={form.neededByDate}
                onChange={handleChange}
                required
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Supporting Documents (Approval Letters/Justification)
              </span>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                  id="request-upload"
                />
                <label htmlFor="request-upload" className="cursor-pointer">
                  <div className="text-sm font-semibold text-primary">
                    Click to upload or drag and drop
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    PDF, JPG or PNG up to 10MB
                  </div>
                  {form.supportingDocumentName ? (
                    <div className="mt-3 text-xs font-medium text-primary">
                      Selected file: {form.supportingDocumentName}
                    </div>
                  ) : null}
                </label>
              </div>
            </label>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewRequest;
