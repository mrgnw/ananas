import { handle } from '$lib/auth';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    return handle({ request, env, ctx });
  },
};
