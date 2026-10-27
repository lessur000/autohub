import * as contactService from "./contact.service.js";
import { asyncHandler, sendSuccess } from "../../shared/utils/moduleHelpers.js";

export const submitContactMessage = asyncHandler(async (req, res) => {
  const message = await contactService.submitContactMessage(
    req.user ?? null,
    req.body,
  );

  return sendSuccess(res, message, "Contact message submitted.", 201);
});

export const getContactMessages = asyncHandler(async (req, res) => {
  const result = await contactService.getContactMessages(req.query);

  return sendSuccess(res, result, "Contact messages retrieved.");
});

export const changeContactStatus = asyncHandler(async (req, res) => {
  const message = await contactService.changeContactStatus(
    req.params.messageId,
    req.body.status,
  );

  return sendSuccess(res, message, "Contact message status updated.");
});
