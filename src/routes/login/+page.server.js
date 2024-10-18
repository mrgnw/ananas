export function load({ platform }) {
  return {
    PUBLIC_PASSLOCK_TENANCY_ID: platform?.env?.PUBLIC_PASSLOCK_TENANCY_ID,
    PUBLIC_PASSLOCK_CLIENT_ID: platform?.env?.PUBLIC_PASSLOCK_CLIENT_ID
  };
}
