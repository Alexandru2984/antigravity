import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const formatPrice = (price: number, currency: string = 'USD') => `${currency} ${price}`;
