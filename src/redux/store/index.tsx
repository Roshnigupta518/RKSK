import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import loginSlice from '../slices/login';
import ClockTimeSlice from '../slices/ClockTime';
import DisclaimerSlice from '../slices/disclaimer';
import ActivityPlan from '../slices/ActivityPlan';
import QueueSlice from '../slices/queueSlice';
import PeerEducatorSlice from '../slices/peerEducatorList';
import MastersSlice from '../slices/Masters';
import PeerReferralList from '../slices/ReferralList';
import ipAddressSlice from '../slices/getIpAddress';
import PeerReportingCountSlice from '../slices/peerReportingCount';
import PeerBrigadeSlice from '../slices/peerBrigade';
import MaterialSlice from '../slices/materials';

const authPersistConfig = {
    key: 'Login',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const disclaimerPersistConfig = {
    key: 'Disclaimer',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const clockPersistConfig = {
    key: 'ClockTime',
    storage: AsyncStorage,
    whitelist: ['loginDetails','logoutDetails'],
  };

  const atpPersistConfig = {
    key: 'activityPlan',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const peerEducatorListConfig = {
    key: 'PeerEducatorList',
    storage: AsyncStorage,
    whitelist: ['data'],
  }

  const atpQueueConfig = {
    key: 'queue',
    storage: AsyncStorage,
    whitelist: ['pending'],
  };
  
  const peerReferralConfig = {
    key: 'PeerReferralList',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const ipAddressConfig = {
    key: 'ipAddress',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const peerBrigadeConfig = {
    key: 'PeerBridageList',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const materialsConfig = {
    key: 'Materials',
    storage: AsyncStorage,
    whitelist: ['data'],
  }

  const appReducer = combineReducers({
    login: persistReducer(authPersistConfig, loginSlice),
    clockTime: persistReducer(clockPersistConfig, ClockTimeSlice),
    disclaimerStatus: persistReducer(disclaimerPersistConfig, DisclaimerSlice),
    activityPlan : persistReducer(atpPersistConfig, ActivityPlan), 
    queue: persistReducer(atpQueueConfig, QueueSlice),
    peerEducatorList: persistReducer(peerEducatorListConfig, PeerEducatorSlice),
    peerReferralList: persistReducer(peerReferralConfig, PeerReferralList),
    getIpAddress: persistReducer(ipAddressConfig, ipAddressSlice),
    peerBrigadeList : persistReducer(peerBrigadeConfig, PeerBrigadeSlice),
    iecMaterialList : persistReducer(materialsConfig, MaterialSlice),
    masters : MastersSlice,
    peerReportingCount: PeerReportingCountSlice
  })

  const rootReducer = (state: any, action: any) => {
    if (action.type === 'RESET_ALL') {
      return appReducer(
        {
          disclaimerStatus: state?.disclaimerStatus,
        },
        action
      );
    }
    return appReducer(state, action);
  };

export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
  
  // Persistor with timeout
  export const persistor = persistStore(store);
  export type RootState = ReturnType<typeof store.getState>;
  export type AppDispatch = typeof store.dispatch;