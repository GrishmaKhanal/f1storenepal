"use server";

import { redirect } from "next/navigation";
import { hasDb } from "@/db";
import { orderIdFrom } from "@/lib/money";
import { findOrderToken } from "@/lib/orders";

// The typed values come back with the error: React resets the form after each submit.
export type TrackState = { error: string; order: string; phone: string } | undefined;

/**
 * Opens an order's page from its number and the phone it was placed with. Both have to
 * match, and a miss says the same thing either way, so order numbers (which count up)
 * can't be used to find out about other people's orders.
 */
export async function trackOrder(_: TrackState, fd: FormData): Promise<TrackState> {
  const ref = String(fd.get("order") ?? "").slice(0, 40);
  const phone = String(fd.get("phone") ?? "").slice(0, 40);
  const fail = (error: string) => ({ error, order: ref, phone });
  if (!hasDb) return fail("Order tracking isn't available right now. Please message us on Instagram.");
  if (!orderIdFrom(ref) || !phone.trim()) return fail("Enter your order number (like F1N-1027) and the phone number you ordered with.");
  const token = await findOrderToken(ref, phone);
  if (!token) return fail("We couldn't find an order with that number and phone. Check both, or message us.");
  redirect(`/order/${token}`);
}
