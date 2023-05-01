export type SubsystemMessage = {
  id: string;
  world_id: string;
  from_subsystem?: string | null;
  from_action_id?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
};
