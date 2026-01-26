import { StatusCodes, getReasonPhrase } from "http-status-codes";

export const apiResponse = ({
  res,
  error,
  statusCode,
  message = null,
  data,
  pagination,
  ...options
}) => {
  const isBody = data ? data : null;
  const status =
    statusCode || error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const msg = message || error?.message || getReasonPhrase(status);
  return res
    .status(status)
    .json({ message: msg, error, pagination, body: isBody, ...options });
};

export const parseJoiError = (error) => {
  const errors = {};

  error.details.forEach((detail) => {
    errors[detail.context.key] = detail.message.replace(/['"]/g, "");
  });

  return errors;
};
