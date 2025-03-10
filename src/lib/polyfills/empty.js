// Empty polyfill for Node.js modules
export default {};
export const execSync = () => {
  throw new Error('execSync is not available in Cloudflare Workers');
};
