import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { Scope } from "@specs-feup/clava/api/Joinpoints.js";

namespace ScopeStartNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends InstructionNode.Class<D, S> {
        override get jp(): Scope {
            return this.scratchData.$jp;
        }

        get scopeKind(): Kind {
            return this.data.scopeKind;
        }
    }

    export class Builder
        extends InstructionNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        #kind: Kind;

        constructor($jp: Scope, kind: Kind) {
            super(InstructionNode.Type.SCOPE_START, $jp);
            this.#kind = kind;
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...super.buildData(data) as InstructionNode.Data & { instructionFlowNodeType: InstructionNode.Type.SCOPE_START },
                scopeKind: this.#kind,
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData) as InstructionNode.Data & { $jp: Scope },
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!InstructionNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (d.instructionFlowNodeType !== InstructionNode.Type.SCOPE_START) return false;
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
        instructionFlowNodeType: InstructionNode.Type.SCOPE_START;
        scopeKind: Kind;
    }

    export interface ScratchData extends InstructionNode.ScratchData {
        $jp: Scope;
    }

    // -------------------------------------

    export enum Kind {
        // The scope was entered normally as it was
        // the next line of code to be executed
        NORMAL_FLOW,
        // The scope was entered as a result of a
        // control flow statement (e.g. goto)
        BROKEN_FLOW,
    }
}

export default ScopeStartNode;
