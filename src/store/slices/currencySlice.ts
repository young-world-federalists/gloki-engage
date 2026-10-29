import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBalance, getParameters } from '../../services/contracts/community';
import type { IParameters } from '../../services/contracts/community';

// Currency state interface
interface CurrencyState {
  userBalance: number | null;
  parameters: IParameters | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrencyState = {
  userBalance: null,
  parameters: null,
  loading: false,
  error: null,
};

// Async thunk to fetch user balance and parameters
export const fetchUserBalance = createAsyncThunk(
  'currency/fetchUserBalance',
  async (args: { serverUrl: string; publicKey: string; contractId: string }) => {
    const balance = await getBalance(
      args.serverUrl,
      args.publicKey,
      args.contractId,
    );

    const parameters = await getParameters(
      args.serverUrl,
      args.publicKey,
      args.contractId,
    );

    return { balance, parameters };
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.userBalance = Math.round((action.payload.balance as number) * 100) / 100;
        state.parameters = action.payload.parameters;
      })
      .addCase(fetchUserBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user balance';
      });
  },
});

export default currencySlice.reducer;
