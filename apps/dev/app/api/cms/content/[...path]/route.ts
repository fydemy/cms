import { createContentApiHandlers } from "@fydemy/cms";

const handlers = createContentApiHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
