import * as contactRepository from "./contact.repository.js";
import {
  httpError,
  isUuid,
  parsePagination,
} from "../../shared/utils/moduleHelpers.js";

export const submitContactMessage = async (user, payload) => {
  const { name, email, subject, message } = payload;

  if (typeof name !== "string" || !name.trim() || name.length > 160) {
    throw httpError(
      400,
      "Name is required and must be at most 160 characters.",
    );
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 320
  ) {
    throw httpError(400, "A valid email address is required.");
  }

  if (
    subject != null &&
    (typeof subject !== "string" || subject.length > 200)
  ) {
    throw httpError(400, "Subject must be at most 200 characters.");
  }

  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 10000
  ) {
    throw httpError(
      400,
      "Message is required and must be at most 10000 characters.",
    );
  }

  return contactRepository.createMessage({
    userId: user?.id ?? null,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject?.trim() || null,
    message: message.trim(),
  });
};

export const getContactMessages = async (query = {}) => {
  const { page, limit, offset } = parsePagination(query);

  const allowedStatuses = ["new", "read", "in_progress", "resolved", "closed"];
  const status = query.status || null;

  if (status && !allowedStatuses.includes(status)) {
    throw httpError(400, "Invalid contact message status.");
  }

  const messages = await contactRepository.findMessages({
    status,
    limit,
    offset,
  });

  return { page, limit, messages };
};

export const changeContactStatus = async (messageId, status) => {
  if (!isUuid(messageId)) {
    throw httpError(400, "Invalid contact message ID.");
  }

  const allowedStatuses = ["new", "read", "in_progress", "resolved", "closed"];

  if (!allowedStatuses.includes(status)) {
    throw httpError(400, "Invalid contact message status.");
  }

  const updated = await contactRepository.updateMessageStatus(
    messageId,
    status,
  );

  if (!updated) {
    throw httpError(404, "Contact message not found.");
  }

  return updated;
};
