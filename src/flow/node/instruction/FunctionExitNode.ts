import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { FunctionJp } from "@specs-feup/clava/api/Joinpoints.js";

namespace FunctionExitNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends InstructionNode.Class<D, S> {
        override get jp(): FunctionJp {
            return this.scratchData.$jp;
        }
    }

    export class Builder
        extends InstructionNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        constructor($jp: FunctionJp) {
            super(InstructionNode.Type.FUNCTION_EXIT, $jp);
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...super.buildData(data) as InstructionNode.Data & { instructionFlowNodeType: InstructionNode.Type.FUNCTION_EXIT },
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData) as InstructionNode.Data & { $jp: FunctionJp },
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!InstructionNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (d.instructionFlowNodeType !== InstructionNode.Type.FUNCTION_EXIT) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!InstructionNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            return true;
        },
    };

    export interface Data extends InstructionNode.Data {
        instructionFlowNodeType: InstructionNode.Type.FUNCTION_EXIT;
    }

    export interface ScratchData extends InstructionNode.ScratchData {
        $jp: FunctionJp;
    }
}

export default FunctionExitNode;
