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
    <div>
      <form className="flex gap-2 p-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1 flex-1 bg-white border border-gray-500 p-6 rounded-lg shadow">
          <span className="flex flex-col">
            <h1 className="text-2xl font-semibold text-primary">
              New Supply Request
            </h1>
            <p className="text-primary">
              Submit a new request for ICT equipment or consumables
            </p>
          </span>

          <span className="flex gap-3 justify-between mt-2">
            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                Requester Name
              </label>
              <input
                type="text"
                name="requester"
                value={form.requester}
                onChange={handleChange}
                required
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>

            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                department
              </label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>
          </span>

          <span className="flex gap-3 justify-between mt-2">
            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                item category
              </label>
              <input
                type="text"
                name="itemCategory"
                value={form.itemCategory}
                onChange={handleChange}
                required
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>

            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                equipment name
              </label>
              <input
                type="text"
                name="itemName"
                value={form.itemName}
                onChange={handleChange}
                required
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>
          </span>

          <span className="flex gap-3 justify-between mt-2">
            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                min="1"
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>

            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                priority level
              </label>
              <input
                type="text"
                name="priorityLevel"
                value={form.priorityLevel}
                onChange={handleChange}
                required
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>
          </span>

          <span className="flex gap-3 justify-between mt-2">
            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                request purpose
              </label>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                className="py-4 px-8 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>

            <span className="flex flex-col gap-1">
              <label className="text-primary uppercase font-semibold mb-1">
                needed by date
              </label>
              <input
                type="date"
                name="neededByDate"
                value={form.neededByDate}
                onChange={handleChange}
                required
                className="py-2 px-4 bg-secondary-container text-primary font-semibold border border-primary active:border-primary rounded"
              />
            </span>
          </span>

          <span className="flex flex-col gap-1">
            <label className="text-primary uppercase font-semibold mb-1">
              Supporting Documents (Approval Letters/Justification)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />

              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <p className="mb-1 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>

              <p className="text-xs text-gray-500">
                PDF, JPG or PNG (max. 10MB)
              </p>
              {form.supportingDocumentName ? (
                <p className="mt-2 text-xs font-medium text-primary">
                  Selected file: {form.supportingDocumentName}
                </p>
              ) : null}
            </label>
          </span>

          <button
            type="submit"
            className="mt-6 self-start rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Submit Request
          </button>
        </div>
        <div className="flex-1"></div>
      </form>
    </div>
  );
}

export default NewRequest;
