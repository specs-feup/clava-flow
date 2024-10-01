import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { EmptyStmt } from "@specs-feup/clava/api/Joinpoints.js";

namespace EmptyStatementNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends InstructionNode.Class<D, S> {
        override get jp(): EmptyStmt {
            return this.scratchData.$jp;
        }
    }

    export class Builder
        extends InstructionNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        constructor($jp: EmptyStmt) {
            super(InstructionNode.Type.EMPTY_STATEMENT, $jp);
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...(super.buildData(data) as InstructionNode.Data & {
                    instructionFlowNodeType: InstructionNode.Type.EMPTY_STATEMENT;
                }),
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...(super.buildScratchData(scratchData) as InstructionNode.Data & {
                    $jp: EmptyStmt;
                }),
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!InstructionNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (d.instructionFlowNodeType !== InstructionNode.Type.EMPTY_STATEMENT)
                return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!InstructionNode.TypeGuard.isScratchDataCompatible(scratchData))
                return false;
            return true;
        },
    };

    export interface Data extends InstructionNode.Data {
        instructionFlowNodeType: InstructionNode.Type.EMPTY_STATEMENT;
    }

    export interface ScratchData extends InstructionNode.ScratchData {
        $jp: EmptyStmt;
    }
}

export default EmptyStatementNode;
