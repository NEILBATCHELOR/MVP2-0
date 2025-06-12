export type KYCStatus =
  | "approved"
  | "pending"
  | "failed"
  | "not_started"
  | "expired";

export const isKYCExpired = (lastUpdated: string): boolean => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return new Date(lastUpdated) < sixMonthsAgo;
};

export const getKYCStatus = (
  status: KYCStatus,
  lastUpdated: string,
): KYCStatus => {
  if (status === "approved" && isKYCExpired(lastUpdated)) {
    return "expired";
  }
  return status;
};
