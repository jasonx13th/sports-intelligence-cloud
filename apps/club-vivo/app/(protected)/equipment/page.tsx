import { cookies } from "next/headers";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { EquipmentEssentialsManager } from "../../../components/coach/EquipmentEssentialsManager";
import {
  EQUIPMENT_HINTS_COOKIE,
  getEquipmentItems,
  serializeEquipmentHints
} from "../../../lib/equipment-hints";

export default async function EquipmentPage() {
  const cookieStore = await cookies();
  const initialItems = getEquipmentItems(cookieStore.get(EQUIPMENT_HINTS_COOKIE)?.value);

  async function saveEquipmentAction(items: string[]) {
    "use server";

    const serializedItems = serializeEquipmentHints(items);
    const nextItems = getEquipmentItems(serializedItems);

    const responseCookieStore = await cookies();
    responseCookieStore.set(EQUIPMENT_HINTS_COOKIE, serializedItems, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax"
    });

    return {
      items: nextItems,
      message: "Essentials saved in this browser."
    };
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Equipment"
        title="Essentials"
        description="Start with the standard equipment most coaches need, then add any extra items you want available in your planning context."
      />

      <EquipmentEssentialsManager
        initialItems={initialItems}
        saveEquipmentAction={saveEquipmentAction}
      />
    </div>
  );
}
