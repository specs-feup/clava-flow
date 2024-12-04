import ControlFlowEdge from "@specs-feup/flow/flow/ControlFlowEdge";
import Edge from "@specs-feup/flow/graph/Edge";

namespace ConditionalEdge {
    export const TAG = "__lara_flow__conditional_edge";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends ControlFlowEdge.Class<D, S> {
        get executesIfTrue(): boolean {
            return this.data[TAG].conditionToExecute;
        }

        get executesIfFalse(): boolean {
            return !this.data[TAG].conditionToExecute;
        }
    }

    export class Builder
        implements
            Edge.Builder<
                Data,
                ScratchData,
                ControlFlowEdge.Data,
                ControlFlowEdge.ScratchData
            >
    {
        #conditionToExecute: boolean;

        constructor(conditionToExecute: boolean) {
            this.#conditionToExecute = conditionToExecute;
        }

        buildData(data: ControlFlowEdge.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                    conditionToExecute: this.#conditionToExecute,
                },
            };
        }

        buildScratchData(scratchData: ControlFlowEdge.ScratchData): ScratchData {
            return {
                ...scratchData,
            };
        }
    }

    export const TypeGuard = Edge.TagTypeGuard<Data, ScratchData>(TAG, VERSION);

    export interface Data extends ControlFlowEdge.Data {
        [TAG]: {
            version: typeof VERSION;
            conditionToExecute: boolean;
        };
    }

    export interface ScratchData extends ControlFlowEdge.ScratchData {}
}

export default ConditionalEdge;
