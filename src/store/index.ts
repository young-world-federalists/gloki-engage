import { configureStore } from '@reduxjs/toolkit';
import communitiesReducer from './slices/communitiesSlice';
import userReducer from './slices/userSlice';
import currencyReducer from './slices/currencySlice';
import initiativeReducer from './slices/initiativeSlice';
import flowContractsReducer from '../components/collaboration/flows/shared/flowContractsSlice';
import preferencesReducer from './slices/preferencesSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    communities: communitiesReducer,
    user: userReducer,
    currency: currencyReducer,
    initiative: initiativeReducer,
    flowContracts: flowContractsReducer,
    preferences: preferencesReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
