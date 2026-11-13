export type ConfirmationAction = "confirm" | "cancel" | "ignore";

export function getConfirmationAction(
  text: string,
): ConfirmationAction {
  const answer = text.trim().toLowerCase();

  if (answer === "ya") return "confirm";
  if (answer === "batal") return "cancel";

  return "ignore";
}
