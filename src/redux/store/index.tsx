import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
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

const authPersistConfig = {
    key: 'Login',
    storage: AsyncStorage,
    whitelist: ['data'],
  };

  const clockPersistConfig = {
    key: 'ClockTime',
    storage: AsyncStorage,
    whitelist: ['loginDetails','logoutDetails'],
  };

  const appReducer = combineReducers({
    login: persistReducer(authPersistConfig, loginSlice),
    clockTime: persistReducer(clockPersistConfig, ClockTimeSlice),
  })

export const store = configureStore({
    reducer: appReducer,
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