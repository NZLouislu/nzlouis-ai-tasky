export interface MemberMapping {
  alias: string;
  trelloUsername: string;
  trelloMemberId?: string;
}

export interface LabelColorMapping {
  labelName: string;
  color: string;
}

export const defaultMemberMappings: MemberMapping[] = [
  { alias: "developer", trelloUsername: "developer" },
  { alias: "tester", trelloUsername: "tester" },
  { alias: "designer", trelloUsername: "designer" },
  { alias: "pm", trelloUsername: "projectmanager" },
];

export const defaultLabelColors: LabelColorMapping[] = [
  { labelName: "bug", color: "red" },
  { labelName: "feature", color: "green" },
  { labelName: "enhancement", color: "blue" },
  { labelName: "documentation", color: "yellow" },
  { labelName: "testing", color: "purple" },
  { labelName: "urgent", color: "orange" },
  { labelName: "blocked", color: "black" },
  { labelName: "security", color: "pink" },
];

export function mapAliasToTrelloMember(
  alias: string,
  mappings: MemberMapping[] = defaultMemberMappings
): string | null {
  const mapping = mappings.find(
    (m) => m.alias.toLowerCase() === alias.toLowerCase()
  );
  return mapping?.trelloUsername || null;
}

export function getLabelColor(
  labelName: string,
  colorMappings: LabelColorMapping[] = defaultLabelColors
): string {
  const mapping = colorMappings.find(
    (m) => m.labelName.toLowerCase() === labelName.toLowerCase()
  );
  return mapping?.color || "sky";
}

export function parseAssignees(assigneesString: string): string[] {
  const match = assigneesString.match(/\[([^\]]+)\]/);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

export function parseLabels(labelsString: string): string[] {
  const match = labelsString.match(/\[([^\]]+)\]/);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function createMemberMapping(
  alias: string,
  trelloUsername: string,
  trelloMemberId?: string
): MemberMapping {
  return {
    alias,
    trelloUsername,
    trelloMemberId,
  };
}

export function createLabelColorMapping(
  labelName: string,
  color: string
): LabelColorMapping {
  return {
    labelName,
    color,
  };
}

export async function saveMemberMappings(
  userId: string,
  mappings: MemberMapping[]
): Promise<boolean> {
  try {
    return true;
  } catch (error) {
    console.error("Failed to save member mappings:", error);
    return false;
  }
}

export async function loadMemberMappings(
  userId: string
): Promise<MemberMapping[]> {
  try {
    return defaultMemberMappings;
  } catch (error) {
    console.error("Failed to load member mappings:", error);
    return defaultMemberMappings;
  }
}
