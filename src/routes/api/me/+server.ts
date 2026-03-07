import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ locals }) => {
  return json({
    user: locals.user,
    isOnboarded: locals.isOnboarded,
  });
};
