import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Node from "@specs-feup/flow/graph/Node";

namespace ClavaControlFlowNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends ControlFlowNode.Class<D, S> {
        get jp(): Joinpoint {
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
        #clavaNodeBuilder: ClavaNode.Builder;

        constructor(jp: Joinpoint) {
            this.#clavaNodeBuilder = new ClavaNode.Builder(jp);
        }

        buildData(data: ControlFlowNode.Data): Data {
            return {
                ...data,
                ...this.#clavaNodeBuilder.buildData(data),
            };
        }

        buildScratchData(scratchData: ControlFlowNode.ScratchData): ScratchData {
            return {
                ...scratchData,
                ...this.#clavaNodeBuilder.buildScratchData(scratchData),
            };
        }
    }

    export const TypeGuard: Node.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            return (
                ClavaNode.TypeGuard.isDataCompatible(data) &&
                ControlFlowNode.TypeGuard.isDataCompatible(data)
            );
        },

        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is ScratchData {
            return (
                ClavaNode.TypeGuard.isScratchDataCompatible(sData) &&
                ControlFlowNode.TypeGuard.isScratchDataCompatible(sData)
            );
        },
    };

    export interface Data extends ControlFlowNode.Data, ClavaNode.Data {}

    export interface ScratchData
        extends ControlFlowNode.ScratchData,
            ClavaNode.ScratchData {}
}

export default ClavaControlFlowNode;
