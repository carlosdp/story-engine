import { Action, ActionResult } from '../action';
import { DeterministicSubsystem } from './base';

class ResourceReport extends Action {
  name = 'resource-report';
  description = 'Report resources we have available';
  parameters = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    if (!data) {
      const messageId = await this.sendSignal(thoughtActionId, 'out', 'logistics', { action: 'stored-resources' });

      return { status: Action.STATUS_WAITING, data: { messageId } };
    } else {
      const { messageId } = data;

      const responsePayload = await this.getSignalResponse(messageId);

      return !responsePayload
        ? { status: Action.STATUS_WAITING, data }
        : { status: Action.STATUS_COMPLETE, data: { ...data, resources: responsePayload } };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    return `Current Resources: ${JSON.stringify(data.resources)}}`;
  }
}

export class ResourceDepot extends DeterministicSubsystem {
  name = 'resourceDepot';
  actions = [new ResourceReport()];
}
