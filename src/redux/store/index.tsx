import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { encryptTransform } from 'redux-persist-transform-encrypt';
import loginSlice from '../slices/login';
import ClockTimeSlice from '../slices/ClockTime';
import DisclaimerSlice from '../slices/disclaimer';
import ActivityPlan from '../slices/ActivityPlan';
import QueueSlice from '../slices/queueSlice';
import PeerEducatorSlice from '../slices/peerEducatorList';
import MastersSlice from '../slices/Masters';
import PeerReferralList from '../slices/PeerReferralList';
import ipAddressSlice from '../slices/getIpAddress';
import PeerReportingCountSlice from '../slices/peerReportingCount';
import PeerBrigadeSlice from '../slices/peerBrigade';
import MaterialSlice from '../slices/materials';
import AwarenessVideoSlice from '../slices/awarenessVideo';
import ProfileSlice from '../slices/profile';
import ReferralSlice from '../slices/referralList';
import { EncryptionKeyService, SecureTokenService } from '../../utils/security';

// -----------------------------------------------------------------------------
// F-04 fix: at-rest encryption for every persisted slice + JWT stripped from
// redux-persist entirely (JWT lives only in Keychain via SecureTokenService).
//
// Store construction is LAZY because the redux-persist encryption transform
// needs the Keychain-backed AES key synchronously, and Keychain reads are
// async. `bootstrapSecurity()` (invoked from App.js) hydrates the key into
// EncryptionKeyService before the first `store.getState()` / `store.dispatch()`
// call happens. Building the store lazily lets us keep the existing
// `import { store } from '../../redux/store'` call sites unchanged.
// -----------------------------------------------------------------------------

type StoreInternals = {
  store: ReturnType<typeof buildStoreInternal>['store'];
  persistor: ReturnType<typeof buildStoreInternal>['persistor'];
};

let internals: StoreInternals | null = null;

function buildStoreInternal() {
  const encryptor = encryptTransform({
    secretKey: EncryptionKeyService.getSync(),
    onError: (err: any) => {
      // Decrypt/encrypt failures usually mean the Keychain key was rotated
      // or the ciphertext was tampered with. The persistor will drop the
      // affected slice; UI code will treat those slices as empty and
      // trigger re-fetch.
      console.warn('[redux-persist-encrypt] transform error:', err?.message || err);
    },
  });

  // Auth-persist safety net: strip any legacy `jwtToken` field that might
  // have been persisted by pre-fix builds, and migrate it into Keychain.
  const stripJwtFromAuthTransform = createTransform(
    (inboundState: any) => {
      if (inboundState && typeof inboundState === 'object' && inboundState.data) {
        const sanitized = { ...inboundState.data };
        delete sanitized.jwtToken;
        return { ...inboundState, data: sanitized };
      }
      return inboundState;
    },
    (outboundState: any) => {
      if (outboundState && typeof outboundState === 'object' && outboundState.data) {
        const legacyToken = outboundState.data.jwtToken;
        if (legacyToken) {
          SecureTokenService.setToken(legacyToken).catch(() => {});
          const sanitized = { ...outboundState.data };
          delete sanitized.jwtToken;
          return { ...outboundState, data: sanitized };
        }
      }
      return outboundState;
    },
    { whitelist: ['Login'] },
  );

  const authPersistConfig = {
    key: 'Login',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [stripJwtFromAuthTransform, encryptor],
  };

  const disclaimerPersistConfig = {
    key: 'Disclaimer',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const clockPersistConfig = {
    key: 'ClockTime',
    storage: AsyncStorage,
    whitelist: ['loginDetails', 'logoutDetails'],
    transforms: [encryptor],
  };

  const atpPersistConfig = {
    key: 'activityPlan',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const peerEducatorListConfig = {
    key: 'PeerEducatorList',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const atpQueueConfig = {
    key: 'queue',
    storage: AsyncStorage,
    whitelist: ['pending'],
    transforms: [encryptor],
  };

  const peerReferralConfig = {
    key: 'PeerReferralList',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const ipAddressConfig = {
    key: 'ipAddress',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const peerBrigadeConfig = {
    key: 'PeerBridageList',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const materialsConfig = {
    key: 'Materials',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const awarenessConfig = {
    key: 'AwarenessVideo',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const profileConfig = {
    key: 'Profile',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const referralConfig = {
    key: 'ReferralList',
    storage: AsyncStorage,
    whitelist: ['data'],
    transforms: [encryptor],
  };

  const appReducer = combineReducers({
    login: persistReducer(authPersistConfig, loginSlice),
    clockTime: persistReducer(clockPersistConfig, ClockTimeSlice),
    disclaimerStatus: persistReducer(disclaimerPersistConfig, DisclaimerSlice),
    activityPlan: persistReducer(atpPersistConfig, ActivityPlan),
    queue: persistReducer(atpQueueConfig, QueueSlice),
    peerEducatorList: persistReducer(peerEducatorListConfig, PeerEducatorSlice),
    peerReferralList: persistReducer(peerReferralConfig, PeerReferralList),
    getIpAddress: persistReducer(ipAddressConfig, ipAddressSlice),
    peerBrigadeList: persistReducer(peerBrigadeConfig, PeerBrigadeSlice),
    ReferralList: persistReducer(referralConfig, ReferralSlice),
    iecMaterialList: persistReducer(materialsConfig, MaterialSlice),
    awarenessVideoList: persistReducer(awarenessConfig, AwarenessVideoSlice),
    getProfile: persistReducer(profileConfig, ProfileSlice),
    masters: MastersSlice,
    peerReportingCount: PeerReportingCountSlice,
  });

  const rootReducer = (state: any, action: any) => {
    if (action.type === 'RESET_ALL') {
      return appReducer(
        {
          disclaimerStatus: state?.disclaimerStatus,
        } as any,
        action
      );
    }
    return appReducer(state, action);
  };

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor };
}

function getInternals(): StoreInternals {
  if (!internals) {
    internals = buildStoreInternal();
  }
  return internals;
}

// Return raw values (not bound copies) so identity is stable across accesses.
// Redux Toolkit's configureStore and redux-persist's persistStore both return
// plain objects whose methods are closures over private state, so `this` does
// not need to be rebound. Stable identity for `store.subscribe` / `getState`
// is required by react-redux's useSyncExternalStore path — a fresh bound
// function per access would trigger re-subscription every render.
const makeLazyProxy = <T extends object>(pick: (i: StoreInternals) => T): T =>
  new Proxy({} as T, {
    get(_target, prop) {
      const target = pick(getInternals()) as any;
      return target[prop];
    },
    set(_target, prop, value) {
      const target = pick(getInternals()) as any;
      target[prop] = value;
      return true;
    },
    has(_target, prop) {
      const target = pick(getInternals()) as any;
      return prop in target;
    },
    ownKeys() {
      const target = pick(getInternals()) as any;
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const target = pick(getInternals()) as any;
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  });

export const store: ReturnType<typeof buildStoreInternal>['store'] =
  makeLazyProxy((i) => i.store) as any;

export const persistor: ReturnType<typeof buildStoreInternal>['persistor'] =
  makeLazyProxy((i) => i.persistor) as any;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
