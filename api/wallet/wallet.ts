// hooks/useTransactions.ts
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "../apiclient";

/* ─────────── Types ─────────── */

export interface BankAccount {
  bankName: string | null;
  accountNumber: string | null;
}

export interface Transaction {
  id: string;
  type: string; // "withdrawal" | "deposit" | … (left open)
  amount: number;
  fee: number | null;
  netAmount: number;
  description: string | null;
  status: string;
  reference: string | null;
  createdAt: string; // ISO date
  bankAccount: BankAccount | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  success: true;
  data: {
    transactions: Transaction[];
    pagination: Pagination;
  };
}

export interface ApiError {
  success?: false;
  message?: string;
}

export interface QueryParams {
  /** Page number (1-based). Default = 1 */
  page?: number;
  /** Items per page. Default = 20 */
  limit?: number;
  /** Transaction type filter, e.g. "withdrawal" */
  type?: string;
}

/* ─────────── Fetcher ─────────── */

const fetchTransactions = async (
  params: QueryParams
): Promise<TransactionsResponse> => {
  const { data } = await api.get<TransactionsResponse>(
    "/wallets/transactions",
    {
      params,
    }
  );
  return data;
};

/* ─────────── Hook ─────────── */

/**
 * Fetch the authenticated user's wallet transactions.
 *
 * @param params   Pagination / filter query-params
 * @param options  React-Query options (staleTime, retry, etc.)
 *
 * @example
 * const { data, isLoading } = useTransactions({ page: 1, type: "withdrawal" });
 */
export function useTransactions(
  params: QueryParams = {},
  options?: UseQueryOptions<
    TransactionsResponse,
    AxiosError<ApiError>,
    TransactionsResponse
  >
) {
  const queryKey = ["transactions", params];

  return useQuery<TransactionsResponse, AxiosError<ApiError>>({
    queryKey,
    queryFn: () => fetchTransactions(params),
    retry: true,
    ...{
      keepPreviousData: true,
      ...options,
    },
  });
}

/* ───────── Convenience wrapper for withdrawals only ───────── */

export function useWithdrawalTransactions(
  params: Omit<QueryParams, "type"> = {},
  options?: UseQueryOptions<
    TransactionsResponse,
    AxiosError<ApiError>,
    TransactionsResponse
  >
) {
  return useTransactions({ ...params, type: "withdrawal" }, options);
}

export interface Wallet {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface BalanceResponse {
  success: true;
  data: {
    wallet: Wallet;
  };
}

/* ─────────── Fetcher ─────────── */

const fetchBalance = async (): Promise<BalanceResponse> => {
  const { data } = await api.get<BalanceResponse>("/wallets/balance");
  return data;
};

/* ─────────── Hook ─────────── */

/**
 * Retrieve the current user's wallet balance.
 *
 * @example
 * const { data, isLoading } = useBalance();
 */
export function useBalance(
  options?: UseQueryOptions<
    BalanceResponse,
    AxiosError<ApiError>,
    BalanceResponse
  >
) {
  return useQuery<BalanceResponse, AxiosError<ApiError>>({
    queryKey: ["balance"],
    queryFn: fetchBalance,
    staleTime: 10000,
    refetchInterval: 10000,
    retry: true,
    ...options,
  });
}

/* ─────────── WITHDRAW ─────────── */

export interface WithdrawBody {
  amount: number;
  bankAccountId: string | number;
}

export interface WithdrawResponse {
  success: true;
  message: string;
}

const withdrawRequest = async (
  body: WithdrawBody
): Promise<WithdrawResponse> => {
  const { data } = await api.post<WithdrawResponse>("/wallets/withdraw", body);
  return data;
};

export function useWithdraw(
  options?: UseMutationOptions<
    WithdrawResponse,
    AxiosError<ApiError>,
    WithdrawBody
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: withdrawRequest,
    ...options,
    onSuccess: (data, variables, context) => {
      // Invalidate balance and transactions to refetch
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

export interface VerifyAccountBody {
  bankCode: string; // e.g. "058"
  accountNumber: string; // "0123456789"
}

export interface BankDetails {
  accountName: string; // "Ola A. Johnson"
  accountNumber: string; // full number as returned by server
  bankId: string; // provider-specific numeric ID
  bankCode: string; // same code you sent ("058")
}

export interface VerifyAccountResponse {
  success: true;
  data: BankDetails;
}

/* ────────── Network call ────────── */
const verifyAccountRequest = async (
  body: VerifyAccountBody
): Promise<VerifyAccountResponse> => {
  const { data } = await api.post<VerifyAccountResponse>(
    "/wallets/verify-account",
    body
  );
  console.log(data);
  return data;
};

/* ────────── Hook ────────── */
/**
 * Call `/verify-account` to confirm that an acct # / bank-code combination is
 * valid. Returns the resolved account name & IDs direct from the payment
 * provider (via your backend).
 *
 * @example
 * const { mutate: verify } = useVerifyAccount({
 *   onSuccess: ({ data }) => console.log("Account name:", data.accountName),
 * });
 */
export function useVerifyAccount(
  options?: UseMutationOptions<
    VerifyAccountResponse,
    AxiosError<ApiError>,
    VerifyAccountBody
  >
) {
  return useMutation<
    VerifyAccountResponse,
    AxiosError<ApiError>,
    VerifyAccountBody
  >({ mutationFn: verifyAccountRequest, ...options });
}

export interface AddBankAccountBody {
  bankCode: string; // "058"
  bankName: string; // "GTBank"
  accountNumber: string; // "0123456789"
  accountName: string; // "Ola A. Johnson"
  isDefault?: boolean; // optional; default = false
}

export interface AddBankAccountResponse {
  success: true;
  message: string; // "Bank account added successfully"
  data: BankAccount;
}

/* ─────────────────  Network request  ───────────────── */

const addBankAccountRequest = async (
  body: AddBankAccountBody
): Promise<AddBankAccountResponse> => {
  const { data } = await api.post<AddBankAccountResponse>(
    "/wallets/bank-accounts",
    body
  );
  return data;
};

/* ───────────────────────  Hook  ─────────────────────── */

/**
 * Save a (verified) bank account for the authenticated user.
 *
 * On success the hook invalidates the cached `"bank-accounts"` list
 * so any UI listing accounts picks up the new entry automatically.
 */
export function useAddBankAccount(
  options?: UseMutationOptions<
    AddBankAccountResponse,
    AxiosError<ApiError>,
    AddBankAccountBody
  >
) {
  const qc = useQueryClient();

  return useMutation<
    AddBankAccountResponse,
    AxiosError<ApiError>,
    AddBankAccountBody
  >({
    mutationFn: addBankAccountRequest,
    ...{
      ...options,
      onSuccess: (data, variables, context) => {
        // Refresh cached list of accounts (if you cache it under this key)
        qc.invalidateQueries({ queryKey: ["bank-accounts"] });

        options?.onSuccess?.(data, variables, context);
      },
    },
  });
}

export interface BankAccountsResponse {
  success: true;
  data: BankAccount[];
}

/* ───────────── Fetcher ───────────── */

const fetchBankAccounts = async (): Promise<BankAccountsResponse> => {
  const { data } = await api.get<BankAccountsResponse>(
    "/wallets/bank-accounts"
  );
  return data;
};

/* ─────────────── Hook ─────────────── */

/**
 * Retrieve all bank accounts saved by the authenticated user.
 *
 * The hook uses the cache key **["bank-accounts"]** so that other mutations
 * (e.g. `useAddBankAccount`) can invalidate or update this list seamlessly.
 *
 * @example
 * const { data, isLoading, error } = useBankAccounts({ staleTime: 60_000 });
 */
export function useBankAccounts(
  options?: UseQueryOptions<
    BankAccountsResponse,
    AxiosError<ApiError>,
    BankAccountsResponse
  >
) {
  return useQuery<BankAccountsResponse, AxiosError<ApiError>>({
    queryKey: ["bank-accounts"],
    queryFn: fetchBankAccounts,
    ...options,
  });
}

export interface VirtualAccountResponse {
  success: true;
  data: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

/* ─────────── Fetcher ─────────── */

const fetchVirtualAccount = async (): Promise<VirtualAccountResponse> => {
  const { data } = await api.get<VirtualAccountResponse>(
    "/wallets/virtual-account"
  );
  return data;
};

/* ─────────── Hook ─────────── */

/**
 * Retrieve the current user's wallet balance.
 *
 * @example
 * const { data, isLoading } = useVirtualAccount();
 */
export function useVirtualAccount(
  options?: UseQueryOptions<
    VirtualAccountResponse,
    AxiosError<ApiError>,
    VirtualAccountResponse
  >
) {
  return useQuery<VirtualAccountResponse, AxiosError<ApiError>>({
    queryKey: ["virtual-account"],
    queryFn: fetchVirtualAccount,
    retry: true,
    ...options,
  });
}
