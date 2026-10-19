const BASE_URL = "https://open.api.nexon.com";
const API_KEY_HEADER = "x-nxopen-api-key";

const get = async <T>(
  apiKey: string,
  path: string,
  params: Record<string, string | undefined>,
): Promise<T> => {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const response = await fetch(url, { headers: { [API_KEY_HEADER]: apiKey } });
  if (!response.ok) {
    // 넥슨 오류 본문(error.name / error.message)만 전달하고 키는 어디에도 싣지 않는다.
    const body = (await response.json().catch(() => null)) as {
      error?: { name?: string; message?: string };
    } | null;
    throw new Error(
      `Nexon Open API ${response.status} ${body?.error?.name ?? ""} ${body?.error?.message ?? ""}`.trim(),
    );
  }
  return (await response.json()) as T;
};

/** /maplestory/v1/character/item-equipment 응답 중 이 서비스가 쓰는 필드만. */
type RawItem = {
  item_equipment_part: string;
  item_equipment_slot: string;
  item_name: string;
  item_icon: string;
  starforce: string;
  starforce_scroll_flag: string;
  scroll_upgradeable_count: string;
  potential_option_grade: string | null;
  potential_option_1: string | null;
  potential_option_2: string | null;
  potential_option_3: string | null;
  additional_potential_option_grade: string | null;
  additional_potential_option_1: string | null;
  additional_potential_option_2: string | null;
  additional_potential_option_3: string | null;
  item_base_option: { base_equipment_level: number };
};
type RawEquipment = {
  date: string | null;
  character_class: string;
  preset_no: number;
  item_equipment: RawItem[];
};

export type Equipment = Awaited<ReturnType<typeof getEquipment>>;

export const getEquipment = async (
  apiKey: string,
  characterName: string,
  date?: string,
) => {
  const { ocid } = await get<{ ocid: string }>(apiKey, "/maplestory/v1/id", {
    character_name: characterName,
  });
  const raw = await get<RawEquipment>(
    apiKey,
    "/maplestory/v1/character/item-equipment",
    { ocid, date },
  );

  return {
    date: raw.date,
    characterClass: raw.character_class,
    presetNo: raw.preset_no,
    items: raw.item_equipment.map((item) => ({
      part: item.item_equipment_part,
      slot: item.item_equipment_slot,
      name: item.item_name,
      icon: item.item_icon,
      level: item.item_base_option.base_equipment_level,
      starforce: Number(item.starforce),
      starforceScrollFlag: item.starforce_scroll_flag,
      scrollUpgradeable: Number(item.scroll_upgradeable_count),
      potential: {
        grade: item.potential_option_grade,
        options: [
          item.potential_option_1,
          item.potential_option_2,
          item.potential_option_3,
        ],
      },
      additionalPotential: {
        grade: item.additional_potential_option_grade,
        options: [
          item.additional_potential_option_1,
          item.additional_potential_option_2,
          item.additional_potential_option_3,
        ],
      },
    })),
  };
};
