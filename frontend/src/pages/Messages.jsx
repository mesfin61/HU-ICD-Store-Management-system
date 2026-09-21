import React, { useEffect, useState } from "react";

import {
  FiArrowLeft,
  FiCheck,
  FiEdit3,
  FiInbox,
  FiMail,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";

import PageTransition from "../animated_motion/PageTransition";

import {
  getInbox,
  getSentMessages,
  getMessageRecipients,
  getUnreadMessageCount,
  sendMessage,
  markMessageAsRead,
} from "../services/messageService";

function Messages() {
  const [activeTab, setActiveTab] = useState("inbox");

  const [inbox, setInbox] = useState([]);

  const [sent, setSent] = useState([]);

  const [recipients, setRecipients] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [selectedMessage, setSelectedMessage] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isSending, setIsSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // COMPOSE FORM
  // =========================================================

  const [recipientId, setRecipientId] = useState("");

  const [subject, setSubject] = useState("");

  const [body, setBody] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadData = async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setErrorMessage("");

      const [inboxData, sentData, recipientData, unreadData] =
        await Promise.all([
          getInbox(),
          getSentMessages(),
          getMessageRecipients(),
          getUnreadMessageCount(),
        ]);

      const nextInbox = Array.isArray(inboxData) ? inboxData : [];

      const nextSent = Array.isArray(sentData) ? sentData : [];

      const nextRecipients = Array.isArray(recipientData) ? recipientData : [];

      setInbox(nextInbox);
      setSent(nextSent);
      setRecipients(nextRecipients);

      setUnreadCount(Number(unreadData) || 0);

      if (!recipientId && nextRecipients.length > 0) {
        setRecipientId(nextRecipients[0].id);
      }
    } catch (error) {
      console.error("[Messages] load:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to load messages.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    await loadData({
      showLoading: false,
    });
  };

  // =========================================================
  // MARK MESSAGE AS READ
  // =========================================================

  const handleOpenMessage = async (message) => {
    try {
      setErrorMessage("");
      setSelectedMessage(message);

      if (!message.is_read) {
        await markMessageAsRead(message.id);

        const updatedMessage = {
          ...message,
          is_read: true,
        };

        setSelectedMessage(updatedMessage);

        setInbox((current) =>
          current.map((item) =>
            item.id === message.id
              ? {
                  ...item,
                  is_read: true,
                }
              : item,
          ),
        );

        setUnreadCount((current) => Math.max(Number(current) - 1, 0));
      }
    } catch (error) {
      console.error("[Messages] mark read:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to open message.",
      );
    }
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSend = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!recipientId) {
      setErrorMessage("Select a recipient.");
      return;
    }

    if (!subject.trim()) {
      setErrorMessage("Subject is required.");
      return;
    }

    if (!body.trim()) {
      setErrorMessage("Message body is required.");
      return;
    }

    try {
      setIsSending(true);

      await sendMessage({
        recipientId,
        subject: subject.trim(),
        body: body.trim(),
      });

      setSubject("");
      setBody("");

      setSuccessMessage("Message sent successfully.");

      setActiveTab("sent");

      await loadData({
        showLoading: false,
      });
    } catch (error) {
      console.error("[Messages] send:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to send message.",
      );
    } finally {
      setIsSending(false);
    }
  };

  // =========================================================
  // REPLY
  // =========================================================

  const handleReply = () => {
    if (!selectedMessage) {
      return;
    }

    setRecipientId(selectedMessage.sender_id);

    setSubject(
      selectedMessage.subject
        ? selectedMessage.subject.startsWith("Re:")
          ? selectedMessage.subject
          : `Re: ${selectedMessage.subject}`
        : "Re:",
    );

    setBody("");

    setSelectedMessage(null);

    setActiveTab("compose");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  };

  // =========================================================
  // RECIPIENT LABEL
  // =========================================================

  const recipientLabel = (recipient) => {
    if (!recipient) {
      return "Unknown user";
    }

    const department = recipient.department ? ` — ${recipient.department}` : "";

    return `${recipient.full_name || "User"} (${recipient.role || "User"})${department}`;
  };

  // =========================================================
  // MESSAGE LIST
  // =========================================================

  const renderMessageList = (messages, type) => {
    if (messages.length === 0) {
      return (
        <div className="rounded-lg border border-dashed bg-white p-12 text-center">
          {type === "inbox" ? (
            <FiInbox className="mx-auto h-10 w-10 text-slate-300" />
          ) : (
            <FiSend className="mx-auto h-10 w-10 text-slate-300" />
          )}

          <h3 className="mt-4 text-lg font-semibold text-primary">
            {type === "inbox" ? "Inbox is empty" : "No sent messages"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {type === "inbox"
              ? "You have no messages at the moment."
              : "Messages you send will appear here."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {messages.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() =>
              type === "inbox"
                ? handleOpenMessage(message)
                : setSelectedMessage(message)
            }
            className={`flex w-full items-start gap-4 border-b p-4 text-left transition last:border-b-0 hover:bg-slate-50 ${
              !message.is_read && type === "inbox" ? "bg-blue-50/60" : ""
            }`}
          >
            <div
              className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                !message.is_read && type === "inbox"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <FiMail className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-primary">
                      {type === "inbox"
                        ? message.sender_name
                        : `To: ${message.recipient_name}`}
                    </span>

                    {!message.is_read && type === "inbox" && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    )}
                  </div>

                  <div className="mt-1 truncate text-sm font-medium text-slate-700">
                    {message.subject}
                  </div>
                </div>

                <span className="shrink-0 text-xs text-slate-500">
                  {formatDate(message.created_at)}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {message.body}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-5">
        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              <FiMail className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-primary">Messages</h1>

              <p className="text-sm font-semibold text-slate-500">
                Communicate securely with authorized system users.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* =================================================
            SUMMARY
            ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Inbox
            </div>

            <div className="mt-1 text-2xl font-bold text-primary">
              {inbox.length}
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-blue-700">
              Unread
            </div>

            <div className="mt-1 text-2xl font-bold text-blue-800">
              {unreadCount}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Sent
            </div>

            <div className="mt-1 text-2xl font-bold text-primary">
              {sent.length}
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR / SUCCESS
            ================================================= */}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* =================================================
            TABS
            ================================================= */}

        <div className="flex flex-wrap gap-2 border-b">
          <button
            type="button"
            onClick={() => {
              setActiveTab("inbox");
              setSelectedMessage(null);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`inline-flex items-center gap-2 rounded-t-md px-4 py-3 text-sm font-semibold ${
              activeTab === "inbox"
                ? "border-b-2 border-blue-700 text-blue-700"
                : "text-slate-600 hover:text-primary"
            }`}
          >
            <FiInbox />
            Inbox
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("sent");
              setSelectedMessage(null);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`inline-flex items-center gap-2 rounded-t-md px-4 py-3 text-sm font-semibold ${
              activeTab === "sent"
                ? "border-b-2 border-blue-700 text-blue-700"
                : "text-slate-600 hover:text-primary"
            }`}
          >
            <FiSend />
            Sent
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("compose");
              setSelectedMessage(null);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`inline-flex items-center gap-2 rounded-t-md px-4 py-3 text-sm font-semibold ${
              activeTab === "compose"
                ? "border-b-2 border-blue-700 text-blue-700"
                : "text-slate-600 hover:text-primary"
            }`}
          >
            <FiEdit3 />
            Compose
          </button>
        </div>

        {/* =================================================
            CONTENT
            ================================================= */}

        {isLoading ? (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-slate-500">
            Loading messages...
          </div>
        ) : (
          <>
            {activeTab === "inbox" && renderMessageList(inbox, "inbox")}

            {activeTab === "sent" && renderMessageList(sent, "sent")}

            {activeTab === "compose" && (
              <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-primary">
                    New Message
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select an authorized recipient and send your message.
                  </p>
                </div>

                {recipients.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    No authorized recipients are currently available.
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="space-y-5">
                    {/* RECIPIENT */}

                    <div>
                      <label className="block text-sm font-semibold text-primary">
                        Recipient
                      </label>

                      <select
                        value={recipientId}
                        onChange={(event) => setRecipientId(event.target.value)}
                        disabled={isSending}
                        className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-primary outline-none focus:border-blue-500"
                      >
                        <option value="">Select recipient...</option>

                        {recipients.map((recipient) => (
                          <option key={recipient.id} value={recipient.id}>
                            {recipientLabel(recipient)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* SUBJECT */}

                    <div>
                      <label className="block text-sm font-semibold text-primary">
                        Subject
                      </label>

                      <input
                        type="text"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        disabled={isSending}
                        maxLength={200}
                        placeholder="Message subject"
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-primary outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* BODY */}

                    <div>
                      <label className="block text-sm font-semibold text-primary">
                        Message
                      </label>

                      <textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        disabled={isSending}
                        rows={8}
                        placeholder="Write your message..."
                        className="mt-2 block w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-primary outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* SEND */}

                    <div className="flex justify-end border-t pt-4">
                      <button
                        type="submit"
                        disabled={isSending || recipients.length === 0}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiSend />

                        {isSending ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* =================================================
            MESSAGE DETAILS
            ================================================= */}

        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              {/* HEADER */}

              <div className="flex items-start justify-between border-b px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FiMail className="h-5 w-5 text-blue-700" />

                    <h2 className="truncate text-xl font-bold text-primary">
                      {selectedMessage.subject}
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="rounded-md px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              {/* CONTENT */}

              <div className="overflow-y-auto p-6">
                <div className="mb-6 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      From
                    </div>

                    <div className="mt-1 font-semibold text-primary">
                      {selectedMessage.sender_name}
                    </div>

                    {selectedMessage.sender_email && (
                      <div className="text-xs text-slate-500">
                        {selectedMessage.sender_email}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      To
                    </div>

                    <div className="mt-1 font-semibold text-primary">
                      {selectedMessage.recipient_name}
                    </div>

                    {selectedMessage.recipient_email && (
                      <div className="text-xs text-slate-500">
                        {selectedMessage.recipient_email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedMessage.body}
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
                {activeTab === "inbox" && (
                  <button
                    type="button"
                    onClick={handleReply}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    <FiArrowLeft />
                    Reply
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="inline-flex items-center gap-2 rounded-md border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
                >
                  <FiCheck />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default Messages;
