import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
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
    > extends ClavaControlFlowNode.Class<D, S> {
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
        #clavaNodeBuilder: ClavaNode.Builder;

        constructor(jp: Loop) {
            this.#jp = jp;
            this.#clavaNodeBuilder = new ClavaNode.Builder(this.#jp);
        }

        buildData(data: ControlFlowNode.Data): Data {
            return {
                ...data,
                ...this.#clavaNodeBuilder.buildData(data),
                [TAG]: {
                    version: VERSION,
                },
            };
        }

        buildScratchData(scratchData: ControlFlowNode.ScratchData): ScratchData {
            return {
                ...scratchData,
                ...this.#clavaNodeBuilder.buildScratchData(scratchData),
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
                ClavaControlFlowNode.TypeGuard.isScratchDataCompatible(sData) &&
                sData[ClavaNode.TAG].jp instanceof Loop
            );
        },
    );

    export interface Data extends ClavaControlFlowNode.Data {
        [TAG]: {
            version: typeof VERSION;
        };
    }

    export interface ScratchData extends ClavaControlFlowNode.ScratchData {
        [ClavaNode.TAG]: {
            jp: Loop;
        };
    }
}

export default ForNode;
