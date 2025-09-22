// src/hooks.ts (or wherever you prefer)
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store' // adjust path
import type { AppDispatch } from '../redux/store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;
