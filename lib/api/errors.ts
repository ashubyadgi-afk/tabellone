export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
};

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: ApiErrorBody["error"]["details"]
) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}
