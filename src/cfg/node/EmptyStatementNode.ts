import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
import ClavaNode from "@specs-feup/clava-flow/ClavaNode";
import { EmptyStmt, FunctionJp, Scope } from "@specs-feup/clava/api/Joinpoints.js";
import ControlFlowNode from "@specs-feup/lara-flow/flow/ControlFlowNode";
import FunctionNode from "@specs-feup/lara-flow/flow/FunctionNode";
import BaseNode from "@specs-feup/lara-flow/graph/BaseNode";
import Node from "@specs-feup/lara-flow/graph/Node";

namespace EmptyStatementNode {
    export const TAG = "__clava_flow__empty_statement_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends ClavaControlFlowNode.Class<D, S> {
        override get jp(): EmptyStmt {
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
        #jp: EmptyStmt;
        #clavaNodeBuilder: ClavaNode.Builder;

        constructor(jp: EmptyStmt) {
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
                sData[ClavaNode.TAG].jp instanceof EmptyStmt
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
            jp: EmptyStmt;
        };
    }
}

export default EmptyStatementNode;
