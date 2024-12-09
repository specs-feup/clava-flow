import ConditionNode from "@specs-feup/clava-flow/cfg/node/condition/ConditionNode";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { Loop } from "@specs-feup/clava/api/Joinpoints.js";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import Node from "@specs-feup/flow/graph/Node";

namespace ForNode {
    export const TAG = "__clava_flow__for_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends ConditionNode.Class<D, S> {
        override get jp(): Loop {
            return this.scratchData[ClavaNode.TAG].jp;
        }
    }

    export class Builder
        implements
            Node.Builder<
                Data,
                ScratchData,
                ControlFlowNode.Data,
                ControlFlowNode.ScratchData
            >
    {
        #jp: Loop;
        #conditionNodeBuilder: ConditionNode.Builder;

        constructor(jp: Loop) {
            this.#jp = jp;
            this.#conditionNodeBuilder = new ConditionNode.Builder(this.#jp);
        }

        buildData(data: ControlFlowNode.Data): Data {
            return {
                ...data,
                ...this.#conditionNodeBuilder.buildData(data),
                [TAG]: {
                    version: VERSION,
                },
            };
        }

        buildScratchData(scratchData: ControlFlowNode.ScratchData): ScratchData {
            return {
                ...scratchData,
                ...this.#conditionNodeBuilder.buildScratchData(scratchData),
                [ClavaNode.TAG]: {
                    jp: this.#jp,
                },
            };
        }
    }

    export const TypeGuard = Node.TagTypeGuard<Data, ScratchData>(
        TAG,
        VERSION,
        (sData) => {
            return (
                ConditionNode.TypeGuard.isScratchDataCompatible(sData) &&
                sData[ClavaNode.TAG].jp instanceof Loop
            );
        },
    );

    export interface Data extends ConditionNode.Data {
        [TAG]: {
            version: typeof VERSION;
        };
    }

    export interface ScratchData extends ConditionNode.ScratchData {
        [ClavaNode.TAG]: {
            jp: Loop;
        };
    }
}

export default ForNode;
