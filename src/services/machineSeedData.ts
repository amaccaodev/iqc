import type { Machine } from "../types/machine";
import { isoDay, make7DayStats, seedMachinesPartA } from "./machineSeedDataA";
import { seedMachinesPartB } from "./machineSeedDataB";

export { isoDay, make7DayStats };

export const defaultMachinesSeed: Machine[] = [
  ...seedMachinesPartA,
  ...seedMachinesPartB,
];
