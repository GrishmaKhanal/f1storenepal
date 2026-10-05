"use client";

import type { OrderStatus } from "@/db/schema";
import { deleteOrder, updateOrder } from "../../actions";
import { Area, Select } from "../../_components/fields";
import { Popconfirm } from "../../_components/popconfirm";
import { SaveForm } from "../../_components/save";

export function OrderForm({ id, status, adminNote }: { id: number; status: OrderStatus; adminNote: string | null }) {
  return (
    <>
      <SaveForm action={updateOrder} label="Update order" className="space-y-4 rounded-[14px] border border-rule bg-white p-5">
        <input type="hidden" name="id" value={id} />
        <h2 className="font-display text-xl font-bold uppercase">Status</h2>
        <Select
          name="status"
          label="Order status"
          empty={null}
          defaultValue={status}
          options={[["new", "New"], ["confirmed", "Confirmed (customer called)"], ["paid", "Paid"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled (puts stock back)"]]}
          hint="Cancelling returns the items to stock. Moving a cancelled order back takes the stock again."
        />
        <Area name="adminNote" label="Private note" rows={3} defaultValue={adminNote} hint="Only visible here. E.g. tracking number, payment reference, call notes." />
      </SaveForm>
      <form action={deleteOrder} className="mt-2">
        <input type="hidden" name="id" value={id} />
        <Popconfirm label="Delete order" title="Delete this order?" description="It's removed for good. Stock is returned if the order hadn't shipped. Prefer Cancelled to keep a record." confirmLabel="Delete" align="start" triggerClassName="text-sm text-red underline" />
      </form>
    </>
  );
}
